const createError = require('http-errors');
const DriverName = require('./name.model');
const database = require('./../../../db/database');

const checkDriver = (query = {}) => {
    return database.exists(DriverName, query);
};
const fetchDrivers = (query = {}, projection = {}, sort = {order: 1}, limit = 0) => {
    return database.find(DriverName, query, projection, sort, limit);
};
const insertDriver = async (properties) => {
    const doc = new DriverName(properties);
    const error = await doc.validate();
    if (!error) return database.create(DriverName, doc);
    throw new createError(500);
};
const updateDriver = async (id, properties) => {
    const doc = new DriverName(properties);
    const error = await doc.validate(Object.keys(properties));
    if (!error) return database.findByIdAndUpdate(DriverName, id, properties);
    throw new createError(500);
};
const deleteDriver = (id) => {
    return database.findByIdAndDelete(DriverName, id);
};

module.exports = {
    checkDriver,
    fetchDrivers,
    insertDriver,
    updateDriver,
    deleteDriver,
};
