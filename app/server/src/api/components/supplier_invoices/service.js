const createError = require('http-errors');
const SupplierInvoices = require('./model');
const database = require('./../../../db/database');

const checkSupplierInvoices = (query = {}) => {
    return database.exists(SupplierInvoices, query);
};
const fetchSupplierInvoices = (query = {}, projection = {}, sort = {invoice_date: 1}, limit = 0) => {
    return database.find(SupplierInvoices, query, projection, sort, limit);
};
const insertSupplierInvoice = async (properties) => {
    const doc = new SupplierInvoices(properties);
    const error = await doc.validate();
    if (!error) {
        doc.standard_rate = calculateStandardRateFromVat(doc);
        doc.zero_rate = calculateZeroRate(doc);
        return database.create(SupplierInvoices, doc);
    }
    throw new createError(500);
};
const updateSupplierInvoice = async (id, properties) => {
    const doc = new SupplierInvoices(properties);
    const error = await doc.validate(Object.keys(properties));
    if (!error) {
        const existingEntry = await database.findOne(SupplierInvoices, {_id: id});
        if(existingEntry.total !== doc.total || existingEntry.vat !== doc.vat) {
            properties.standard_rate = calculateStandardRateFromVat(doc);
            properties.zero_rate = calculateZeroRate(doc);
        }
        return database.findByIdAndUpdate(SupplierInvoices, id, properties);
    }
    throw new createError(500);
};
const deleteSupplierInvoice = (id) => {
    return database.findByIdAndDelete(SupplierInvoices, id);
};
const updatePayments = async (id, properties) => {
    return database.findByIdAndUpdate(SupplierInvoices, id, properties);
};

const calculateStandardRateFromVat = doc => {
    let standardRate = Number(doc.vat.toFixed(2)) / 0.2;
    return Number(standardRate.toFixed(2));
};

const calculateZeroRate = doc => {
    let zeroRate = (doc.vat + doc.standard_rate) - doc.total;
    return Number(zeroRate.toFixed(2));
};

module.exports = {
    checkSupplierInvoices,
    fetchSupplierInvoices,
    insertSupplierInvoice,
    updateSupplierInvoice,
    deleteSupplierInvoice,
    updatePayments
};
