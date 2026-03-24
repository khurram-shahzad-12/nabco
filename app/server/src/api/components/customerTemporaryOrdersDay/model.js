const MONGOOSE = require('mongoose');
const SERVICE_CUSTOMER = require('./../customer/service');
const MODEL_NAME = 'CustomerTemporaryOrdersDay';
const COLLECTION_NAME = 'customerTemporaryOrdersDay';
const moment = require('moment');

const verifyCustomer = async (value) => {
    const customerID = value.toString();
    const lookup = await SERVICE_CUSTOMER.checkCustomer({_id: customerID});
    return (lookup !== null);
};

const SCHEMA_CUSTOMER_TEMPORARY_ORDERS_DAY = new MONGOOSE.Schema({
    customer: {
        type: MONGOOSE.Schema.Types.ObjectId, required: true, ref: 'Customer',
        index: true, validate: {validator: verifyCustomer},
    },
    ot_date: {type: Date, required: true, default: moment().format('YYYY-MM-DD'), index: true},
}, {
    collection: COLLECTION_NAME,
    versionKey: false
});

const CustomerTemporaryOrdersDay = MONGOOSE.model(MODEL_NAME, SCHEMA_CUSTOMER_TEMPORARY_ORDERS_DAY);
module.exports = CustomerTemporaryOrdersDay;
