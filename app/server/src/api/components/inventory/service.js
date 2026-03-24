const createError = require('http-errors');
const Inventory = require('./model');
const database = require('./../../../db/database');
const env = require('./../../../config.env');
const SERVICE_CUSTOMER_ITEMS = require('../customerItems/service');
const SERVICE_CUSTOMER_GROUPS = require('../customerGroups/service');
const moment = require('moment');
const axios = require("axios");
let nextItemID = env.ITEM_ID_OFFSET;

const upsertProduct = async (productData) => {
          try {
            const appResp = await axios.post(`${env.SDW_APP_API}/api/add_new_product`, productData,{
                headers: { Authorization: `Bearer ${env.SYNC_SECRET_TOKEN}` }
            });
            if(appResp.status === 200){console.log("Product added/updated in app")}else{console.log("Product cannot add in app, network error")}
          } catch (error) {
            console.log("error", error)
          }
}

const removeInventoryFromApp = async (id) => {
    try {
            const appResp = await axios.delete(`${env.SDW_APP_API}/api/remove_inventory`, {data:{id},headers: { Authorization: `Bearer ${env.SYNC_SECRET_TOKEN}` }});
            if(appResp.status === 200){console.log("Product deleted in app")}else{console.log("Product cannot deleted from app, network error")}
          } catch (error) {
            console.log("error", error)
          }
}

const checkInventory = (query = {}) => {
    return database.exists(Inventory, query);
};
const fetchInventory = (query = {}, projection = ['-item_image'], sort = { name: 1 }, limit = 0) => {
    return database.find(Inventory, query, projection, sort, limit);
};
const fetchOneItemFromInventory = (query = {}, projection = {}, sort = { name: 1 }, limit = 0) => {
    return database.findOne(Inventory, query, projection, sort, limit);
};
const insertInventory = async (properties) => {
    const doc = new Inventory(properties);
    const error = await doc.validate();
    if (!error) {
        doc.barcode = await generateBarcode();
        formatNumbers(doc);
        const resp = await database.create(Inventory, doc);
        if(env.NODE_ENV === 'production') {
             await upsertProduct(resp[0])
         }
        return resp
    }
    throw new createError(500);
};
const updateInventory = async (id, properties) => {
    const doc = new Inventory(properties);
    const error = await doc.validate(Object.keys(properties));
    if (!error) {
        formatNumbers(properties);
        const originalItemData = await database.findOne(Inventory, { _id: id });
        let updatedItemData = await database.findByIdAndUpdate(Inventory, id, properties);
        if(env.NODE_ENV === 'production') {
            await upsertProduct(updatedItemData);
        }
        if (originalItemData.cost_price !== updatedItemData.cost_price ||
            originalItemData.min_sale_price !== updatedItemData.min_sale_price ||
            originalItemData.default_sale_price !== updatedItemData.default_sale_price
        ) {
            properties.prices_last_updated = moment().format('YYYY-MM-DD');
            if(properties.updateCustomerPrices) {
                properties.collection_price = properties.min_sale_price;
            }
            updatedItemData = await database.findByIdAndUpdate(Inventory, id, properties);
            if (properties.updateCustomerPrices) {
                await SERVICE_CUSTOMER_ITEMS.updateItemPrices(updatedItemData);
                await SERVICE_CUSTOMER_GROUPS.updateGroupItemPrices(updatedItemData);
            }
        }
        if (originalItemData.active && !updatedItemData.active) {
            await SERVICE_CUSTOMER_ITEMS.removeDisabledInventoryItemFromCustomerItems(id);
            await SERVICE_CUSTOMER_GROUPS.removeDisabledInventoryItemFromCustomerGroupItems(id);
        }
        return updatedItemData;
    }
    throw new createError(500);
};
const updateInventoryImage = async (id, image) => {
    await database.findByIdAndUpdate(Inventory, id, { item_image: image.buffer.toString('base64') });
};
const removeInventoryImage = async (id) => {
    await database.findByIdAndUpdate(Inventory, id, { item_image: null });
};
const getInventoryImage = async (id) => {
    const base64ImageFromMongo = await database.findOne(Inventory, { _id: id }, ['item_image']);
    if (!base64ImageFromMongo.item_image) {
        throw new createError(404);
    }
    const buffer = Buffer.from(base64ImageFromMongo.item_image, "base64");
    return buffer;
};
const updateInventoryItemQuantity = async (id, quantity) => {
    const itemToUpdate = await database.findOne(Inventory, { _id: id });
    if (itemToUpdate) {
        itemToUpdate.quantity += quantity;
        await database.findByIdAndUpdate(Inventory, id, itemToUpdate);
    }
};
const deleteInventory = async (id) => {
    await SERVICE_CUSTOMER_ITEMS.removeDeletedInventoryItemFromCustomerItems(id);
    await SERVICE_CUSTOMER_GROUPS.removeDeletedInventoryItemFromCustomerGroupItems(id);
    if(env.NODE_ENV === 'production') { await removeInventoryFromApp(id); }
    return database.findByIdAndDelete(Inventory, id);
};
const resetInventoryNegatives = async () => {
    const query = { quantity: { $lt: 0 } };
    const projection = ['_id', 'name', 'quantity'];
    const negativeQuantityItems = await database.find(Inventory, query, projection);
    for (const item of negativeQuantityItems) {
        item.quantity = 0;
        await database.findByIdAndUpdate(Inventory, item._id, item);
    }
};

Inventory.init()
    .then(() => database.find(Inventory, {}, { barcode: 1 }, { barcode: -1 }, 1))
    .then(result => {
        if (result.length > 0) nextItemID += result[0].barcode + 1;
        process.stdout.write(`Next Item ID: ${nextItemID}\n`);
    });

const generateBarcode = async () => {
    const check = await database.exists(Inventory, { barcode: nextItemID });
    if (check) {
        nextItemID = await database.find(Inventory, {}, { barcode: 1 }, { barcode: -1 }, 1)
            .then(result => result[0].barcode + 1);
    }
    return nextItemID++;
};
const formatNumbers = (doc) => {
    if (doc.quantity) doc.quantity = +doc.quantity.toFixed(0);
    if (doc.cost_price) doc.cost_price = +doc.cost_price.toFixed(2);
    if (doc.min_sale_price) doc.min_sale_price = +doc.min_sale_price.toFixed(2);
    if (doc.default_sale_price) doc.default_sale_price = +doc.default_sale_price.toFixed(2);
    if (doc.collection_price) doc.collection_price = +doc.collection_price.toFixed(2);
};
const getMultipleImages = async(ids) => {
    if(!ids || ids.length === 0) return {};
    const items = await database.find(Inventory, {_id: {$in: ids}},['item_image']);
    const imageMap = {};
    items.forEach(item => {
        if(!item.item_image){imageMap[item._id] = ''; return}
        const buffer = Buffer.from(item.item_image, 'base64');
        const isPNG = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
        const isJPG = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
        if (isPNG || isJPG) { imageMap[item._id] = buffer;
        } else { imageMap[item._id] = ''; }
    });
    return imageMap;
}

module.exports = {
    checkInventory,
    fetchInventory,
    fetchOneItemFromInventory,
    insertInventory,
    updateInventory,
    updateInventoryImage,
    removeInventoryImage,
    getInventoryImage,
    updateInventoryItemQuantity,
    deleteInventory,
    resetInventoryNegatives,
    getMultipleImages,
};

//prevent circular dependency issue
exports.checkInventory = checkInventory;
exports.fetchInventory = fetchInventory;