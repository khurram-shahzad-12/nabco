const createError = require('http-errors');
const CustomerCancelledInvoicesDay = require('./model');
const database = require('./../../../db/database');

const fetchCustomerCancelledInvoicesForDate = (ot_date, projection = {}, sort = {}, limit = 0) => {
    const query = {ot_date: ot_date };
    return database.find(CustomerCancelledInvoicesDay, query, projection, sort, limit);
};

const fetchCustomerCancelledInvoicesBeforeDate = (ot_date, projection = {}, sort = {}, limit = 0) => {
    const query = {ot_date: {$lt: ot_date} };
    return database.find(CustomerCancelledInvoicesDay, query, projection, sort, limit);
};

const insertCustomerCancelledInvoicesDay = async (properties) => {
    const doc = new CustomerCancelledInvoicesDay(properties);
    const error = await doc.validate();
    if (!error) {
        return database.create(CustomerCancelledInvoicesDay, doc);
    }
    throw new createError(500);
};

const deleteCustomerCancelledInvoicesDay = async (id) => {
    return database.findByIdAndDelete(CustomerCancelledInvoicesDay, id);
};

module.exports = {
    fetchCustomerCancelledInvoicesForDate,
    fetchCustomerCancelledInvoicesBeforeDate,
    insertCustomerCancelledInvoicesDay,
    deleteCustomerCancelledInvoicesDay,
};