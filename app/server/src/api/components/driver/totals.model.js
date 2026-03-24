const mongoose = require('mongoose');
const MODEL_NAME = 'DriverTotal';
const COLLECTION_NAME = 'driverTotals';
const moment = require('moment');

const SERVICE_DRIVER_NAME = require('./name.service');
const SERVICE_VEHICLE = require('./vehicle.service');
const SERVICE_ZONE = require('./../zone/service');

const verifyDriver = async (value) => {
    const driverID = value.toString();
    const lookup = await SERVICE_DRIVER_NAME.checkDriver({_id: driverID});
    return (lookup !== null);
};

const verifyVehicle = async (value) => {
    const vehicleID = value.toString();
    const lookup = await SERVICE_VEHICLE.checkVehicle({_id: vehicleID});
    return (lookup !== null);
};

const verifyZone = async (value) => {
    const zoneID = value.toString();
    const lookup = await SERVICE_ZONE.checkZone({_id: zoneID});
    return (lookup !== null);
};

const SCHEMA_DRIVER_TOTAL = new mongoose.Schema({
    driver: {
        type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true,
        validate: {validator: verifyDriver},
    },
    vehicle: {
        type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true,
        validate: {validator: verifyVehicle},
    },
    date: {type: Date, required: true, default: moment().format('YYYY-MM-DD')},
    helper:     {type: String, default: ''},
    zone:   {
        type: mongoose.Schema.Types.ObjectId, ref: 'Zone', required: true, index: true,
        validate: {validator: verifyZone},
    },
    recorded_by:     {type: String, default: ''},
    checked_by:      {type: String, default: ''},
    notes:       {type: String, trim: true, default: ''},
    deduction_amount: {type: Number, required: true, min: 0},
    cash_total: {type: Number, required: true, min: 0},
    card_total: {type: Number, required: true, min: 0},
    cash_received: {type: Number, required: true, min: 0},
    cash_difference: {type: Number, required: true, default: 0},
    reason:   {type: String, required: true, trim: true},
}, {
    collection: COLLECTION_NAME,
    versionKey: false,
});

const DriverName = mongoose.model(MODEL_NAME, SCHEMA_DRIVER_TOTAL);
module.exports = DriverName;
