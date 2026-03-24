const mongoose = require('mongoose');
const MODEL_NAME = 'InventoryTag';
const COLLECTION_NAME = 'inventoryTags';

const SCHEMA_INVENTORY_TAG = new mongoose.Schema({
    name: {type: String, required: true, trim: true, unique: true},
}, {
    collection: COLLECTION_NAME,
    versionKey: false,
});

const InventoryTags = mongoose.model(MODEL_NAME, SCHEMA_INVENTORY_TAG);
module.exports = InventoryTags;
