const SERVICE_SUPPLIER_INVOICES = require('./service');
const validate = require('../../../utils/validate');
const extractProperties = require('./../../../utils/extractProperties');
const moment = require("moment");

const allowedModifiableProperties = ['supplier', 'invoice_number', 'invoice_date', 'total', 'vat', 'standard_rate', 'zero_rate', 'delivery_status', 'invoice_type', 'expense_type'];
const allowedPaymentModifiableProperties = ['payments'];
const buildQuery = (req) => {
    const {supplier_day_start, supplier_day_end} = req.query;
    const QUERY = {};
    if (req.params.id && validate.id(req.params.id)) QUERY._id = req.params.id;
    if(supplier_day_start){
        const date = moment(supplier_day_start).format("YYYY-MM-DD");
        if(date) QUERY.invoice_date = {$gte: date};
    }
    if(supplier_day_end){
        const date = moment(supplier_day_end).format("YYYY-MM-DD");
        if(date){
            if(!QUERY.hasOwnProperty("invoice_date")) QUERY.invoice_date = {$lte: date};
            else QUERY.invoice_date[`$lte`] = date;
        }
    }
    return QUERY;
};

const getSupplierInvoices = async (req, res, next) => {
    try {
        res.status(200).json(await SERVICE_SUPPLIER_INVOICES.fetchSupplierInvoices(buildQuery(req)));
    } catch (e) {next(e);}
};
const addSupplierInvoice = async (req, res, next) => {
    try {
        res.status(201).json(await SERVICE_SUPPLIER_INVOICES.insertSupplierInvoice(extractProperties(req.body, allowedModifiableProperties)));
    } catch (e) {next(e);}
};
const updateSupplierInvoice = async (req, res, next) => {
    try {
        res.status(200).json(await SERVICE_SUPPLIER_INVOICES.updateSupplierInvoice(validate.id(req.params.id), extractProperties(req.body, allowedModifiableProperties)));
    } catch (e) {next(e);}
};
const deleteSupplierInvoice = async (req, res, next) => {
    try {
        res.status(200).json(await SERVICE_SUPPLIER_INVOICES.deleteSupplierInvoice(validate.id(req.params.id)));
    } catch (e) {next(e);}
};
const recordPayments = async (req, res, next) => {
    try {
        res.status(200).json(await SERVICE_SUPPLIER_INVOICES.updatePayments(validate.id(req.params.id), extractProperties(req.body, allowedPaymentModifiableProperties)));
    } catch (e) {next(e);}
};

module.exports = {
    getSupplierInvoices,
    addSupplierInvoice,
    updateSupplierInvoice,
    deleteSupplierInvoice,
    recordPayments
};
