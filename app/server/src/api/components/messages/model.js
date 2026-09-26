const mongoose = require('mongoose');
const MODEL_NAME = 'Messages';
const COLLECTION_NAME = 'messages';

const SCHEMA_MESSAGE = new mongoose.Schema({
    senderId:  {type: mongoose.Schema.Types.ObjectId, required: true, index: true, ref: 'User'},
    receiverId:  {type: mongoose.Schema.Types.ObjectId, required: true, index: true, ref: 'User'},
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
    toJSON: { virtuals: true }, 
    toObject: { virtuals: true }
});
SCHEMA_MESSAGE.index({ senderId: 1, receiverId: 1, createdAt: -1 });
SCHEMA_MESSAGE.index({ receiverId: 1, seen: 1 });
SCHEMA_MESSAGE.index({ receiverId: 1, delivered: 1 });

SCHEMA_MESSAGE.virtual('sender', {
    ref: 'User',
    localField: 'senderId',
    foreignField: '_id',
    justOne: true
});

SCHEMA_MESSAGE.virtual('receiver', {
    ref: 'User',
    localField: 'receiverId',
    foreignField: '_id',
    justOne: true
});

const Messages = mongoose.model(MODEL_NAME, SCHEMA_MESSAGE);
module.exports = Messages;
