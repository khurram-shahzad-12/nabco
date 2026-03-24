const createError = require('http-errors');
const moment = require('moment');
const Invoice = require('./model');
const database = require('./../../../db/database');
const SERVICE_INVENTORY = require('./../inventory/service');
const SERVICE_CUSTOMER = require('./../customer/service');
const SERVICE_CUSTOMER_ITEMS = require('./../customerItems/service');
const validate = require('../../../utils/validate');
const env = require('./../../../config.env');
const nodemailer = require("nodemailer");
const {ObjectId} = require("mongodb")
let nextInvoiceID = env.INVOICE_ID_OFFSET;
let transporter = null;

if(env.EMAIL_ENABLED) {
    transporter = nodemailer.createTransport({
        host: 'smtp.office365.com',
        port: 587,
        auth: {
            user: env.EMAIL_ADDRESS,
            pass: env.EMAIL_PASSWORD
        },
    });
    transporter.verify().then(value => console.log(`Mailer initialised with value:${value}`)).catch(console.error);
}

const checkInvoice = (query = {}) => {
    return database.exists(Invoice, query);
};
const fetchInvoices = (query = {}, projection = {}, sort = {invoice_date: -1, sale_number: -1}, limit = 0) => {
    return database.find(Invoice, query, projection, sort, limit);
};
const fetchOneInvoice = (query = {}, projection = {}, sort = {}, limit = 0) => {
    return database.findOne(Invoice, query, projection, sort, limit);
};
const insertInvoice = async (properties, userPermissions) => {
    const doc = new Invoice(properties);
    const error = await doc.validate();
    if (error) {
        throw new createError(500);
    }
    if(!await SERVICE_CUSTOMER.isCustomerActive(doc.customer) || await SERVICE_CUSTOMER.isCustomerOnHold(doc.customer)) {
        throw new createError(500);
    }
    doc.invoice_date = moment(doc.invoice_date).format('YYYY-MM-DD');
    doc.ot_date = moment(doc.ot_date).format('YYYY-MM-DD');
    doc.sale_number = await generateInvoiceID();
    if (properties.hasOwnProperty('items')) {
        await processItems(doc, !userPermissions.includes(env.WRITE_OVERRIDE_MIN_SALE_PRICE_CLAIM));
        for(const item of properties.items) {
            await SERVICE_INVENTORY.updateInventoryItemQuantity(item._id, -item.quantity);
        }
    }
    return database.create(Invoice, doc);
};
const updateInvoice = async (id, properties, userPermissions) => {
    const doc = new Invoice(properties);
    const error = await doc.validate(Object.keys(properties));
    if (!error) {
        const originalInvoice = await fetchOneInvoice({_id: id});
        const todaysDate = moment(moment().format('YYYY-MM-DD'));
        const invoice_date = moment(moment(originalInvoice.invoice_date).format('YYYY-MM-DD'));
        const invoice_OT_date = moment(moment(originalInvoice.ot_date).format('YYYY-MM-DD'));
        const daysSinceInvoiceDate = todaysDate.diff(invoice_date, 'days');
        const hoursSinceInvoiceOTDate = todaysDate.diff(invoice_OT_date, 'hours');

        if(!userPermissions.includes(env.WRITE_INVOICE_PAYMENTS_DATA_CLAIM)) {
            if(hoursSinceInvoiceOTDate > env.INVOICES_EDIT_DURATION_SALES_HOURS) throw new createError(500);
        }

        if(daysSinceInvoiceDate > env.INVOICES_EDIT_DURATION_LIMIT) throw new createError(500);
        if (properties.hasOwnProperty('invoice_date')) properties.invoice_date = moment(doc.invoice_date).format('YYYY-MM-DD');
        if (properties.hasOwnProperty('ot_date')) properties.ot_date = moment(doc.ot_date).format('YYYY-MM-DD');
        if (properties.hasOwnProperty('items')) {
            await processItems(properties, false);
            for(const item of originalInvoice.items) {
                await SERVICE_INVENTORY.updateInventoryItemQuantity(item._id, item.quantity);
            }
            for(const item of properties.items) {
                await SERVICE_INVENTORY.updateInventoryItemQuantity(item._id, -item.quantity);
            }
        }
        const updatedInvoice = await database.findByIdAndUpdate(Invoice, id, properties);
        await updatePayments(id, {payments: updatedInvoice.payments});
        return updatedInvoice;
    }
    throw new createError(500);
};
const updateInvoicesAfterPriceChange = async (updatedItem) => {
    //fetch all invoices that contain updated item, within the date range
    //trigger process items function on each invoice
    /*const todaysDate = moment(moment().format('YYYY-MM-DD'));

    const query = {
        invoice_date: { $gt: todaysDate },
        items: {$elemMatch: { _id: updatedItem._id.toString() } }
    };

    const affectedInvoices = await fetchInvoices(query);
    for(let invoice of affectedInvoices) {
        for(let item of invoice.items) {
            if(item._id.toString() === updatedItem._id.toString()) {
                const oldProfitMargin = (item.rate - item.cost_price) * item.quantity
                const newProfitMargin = (updatedItem.default_sale_price - updatedItem.cost_price) * item.quantity
                const oldTotal_no_vat = item.rate * item.quantity;
                const oldVat_amount = item.rate * item.quantity * (item.tax / 100);
                const newTotal_no_vat = updatedItem.default_sale_price * item.quantity;
                const newVat_amount = updatedItem.default_sale_price * item.quantity * (updatedItem.tax / 100);
                item.tax = updatedItem.tax;
                item.rate = updatedItem.default_sale_price;
                item.cost_price = updatedItem.cost_price;

                invoice.total_no_vat -= oldTotal_no_vat;
                invoice.vat_total -= oldVat_amount;
                invoice.total_incl_vat -= oldTotal_no_vat - oldVat_amount;
                invoice.profit -= oldProfitMargin;

                invoice.total_no_vat += newTotal_no_vat;
                invoice.vat_total += newVat_amount;
                invoice.total_incl_vat += newTotal_no_vat + newVat_amount;
                invoice.profit += newProfitMargin;

                invoice.total_no_vat = +invoice.total_no_vat.toFixed(2);
                invoice.vat_total = +invoice.vat_total.toFixed(2);
                invoice.total_incl_vat = +(invoice.total_no_vat + invoice.vat_total).toFixed(2);
                invoice.profit = +invoice.profit.toFixed(2);
            }
        }
        await database.findByIdAndUpdateNoValidate(Invoice, invoice._id.toString(), invoice);
    }*/
};
const updateInvoicesAfterWeightChange = async (updatedItem) => {
    //fetch all invoices that contain updated item, within the date range
    //trigger process items function on each invoice
    const todaysDate = moment(moment().format('YYYY-MM-DD'));

    const query = {
        invoice_date: { $gt: todaysDate },
        items: {$elemMatch: { _id: updatedItem._id.toString() } }
    };

    const affectedInvoices = await fetchInvoices(query);
    for(let invoice of affectedInvoices) {
        for(let item of invoice.items) {
            if(item._id.toString() === updatedItem._id.toString()) {
                item.weight_kg = updatedItem.weight_kg;
                item.weight_grams = updatedItem.weight_grams;
            }
        }
        await database.findByIdAndUpdateNoValidate(Invoice, invoice._id.toString(), invoice);
    }
};
const updatePayments = async (id, properties) => {
    const fullInvoice = await database.findOne(Invoice, {_id: id});
    let total = 0;
    properties.payments.forEach(payment => {
        total += Number(payment.amount);
    });
    properties.paid = Number(total.toFixed(2)) >= fullInvoice.total_incl_vat;

    return database.findByIdAndUpdate(Invoice, id, properties);
};
const deleteInvoice = (id) => {
    return database.findByIdAndDelete(Invoice, id);
};

