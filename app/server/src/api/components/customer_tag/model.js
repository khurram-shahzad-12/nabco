const mongoose = require('mongoose');
const MODEL_NAME = 'CustomerTag';
const COLLECTION_NAME = 'customerTags';

const SCHEMA_CUSTOMER_TAG = new mongoose.Schema({
    name: {type: String, required: true, trim: true, unique: true},
}, {
    collection: COLLECTION_NAME,
    versionKey: false,
});

const CustomerTags = mongoose.model(MODEL_NAME, SCHEMA_CUSTOMER_TAG);
module.exports = CustomerTags;
