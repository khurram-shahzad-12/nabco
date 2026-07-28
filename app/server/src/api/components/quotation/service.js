const QuotationModel = require('./model');
const {getDateRangeFilter} = require('../../../utils/crmUtility');
const mongoose = require('mongoose');
const InvoiceModel = require("../invoice/model");
const CustomerModel = require("../customer/model");
const InventoryModel = require('../inventory/model');
const moment = require("moment");

const createNewQuotation = async (data) => {return await QuotationModel.create(data);}
const getAllQuotations = async (start_date, end_date) => {
    const filter = getDateRangeFilter(start_date, end_date);
    return await QuotationModel.find(filter).sort({createdAt: -1});
}
const deleteQuotation = async (id) => {
    const Quotation = await QuotationModel.findById(id);
    if(!Quotation) throw new Error("Quotation not found");
    return await QuotationModel.findByIdAndDelete(id);
}
const updateQuotation = async (id, quotation) => {
    const updateQuotation = await QuotationModel.findByIdAndUpdate(id, quotation, { new: true, runValidators: true });
    if (!updateQuotation) throw new Error('Quotation does not exit');
    return updateQuotation;
}
const getQuotationsByIds = async (ids) => {
    const objectIds = ids.map(id => new mongoose.Types.ObjectId(id));
    return await QuotationModel.find({_id: {$in: objectIds}}).sort({createdAt: -1});
}

const convertQuotationToInvoice = async (quotationId, customerId, createdBy, userPermissions) => {
    try {
        if (!quotationId) {throw new Error('Quotation ID is required'); }
        if (!customerId) { throw new Error('Customer ID is required'); }
        const quotation = await QuotationModel.findById(quotationId);
        if (!quotation) { throw new Error('Quotation not found'); }
        if (quotation.convertedToInvoice) { throw new Error('This quotation has already been converted to an invoice'); }
        if (!quotation.items || quotation.items.length === 0) { throw new Error('Cannot convert: Quotation has no items'); }
        const customer = await CustomerModel.findById(customerId);
        if (!customer) { throw new Error('Customer not found');  }
        if (!customer.active) { throw new Error('Cannot convert: Customer is inactive'); }
        if (customer.on_hold) { throw new Error('Cannot convert: Customer is on hold');  }
        const SERVICE_INVOICE = require("../invoice/service");
        let sale_number = await SERVICE_INVOICE.generateInvoiceID();
        let totalNoVat = 0; let totalCost = 0;
        const items_detail = await Promise.all(quotation.items.map(async (item) => {
            const productId = item.productId || item._id;
            const proData = await InventoryModel.findById(productId);
            if (!proData) {
                console.log(`Product not found: ${productId}`);
                return null;
            }
            const quantity = Number(item.quantity);
            const rate = Number(item.rate); 
            const costPrice = proData.cost_price || 0;

            totalNoVat += rate * quantity;
            totalCost += costPrice * quantity;
            return {
                _id: mongoose.Types.ObjectId(productId),
                name: item.name || proData.name,
                barcode: proData.barcode || '',
                quantity: Number(item.quantity),
                rate: Number(item.rate),
                cost_price: proData.cost_price || 0,
                vat: mongoose.Types.ObjectId(proData.vat),
                tax: Number(item.tax) || 0,
                weight_grams: proData.weight_grams || 0,
                weight_kg: proData.weight_kg || 1,
                
            };
        }));
        const filter_products = items_detail.filter(item => item !== null);
        if (filter_products.length === 0) { throw new Error('No valid products found in quotation'); }
        const todayDate = moment().format('YYYY-MM-DD');
        const profit = totalNoVat - totalCost;
        const payload = {
            created_by: createdBy || 'system',
            invoice_date: todayDate,
            ot_date: todayDate,
            customer: mongoose.Types.ObjectId(customerId),
            cash_invoice: false,
            in_person: false,
            remarks: `Converted from Quotation #${quotation.quotationNo || ''}`,
            driverNotes: '',
            items: filter_products,
            total_no_vat: Number(quotation.total_no_vat || 0),
            vat_total: Number(quotation.vat_total || 0),
            total_incl_vat: Number(quotation.total_incl_vat || 0),
            profit: Number(profit.toFixed(2)), 
            paid: false,
            email_sent: false,
            printed: false,
            picked: false,
            delivery_status: 'pending',
            priority_value: 0,
            payments: [],
            sale_number: sale_number,
            quotationNo: quotation.quotationNo
        };
        const newInvoice = await InvoiceModel.create(payload);
        if (!newInvoice) { throw new Error('Failed to create invoice'); }
        quotation.convertedToInvoice = true;
        quotation.invoiceNumber = newInvoice.sale_number;
        // quotation.convertedAt = new Date();
        // quotation.convertedBy = createdBy || 'system';
        await quotation.save();
        return {
            success: true,
            message: 'Quotation converted to invoice successfully',
            invoiceId: newInvoice._id,
            invoiceNumber: newInvoice.sale_number,
            invoice: {
                _id: newInvoice._id,
                sale_number: newInvoice.sale_number,
                total_no_vat: newInvoice.total_no_vat,
                vat_total: newInvoice.vat_total,
                total_incl_vat: newInvoice.total_incl_vat,
                invoice_date: newInvoice.invoice_date,
                customer: newInvoice.customer
            },
            quotation: {
                _id: quotation._id,
                quotationNo: quotation.quotationNo,
                convertedToInvoice: quotation.convertedToInvoice,
                // invoiceId: quotation.invoiceId,
                invoiceNumber: quotation.invoiceNumber
            }
        };

    } catch (error) {
        console.error('Conversion error:', error);
        throw new Error(`Failed to convert quotation to invoice: ${error.message}`);
    }
};
module.exports = {
    createNewQuotation,
    getAllQuotations,
    deleteQuotation,
    updateQuotation,
    getQuotationsByIds,
    convertQuotationToInvoice,
};
