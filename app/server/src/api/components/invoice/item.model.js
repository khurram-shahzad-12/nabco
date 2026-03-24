const MONGOOSE = require('mongoose');
const SERVICE_VAT = require('./../vat/service');
const SERVICE_INVENTORY = require('./../inventory/service');

const verifyInventory = async (value) => {
    const itemID = value.toString();
    const lookup = await SERVICE_INVENTORY.checkInventory({_id: itemID});
    return (lookup !== null);
};
const verifyVAT = async (value) => {
    const taxID = value.toString();
    const lookup = await SERVICE_VAT.checkVAT({_id: taxID});
    return (lookup !== null);
};

const SCHEMA_INVOICE_ITEM = new MONGOOSE.Schema({
    _id:        {type: MONGOOSE.Schema.Types.ObjectId, ref: 'Inventory', required: true,
        validate: {validator: verifyInventory},
    },
    name:       {type: String, required: true},
    barcode:    {type: Number, required: true},
    quantity:   {type: Number, required: true, min: 0},
    rate:       {type: Number, required: true},
    cost_price: {type: Number, required: true},
    vat:        {type: MONGOOSE.Schema.Types.ObjectId, ref: 'VAT', required: true,
        validate: {validator: verifyVAT},
    },
    tax:        {type: Number, required: true, min: 0},
    weight_grams: {type: Number, required: true, default: 0, min: 0},
    weight_kg:  {type: Number, required: true, default: 0, min: 0},
}, {
    versionKey: false,
});

module.exports = SCHEMA_INVOICE_ITEM;
