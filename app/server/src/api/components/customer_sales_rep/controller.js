const SERVICE_CUSTOMER_SALES_REP = require('./service');
const validate = require('../../../utils/validate');
const extractProperties = require('./../../../utils/extractProperties');

const allowedModifiableProperties = ['name'];
const buildQuery = (req) => {
    const QUERY = {};
    if (req.params.id && validate.id(req.params.id)) QUERY._id = req.params.id;
    return QUERY;
};

const getCustomerSalesRep = async (req, res, next) => {
    try {
        res.status(200).json(await SERVICE_CUSTOMER_SALES_REP.fetchCustomerSalesRep(buildQuery(req)));
    } catch (e) {next(e);}
};
const addCustomerSalesRep = async (req, res, next) => {
    try {
        res.status(201).json(await SERVICE_CUSTOMER_SALES_REP.insertCustomerSalesRep(extractProperties(req.body, allowedModifiableProperties)));
    } catch (e) {next(e);}
};
const updateCustomerSalesRep = async (req, res, next) => {
    try {
        res.status(200).json(await SERVICE_CUSTOMER_SALES_REP.updateCustomerSalesRep(validate.id(req.params.id), extractProperties(req.body, allowedModifiableProperties)));
    } catch (e) {next(e);}
};
const deleteCustomerSalesRep = async (req, res, next) => {
    try {
        res.status(200).json(await SERVICE_CUSTOMER_SALES_REP.deleteCustomerSalesRep(validate.id(req.params.id)));
    } catch (e) {next(e);}
};

module.exports = {
    getCustomerSalesRep,
    addCustomerSalesRep,
    updateCustomerSalesRep,
    deleteCustomerSalesRep,
};
