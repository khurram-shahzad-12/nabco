const mongoose = require('mongoose');
const MODEL_NAME = 'Invoice';
const COLLECTION_NAME = 'invoices';
const MODEL_ITEM = require('./item.model');
const MODEL_PAYMENT = require('./payment.model');
const SERVICE_CUSTOMER = require('./../customer/service');
const SERVICE_CUSTOMER_SALES_REP = require("../customer_sales_rep/service")
const moment = require('moment');

const verifyCustomer = async (value) => {
    const customerID = value.toString();
    const lookup = await SERVICE_CUSTOMER.checkCustomer({_id: customerID});
    return (lookup !== null);
};
const verifySalesRep = async (value) => {
    const salesRepID = value.toString();
    const lookup = await SERVICE_CUSTOMER_SALES_REP.checkCustomerSalesRep({_id: salesRepID});
    return (lookup !== null);
};

const SCHEMA_INVOICE = new mongoose.Schema({
    created_by:     {type: String, default: ''},
    invoice_date:   {type: Date, required: true, default: moment().format('YYYY-MM-DD'), index: true},
    ot_date:        {type: Date, required: true, default: moment().format('YYYY-MM-DD'), index: true},

    sale_number:    {type: Number, unique: true},
    customer:       {type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true,
        validate: {validator: verifyCustomer},
    },

    cash_invoice:   {type: Boolean, required: true, default: false, index: true,
        validate: {validator: (value) => [false, true].includes(value)},
    },
    in_person:   {type: Boolean, required: true, default: false,
        validate: {validator: (value) => [false, true].includes(value)},
    },
    payments:       {type: [MODEL_PAYMENT], default: [],
        validate: {validator: (value) => Array.isArray(value)},
    },
    remarks:        {type: String, default: ''},
    driverNotes:    {type: String, default: ''},

    items:          {type: [MODEL_ITEM], default: [],
        validate: {validator: (value) => Array.isArray(value)},
    },
    total_no_vat:   {type: Number, default: 0},
    vat_total:      {type: Number, min: 0, default: 0},
    total_incl_vat: {type: Number, min: 0, default: 0},
    profit: {type: Number, default: 0},
    paid:   {type: Boolean, required: true, default: false,
        validate: {validator: (value) => [false, true].includes(value)},
    },
    email_sent:   {type: Boolean, required: true, default: false,
        validate: {validator: (value) => [false, true].includes(value)},
    },
    printed:   {type: Boolean, required: true, default: false,
        validate: {validator: (value) => [false, true].includes(value)},
    },
    picked:   {type: Boolean, required: true, default: false,
        validate: {validator: (value) => [false, true].includes(value)},
    },
    delivery_status:     {type: String, default: 'pending'},
    priority_value:       {type: Number, default: 0},
    zone:       {type: String, trim:true,},
    order_app_id:     {type: String, default: ''},
    order_number:     {type: String, default: ''},
    customer_sales_rep: {type:mongoose.Schema.Types.ObjectId, ref: 'CustomerSalesRep', validate: {validator: verifySalesRep},},
}, {
    collection: COLLECTION_NAME,
    versionKey: false,
});

const Invoice = mongoose.model(MODEL_NAME, SCHEMA_INVOICE);
module.exports = Invoice;