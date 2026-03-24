const createError = require('http-errors');
const InventoryTags = require('./model');
const database = require('./../../../db/database');

const checkInventoryTag = (query = {}) => {
    return database.exists(InventoryTags, query);
};
const fetchInventoryTags = (query = {}, projection = {}, sort = {name: 1}, limit = 0) => {
    return database.find(InventoryTags, query, projection, sort, limit);
};
const insertInventoryTag = async (properties) => {
    const doc = new InventoryTags(properties);
    const error = await doc.validate();
    if (!error) return database.create(InventoryTags, doc);
    throw new createError(500);
};
const updateInventoryTag = async (id, properties) => {
    const doc = new InventoryTags(properties);
    const error = await doc.validate(Object.keys(properties));
    if (!error) return database.findByIdAndUpdate(InventoryTags, id, properties);
    throw new createError(500);
};
const deleteInventoryTag = (id) => {
    return database.findByIdAndDelete(InventoryTags, id);
};

module.exports = {
    checkInventoryTag,
    fetchInventoryTags,
    insertInventoryTag,
    updateInventoryTag,
    deleteInventoryTag,
};
