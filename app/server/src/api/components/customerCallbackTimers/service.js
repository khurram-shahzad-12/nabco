const createError = require('http-errors');
const CustomerCallbackTimers = require('./model');
const database = require('./../../../db/database');

const fetchCustomerCallbackTimers = (query = {}, projection = {}, sort = {}, limit = 0) => {
    return database.find(CustomerCallbackTimers, query, projection, sort, limit);
};

const fetchCustomerCallbackTimersBeforeDate = (date, projection = {}, sort = {}, limit = 0) => {
    const query = {time: {$lt: date} };
    return database.find(CustomerCallbackTimers, query, projection, sort, limit);
};

const insertCustomerCallbackTimer = async (properties) => {
    const doc = new CustomerCallbackTimers(properties);
    const error = await doc.validate();
    if (!error) {
        return database.create(CustomerCallbackTimers, doc);
    }
    throw new createError(500);
};

const deleteCustomerCallbackTimer = async (id) => {
    return database.findByIdAndDelete(CustomerCallbackTimers, id);
};

module.exports = {
    fetchCustomerCallbackTimers,
    fetchCustomerCallbackTimersBeforeDate,
    insertCustomerCallbackTimer,
    deleteCustomerCallbackTimer,
};
