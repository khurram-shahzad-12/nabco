const SERVICE_INVENTORY_TAG = require('./service');
const validate = require('../../../utils/validate');
const extractProperties = require('./../../../utils/extractProperties');

const allowedModifiableProperties = ['name'];
const buildQuery = (req) => {
    const QUERY = {};
    if (req.params.id && validate.id(req.params.id)) QUERY._id = req.params.id;
    return QUERY;
};

const getInventoryTags = async (req, res, next) => {
    try {
        res.status(200).json(await SERVICE_INVENTORY_TAG.fetchInventoryTags(buildQuery(req)));
    } catch (e) {next(e);}
};
const addInventoryTag = async (req, res, next) => {
    try {
        res.status(201).json(await SERVICE_INVENTORY_TAG.insertInventoryTag(extractProperties(req.body, allowedModifiableProperties)));
    } catch (e) {next(e);}
};
const updateInventoryTag = async (req, res, next) => {
    try {
        res.status(200).json(await SERVICE_INVENTORY_TAG.updateInventoryTag(validate.id(req.params.id), extractProperties(req.body, allowedModifiableProperties)));
    } catch (e) {next(e);}
};
const deleteInventoryTag = async (req, res, next) => {
    try {
        res.status(200).json(await SERVICE_INVENTORY_TAG.deleteInventoryTag(validate.id(req.params.id)));
    } catch (e) {next(e);}
};

module.exports = {
    getInventoryTags,
    addInventoryTag,
    updateInventoryTag,
    deleteInventoryTag,
};
