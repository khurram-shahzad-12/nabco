const mongoose = require('mongoose');
const MODEL_NAME = 'InventorySupplier';
const COLLECTION_NAME = 'inventorySuppliers';

const SCHEMA_INVENTORY_SUPPLIER = new mongoose.Schema({
    account: { type: String, required: true, trim: true, unique: true, index: true, },
    name: { type: String, required: true, trim: true, unique: true, index: true, },
    address: { type: String, trim: true, default: "", },
    postcode: { type: String, trim: true, default: "", },
    accounts_contact: { type: String, trim: true, default: "", },
    account_email: { type: String, trim: true, default: "", },
    orders_contact: { type: String, trim: true, default: "", },
    orders_email: { type: String, trim: true, default: "", },
    phone: { type: String, trim: true, default: "", },
    mobile: { type: String, trim: true, default: "", },
    website: { type: String, trim: true, default: "", },
    credit_limit: { type: Number, required: true, default: 0, min: 0, },
    payee_name: { type: String, trim: true, default: "", },
    hold: { type: Boolean, required: true, default: false, index: true, validate: { validator: value => [true, false].includes(value), },
    },
}, {
    collection: COLLECTION_NAME,
    versionKey: false,
});

const InventorySupplier = mongoose.model(MODEL_NAME, SCHEMA_INVENTORY_SUPPLIER);
module.exports = InventorySupplier ;
