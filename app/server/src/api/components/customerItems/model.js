const MONGOOSE = require('mongoose');
const SERVICE_CUSTOMER = require('./../customer/service');
const MODEL_NAME = 'CustomerItems';
const MODEL_ITEM = require('./item.model');
const COLLECTION_NAME = 'customerItems';

const verifyCustomer = async (value) => {
    const customerID = value.toString();
    const lookup = await SERVICE_CUSTOMER.checkCustomer({_id: customerID});
    return (lookup !== null);
};

const SCHEMA_CUSTOMER_ITEMS = new MONGOOSE.Schema({
    customer: {
        type: MONGOOSE.Schema.Types.ObjectId, required: true, ref: 'Customer', unique: true,
        index: true, validate: {validator: verifyCustomer}
    },
    items: {
        type: [MODEL_ITEM], default: [], validate: {validator: (value) => Array.isArray(value)},
    }
}, {
    collection: COLLECTION_NAME,
    versionKey: false,
});

const CustomerItems = MONGOOSE.model(MODEL_NAME, SCHEMA_CUSTOMER_ITEMS);
module.exports = CustomerItems;
