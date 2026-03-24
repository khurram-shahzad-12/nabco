const moment = require('moment');
const SERVICE_INVOICE = require('./service');
const SERVICE_INVOICE_PDF = require('./service.pdf');
const validate = require('../../../utils/validate');
const env = require('../../../config.env');
const extractProperties = require('./../../../utils/extractProperties');

const allowedModifiableProperties = [
    'created_by', 'invoice_date', 'ot_date', 'customer', 'cash_invoice', 'payments', 'remarks', 'driverNotes', 'items', 'in_person',
    'printed', 'picked', 'customer_sales_rep',
];
const allowedPaymentModifiableProperties = ['payments'];

const buildQuery = (req) => {
    if (req.params.id && validate.id(req.params.id)) return {_id: req.params.id};
    const QUERY = {};
    const {customer, ot_day_start, ot_day_end, delivery_day_start, delivery_day_end, in_person} = req.query;
    if (customer && validate.id(customer)) QUERY.customer = customer;
    if (ot_day_start) {
        const date = moment(ot_day_start).format('YYYY-MM-DD');
        if (date) QUERY.ot_date = {$gte: date};
    }
    if (ot_day_end) {
        const date = moment(ot_day_end).format('YYYY-MM-DD');
        if (date) {
            if (!QUERY.hasOwnProperty('ot_date')) QUERY.ot_date = {$lte: date};
            else QUERY.ot_date['$lte'] = date;
        }
    }
    if (delivery_day_start) {
    QUERY.invoice_date = QUERY.invoice_date || {};
    QUERY.invoice_date.$gte = moment.utc(delivery_day_start).startOf('day').toDate();
    }
    if (delivery_day_end) {
        QUERY.invoice_date = QUERY.invoice_date || {};
        QUERY.invoice_date.$lte = moment.utc(delivery_day_end).endOf('day').toDate();
    }
    if (in_person) {
        QUERY.in_person = in_person;
    }
    return QUERY;
};

const buildCustomerAccountsQuery = (req) => {
    const QUERY = {};
    const {start, end} = req.query;
    if(start && end) {
        const startDate = moment(start).format('YYYY-MM-DD');
        const endDate = moment(end).format('YYYY-MM-DD');
        QUERY.date = {$gte: startDate, $lte: endDate};
    }
    return QUERY;
};

const getInvoices = async (req, res, next) => {
    try {
        let projection = [];
        if(!req.auth.payload.permissions.includes(env.READ_INVOICE_MARGINS_CLAIM)) {
            projection.push('-profit');
        }
        res.status(200).json(await SERVICE_INVOICE.fetchInvoices(buildQuery(req), projection));
    } catch (e) {next(e);}
};

const addInvoice = async (req, res, next) => {
    try {
        res.status(201).json(await SERVICE_INVOICE.insertInvoice(extractProperties(req.body, allowedModifiableProperties), req.auth.payload.permissions));
    } catch (e) {next(e);}
};
const recordPayments = async (req, res, next) => {
    try {
        res.status(200).json(await SERVICE_INVOICE.updatePayments(validate.id(req.params.id), extractProperties(req.body, allowedPaymentModifiableProperties)));
    } catch (e) {next(e);}
};
const updateInvoice = async (req, res, next) => {
    try {
        res.status(200).json(await SERVICE_INVOICE.updateInvoice(validate.id(req.params.id),
            extractProperties(req.body, allowedModifiableProperties), req.auth.payload.permissions)
        );
    } catch (e) {next(e);}
};
const updateInvoiceItemPrices = async (req, res, next) => {
    try {
        await SERVICE_INVOICE.updateInvoicesAfterPriceChange(req.body)
        res.sendStatus(200);
    } catch (e) {next(e);}
};
const updateInvoicesAfterWeightChange = async (req, res, next) => {
    try {
        await SERVICE_INVOICE.updateInvoicesAfterWeightChange(req.body)
        res.sendStatus(200);
    } catch (e) {next(e);}
};
const deleteInvoice = async (req, res, next) => {
    try {
        res.status(200).json(await SERVICE_INVOICE.deleteInvoice(validate.id(req.params.id)));
    } catch (e) {next(e);}
};
const getItemHistory = async (req, res, next) => {
    try {
        res.status(200).json(await SERVICE_INVOICE.getItemHistory(
            validate.id(req.body.customerID),
            validate.id(req.body.itemID),
            req.body.startDate,
            req.body.endDate
        ));
    } catch (e) {next(e);}
};
const getUnpaidInvoices = async (req, res, next) => {
    try {
        res.status(200).json(await SERVICE_INVOICE.fetchUnpaidInvoicesForCustomer(
            validate.id(req.params.customerID)
        ));
    } catch (e) {next(e);}
};
const getCustomerAccountsData = async (req, res, next) => {
    try {
        res.status(200).json(await SERVICE_INVOICE.fetchCustomerAccountsData(
            moment(req.query.start).format('YYYY-MM-DD'),
            moment(req.query.end).format('YYYY-MM-DD'),
            req.auth.payload.permissions
        ));
    } catch (e) {next(e);}
};
const emailInvoice = async (req, res, next) => {
    if (!(req.params.id && validate.id(req.params.id))) throw new Error("Invalid ID");
    try {
        const invoice = await SERVICE_INVOICE.fetchOneInvoice({_id: req.params.id});
        const invoicePdfBuffer = await SERVICE_INVOICE_PDF.generateInvoicePDF([invoice._id]);
        await SERVICE_INVOICE.emailInvoiceToCustomer(invoice, invoicePdfBuffer, res);
    } catch (e) {next(e);}
};

const updatedPrintedStatus = async (req, res, next) => {
    if (!(req.params.id && validate.id(req.params.id))) throw new Error("Invalid ID");
    const status = req.params.printedStatus.toLowerCase() === "true";
    try {
        await SERVICE_INVOICE.updateInvoicePrintedStatus(req.params.id, status);
        res.sendStatus(200);
    } catch (e) {next(e);}
};
const updatedPickedStatus = async (req, res, next) => {
    if (!(req.params.id && validate.id(req.params.id))) throw new Error("Invalid ID");
    const status = req.params.pickedStatus.toLowerCase() === "true";
    try {
        await SERVICE_INVOICE.updateInvoicePickedStatus(req.params.id, status);
        res.sendStatus(200);
    } catch (e) {next(e);}
};
const getOrderForRoute = async (req, res, next) => {
    try {
        res.status(200).json(await SERVICE_INVOICE.getOrderForRoute(buildQuery(req)));
    } catch (e) {next(e);}
}
const updateOrderPriority = async (req, res, next) => {
    try {
        res.status(200).json(await SERVICE_INVOICE.updateOrderPriority(req.body))
    } catch (e) {next(e);}
}

module.exports = {
    getInvoices,
    addInvoice,
    recordPayments,
    updateInvoice,
    updateInvoiceItemPrices,
    updateInvoicesAfterWeightChange,
    deleteInvoice,
    getItemHistory,
    getUnpaidInvoices,
    getCustomerAccountsData,
    emailInvoice,
    updatedPrintedStatus,
    updatedPickedStatus,
    getOrderForRoute,
    updateOrderPriority,
};