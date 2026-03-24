const SERVICE_CUSTOMER_TEMPORARY_ORDERS_DAY = require('./service');
const validate = require('../../../utils/validate');
const extractProperties = require('./../../../utils/extractProperties');

const allowedModifiableProperties = [
    'customer', 'ot_date'
];

const getTemporaryCustomersForDate = async (req, res, next) => {
    try {
        res.status(200).json(await SERVICE_CUSTOMER_TEMPORARY_ORDERS_DAY.fetchTemporaryCustomersForDate(req.params.ot_date));
    } catch (e) {next(e);}
};
const addTemporaryCustomerForDate = async (req, res, next) => {
    try {
        res.status(201).json(await SERVICE_CUSTOMER_TEMPORARY_ORDERS_DAY.insertCustomerTemporaryOrdersDay(extractProperties(req.body, allowedModifiableProperties)));
    } catch (e) {next(e);}
};
const deleteTemporaryCustomerForDate = async (req, res, next) => {
    try {
        res.status(200).json(await SERVICE_CUSTOMER_TEMPORARY_ORDERS_DAY.deleteCustomerTemporaryOrdersDay(validate.id(req.params.id)));
    } catch (e) {next(e);}
};

module.exports = {
    getTemporaryCustomersForDate,
    addTemporaryCustomerForDate,
    deleteTemporaryCustomerForDate,
};
