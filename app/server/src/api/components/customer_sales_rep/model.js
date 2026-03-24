const mongoose = require('mongoose');
const MODEL_CUSTOMER_SALES_REP = 'CustomerSalesRep';
const COLLECTION_NAME = 'customerSalesRep';

const SCHEMA_CUSTOMER_SALES_REP = new mongoose.Schema({
    name:   {type: String, required: true, trim: true, unique: true},
}, {
    collection: COLLECTION_NAME,
    versionKey: false,
});

const CustomerSalesRep = mongoose.model(MODEL_CUSTOMER_SALES_REP, SCHEMA_CUSTOMER_SALES_REP);
module.exports = CustomerSalesRep;
