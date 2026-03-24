const mongoose = require('mongoose');
const MODEL_NAME = 'InventoryCategory';
const COLLECTION_NAME = 'inventoryCategories';

const SCHEMA_INVENTORY_CATEGORY = new mongoose.Schema({
    name: {type: String, required: true, trim: true, unique: true},
}, {
    collection: COLLECTION_NAME,
    versionKey: false,
});

const InventoryCategory = mongoose.model(MODEL_NAME, SCHEMA_INVENTORY_CATEGORY);
module.exports = InventoryCategory;
