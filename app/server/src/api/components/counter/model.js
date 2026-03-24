const mongoose = require("mongoose");
const MODEL_NAME = 'Counter';
const COLLECTION_NAME = 'counters';

const COUNTER_SCHEMA = new mongoose.Schema({
    _id:{type: String, required: true},
    seq: {type: Number, default: 0}
},{
    collection: COLLECTION_NAME,
    versionKey: false,
});

const Counter = mongoose.model(MODEL_NAME, COUNTER_SCHEMA);
module.exports = Counter;