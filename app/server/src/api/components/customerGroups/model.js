const MONGOOSE = require('mongoose');
const SERVICE_CUSTOMER = require('./../customer/service');
const MODEL_NAME = 'CustomerGroups';
const MODEL_ITEM = require('./item.model');
const COLLECTION_NAME = 'customerGroups';

const verifyCustomer = async (customers) => {
    if(!Array.isArray(customers)) {
        return false;
    }
    for(let customer of customers) {
        const customerID = customer.toString();
        const lookup = await SERVICE_CUSTOMER.checkCustomer({_id: customerID});
        if(lookup === null) {
            return false;
        }
    }
    return true;
};

const SCHEMA_CUSTOMER_GROUPS = new MONGOOSE.Schema({
    name: {type: String, required: true, trim: true, unique: true},
    customers: {
        type: [MONGOOSE.Schema.Types.ObjectId], required: true, ref: 'Customer',
        index: true, validate: {validator: verifyCustomer}
    },
    items: {
        type: [MODEL_ITEM], default: [], validate: {validator: (value) => Array.isArray(value)},
    }
}, {
    collection: COLLECTION_NAME,
    versionKey: false,
});

const CustomerGroups = MONGOOSE.model(MODEL_NAME, SCHEMA_CUSTOMER_GROUPS);
module.exports = CustomerGroups;
