const SERVICE_DRIVER = require('./name.service');
const validate = require('../../../utils/validate');
const extractProperties = require('./../../../utils/extractProperties');

const allowedModifiableProperties = ['name'];
const buildQuery = (req) => {
    const QUERY = {};
    if (req.params.id && validate.id(req.params.id)) QUERY._id = req.params.id;
    return QUERY;
};

const getDrivers = async (req, res, next) => {
    try {
        res.status(200).json(await SERVICE_DRIVER.fetchDrivers(buildQuery(req)));
    } catch (e) {next(e);}
};
const addDriver = async (req, res, next) => {
    try {
        res.status(201).json(await SERVICE_DRIVER.insertDriver(extractProperties(req.body, allowedModifiableProperties)));
    } catch (e) {next(e);}
};
const updateDriver = async (req, res, next) => {
    try {
        res.status(200).json(await SERVICE_DRIVER.updateDriver(validate.id(req.params.id), extractProperties(req.body, allowedModifiableProperties)));
    } catch (e) {next(e);}
};
const deleteDriver = async (req, res, next) => {
    try {
        res.status(200).json(await SERVICE_DRIVER.deleteDriver(validate.id(req.params.id)));
    } catch (e) {next(e);}
};

module.exports = {
    getDrivers,
    addDriver,
    updateDriver,
    deleteDriver,
};
