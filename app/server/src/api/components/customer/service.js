const createError = require('http-errors');
const Customer = require('./model');
const database = require('./../../../db/database');
const axios = require("axios");
const env = require("../../../config.env");

const upsertCustomerApp = async (resp) => {
    const deliveryDaysMap = resp.order_taking_days.map(day => day + 1);
    const appPayload = { 
                _id:resp._id,
                customer_name: resp.customer_name,
                active: resp.active,
                mobile: resp.mobile,
                email: resp.email,
                zones: resp.zones || [],
                status: false,
                delivery_days: deliveryDaysMap || []
          }
          try {
            const appResp = await axios.post(`${env.SDW_APP_API}/api/create_new_customer`, appPayload,{
                headers: { Authorization: `Bearer ${env.SYNC_SECRET_TOKEN}` }
            });
            if(appResp.status === 200){console.log("customer added/updated in app")}else{console.log("customer cannot add in app, network error")}
          } catch (error) {
            console.log("error", error)
          }
}
const checkCustomer = (query = {}) => {
    return database.exists(Customer, query);
};
const fetchOneCustomer = (query = {}, projection = {}, sort = {customer_name: 1}, limit = 0) => {
    return database.findOne(Customer, query, projection, sort, limit);
};
const fetchCustomers = (query = {}, projection = {}, sort = {customer_name: 1}, limit = 0) => {
    return database.find(Customer, query, projection, sort, limit);
};
const insertCustomer = async (properties) => {
    let rep = properties.sales_rep;
    if(rep === undefined || rep === null || rep === "") {
        delete properties.sales_rep;
    }
    const doc = new Customer(properties);
    const error = await doc.validate();
    if (!error) {
        const resp = await database.create(Customer, doc);  
        if(env.NODE_ENV === 'production') {
            await upsertCustomerApp(resp[0]);
        }
        return resp;
    }
    throw new createError(500);
};
const updateCustomer = async (id, properties) => {
    const doc = new Customer(properties);
    const error = await doc.validate(Object.keys(properties));
    if (!error) {
        const resp = await database.findByIdAndUpdate(Customer, id, properties);
        if(env.NODE_ENV === 'production') {
            await upsertCustomerApp(resp);
        }
        return resp;
    }
    throw new createError(500);
};

const updateCustomerZoneDelivery = async (payload) => {
    const {updatedCustomers, removedCustomers} = payload;

    for(const customer of updatedCustomers) {
        await database.findByIdAndUpdate(Customer, customer._id, customer);
    }

    for(const customer of removedCustomers) {
        await database.findByIdAndUpdate(Customer, customer._id, customer);
    }
};

const deleteCustomer = (id) => {
    return database.findByIdAndDelete(Customer, id);
};

const isCustomerActive = async (id) => {
    const customer = await Customer.findById(id);
    return customer.active;
};

const isCustomerOnHold = async (id) => {
    const customer = await Customer.findById(id);
    return customer.on_hold;
};

const getCustomerNamesInBulk = (customerIds) => {
    return Customer.find({_id: {$in:customerIds}}, {customer_name: 1});
}

module.exports = {
    checkCustomer,
    fetchOneCustomer,
    fetchCustomers,
    insertCustomer,
    updateCustomer,
    updateCustomerZoneDelivery,
    deleteCustomer,
    isCustomerActive,
    isCustomerOnHold,
    getCustomerNamesInBulk,
};
