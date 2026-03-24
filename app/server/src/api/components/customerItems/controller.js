const SERVICE_CUSTOMER_ITEMS = require('./service');
const validate = require('../../../utils/validate');
const extractProperties = require('./../../../utils/extractProperties');

const allowedModifiableProperties = [
    'customer', 'items', 'updateCustomerItemId'
];
const buildQuery = (req) => {
    if (req.params.id && validate.id(req.params.id)) return {customer: req.params.id};
    return {};
};

const getCustomerItems = async (req, res, next) => {
    try {
        res.status(200).json(await SERVICE_CUSTOMER_ITEMS.fetchCustomerItems(buildQuery(req)));
    } catch (e) {next(e);}
};
const getCustomerItemsNames = async (req, res, next) => {
    try {
        res.status(200).json(await SERVICE_CUSTOMER_ITEMS.fetchCustomerItemsNames(buildQuery(req)));
    } catch (e) {next(e);}
};
const addCustomerItems = async (req, res, next) => {
    try {
        res.status(201).json(await SERVICE_CUSTOMER_ITEMS.insertCustomerItems(extractProperties(req.body, allowedModifiableProperties), req.auth.payload.permissions));
    } catch (e) {next(e);}
};
const updateCustomerItems = async (req, res, next) => {
    try {
        res.status(200).json(await SERVICE_CUSTOMER_ITEMS.updateCustomerItems(validate.id(req.params.id), extractProperties(req.body, allowedModifiableProperties), req.auth.payload.permissions));
    } catch (e) {next(e);}
};
const upsertCustomerItems = async (req, res, next) => {
    try {
        res.status(200).json(await SERVICE_CUSTOMER_ITEMS.upsertCustomerItems(validate.id(req.params.id), req.body.items, req.auth.payload.permissions));
    } catch (e) {next(e);}
};
const getCustomersWithPriceBelowCost = async (req, res, next) => {
    try {
        res.status(200).json(await SERVICE_CUSTOMER_ITEMS.getCustomersWithPriceBelowCost());
    } catch (e) {next(e);}
};

module.exports = {
    getCustomerItems,
    addCustomerItems,
    updateCustomerItems,
    getCustomersWithPriceBelowCost,
    getCustomerItemsNames,
    upsertCustomerItems,
};
