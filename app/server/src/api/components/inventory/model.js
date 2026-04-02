const mongoose = require('mongoose');
const SERVICE_INVENTORY_CATEGORY = require('./../inventory_category/service');
const SERVICE_INVENTORY_TAG = require('./../inventory_tag/service');
const SERVICE_INVENTORY_SUPPLIER = require('./../inventory_supplier/service');
const SERVICE_VAT = require('./../vat/service');
const MODEL_NAME = 'Inventory';
const COLLECTION_NAME = 'inventory';
const moment = require('moment');

const verifyInventoryCategory = async (value) => {
    if (value === null) return true;
    const categoryID = value.toString();
    const lookup = await SERVICE_INVENTORY_CATEGORY.checkInventoryCategory({_id: categoryID});
    return (lookup !== null);
};
const verifyInventoryTags = async (value) => {
    if (!Array.isArray(value)) return false;
    if (!value.length) return true;
    const tagsID = value.map(v => v.toString());
    const lookup = await SERVICE_INVENTORY_TAG.fetchInventoryTags({_id: {$in: tagsID}}, {_id: 1});
    return tagsID.length === lookup.length;
};
const verifyInventorySupplier = async (value) => {
    if (value === null) return true;
    const supplierID = value.toString();
    const lookup = await SERVICE_INVENTORY_SUPPLIER.fetchInventorySuppliers({_id: supplierID});
    return (lookup !== null);
};
const verifyVAT = async (value) => {
    const taxID = value.toString();
    const lookup = await SERVICE_VAT.checkVAT({_id: taxID});
    return (lookup !== null);
};

const SCHEMA_INVENTORY = new mongoose.Schema({
    name:       {type: String, required: true, trim: true, unique: true},
    barcode:    {type: Number, unique: true, index: true},
    active:     {type: Boolean, required: true, default: true, index: true,
        validate: {validator: (value) => [false, true].includes(value)},
    },

    category: {
        type: mongoose.Schema.Types.ObjectId, ref: 'InventoryCategory', default: null, index: true,
        validate: {validator: verifyInventoryCategory},
    },
    tags: {
        type: [mongoose.Schema.Types.ObjectId], ref: 'InventoryTag', default: [], index: true,
        validate: {validator: verifyInventoryTags},
    },
    vat: {
        type: mongoose.Schema.Types.ObjectId, ref: 'VAT', required: true, index: true,
        validate: {validator: verifyVAT},
    },
    supplier1: {
        type: mongoose.Schema.Types.ObjectId, ref: 'InventorySupplier', default: null,
        validate: {validator: verifyInventorySupplier},
    },
    supplier2: {
        type: mongoose.Schema.Types.ObjectId, ref: 'InventorySupplier', default: null,
        validate: {validator: verifyInventorySupplier},
    },
    supplier3: {
        type: mongoose.Schema.Types.ObjectId, ref: 'InventorySupplier', default: null,
        validate: {validator: verifyInventorySupplier},
    },

    quantity:           {type: Number, required: true, default: 0},
    alert_quantity:     {type: Number, required: true, default: 0},
    weight_grams:       {type: Number, required: false, default: 0, min: 0},
    weight_kg:          {type: Number, required: false, default: 0, min: 0},
    cost_price:         {type: Number, required: true},
    min_sale_price:     {type: Number, required: true},
    default_sale_price: {type: Number, required: true},
    collection_price:   {type: Number, required: true},
    prices_last_updated:{type: Date, required: true, default: moment().format('YYYY-MM-DD'), index: true},
    item_image:         {type: String},
    aisle:              {type:String},
    location:           {type:String},
}, {
    collection: COLLECTION_NAME,
    versionKey: false,
});

const Inventory = mongoose.model(MODEL_NAME, SCHEMA_INVENTORY);
module.exports = Inventory;
