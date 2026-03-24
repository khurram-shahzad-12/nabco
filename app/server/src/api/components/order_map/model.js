const mongoose = require('mongoose');
const MODEL_NAME = 'OrderMap';
const COLLECTION_NAME = 'routesolver';
const Customer = require('../customer/model');
const Invoice = require('../invoice/model');
const Vehicle = require('../driver/vehicle.model');
const SERVICE_CUSTOMER = require('../customer/service');
const SERVICE_INOICE = require('../invoice/service');

const verifyCustomer = async (value) => {
    const customerID = value.toString();
    const lookup = await SERVICE_CUSTOMER.checkCustomer({_id: customerID});
    return (lookup !== null);
};
const verifyInvoice = async (value) => {
    const InvoiceID = value.toString();
    const lookup = await SERVICE_INOICE.checkInvoice({_id: InvoiceID});
    return (lookup !== null);
};


const SCHEMA_INVOICE = new mongoose.Schema({
    solution_id:     {type: String, default: '', trim: true},
    total_distance:    {type: Number, trim: true, default: ""},
    date: {type: Date, trim: true},
    vehicle_routes:   [{
        vehicle_id: {type: mongoose.Schema.Types.ObjectId, required:true, ref:'Vehicle'},
        distance_veh_km: {type: Number, trim:true, default: 0},
        total_weight_kg_veh:{type: Number, trim:true, default:0},
        zone:{type:String,trim:true},
        stops:[{
            type: {type: String, required: true, trim: true },
            location: {type: String, required: true, trim: true},
            address: {type: String, trime: true},
            customer_name: {type: String, trim: true},
            customer_id : {type: mongoose.Schema.Types.ObjectId, ref:'Customer',validate: {validator: verifyCustomer}},
            order_id : {type: mongoose.Schema.Types.ObjectId, ref: 'Invoice',validate:{validator: verifyInvoice} },
            order_weight: {type: Number, trim: true, default:0},
            arrival_time: {type:String, trim:true, default:"00:00"},
            travel_time: {type:String, trim:true, default:"0min"},
            departure_time:{type:String, trim:true, default:"00:00"},
            distance:{type:Number, trim:true, default:0},
            original_order_ids:[{type:String}],

        }]
    }],
}, {
    collection: COLLECTION_NAME,
    versionKey: false,
});

const OrderMap = mongoose.model(MODEL_NAME, SCHEMA_INVOICE);
module.exports = OrderMap;