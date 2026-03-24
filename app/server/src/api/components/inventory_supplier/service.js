const createError = require('http-errors');
const InventorySupplier = require('./model');
const database = require('./../../../db/database');

const checkInventorySupplier = (query = {}) => {
    return database.exists(InventorySupplier, query);
};
const fetchInventorySupplier = (query = {}, projection = {}, sort = {name: 1}, limit = 0) => {
    return database.find(InventorySupplier, query, projection, sort, limit);
};
const insertInventorySupplier = async (properties) => {
    const doc = new InventorySupplier(properties);
    const error = await doc.validate();
    if (!error) return database.create(InventorySupplier, doc);
    throw new createError(500);
};
const updateInventorySupplier = async (id, properties) => {
    const doc = new InventorySupplier(properties);
    const error = await doc.validate(Object.keys(properties));
    if (!error) return database.findByIdAndUpdate(InventorySupplier, id, properties);
    throw new createError(500);
};
const deleteInventorySupplier = (id) => {
    return database.findByIdAndDelete(InventorySupplier, id);
};

module.exports = {
    checkInventorySupplier: checkInventorySupplier,
    fetchInventorySuppliers: fetchInventorySupplier,
    insertInventorySupplier: insertInventorySupplier,
    updateInventorySupplier: updateInventorySupplier,
    deleteInventorySupplier: deleteInventorySupplier,
};
