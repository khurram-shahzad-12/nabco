const cron = require("node-cron");
const axios = require("axios");
const mongoose = require("mongoose");
const moment = require("moment");
const appOrder = require('../api/components/app_orders/service');
const Inventory = require("../api/components/inventory/model");
const spiceApp_cancel_invoices = require("../api/components/customerCancelledInvoicesDay/model");
const env = require("../config.env");

const getOrdersFromSpiceDirectApp = cron.schedule('*/5 * * * *', async () => {
    try {
        if (env.NODE_ENV === 'production') {
        let lastFetchOrder = '';
        const lastOrder = await appOrder.fetchLastOrder();
        if (lastOrder) {
            lastFetchOrder = lastOrder.appOrder_Id;
        } else {
            lastFetchOrder = "";
        }
        const orderResp = await axios.get(`${env.SDW_APP_API}/api/fetch_all_orders?id=${lastFetchOrder}`, {
            headers: { Authorization: `Bearer ${env.SYNC_SECRET_TOKEN}` }
        });
        if (orderResp.data.orders.length == 0) return;
        let orderAppIds = [];
        const payload = await Promise.all(orderResp.data.orders.map(async (ord) => {
            orderAppIds.push(ord._id);
            const SERVICE_INVOICE = await require("../api/components/invoice/service");
            let sale_number = await SERVICE_INVOICE.generateInvoiceID();
            let items_detail = await Promise.all(ord.items.map(async (pro) => {
                let proData = await Inventory.findById(pro._id);
                if (!proData) {
                    console.log(`Product not found: ${pro.number}`);
                    return null;
                }
                return {
                    _id: mongoose.Types.ObjectId(pro._id),
                    name: pro.name,
                    barcode: pro.barcode,
                    quantity: pro.quantity,
                    rate: pro.rate,
                    cost_price: pro.cost_price,
                    vat: mongoose.Types.ObjectId(pro.vat),
                    tax: pro.tax,
                    weight_grams: 0,
                    weight_kg: pro.weight_kg || 1
                }
            }));

            let filter_products = items_detail.filter(item => item !== null);
            return {
                created_by: "SpiceDirect App",
                invoice_date: moment(ord.invoice_date).format('YYYY-MM-DD'),
                ot_date: moment(ord.ot_date).format('YYYY-MM-DD'),
                customer: mongoose.Types.ObjectId(ord.customer),
                cash_invoice: false,
                in_person: false,
                remarks: '',
                driverNotes: ord.deliveryNote || "",
                items: filter_products,
                total_no_vat: Number(ord.total_no_vat),
                vat_total: Number(ord.vat_total),
                total_incl_vat: Number(ord.total_incl_vat),
                profit: Number(ord.profit),
                paid: false,
                email_sent: false,
                payments: [],
                sale_number: sale_number,
                order_app_id: ord._id.toString(),
                order_number: ord.order_number,
            }
        })
        );
        for (let order of payload) {
            try {
                const Invoice = await require('../api/components/invoice/model');
                const invoice = await Invoice.create(order);
            } catch (error) {
                console.log("Error creating invoice:", error);
            }
        }
        for (let ordid of orderAppIds) {
            try {
                    await appOrder.insertAppOrder(ordid);
            } catch (error) {
                console.error('Error fetching last order from Ordering App: ' + error.message);
            }
        }
        } else { console.log('cannot fetch order from spicedirect app in development server'); return; };
    } catch (error) {
        console.error('Error fetching orders from spice direct Mobile App:', error)
    }
});

const cancelOrdersFromSpiceDirectApp = cron.schedule('*/5 * * * *', async () => {
    try {
        if (env.NODE_ENV === 'production') {
        const todayDate = new Date();
        const oneHourAgo = new Date(todayDate);
        oneHourAgo.setHours(todayDate.getHours() - 2);
        const toDate = todayDate.toISOString();
        const fromDate = oneHourAgo.toISOString();

        const spiceAppResp = await axios.get(`${env.SDW_APP_API}/api/fetch_cancel_order?from=${fromDate}&to=${toDate}`, { headers: { Authorization: `Bearer ${env.SYNC_SECRET_TOKEN}` } });
        if (spiceAppResp.data?.cancelledOrder.length === 0) return;
        for (let cancelOrder of spiceAppResp.data.cancelledOrder) {
            try {
                const Invoice = await require('../api/components/invoice/model');
                const updateCancelInvoiceItems = [{
                    cost_price: 0.00,
                    rate: 0.00,
                    quantity: 1,
                    _id: '628a6c42b6b05596c6bf91ef',
                    vat: '628a6c3bb6b05596c6bf778e'
                }];
                const updateInvoice = await Invoice.updateOne({ order_number: cancelOrder.order_number }, {
                    $set: {
                        remarks: "Customer cancel order from SpiceDirect app",
                        total_no_vat: 0.00,
                        total_incl_vat: 0.00,
                        vat_total: 0.00,
                        profit: 0.00,
                        items: updateCancelInvoiceItems,
                    }
                });
                if (!updateInvoice) {
                    console.log(`Order not found ${cancelOrder.order_number}`);
                }
            } catch (error) {
                console.error("Error adding detail of cencel order from mobile app invoice:", error);
            }
        }
        for (const order of spiceAppResp.data.cancelledOrder) {
            await spiceApp_cancel_invoices.updateOne({
                customer: mongoose.Types.ObjectId(order.customer),
                ot_date: moment(order.ot_date).format('YYYY-MM-DD'),
            }, {
                customer: mongoose.Types.ObjectId(order.customer),
                ot_date: moment(order.ot_date).format('YYYY-MM-DD'),
                reason: "customer cancel from App",
            }, {
                upsert: true
            });
        }
        } else { console.log("cannot submit cancel order request from mobile app in development server"); return; };
    } catch (error) {
        console.error(`Error occured while canceling order from mob app:`, error);
    }
});
module.exports = { getOrdersFromSpiceDirectApp, cancelOrdersFromSpiceDirectApp }