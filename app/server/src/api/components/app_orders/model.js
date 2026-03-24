const mongoose = require('mongoose');
const MODEL_NAME = 'appOrder';
const COLLECTION_NAME = 'appOrders';

const SCHEMA_apporder = new mongoose.Schema({
    date:{
        type:Date,
        default:Date.now()
    },
    appOrder_Id:{
        type:String,
        required:true,
    }
}, {
    collection: COLLECTION_NAME,
    versionKey: false,
});

const appOrder = mongoose.model(MODEL_NAME, SCHEMA_apporder);
module.exports = appOrder;
