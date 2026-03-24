const mongoose = require('mongoose');
const MODEL_NAME = 'PaymentTerm';
const COLLECTION_NAME = 'paymentTerm';

const SCHEMA_INVENTORY_CATEGORY = new mongoose.Schema({
    name: {type: String, required: true, trim: true, unique: true},
}, {
    collection: COLLECTION_NAME,
    versionKey: false,
});

const PaymentTerm = mongoose.model(MODEL_NAME, SCHEMA_INVENTORY_CATEGORY);
module.exports = PaymentTerm;
