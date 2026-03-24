const mongoose = require('mongoose');
const SERVICE_INVENTORY_SUPPLIER = require('./../inventory_supplier/service');
const MODEL_PAYMENT = require('./payment.model');
const MODEL_NAME = 'SupplierInvoices';
const COLLECTION_NAME = 'supplierInvoices';
const moment = require('moment');

const verifyInventorySupplier = async (value) => {
    if (value === null) return true;
    const supplierID = value.toString();
    const lookup = await SERVICE_INVENTORY_SUPPLIER.fetchInventorySuppliers({_id: supplierID});
    return (lookup !== null);
};

const SCHEMA_SUPPLIER_INVOICES = new mongoose.Schema({
    supplier: {
        type: mongoose.Schema.Types.ObjectId, ref: 'InventorySupplier', default: null,
        validate: {validator: verifyInventorySupplier},
    },
    invoice_number: {type: String, required: true, trim: true},
    invoice_date: {type: Date, required: true, default: moment().format('YYYY-MM-DD')},
    created: {type: Date, required: true, default: moment().format()},
    total: {type: Number, default: 0, required: true},
    vat: {type: Number, min: 0, default: 0},
    standard_rate: {type: Number, min: 0, default: 0},
    zero_rate: {type: Number, default: 0},
    delivery_status: {type: String, required: true, trim: true,
        validate: {validator: (value) => ['Delivered', 'Not Delivered', 'Collected'].includes(value)}
    },
    invoice_type: {type: String, required: true, trim: true,
        validate: {validator: (value) => ['Invoiced', 'Pro Forma Invoice', 'Delivery Note', 'Credit Note'].includes(value)}
    },
    expense_type: {type: String, required: true, trim: true,
        validate: {validator: (value) => ['Inventory', 'Expense'].includes(value)}
    },
    payments:       {type: [MODEL_PAYMENT], default: [],
        validate: {validator: (value) => Array.isArray(value)},
    },
}, {
    collection: COLLECTION_NAME,
    versionKey: false,
});

const SupplierInvoices = mongoose.model(MODEL_NAME, SCHEMA_SUPPLIER_INVOICES);
module.exports = SupplierInvoices ;
