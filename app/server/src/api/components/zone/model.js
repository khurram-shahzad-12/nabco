const mongoose = require('mongoose');
const MODEL_NAME = 'Zone';
const COLLECTION_NAME = 'zones';

const SCHEMA_ZONE = new mongoose.Schema({
    name:   {type: String, required: true, trim: true, unique: true},
    order:  {type: Number, required: true, min: 0, default: 0},
}, {
    collection: COLLECTION_NAME,
    versionKey: false,
});

const Zone = mongoose.model(MODEL_NAME, SCHEMA_ZONE);
module.exports = Zone;
