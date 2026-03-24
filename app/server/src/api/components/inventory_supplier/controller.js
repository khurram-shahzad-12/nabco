const SERVICE_INVENTORY_SUPPLIER = require('./service');
const validate = require('../../../utils/validate');
const extractProperties = require('./../../../utils/extractProperties');

const allowedModifiableProperties = ['name'];
const buildQuery = (req) => {
    const QUERY = {};
    if (req.params.id && validate.id(req.params.id)) QUERY._id = req.params.id;
    return QUERY;
};

const getInventorySuppliers = async (req, res, next) => {
    try {
        res.status(200).json(await SERVICE_INVENTORY_SUPPLIER.fetchInventorySuppliers(buildQuery(req)));
    } catch (e) {next(e);}
};
const addInventorySupplier = async (req, res, next) => {
    try {
        res.status(201).json(await SERVICE_INVENTORY_SUPPLIER.insertInventorySupplier(extractProperties(req.body, allowedModifiableProperties)));
    } catch (e) {next(e);}
};
const updateInventorySupplier = async (req, res, next) => {
    try {
        res.status(200).json(await SERVICE_INVENTORY_SUPPLIER.updateInventorySupplier(validate.id(req.params.id), extractProperties(req.body, allowedModifiableProperties)));
    } catch (e) {next(e);}
};
const deleteInventorySupplier = async (req, res, next) => {
    try {
        res.status(200).json(await SERVICE_INVENTORY_SUPPLIER.deleteInventorySupplier(validate.id(req.params.id)));
    } catch (e) {next(e);}
};

module.exports = {
    getInventorySuppliers: getInventorySuppliers,
    addInventorySupplier: addInventorySupplier,
    updateInventorySupplier: updateInventorySupplier,
    deleteInventorySupplier: deleteInventorySupplier,
};
