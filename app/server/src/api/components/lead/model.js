const mongoose = require('mongoose');
const SERVICE_CUSTOMER_SALES_REP = require("../customer_sales_rep/service");
const SERVICE_CUSTOMER = require("./../customer/service");
const MODEL_NAME = 'Lead';
const COLLECTION_NAME = 'lead';

const verifySalesRep = async (value) => {
    if (!value) return true;
    const salesRepID = value.toString();
    const lookup = await SERVICE_CUSTOMER_SALES_REP.checkCustomerSalesRep({ _id: salesRepID });
    return (lookup !== null);
};
const verifyCustomer = async (value) => {
    if (!value) return true;
    const customerID = value.toString();
    const lookup = await SERVICE_CUSTOMER.checkCustomer({ _id: customerID });
    return (lookup !== null);
};
const LEAD_SCHEMA = new mongoose.Schema({
    customer_name: { type: String, required: true, trim: true },
    contact_name: { type: String, trim: true },
    phone: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, default: '' },
    address: {type: String, trim: true},
    city: {type: String, trim: true},
    postcode: {type: String, trim: true},
    lead_source: { type: String },
    assigned_to: { type: mongoose.Schema.Types.ObjectId, ref: 'CustomerSalesRep', validate: { validator: verifySalesRep }, },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', validate: { validator: verifyCustomer }, },
    createdAt: { type: Date, default: Date.now }
}, {
    collection: COLLECTION_NAME,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

LEAD_SCHEMA.virtual("opportunities", {
    ref: 'Opportunity', localField: '_id', foreignField: 'lead', justOne: false
})
LEAD_SCHEMA.virtual('activities', {
    ref: 'Activity', localField: '_id', foreignField: 'lead', justOne: false
})

const Lead = mongoose.model(MODEL_NAME, LEAD_SCHEMA);
module.exports = Lead;
