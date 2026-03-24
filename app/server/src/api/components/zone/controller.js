const SERVICE_ZONE = require('./service');
const validate = require('../../../utils/validate');
const extractProperties = require('./../../../utils/extractProperties');

const allowedModifiableProperties = ['name', 'order'];
const buildQuery = (req) => {
    const QUERY = {};
    if (req.params.id && validate.id(req.params.id)) QUERY._id = req.params.id;
    return QUERY;
};

const getZones = async (req, res, next) => {
    try {
        res.status(200).json(await SERVICE_ZONE.fetchZones(buildQuery(req)));
    } catch (e) {next(e);}
};
const addZone = async (req, res, next) => {
    try {
        res.status(201).json(await SERVICE_ZONE.insertZone(extractProperties(req.body, allowedModifiableProperties)));
    } catch (e) {next(e);}
};
const updateZone = async (req, res, next) => {
    try {
        res.status(200).json(await SERVICE_ZONE.updateZone(validate.id(req.params.id), extractProperties(req.body, allowedModifiableProperties)));
    } catch (e) {next(e);}
};
const deleteZone = async (req, res, next) => {
    try {
        res.status(200).json(await SERVICE_ZONE.deleteZone(validate.id(req.params.id)));
    } catch (e) {next(e);}
};

module.exports = {
    getZones,
    addZone,
    updateZone,
    deleteZone,
};
