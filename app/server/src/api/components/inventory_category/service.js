const createError = require('http-errors');
const InventoryCategory = require('./model');
const database = require('./../../../db/database');

const checkInventoryCategory = (query = {}) => {
    return database.exists(InventoryCategory, query);
};
const fetchInventoryCategories = (query = {}, projection = {}, sort = {name: 1}, limit = 0) => {
    return database.find(InventoryCategory, query, projection, sort, limit);
};
const insertInventoryCategory = async (properties) => {
    const doc = new InventoryCategory(properties);
    const error = await doc.validate();
    if (!error) return database.create(InventoryCategory, doc);
    throw new createError(500);
};
const updateInventoryCategory = async (id, properties) => {
    const doc = new InventoryCategory(properties);
    const error = await doc.validate(Object.keys(properties));
    if (!error) return database.findByIdAndUpdate(InventoryCategory, id, properties);
    throw new createError(500);
};
const deleteInventoryCategory = (id) => {
    return database.findByIdAndDelete(InventoryCategory, id);
};

module.exports = {
    checkInventoryCategory,
    fetchInventoryCategories,
    insertInventoryCategory,
    updateInventoryCategory,
    deleteInventoryCategory,
};
