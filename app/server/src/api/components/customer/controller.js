const SERVICE_CUSTOMER = require('./service');
const validate = require('./../../../utils/validate');
const extractProperties = require('./../../../utils/extractProperties');
const createError = require('http-errors');

const allowedModifiableProperties = [
    'legal_entity', 'customer_name', 'active', 'on_hold', 'shop_keys', 'tags', 'comments', 'contact_name', 'mobile', 'phone', 'email', 'address', 'city', 'postcode',
    'cash_invoice', 'print_outstanding_balances', 'payment_term', 'order_taking_days', 'payment_taking_days', 'payment_contact_name', 'payment_contact_detail', 'payment_contact_method',
    'payment_method', 'do_not_call_for_payments', 'payment_comments', 'zones', 'delivery_order', 'sales_rep', 'tele_sales_rep', 'director_name', 'director_address', 'company_number', 'vat_number', 'business_timings','latitude', 'longitude','business_start_hour','business_close_hour',
];
const buildQuery = (req) => {
    const QUERY = {};
    if (req.query.hasOwnProperty('active')) QUERY.active = true;
    if (req.query.hasOwnProperty('cash_invoice')) QUERY.cash_invoice = true;
    if (req.query.hasOwnProperty('tags')) QUERY.tags = Array.isArray(req.query.tags) ? {$all: req.query.tags} : req.query.tags;
    if (req.query.hasOwnProperty('order_taking_days') && ['0', '1', '2', '3', '4', '5', '6'].includes(req.query.order_taking_days)) QUERY.order_taking_days = req.query.order_taking_days;
    if (req.query.hasOwnProperty('payment_taking_days') && ['0', '1', '2', '3', '4', '5', '6'].includes(req.query.payment_taking_days)) QUERY.payment_taking_days = req.query.payment_taking_days;
    if (req.query.hasOwnProperty('delivery_days') && ['0', '1', '2', '3', '4', '5', '6'].includes(req.query.delivery_days)) QUERY['delivery_days.' + req.query.delivery_days] = {$ne: null};
    if (req.params.id && validate.id(req.params.id)) QUERY._id = req.params.id;
    return QUERY;
};

const getCustomers = async (req, res, next) => {
    try {
        res.status(200).json(await SERVICE_CUSTOMER.fetchCustomers(buildQuery(req)));
    } catch (e) {next(e);}
};
const addCustomer = async (req, res, next) => {
    try {
        res.status(201).json(await SERVICE_CUSTOMER.insertCustomer(extractProperties(req.body, allowedModifiableProperties)));
    } catch (e) {next(e);}
};
const updateCustomer = async (req, res, next) => {
    try {
        if (req.params.id) {
            res.status(200).json(await SERVICE_CUSTOMER.updateCustomer(validate.id(req.params.id), extractProperties(req.body, allowedModifiableProperties)));
        } else {
            if (!req.body) throw new createError(400);
            const idList = Object.keys(req.body);
            if (!idList.length || !validate.id(idList)) throw new createError(400);
            const result = await Promise.allSettled(idList.map(id => SERVICE_CUSTOMER.updateCustomer(id, extractProperties(req.body[id], allowedModifiableProperties))));
            res.status((result.some(r => r.status === 'fulfilled') ? 200 : 400)).json(result);
        }
    } catch (e) {next(e);}
};
const updateCustomerZoneDelivery = async (req, res, next) => {
    try {
        await SERVICE_CUSTOMER.updateCustomerZoneDelivery(req.body);
        res.sendStatus(200);
    } catch (e) {next(e);}
};
const deleteCustomer = async (req, res, next) => {
    try {
        res.status(200).json(await SERVICE_CUSTOMER.deleteCustomer(validate.id(req.params.id)));
    } catch (e) {next(e);}
};

module.exports = {
    getCustomers,
    addCustomer,
    updateCustomer,
    updateCustomerZoneDelivery,
    deleteCustomer,
};
