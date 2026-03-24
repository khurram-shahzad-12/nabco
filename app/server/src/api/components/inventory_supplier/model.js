const mongoose = require('mongoose');
const MODEL_NAME = 'InventorySupplier';
const COLLECTION_NAME = 'inventorySuppliers';

const SCHEMA_INVENTORY_SUPPLIER = new mongoose.Schema({
    name: {type: String, required: true, trim: true, unique: true},
}, {
    collection: COLLECTION_NAME,
    versionKey: false,
});

const InventorySupplier = mongoose.model(MODEL_NAME, SCHEMA_INVENTORY_SUPPLIER);
module.exports = InventorySupplier ;
