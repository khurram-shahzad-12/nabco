const createError = require('http-errors');
const PaymentTerm = require('./model');
const database = require('./../../../db/database');

const checkPaymentTerm = (query = {}) => {
    return database.exists(PaymentTerm, query);
};
const fetchPaymentTerms = (query = {}, projection = {}, sort = {name: 1}, limit = 0) => {
    return database.find(PaymentTerm, query, projection, sort, limit);
};
const insertPaymentTerm = async (properties) => {
    const doc = new PaymentTerm(properties);
    const error = await doc.validate();
    if (!error) return database.create(PaymentTerm, doc);
    throw new createError(500);
};
const updatePaymentTerm = async (id, properties) => {
    const doc = new PaymentTerm(properties);
    const error = await doc.validate(Object.keys(properties));
    if (!error) return database.findByIdAndUpdate(PaymentTerm, id, properties);
    throw new createError(500);
};
const deletePaymentTerm = (id) => {
    return database.findByIdAndDelete(PaymentTerm, id);
};

module.exports = {
    checkPaymentTerm,
    fetchPaymentTerms,
    insertPaymentTerm,
    updatePaymentTerm,
    deletePaymentTerm,
};
