const SERVICE_INVENTORY_CATEGORY = require('./service');
const validate = require('../../../utils/validate');
const extractProperties = require('./../../../utils/extractProperties');

const allowedModifiableProperties = ['name'];
const buildQuery = (req) => {
    const QUERY = {};
    if (req.params.id && validate.id(req.params.id)) QUERY._id = req.params.id;
    return QUERY;
};

const getInventoryCategories = async (req, res, next) => {
    try {
        res.status(200).json(await SERVICE_INVENTORY_CATEGORY.fetchInventoryCategories(buildQuery(req)));
    } catch (e) {next(e);}
};
const addInventoryCategory = async (req, res, next) => {
    try {
        res.status(201).json(await SERVICE_INVENTORY_CATEGORY.insertInventoryCategory(extractProperties(req.body, allowedModifiableProperties)));
    } catch (e) {next(e);}
};
const updateInventoryCategory = async (req, res, next) => {
    try {
        res.status(200).json(await SERVICE_INVENTORY_CATEGORY.updateInventoryCategory(validate.id(req.params.id), extractProperties(req.body, allowedModifiableProperties)));
    } catch (e) {next(e);}
};
const deleteInventoryCategory = async (req, res, next) => {
    try {
        res.status(200).json(await SERVICE_INVENTORY_CATEGORY.deleteInventoryCategory(validate.id(req.params.id)));
    } catch (e) {next(e);}
};

module.exports = {
    getInventoryCategories,
    addInventoryCategory,
    updateInventoryCategory,
    deleteInventoryCategory,
};
