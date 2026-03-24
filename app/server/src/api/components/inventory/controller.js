const SERVICE_INVENTORY = require('./service');
const validate = require('../../../utils/validate');
const extractProperties = require('./../../../utils/extractProperties');

const allowedModifiableProperties = ['name', 'active', 'category', 'tags', 'vat', 'quantity', 'alert_quantity', 'cost_price', 'min_sale_price',
    'default_sale_price', 'collection_price', 'weight_grams', 'weight_kg', 'supplier1', 'supplier2', 'supplier3', 'item_image', 'updateCustomerPrices'];
const buildQuery = (req) => {
    const QUERY = {};
    if (req.query.hasOwnProperty('category')) QUERY.category = req.query.category;
    if (req.query.hasOwnProperty('tags')) QUERY.tags = Array.isArray(req.query.tags) ? {$all: req.query.tags} : req.query.tags;
    if (req.query.hasOwnProperty('vat')) QUERY.vat = req.query.vat;
    if (req.params.id && validate.id(req.params.id)) QUERY._id = req.params.id;
    return QUERY;
};

const getInventory = async (req, res, next) => {
    try {
        res.status(200).json(await SERVICE_INVENTORY.fetchInventory(buildQuery(req)));
    } catch (e) {next(e);}
};
const addInventory = async (req, res, next) => {
    try {
        res.status(201).json(await SERVICE_INVENTORY.insertInventory(extractProperties(req.body, allowedModifiableProperties)));
    } catch (e) {next(e);}
};
const updateInventory = async (req, res, next) => {
    try {
        res.status(200).json(await SERVICE_INVENTORY.updateInventory(validate.id(req.params.id), extractProperties(req.body, allowedModifiableProperties)));
    } catch (e) {next(e);}
};
const getInventoryItemImage = async (req, res, next) => {
    try {
        res.send(await SERVICE_INVENTORY.getInventoryImage(req.params.id));
    } catch (e) {next(e);}
};
const updateInventoryImage = async (req, res, next) => {
    try {
        const fileReceivedFromClient = req.file; //File Object sent in 'fileFieldName' field in multipart/form-data
        res.status(200).json(await SERVICE_INVENTORY.updateInventoryImage(validate.id(req.params.id), fileReceivedFromClient));
    } catch (e) {next(e);}
};
const removeInventoryImage = async (req, res, next) => {
    try {
        res.status(200).json(await SERVICE_INVENTORY.removeInventoryImage(validate.id(req.params.id)));
    } catch (e) {next(e);}
};
const deleteInventory = async (req, res, next) => {
    try {
        res.status(200).json(await SERVICE_INVENTORY.deleteInventory(validate.id(req.params.id)));
    } catch (e) {next(e);}
};
const resetInventoryNegatives = async (req, res, next) => {
    try {
        await SERVICE_INVENTORY.resetInventoryNegatives()
        res.sendStatus(200);
    } catch (e) {next(e);}
};

module.exports = {
    getInventory,
    addInventory,
    updateInventory,
    getInventoryItemImage,
    removeInventoryImage,
    updateInventoryImage,
    deleteInventory,
    resetInventoryNegatives
};
