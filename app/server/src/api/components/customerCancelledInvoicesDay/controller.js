const SERVICE_CUSTOMER_CANCELLED_INVOICES_DAY = require('./service');
const validate = require('../../../utils/validate');
const extractProperties = require('./../../../utils/extractProperties');

const allowedModifiableProperties = [
    'customer', 'reason', 'ot_date'
];

const getCustomerCancelledInvoicesForDate = async (req, res, next) => {
    try {
        res.status(200).json(await SERVICE_CUSTOMER_CANCELLED_INVOICES_DAY.fetchCustomerCancelledInvoicesForDate(req.params.ot_date));
    } catch (e) {next(e);}
};
const addCustomerCancelledInvoicesForDate = async (req, res, next) => {
    try {
        res.status(201).json(await SERVICE_CUSTOMER_CANCELLED_INVOICES_DAY.insertCustomerCancelledInvoicesDay(extractProperties(req.body, allowedModifiableProperties)));
    } catch (e) {next(e);}
};
const deleteCustomerCancelledInvoicesForDate = async (req, res, next) => {
    try {
        res.status(200).json(await SERVICE_CUSTOMER_CANCELLED_INVOICES_DAY.deleteCustomerCancelledInvoicesDay(validate.id(req.params.id)));
    } catch (e) {next(e);}
};

module.exports = {
    getCustomerCancelledInvoicesForDate,
    addCustomerCancelledInvoicesForDate,
    deleteCustomerCancelledInvoicesForDate,
};