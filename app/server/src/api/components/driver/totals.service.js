const createError = require('http-errors');
const DriverTotal = require('./totals.model');
const database = require('./../../../db/database');

const checkDriverTotal = (query = {}) => {
    return database.exists(DriverTotal, query);
};
const fetchDriverTotals = (query = {}, projection = {}, sort = {order: 1}, limit = 0) => {
    return database.find(DriverTotal, query, projection, sort, limit);
};
const insertDriverTotal = async (properties) => {
    const doc = new DriverTotal(properties);
    const error = await doc.validate();
    if (!error) {
        calculateCashDifference(doc);
        return database.create(DriverTotal, doc);
    }
    throw new createError(500);
};
const updateDriverTotal = async (id, properties) => {
    const doc = new DriverTotal(properties);
    const error = await doc.validate(Object.keys(properties));
    if (!error) {
        calculateCashDifference(properties);
        return database.findByIdAndUpdate(DriverTotal, id, properties);
    }
    throw new createError(500);
};
const deleteDriverTotals = (id) => {
    return database.findByIdAndDelete(DriverTotal, id);
};

const calculateCashDifference = (doc) => {
    const difference = doc.cash_total - doc.deduction_amount - doc.cash_received;
    doc.cash_difference = Number(difference.toFixed(2));
};

module.exports = {
    checkDriverTotal,
    fetchDriverTotals,
    insertDriverTotal,
    updateDriverTotal,
    deleteDriverTotals,
};
