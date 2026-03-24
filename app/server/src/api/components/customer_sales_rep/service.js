const createError = require('http-errors');
const CustomerSalesRep = require('./model');
const database = require('./../../../db/database');

const checkCustomerSalesRep = (query = {}) => {
    return database.exists(CustomerSalesRep, query);
};
const fetchCustomerSalesRep = (query = {}, projection = {}, sort = {order: 1}, limit = 0) => {
    return database.find(CustomerSalesRep, query, projection, sort, limit);
};
const insertCustomerSalesRep = async (properties) => {
    const doc = new CustomerSalesRep(properties);
    const error = await doc.validate();
    if (!error) return database.create(CustomerSalesRep, doc);
    throw new createError(500);
};
const updateCustomerSalesRep = async (id, properties) => {
    const doc = new CustomerSalesRep(properties);
    const error = await doc.validate(Object.keys(properties));
    if (!error) return database.findByIdAndUpdate(CustomerSalesRep, id, properties);
    throw new createError(500);
};
const deleteCustomerSalesRep = (id) => {
    return database.findByIdAndDelete(CustomerSalesRep, id);
};

module.exports = {
    checkCustomerSalesRep,
    fetchCustomerSalesRep,
    insertCustomerSalesRep,
    updateCustomerSalesRep,
    deleteCustomerSalesRep,
};
