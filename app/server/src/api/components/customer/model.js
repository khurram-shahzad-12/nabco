const mongoose = require('mongoose');
const SERVICE_CUSTOMER_TAG = require('./../customer_tag/service');
const SERVICE_ZONE = require("../zone/service");
const SERVICE_PAYMENT_TERM = require("../payment_term/service");
const SERVICE_CUSTOMER_SALES_REP = require("../customer_sales_rep/service");
const MODEL_NAME = 'Customer';
const COLLECTION_NAME = 'customers';

const verifyCustomerTags = async (value) => {
    if (!Array.isArray(value)) return false;
    if (!value.length) return true;
    const tagsID = value.map(v => {
        if (v === null) return false;
        return v.toString();
    });
    const lookup = await SERVICE_CUSTOMER_TAG.fetchCustomerTags({_id: {$in: tagsID}}, {_id: 1});
    return tagsID.length === lookup.length;
};
const verifyCustomerOrderTakingDays = (value) => {
    if (!Array.isArray(value) || value.length > 7) return false;
    const checkDays = {0: false, 1: false, 2: false, 3: false, 4: false, 5: false, 6: false};
    for (const DAY of value) {
        if (DAY === null) return false;
        if (checkDays[DAY]) return false;
        checkDays[DAY] = true;
    }
    return true;
};
const verifyZones = async (values) => {
    for(const zone of values) {
        if(zone !== null) {
            const zoneID = zone.toString();
            const lookup = await SERVICE_ZONE.checkZone({_id: zoneID});
            if(lookup === null) return false;
        }
    }
    return true
};
const verifySalesRep = async (value) => {
    const salesRepID = value.toString();
    const lookup = await SERVICE_CUSTOMER_SALES_REP.checkCustomerSalesRep({_id: salesRepID});
    return (lookup !== null);
};
const verifyPaymentTerm = async (value) => {
    const paymentTermID = value.toString();
    const lookup = await SERVICE_PAYMENT_TERM.checkPaymentTerm({_id: paymentTermID});
    return (lookup !== null);
};

const SCHEMA_CUSTOMER = new mongoose.Schema({
    legal_entity:  {type: String, required: false, trim: true},
    customer_name:  {type: String, required: true, trim: true, unique: true},
    active:         {type: Boolean, required: true, default: true, index: true,
        validate: {validator: (value) => [false, true].includes(value)},
    },
    on_hold:         {type: Boolean, required: true, default: false, index: true,
        validate: {validator: (value) => [false, true].includes(value)},
    },
    shop_keys:         {type: Boolean, required: true, default: false, index: true,
        validate: {validator: (value) => [false, true].includes(value)},
    },
    tags: {
        type: [mongoose.Schema.Types.ObjectId], ref: 'CustomerTag', default: [], index: true,
        validate: {validator: verifyCustomerTags},
    },

    comments:       {type: String, trim: true, default: ''},
    contact_name:   {type: String, trim: true, default: ''},
    mobile:         {type: String, trim: true, default: ''},
    phone:          {type: String, trim: true, default: ''},
    email:          {type: String, trim: true, default: ''},

    address:        {type: String, trim: true, default: ''},
    city:           {type: String, trim: true, default: ''},
    postcode:       {type: String, trim: true, default: ''},

    cash_invoice:   {type: Boolean, required: true, default: false, index: true,
        validate: {validator: (value) => [false, true].includes(value)},
    },
    print_outstanding_balances:   {type: Boolean, required: true, default: false, index: true,
        validate: {validator: (value) => [false, true].includes(value)},
    },
    payment_term:   {type: mongoose.Schema.Types.ObjectId, ref: 'PaymentTerm',
        validate: {validator: verifyPaymentTerm},
    },
    order_taking_days: {
        type: [Number], required: true, default: [], enum: [0, 1, 2, 3, 4, 5, 6], index: true,
        validate: {validator: verifyCustomerOrderTakingDays},
    },
    payment_taking_days: {
        type: [Number], required: true, default: [], enum: [0, 1, 2, 3, 4, 5, 6], index: true,
        validate: {validator: verifyCustomerOrderTakingDays},
    },
    payment_contact_name:   {type: String, trim: true, default: ''},
    payment_contact_detail:   {type: String, trim: true, default: ''},
    payment_contact_method:   {type: String, required: false, default: null,
        validate: {validator: (value) => [null, "Call", "Whatsapp", "Email"].includes(value)},
    },
    payment_method:   {type: String, required: false, default: null,
        validate: {validator: (value) => [null, "", "Card", "Cash", "BACS"].includes(value)},
    },
    do_not_call_for_payments:   {type: Boolean, required: true, default: false, index: true,
        validate: {validator: (value) => [false, true].includes(value)},
    },
    payment_comments:  {type: String, trim: true, default: ''},
    // delivery_days: {
    //     type: [mongoose.Schema.Types.ObjectId], ref: 'Section', required: true,
    //     default: [null, null, null, null, null, null, null], index: true,
    //     validate: {validator: verifyCustomerDeliveryDays},
    // },
    zones: {
        type: [mongoose.Schema.Types.ObjectId], ref: 'Zone', required: true,
        default: [null, null, null, null, null, null, null], index: true,
        validate: {validator: verifyZones},
    },
    delivery_order: {
        type: [Number], required: true, default: [null, null, null, null, null, null, null],
    },
    sales_rep: {
        type: mongoose.Schema.Types.ObjectId, ref: 'CustomerSalesRep',
        validate: {validator: verifySalesRep},
    },
    tele_sales_rep: {
        type: mongoose.Schema.Types.ObjectId, ref: 'CustomerSalesRep',
        validate: {validator: verifySalesRep},
    },
    director_name:       {type: String, trim: true, default: '', required: false},
    director_address:       {type: String, trim: true, default: '', required: false},
    company_number:       {type: String, trim: true, default: '', required: false},
    vat_number:       {type: String, trim: true, default: '', required: false},
    business_timings:       {type: String, trim: true, default: '', required: false},
    latitude:           {type: String, trim: true, required: false},
    longitude:           {type: String, trim: true, required: false},
    business_start_hour:  {type: [String], required:true, validate: {validator: (arr) => arr.length === 7, message: "must provide length for 7 days"},},
    business_close_hour:  {type: [String], required:true, validate: {validator: (arr) => arr.length === 7, message: "must provide length for 7 days"},},
}, {
    collection: COLLECTION_NAME,
    versionKey: false,
});

const Customer = mongoose.model(MODEL_NAME, SCHEMA_CUSTOMER);
module.exports = Customer;
