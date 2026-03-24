const MONGOOSE = require('mongoose');

const SCHEMA_INVOICE_PAYMENT = new MONGOOSE.Schema({
    amount: {type: Number, required: true},
    date:   {type: Date, required: true, default: new Date()},
    type:   {type: String, required: true, trim: true},
    recorded_by:     {type: String, default: ''},
    comments:       {type: String, trim: true, default: ''},
}, {
    versionKey: false,
});

module.exports = SCHEMA_INVOICE_PAYMENT;
