const MONGOOSE = require('mongoose');
const SERVICE_CUSTOMER = require('./../customer/service');
const MODEL_NAME = 'CustomerCancelledInvoicesDay';
const COLLECTION_NAME = 'customerCancelledInvoicesDay';
const moment = require('moment');

const verifyCustomer = async (value) => {
    const customerID = value.toString();
    const lookup = await SERVICE_CUSTOMER.checkCustomer({_id: customerID});
    return (lookup !== null);
};

const SCHEMA_CUSTOMER_CANCELLED_INVOICES_DAY = new MONGOOSE.Schema({
    customer: {
        type: MONGOOSE.Schema.Types.ObjectId, required: true, ref: 'Customer', validate: {validator: verifyCustomer},
    },
    reason:  {type: String, trim: true},
    ot_date: {type: Date, required: true, default: moment().format('YYYY-MM-DD'), index: true},
}, {
    collection: COLLECTION_NAME,
    versionKey: false
});

const CustomerCancelledInvoicesDay = MONGOOSE.model(MODEL_NAME, SCHEMA_CUSTOMER_CANCELLED_INVOICES_DAY);
module.exports = CustomerCancelledInvoicesDay;