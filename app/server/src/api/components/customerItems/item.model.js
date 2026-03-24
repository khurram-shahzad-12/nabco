const MONGOOSE = require('mongoose');
// const SERVICE_INVENTORY = require('./../inventory/service');
const { default: mongoose } = require('mongoose');

const verifyInventory = async (value) => {
    const SERVICE_INVENTORY =await require("../inventory/service");
    const itemID = value.toString();
    const lookup = await SERVICE_INVENTORY.checkInventory({_id: mongoose.Types.ObjectId(itemID)});
    return (lookup !== null);
};

const SCHEMA_CUSTOMER_ITEM = new MONGOOSE.Schema({
    _id:        {type: MONGOOSE.Schema.Types.ObjectId, ref: 'Inventory', required: true,
        validate: {validator: verifyInventory},
    },
    rate:       {type: Number, required: true},
}, {
    versionKey: false,
});

module.exports = SCHEMA_CUSTOMER_ITEM;
