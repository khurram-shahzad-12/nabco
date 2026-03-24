const mongoose = require('mongoose');
const SERVICE_CUSTOMER = require("../customer/service");
const SERVICE_LEAD = require('../lead/service');
const SERVICE_SALES_REP = require("../customer_sales_rep/service");
const SERVICE_COUNTER = require('../counter/service');
const SERVICE_VAT = require('../vat/service');
const MODEL_NAME = 'Quotation';
const COLLECTION_NAME = 'quotations';

const verifyCustomer = async (value) => {
    if (!value) return true;
    const customerID = value.toString();
    const lookup = await SERVICE_CUSTOMER.checkCustomer({ _id: customerID });
    return (lookup !== null);
};
const verifyLead = async (value) => {
    if (!value) return true;
    const leadID = value.toString();
    const lookup = await SERVICE_LEAD.checkLead({ _id: leadID });
    return lookup !== null;
};
const verifyVAT = async (value) => {
    const taxID = value.toString();
    const lookup = await SERVICE_VAT.checkVAT({_id: taxID});
    return (lookup !== null);
};
const QUOTATION_SCHEMA = new mongoose.Schema({
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', validate: { validator: verifyCustomer }, },
    lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', validate: { validator: verifyLead } },
    customerInfo: { customer_name: { type: String, required: true }, phone: { type: String } },
    quotationNo: {type: Number,},
    items: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        rate: { type: Number, required: true, },
        tax: { type: Number, default: 0 },
        default_sale_price: {type: Number, default: 0},
        vat: {type: mongoose.Schema.Types.ObjectId, ref: 'VAT',  validate: {validator: verifyVAT}}
    }],
    total_no_vat: { type: Number, required: true },
    vat_total: { type: Number, required: true },
    total_incl_vat: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
}, {
    collection: COLLECTION_NAME,
    versionKey: false,
});
QUOTATION_SCHEMA.pre('save', async function(next){
    if(!this.quotationNo){this.quotationNo = await SERVICE_COUNTER.getNextQuotationNumber();}
    next();
})
const Quotation = mongoose.model(MODEL_NAME, QUOTATION_SCHEMA);
module.exports = Quotation;
