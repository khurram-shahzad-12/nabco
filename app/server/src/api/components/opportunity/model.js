const mongoose = require('mongoose');
const SERVICE_CUSTOMER = require("./../customer/service");
const Lead = require("../lead/model");
const MODEL_NAME = 'Opportunity';
const COLLECTION_NAME = 'opportunity';

const verifyCustomer = async (value) => {
    const customerID = value.toString();
    const lookup = await SERVICE_CUSTOMER.checkCustomer({ _id: customerID });
    return (lookup !== null);
};
const verifyLead = async(value) => {
    const leadID = value.toString();
    const lookup = await Lead.exists({_id: leadID});
    return (lookup !== null);
}
const OPPORTUNITY_SCHEMA = new mongoose.Schema({
    lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', validate: {validator: verifyLead} },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', validate: { validator: verifyCustomer }, },
    closing_note: { type: String },
    stage: { type: String, enum: ['not interested', 'prospecting', 'qualified', 'proposal', 'negotiation', "closed Win", "closed Lost"], default: "prospecting" },
    expected_close_date: { type: Date },
    createdAt: { type: Date, default: Date.now }
}, {
    collection: COLLECTION_NAME,
    versionKey: false,
});

OPPORTUNITY_SCHEMA.pre('validate', function (next) {
    if (!this.lead && !this.customer) {
        next(new Error("opportunity must be associated with a lead or a customer"))
    } else { next() }
})
const Opportunity = mongoose.model(MODEL_NAME, OPPORTUNITY_SCHEMA);
module.exports = Opportunity;