Invoice.init()
    .then(() => database.find(Invoice, {}, {sale_number: 1}, {sale_number: -1}, 1))
    .then(result => {
        if (result.length > 0) nextInvoiceID += result[0].sale_number + 1;
        process.stdout.write(`Next Invoice ID: ${nextInvoiceID}\n`);
        process.stdout.write(`Number of days Invoice can be edited from invoice date: ${env.INVOICES_EDIT_DURATION_LIMIT}\n`);
    });

const generateInvoiceID = async () => {
    const check = await database.exists(Invoice, {sale_number: nextInvoiceID});
    if (check) {
        nextInvoiceID = await database.find(Invoice, {}, {sale_number: 1}, {sale_number: -1}, 1)
            .then(result => result[0].sale_number + 1);
    }
    return nextInvoiceID++;
};
const processItems = async (invoice, checkValues = false) => {
    let InventoryList;
    await Promise.all([
        SERVICE_INVENTORY.fetchInventory({_id: {$in: invoice.items.map(item => validate.id(item._id))}}),
    ]).then(data => {
        [InventoryList] = data.map(list => list.reduce((a, v) => {
            const id = v._id;
            delete v._id;
            a[id] = v;
            return a;
        }, {}));
    });
    invoice.items = invoice.items.sort((x, y) => InventoryList[x._id].name < InventoryList[y._id].name ? -1 : 1);
    const customerItems = await SERVICE_CUSTOMER_ITEMS.fetchCustomerItems({customer: invoice.customer});
    const total_amounts = invoice.items.reduce((a, v) => {
        if (checkValues && !invoice.in_person && v.rate < InventoryList[v._id].min_sale_price && !isItemPriceValidInCustomerItemsPrices(v.rate, v._id, customerItems)) v.rate = InventoryList[v._id].min_sale_price;
        v.cost_price = InventoryList[v._id].cost_price;
        v.quantity = +v.quantity.toFixed(0);
        v.rate = +v.rate.toFixed(2);
        a.profit += +((v.quantity * v.rate) - (v.quantity * v.cost_price)).toFixed(2);
        a.total_no_vat += v.quantity * v.rate;
        a.vat_total += v.quantity * v.rate * (v.tax / 100);
        return a;
    }, {total_no_vat: 0, vat_total: 0, profit: 0});
    invoice.total_no_vat = +total_amounts.total_no_vat.toFixed(2);
    invoice.vat_total = +total_amounts.vat_total.toFixed(2);
    invoice.total_incl_vat = +(invoice.total_no_vat + invoice.vat_total).toFixed(2);
    invoice.profit = +total_amounts.profit.toFixed(2);
};

