const mongoose = require('mongoose');
const MODEL_NAME = 'VAT';
const COLLECTION_NAME = 'vat';

const SCHEMA_VAT = new mongoose.Schema({
    name:   {type: String, required: true, trim: true, unique: true},
    rate:   {type: Number, required: true, min: 0, default: 0},
    order:  {type: Number, required: true, min: 0, default: 0},
}, {
    collection: COLLECTION_NAME,
    versionKey: false,
});

const VAT = mongoose.model(MODEL_NAME, SCHEMA_VAT);
module.exports = VAT;
