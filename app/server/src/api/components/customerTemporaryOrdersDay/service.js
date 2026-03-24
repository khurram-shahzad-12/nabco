const createError = require('http-errors');
const CustomerTemporaryOrdersDay = require('./model');
const database = require('./../../../db/database');

const fetchTemporaryCustomersForDate = (ot_date, projection = {}, sort = {}, limit = 0) => {
    const query = {ot_date: ot_date };
    return database.find(CustomerTemporaryOrdersDay, query, projection, sort, limit);
};

const fetchTemporaryCustomersBeforeDate = (ot_date, projection = {}, sort = {}, limit = 0) => {
    const query = {ot_date: {$lt: ot_date} };
    return database.find(CustomerTemporaryOrdersDay, query, projection, sort, limit);
};

const insertCustomerTemporaryOrdersDay = async (properties) => {
    const doc = new CustomerTemporaryOrdersDay(properties);
    const error = await doc.validate();
    if (!error) {
        return database.create(CustomerTemporaryOrdersDay, doc);
    }
    throw new createError(500);
};

const deleteCustomerTemporaryOrdersDay = async (id) => {
    return database.findByIdAndDelete(CustomerTemporaryOrdersDay, id);
};

module.exports = {
    fetchTemporaryCustomersForDate,
    fetchTemporaryCustomersBeforeDate,
    insertCustomerTemporaryOrdersDay,
    deleteCustomerTemporaryOrdersDay,
};
