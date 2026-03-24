const moment = require('moment');
const SERVICE_DRIVER_TOTALS = require('./totals.service');
const validate = require('../../../utils/validate');
const extractProperties = require('./../../../utils/extractProperties');

const allowedModifiableProperties = ['driver', 'date', 'vehicle', 'helper', 'zone', 'recorded_by', 'checked_by', 'notes',
'deduction_amount', 'cash_total', 'card_total', 'cash_received', 'reason'];

const buildQuery = (req) => {
    const QUERY = {};
    const {start, end} = req.query;
    if (req.params.id && validate.id(req.params.id)) QUERY._id = req.params.id;
    if(start && end) {
        const startDate = moment(start).format('YYYY-MM-DD');
        const endDate = moment(end).format('YYYY-MM-DD');
        QUERY.date = {$gte: startDate, $lte: endDate};
    }
    return QUERY;
};

const getDriverTotals = async (req, res, next) => {
    try {
        res.status(200).json(await SERVICE_DRIVER_TOTALS.fetchDriverTotals(buildQuery(req)));
    } catch (e) {next(e);}
};
const addDriverTotal = async (req, res, next) => {
    try {
        res.status(201).json(await SERVICE_DRIVER_TOTALS.insertDriverTotal(extractProperties(req.body, allowedModifiableProperties)));
    } catch (e) {next(e);}
};
const updateDriverTotal = async (req, res, next) => {
    try {
        res.status(200).json(await SERVICE_DRIVER_TOTALS.updateDriverTotal(validate.id(req.params.id), extractProperties(req.body, allowedModifiableProperties)));
    } catch (e) {next(e);}
};
const deleteDriverTotal = async (req, res, next) => {
    try {
        res.status(200).json(await SERVICE_DRIVER_TOTALS.deleteDriverTotals(validate.id(req.params.id)));
    } catch (e) {next(e);}
};

module.exports = {
    getDriverTotals,
    addDriverTotal,
    updateDriverTotal,
    deleteDriverTotal,
};
