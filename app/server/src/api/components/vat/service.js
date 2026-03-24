const createError = require('http-errors');
const VAT = require('./model');
const database = require('./../../../db/database');

const checkVAT = (query = {}) => {
    return database.exists(VAT, query);
};
const fetchVAT = (query = {}, projection = {}, sort = {order: 1}, limit = 0) => {
    return database.find(VAT, query, projection, sort, limit);
};
const insertVAT = async (properties) => {
    const doc = new VAT(properties);
    const error = await doc.validate();
    if (!error) return database.create(VAT, doc);
    throw new createError(500);
};
const updateVAT = async (id, properties) => {
    const doc = new VAT(properties);
    const error = await doc.validate(Object.keys(properties));
    if (!error) return database.findByIdAndUpdate(VAT, id, properties);
    throw new createError(500);
};
const deleteVAT = (id) => {
    return database.findByIdAndDelete(VAT, id);
};

module.exports = {
    checkVAT,
    fetchVAT,
    insertVAT,
    updateVAT,
    deleteVAT,
};
