const mongoose = require('mongoose');
const SERVICE_INVENTORY_CATEGORY = require('./../inventory_category/service');
const SERVICE_INVENTORY_TAG = require('./../inventory_tag/service');
const SERVICE_INVENTORY_SUPPLIER = require('./../inventory_supplier/service');
const SERVICE_COUNTER = require('./../counter/service');
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
    article:    {type: String, trim: true, index: true},
    name:       {type: String, index: true, trim: true,},
    barcode:    {type: String, index: true},
    active:     {type: Boolean, default: true, index: true,
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
        type: mongoose.Schema.Types.ObjectId, ref: 'VAT', default: null, index: true,
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

    quantity:           {type: Number, default: 0},
    alert_quantity:     {type: Number, default: 0},
    weight_grams:       {type: Number, required: false, default: 0, min: 0},
    weight_kg:          {type: Number, required: false, default: 0, min: 0},
    cost_price:         {type: Number, default: 0},
    min_sale_price:     {type: Number, default: 0},
    default_sale_price: {type: Number, default: 0},
    collection_price:   {type: Number, default: 0},
    list_price:         {type: Number, default: 0},
    discount_percent:   {type: Number, default: 0, min: 0, max: 100},
    prices_last_updated:{type: Date, default: moment().format('YYYY-MM-DD'), index: true},
    item_image:         {type: String},
    aisle:              {type:String},
    location:           {type:String},
    color:               { type: String, default: "", trim: true },
    ral:                 { type: String, default: "", trim: true },
    product_size:                { type: [String], default: [], },

}, {
    collection: COLLECTION_NAME,
    versionKey: false,
});
SCHEMA_INVENTORY.pre('save', async function (next) {
    if (this.isNew && !this.article) {
        try {
            const seq = await SERVICE_COUNTER.getArticleNo('inventory_article');
            this.article = `nabco_${seq}`;
        } catch (err) {
            return next(err);
        }
    }
    next();
});

const Inventory = mongoose.model(MODEL_NAME, SCHEMA_INVENTORY);
module.exports = Inventory;
