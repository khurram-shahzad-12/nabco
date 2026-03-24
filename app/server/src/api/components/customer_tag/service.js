const createError = require('http-errors');
const database = require('./../../../db/database');
const CustomerTags = require('./model');

const checkCustomerTag = (query = {}) => {
    return database.exists(CustomerTags, query);
};
const fetchCustomerTags = (query = {}, projection = {}, sort = {name: 1}, limit = 0) => {
    return database.find(CustomerTags, query, projection, sort, limit);
};
const insertCustomerTag = async (properties) => {
    const doc = new CustomerTags(properties);
    const error = await doc.validate();
    if (!error) return database.create(CustomerTags, doc);
    throw new createError(500);
};
const updateCustomerTag = async (id, properties) => {
    const doc = new CustomerTags(properties);
    const error = await doc.validate(Object.keys(properties));
    if (!error) return database.findByIdAndUpdate(CustomerTags, id, properties);
    throw new createError(500);
};
const deleteCustomerTag = (id) => {
    return database.findByIdAndDelete(CustomerTags, id);
};

module.exports = {
    checkCustomerTag,
    fetchCustomerTags,
    insertCustomerTag,
    updateCustomerTag,
    deleteCustomerTag,
};
