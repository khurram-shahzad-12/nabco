const SERVICE_CUSTOMER_TAG = require('./service');
const validate = require('../../../utils/validate');
const extractProperties = require('./../../../utils/extractProperties');

const allowedModifiableProperties = ['name'];
const buildQuery = (req) => {
    const QUERY = {};
    if (req.params.id && validate.id(req.params.id)) QUERY._id = req.params.id;
    return QUERY;
};

const getCustomerTags = async (req, res, next) => {
    try {
        res.status(200).json(await SERVICE_CUSTOMER_TAG.fetchCustomerTags(buildQuery(req)));
    } catch (e) {next(e);}
};
const addCustomerTag = async (req, res, next) => {
    try {
        res.status(201).json(await SERVICE_CUSTOMER_TAG.insertCustomerTag(extractProperties(req.body, allowedModifiableProperties)));
    } catch (e) {next(e);}
};
const updateCustomerTag = async (req, res, next) => {
    try {
        res.status(200).json(await SERVICE_CUSTOMER_TAG.updateCustomerTag(validate.id(req.params.id), extractProperties(req.body, allowedModifiableProperties)));
    } catch (e) {next(e);}
};
const deleteCustomerTag = async (req, res, next) => {
    try {
        res.status(200).json(await SERVICE_CUSTOMER_TAG.deleteCustomerTag(validate.id(req.params.id)));
    } catch (e) {next(e);}
};

module.exports = {
    getCustomerTags,
    addCustomerTag,
    updateCustomerTag,
    deleteCustomerTag,
};
