const SERVICE_CUSTOMER_GROUPS = require('./service');
const validate = require('../../../utils/validate');
const extractProperties = require('./../../../utils/extractProperties');

const allowedModifiableProperties = [
    'name', 'customers', 'items'
];
const buildQuery = (req) => {
    if (req.params.groupId && validate.id(req.params.groupId)) return {customerGroup: req.params.id};
    return {};
};

const getCustomerGroups = async (req, res, next) => {
    try {
        res.status(200).json(await SERVICE_CUSTOMER_GROUPS.fetchCustomerGroups(buildQuery(req)));
    } catch (e) {next(e);}
};
const addCustomerGroups = async (req, res, next) => {
    try {
        res.status(201).json(await SERVICE_CUSTOMER_GROUPS.insertCustomerGroups(extractProperties(req.body, allowedModifiableProperties), req.auth.payload.permissions));
    } catch (e) {next(e);}
};
const updateCustomerGroups = async (req, res, next) => {
    try {
        res.status(200).json(await SERVICE_CUSTOMER_GROUPS.updateCustomerGroups(validate.id(req.params.groupId), extractProperties(req.body, allowedModifiableProperties), req.auth.payload.permissions));
    } catch (e) {next(e);}
};
const deleteCustomerGroup = async (req, res, next) => {
    try {
        res.status(200).json(await SERVICE_CUSTOMER_GROUPS.deleteCustomerGroup(validate.id(req.params.groupId)));
    } catch (e) {next(e);}
};

module.exports = {
    getCustomerGroups,
    addCustomerGroups,
    updateCustomerGroups,
    deleteCustomerGroup
};
