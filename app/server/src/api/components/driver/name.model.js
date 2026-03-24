const mongoose = require('mongoose');
const MODEL_NAME = 'Driver';
const COLLECTION_NAME = 'driverNames';

const SCHEMA_DRIVER_NAME = new mongoose.Schema({
    name:   {type: String, required: true, trim: true},
}, {
    collection: COLLECTION_NAME,
    versionKey: false,
});

const DriverName = mongoose.model(MODEL_NAME, SCHEMA_DRIVER_NAME);
module.exports = DriverName;
