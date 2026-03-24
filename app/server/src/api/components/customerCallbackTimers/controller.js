const SERVICE_CUSTOMER_CALLBACK_TIMERS = require('./service');
const validate = require('../../../utils/validate');
const extractProperties = require('./../../../utils/extractProperties');

const allowedModifiableProperties = [
    'customer', 'time', 'comment', 'user'
];

const getCustomerCallbackTimers = async (req, res, next) => {
    try {
        res.status(200).json(await SERVICE_CUSTOMER_CALLBACK_TIMERS.fetchCustomerCallbackTimers());
    } catch (e) {next(e);}
};
const addCustomerCallbackTimer = async (req, res, next) => {
    try {
        res.status(201).json(await SERVICE_CUSTOMER_CALLBACK_TIMERS.insertCustomerCallbackTimer(extractProperties(req.body, allowedModifiableProperties)));
    } catch (e) {next(e);}
};
const deleteCustomerCallbackTimer = async (req, res, next) => {
    try {
        res.status(200).json(await SERVICE_CUSTOMER_CALLBACK_TIMERS.deleteCustomerCallbackTimer(validate.id(req.params.id)));
    } catch (e) {next(e);}
};

module.exports = {
    getCustomerCallbackTimers,
    addCustomerCallbackTimer,
    deleteCustomerCallbackTimer,
};
