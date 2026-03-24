const createError = require('http-errors');
const Zone = require('./model');
const database = require('./../../../db/database');

const checkZone = (query = {}) => {
    return database.exists(Zone, query);
};
const fetchZones = (query = {}, projection = {}, sort = {order: 1}, limit = 0) => {
    return database.find(Zone, query, projection, sort, limit);
};
const insertZone = async (properties) => {
    const doc = new Zone(properties);
    const error = await doc.validate();
    if (!error) return database.create(Zone, doc);
    throw new createError(500);
};
const updateZone = async (id, properties) => {
    const doc = new Zone(properties);
    const error = await doc.validate(Object.keys(properties));
    if (!error) return database.findByIdAndUpdate(Zone, id, properties);
    throw new createError(500);
};
const deleteZone = (id) => {
    return database.findByIdAndDelete(Zone, id);
};

module.exports = {
    checkZone,
    fetchZones,
    insertZone,
    updateZone,
    deleteZone,
};
