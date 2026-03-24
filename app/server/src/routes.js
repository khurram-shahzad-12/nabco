const express = require('express');
const app = express();

// Setup
app.use('/zone', require('./api/components/zone/routes'));
app.use('/vat', require('./api/components/vat/routes'));
app.use('/customerSalesRep', require('./api/components/customer_sales_rep/routes'));
app.use('/payment-term', require('./api/components/payment_term/routes'));

// Customer
app.use('/customer', require('./api/components/customer/routes'));
app.use('/customer-tag', require('./api/components/customer_tag/routes'));
app.use('/customerItems', require('./api/components/customerItems/routes'));
app.use('/customerGroups', require('./api/components/customerGroups/routes'));
app.use('/customerCancelledInvoicesDay', require('./api/components/customerCancelledInvoicesDay/routes'));
app.use('/customerTemporaryOrdersDay', require('./api/components/customerTemporaryOrdersDay/routes'));
app.use('/customerCallbackTimers', require('./api/components/customerCallbackTimers/routes'));

// Driver
app.use('/driver', require('./api/components/driver/routes'));

// Inventory
app.use('/inventory', require('./api/components/inventory/routes'));
app.use('/inventory-category', require('./api/components/inventory_category/routes'));
app.use('/inventory-tag', require('./api/components/inventory_tag/routes'));
app.use('/inventory-supplier', require('./api/components/inventory_supplier/routes'));
app.use('/supplier-invoices', require('./api/components/supplier_invoices/routes'));

// Invoice
app.use('/invoice', require('./api/components/invoice/routes'));
app.use('/ordermap', require("./api/components/order_map/route"));
app.use('/salestracker', require("./api/components/sales_tracker/route"));

// CRM
app.use('/lead', require('./api/components/lead/routes'));
app.use('/activities', require('./api/components/activity/routes'));
app.use('/opportunities', require('./api/components/opportunity/routes'));
app.use('/quotation', require('./api/components/quotation/routes'));

module.exports = app;
