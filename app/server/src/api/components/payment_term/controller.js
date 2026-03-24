const SERVICE_PAYMENT_TERM = require('./service');
const validate = require('../../../utils/validate');
const extractProperties = require('./../../../utils/extractProperties');

const allowedModifiableProperties = ['name'];
const buildQuery = (req) => {
    const QUERY = {};
    if (req.params.id && validate.id(req.params.id)) QUERY._id = req.params.id;
    return QUERY;
};

const getPaymentTerms = async (req, res, next) => {
    try {
        res.status(200).json(await SERVICE_PAYMENT_TERM.fetchPaymentTerms(buildQuery(req)));
    } catch (e) {next(e);}
};
const addPaymentTerm = async (req, res, next) => {
    try {
        res.status(201).json(await SERVICE_PAYMENT_TERM.insertPaymentTerm(extractProperties(req.body, allowedModifiableProperties)));
    } catch (e) {next(e);}
};
const updatePaymentTerm = async (req, res, next) => {
    try {
        res.status(200).json(await SERVICE_PAYMENT_TERM.updatePaymentTerm(validate.id(req.params.id), extractProperties(req.body, allowedModifiableProperties)));
    } catch (e) {next(e);}
};
const deletePaymentTerm = async (req, res, next) => {
    try {
        res.status(200).json(await SERVICE_PAYMENT_TERM.deletePaymentTerm(validate.id(req.params.id)));
    } catch (e) {next(e);}
};

module.exports = {
    getPaymentTerms,
    addPaymentTerm,
    updatePaymentTerm,
    deletePaymentTerm,
};
