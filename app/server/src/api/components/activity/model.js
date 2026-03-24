const mongoose = require('mongoose');
const Lead = require('../lead/model');
const MODEL_NAME = 'Activity';
const COLLECTION_NAME = 'activity';

const verifyLead = async(value) => {
    const leadID = value.toString();
    const lookup = await Lead.exists({_id: leadID});
    return (lookup !== null);
}
const ACTIVITY_SCHEMA = new mongoose.Schema({
    type: { type: String, enum:['call', 'email', 'meeting', 'note'] },
    subject: { type: String },
    description: { type: String, trim: true },
    lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', validate: {validator: verifyLead}},
    createdAt: { type: Date, default: Date.now}
}, {
    collection: COLLECTION_NAME,
    versionKey: false,
});

const Activity = mongoose.model(MODEL_NAME, ACTIVITY_SCHEMA);
module.exports = Activity;
