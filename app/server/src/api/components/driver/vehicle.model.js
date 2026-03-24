const mongoose = require('mongoose');
const MODEL_NAME = 'Vehicle';
const COLLECTION_NAME = 'vehicleNames';

const SCHEMA_VEHICLE_NAME = new mongoose.Schema({
    name:   {type: String, required: true, trim: true},
    status: {type: String, required: true, trim: true, default: 'unassigned'},
    availability: {type: String, required: true, trim: true, default: 'available'},
    capacity: {type: Number, required: true, trim: true, default: 1000},
}, {
    collection: COLLECTION_NAME,
    versionKey: false,
});

const VehicleName = mongoose.model(MODEL_NAME, SCHEMA_VEHICLE_NAME);
module.exports = VehicleName;