const isItemPriceValidInCustomerItemsPrices = (rate, itemID, customerItems) => {
    if(!customerItems) {
        throw new Error("Can't find customer to validate customer items for");
    }

    const targetItem = customerItems.items.filter(item => item._id.toString() === itemID.toString());
    if(targetItem.length !== 1) {
        throw new Error(`Number of items not 1 returns when validating item ID[${itemID}]`);
    }

    return rate === targetItem[0].rate;
};

const getItemHistory = async (customerID, itemID, startDate, endDate) => {
    const momentStartDate = moment(startDate).format('YYYY-MM-DD');
    const momentEndDate = moment(endDate).format('YYYY-MM-DD');

    const query = {
        invoice_date: { $gte: momentStartDate, $lte: momentEndDate },
        customer: customerID,
        items: {$elemMatch: { _id: itemID } }
    };

    return fetchInvoices(query);
};

const fetchUnpaidInvoicesForCustomer = async customerId => {
    const momentFormat = 'YYYY-MM-DD';
    const START_DATE_CUTOFF = moment('2023-01-01').format(momentFormat);
    // const END_DATE = moment().format(momentFormat);
    //add $lte: END_DATE to query if needed
    const invoices = await fetchInvoices({customer: customerId, invoice_date: {$gte: START_DATE_CUTOFF}},
        ['invoice_date', 'sale_number', 'total_incl_vat', 'payments']);

    const unpaidInvoices = invoices
        .map(invoice => ({...invoice, totalPaid: +invoice.payments.map(item => item.amount).reduce((a, b) => a + b, 0).toFixed(2)}))
        .filter(invoice => invoice.totalPaid !== invoice.total_incl_vat);
    return unpaidInvoices;
};

const fetchCustomerAccountsData = async (startDate, endDate, userPermissions) => {
    const customers = await SERVICE_CUSTOMER.fetchCustomers({},
        ['_id', 'customer_name', 'payment_term', 'payment_method', 'payment_taking_days', 'payment_contact_name',
            'payment_contact_detail', 'payment_contact_method', 'do_not_call_for_payments', 'payment_comments']);

    const invoicesProjection = ['-created_by', '-cash_invoice', '-driverNotes', '-remarks', '-items'];
    if(!userPermissions.includes(env.READ_INVOICE_MARGINS_CLAIM)) {
        invoicesProjection.push('-profit');
    }
    for(let customer of customers) {
        customer.invoices = await fetchInvoices({customer: customer._id, paid: false, invoice_date: {$gte: startDate, $lte: endDate}}, invoicesProjection);
    }

    return customers.filter(customer => customer.invoices.length > 0);
};

const getLatestAddressHTML = () => {
    return env.getLatestInvoiceConfig().addressLines.map(line => `<p3>${line}</p3>`).join("<br />");
}

