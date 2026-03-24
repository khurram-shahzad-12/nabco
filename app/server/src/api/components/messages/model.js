const mongoose = require('mongoose');
const MODEL_NAME = 'Messages';
const COLLECTION_NAME = 'messages';

const SCHEMA_CUSTOMER = new mongoose.Schema({
    senderId:  {type: String, required: true, index: true},
    receiverId:  {type: String, required: true, index: true},
    message: {type: String, required: true},
    replyTo: {type: mongoose.Schema.Types.ObjectId , ref:'Messages' ,default:null},
    delivered:        {type: Boolean, default: false},
    seen:       {type: Boolean, default: false},
    deliveredAt: {type: Date},
    seenAt: {type: Date},
    createdAt: {type: Date, default: Date.now, index: true, expires: 60*60*24*21}
}, {
    collection: COLLECTION_NAME,
    versionKey: false,
});
SCHEMA_CUSTOMER.index({ senderId: 1, receiverId: 1, createdAt: -1 });
SCHEMA_CUSTOMER.index({ receiverId: 1, seen: 1 });
SCHEMA_CUSTOMER.index({ receiverId: 1, delivered: 1 });

const Messages = mongoose.model(MODEL_NAME, SCHEMA_CUSTOMER);
module.exports = Messages;
