const SERVICE_VEHICLE = require('./vehicle.service');
const validate = require('../../../utils/validate');
const extractProperties = require('./../../../utils/extractProperties');

const allowedModifiableProperties = ['name','capacity', 'status'];
const buildQuery = (req) => {
    const QUERY = {};
    if (req.params.id && validate.id(req.params.id)) QUERY._id = req.params.id;
    return QUERY;
};

const getVehicles = async (req, res, next) => {
    try {
        res.status(200).json(await SERVICE_VEHICLE.fetchVehicles(buildQuery(req)));
    } catch (e) {next(e);}
};
const addVehicle = async (req, res, next) => {
    try {
        res.status(201).json(await SERVICE_VEHICLE.insertVehicle(extractProperties(req.body, allowedModifiableProperties)));
    } catch (e) {next(e);}
};
const updateVehicle = async (req, res, next) => {
    try {
        res.status(200).json(await SERVICE_VEHICLE.updateVehicle(validate.id(req.params.id), extractProperties(req.body, allowedModifiableProperties)));
    } catch (e) {next(e);}
};
const deleteVehicle = async (req, res, next) => {
    try {
        res.status(200).json(await SERVICE_VEHICLE.deleteVehicle(validate.id(req.params.id)));
    } catch (e) {next(e);}
};
const changeAvailability = async (req,res,next) => {
    try {
        res.status(200).json(await SERVICE_VEHICLE.changeAvailability(req.body));
    } catch (e) {next(e);}
}
const updateFields = async (req,res,next) => {
    try {
        res.status(200).json(await SERVICE_VEHICLE.updateFields(req.body));
    } catch (e) {next(e);}
}

module.exports = {
    getVehicles,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    changeAvailability,
    updateFields,
};
