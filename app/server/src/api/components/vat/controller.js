const SERVICE_VAT = require('./service');
const validate = require('../../../utils/validate');
const extractProperties = require('./../../../utils/extractProperties');

const allowedModifiableProperties = ['name', 'rate', 'order'];
const buildQuery = (req) => {
    const QUERY = {};
    if (req.params.id && validate.id(req.params.id)) QUERY._id = req.params.id;
    return QUERY;
};

const getVAT = async (req, res, next) => {
    try {
        res.status(200).json(await SERVICE_VAT.fetchVAT(buildQuery(req)));
    } catch (e) {next(e);}
};
const addVAT = async (req, res, next) => {
    try {
        res.status(201).json(await SERVICE_VAT.insertVAT(extractProperties(req.body, allowedModifiableProperties)));
    } catch (e) {next(e);}
};
const updateVAT = async (req, res, next) => {
    try {
        res.status(200).json(await SERVICE_VAT.updateVAT(validate.id(req.params.id), extractProperties(req.body, allowedModifiableProperties)));
    } catch (e) {next(e);}
};
const deleteVAT = async (req, res, next) => {
    try {
        res.status(200).json(await SERVICE_VAT.deleteVAT(validate.id(req.params.id)));
    } catch (e) {next(e);}
};

module.exports = {
    getVAT,
    addVAT,
    updateVAT,
    deleteVAT,
};