const getInvoiceEmailBody = addressee => {
    return `<div>
        <div><img src='cid:company_logo' width="500" height="200"/></div>
        <div style="background-color: #f4f4f3; width: 500px">
            <h4>Greetings ${addressee},</h4>
            <h4>Please find attached the invoice for your recent order.</h4>
            <h4>Regards, <br />Spice Direct Wholesale LTD.</h4>
        </div>
        <div style="width: 500px; background-color: #16212f; color: white; text-align: center">
        ${getLatestAddressHTML()}
        </div>
        
        </div>`;
};

const emailInvoiceToCustomer = async (invoice, invoicePdfBuffer, res) => {
    if(!env.EMAIL_ENABLED) {
        res.status(400).send("Emails are not currently enabled");
    }
    const projection = ['customer_name', 'legal_entity', 'email'];
    const invoiceCustomer = await SERVICE_CUSTOMER.fetchOneCustomer({_id: invoice.customer}, projection);
    if(invoiceCustomer.email.trim().length > 0) {
        const addressee = invoiceCustomer.legal_entity.trim().length > 0 ? invoiceCustomer.legal_entity : invoiceCustomer.customer_name;
        transporter.sendMail({
            from: `"Nabco" <${env.EMAIL_ADDRESS}>`, // sender address
            to: env.NODE_ENV === 'development' ? 'omera8@hotmail.com' : invoiceCustomer.email, // list of receivers
            subject: "Order created", // Subject line
            text: `Greetings ${addressee}, please find attached the invoice for your recent order.`, // plain text body
            html: getInvoiceEmailBody(addressee), // html body
            attachments: [
                {
                    filename: "nabco.jpg",
                    path: "./public/nabco.jpg",
                    cid: 'company_logo'
                },
                {
                    filename: "invoice.pdf",
                    content: invoicePdfBuffer
                }
            ]
        }).then(info => {
            console.log(`Email successfully sent to customer: ${addressee}`);
            database.findByIdAndUpdate(Invoice, invoice._id, {email_sent: true});
            res.sendStatus(200);
        }).catch(err => {
            console.error(err);
            throw new Error("Error sending email");
        });
    } else {
        env.EMAIL_ENABLED && console.log(`No email for customer:${invoiceCustomer.customer_name}`);
        res.status(400).send("Customer has no email");
    }
};

const updateInvoicePrintedStatus = (invoiceId, updatedStatus) => {
    const newStatus = {printed: updatedStatus}
    if(!updatedStatus) {
        newStatus.picked = false;
    }
    return database.findByIdAndUpdate(Invoice, invoiceId, newStatus);
};

const updateInvoicePickedStatus = (invoiceId, updatedStatus) => {
    return database.findByIdAndUpdate(Invoice, invoiceId, {picked: updatedStatus});
};

const getOrderForRoute = async(query = {}, projection = {sale_number:1, priority_value:1}) => {
    query.invoice_date.$lt = query.invoice_date.$lte;
    delete query.invoice_date.$lte;
    const invoices = await Invoice.find(query,projection).populate('customer','customer_name address city');
    const flat_invoices = invoices.map(inv => ({
        _id: inv._id,
        sale_number: inv.sale_number,
        customer_id: inv.customer?._id,
        customer_name: inv.customer?.customer_name,
        address: inv.customer?.address,
        city: inv.customer?.city,
        priority_value: inv.priority_value,
    }))
    return flat_invoices;
}

const updateOrderPriority = (updateValues) => {
    const bulkops = updateValues.data.map(ele => ({
        updateOne:{
            filter: {_id: new ObjectId(ele._id)},
            update: { $set: {priority_value: ele.priority_value}}
        }
    }));
    return Invoice.bulkWrite(bulkops); 
}


module.exports = {
    checkInvoice,
    fetchInvoices,
    fetchOneInvoice,
    insertInvoice,
    updateInvoice,
    updateInvoicesAfterPriceChange,
    updateInvoicesAfterWeightChange,
    updatePayments,
    deleteInvoice,
    getItemHistory,
    fetchUnpaidInvoicesForCustomer,
    fetchCustomerAccountsData,
    emailInvoiceToCustomer,
    generateInvoiceID,
    updateInvoicePrintedStatus,
    updateInvoicePickedStatus,
    getOrderForRoute,
    updateOrderPriority,
};

// exports.updateInvoicesAfterPriceChange = updateInvoicesAfterPriceChange;
