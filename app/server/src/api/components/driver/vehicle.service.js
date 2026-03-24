const createError = require('http-errors');
const VehicleName = require('./vehicle.model');
const database = require('./../../../db/database');
const { ObjectId } = require('mongodb');

const checkVehicle = (query = {}) => {
    return database.exists(VehicleName, query);
};
const fetchVehicles = (query = {}, projection = {}, sort = {order: 1}, limit = 0) => {
    return database.find(VehicleName, query, projection, sort, limit);
};
const insertVehicle = async (properties) => {
    if(!properties.status || properties.status.trim() === ""){properties.status = "unassigned"}
    const doc = new VehicleName(properties);
    const error = await doc.validate();
    if (!error) return database.create(VehicleName, doc);
    throw new createError(500);
};
const updateVehicle = async (id, properties) => {
    if(!properties.status || properties.status.trim() === ""){properties.status = "unassigned"}
    const doc = new VehicleName(properties);
    const error = await doc.validate(Object.keys(properties));
    if (!error) return database.findByIdAndUpdate(VehicleName, id, properties);
    throw new createError(500);
};
const deleteVehicle = (id) => {
    return database.findByIdAndDelete(VehicleName, id);
};
const changeAvailability = (updateValues) => {
    const bulkops = updateValues.data.ids.map(id=>({
        updateOne:{
            filter: {_id: new ObjectId(id)},
            update: { $set: {availability: updateValues.data.status}}
        }
    }));
    return VehicleName.bulkWrite(bulkops); 
}
const updateFields = (updateFields) => {
    const bulkFds = updateFields.data.map(item => ({
        updateOne: {
            filter: {_id: new ObjectId(item._id)},
            update: {$set: {capacity: item.capacity}},
        }
    }))
    return VehicleName.bulkWrite(bulkFds);
}

module.exports = {
    checkVehicle,
    fetchVehicles,
    insertVehicle,
    updateVehicle,
    deleteVehicle,
    changeAvailability,
    updateFields,
};
