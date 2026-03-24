const MONGOOSE = require('mongoose');
const SERVICE_CUSTOMER = require('./../customer/service');
const MODEL_NAME = 'CustomerCallbackTimers';
const COLLECTION_NAME = 'customerCallbackTimers';

const verifyCustomer = async (value) => {
    const customerID = value.toString();
    const lookup = await SERVICE_CUSTOMER.checkCustomer({_id: customerID});
    return (lookup !== null);
};

const SCHEMA_CUSTOMER_CALLBACK_TIMERS = new MONGOOSE.Schema({
    customer: {
        type: MONGOOSE.Schema.Types.ObjectId, required: true, ref: 'Customer', validate: {validator: verifyCustomer},
    },
    time: {type: Date, required: true},
    comment: {type: String, trim: true, default: ''},
    user: {type: String, trim: true, default: ''},
}, {
    collection: COLLECTION_NAME,
    versionKey: false
});

const CustomerCallbackTimers = MONGOOSE.model(MODEL_NAME, SCHEMA_CUSTOMER_CALLBACK_TIMERS);
module.exports = CustomerCallbackTimers;
