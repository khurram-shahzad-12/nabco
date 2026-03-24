const createError = require('http-errors');
const Customer_Groups = require('./model');
const database = require('./../../../db/database');
const SERVICE_INVENTORY = require('./../inventory/service');
const SERVICE_CUSTOMER_ITEMS = require('./../customerItems/service');
const validate = require('../../../utils/validate');
const env = require('./../../../config.env');
const axios = require("axios");

const upsertGroupForApp = async (doc) => {
    try {
    const appResp = await axios.post(`${env.SDW_APP_API}/api/upsert_customer_group`, doc,{
        headers: { Authorization: `Bearer ${env.SYNC_SECRET_TOKEN}` }
    });
    if(appResp.status === 200){console.log("customergroup added/updated in app")}else{console.log("customergroup cannot add/update in app, network error")}
    } catch (error) {
    console.log("error", error)
    }
}

const removeCustomerGroupItemsInApp = async (id) => {
     try {
        const resp = await axios.delete(`${env.SDW_APP_API}/api/delete_customer_group`, {data:{id}, headers: { Authorization: `Bearer ${env.SYNC_SECRET_TOKEN}` }});
        if(resp.status === 200){console.log("customer Group deleted successfully in app")}else{"no customer Group found to delete"}
    } catch (error) {
        console.log("error to delete customer group in App", error)
    }
}

const fetchOneCustomerGroup = (query = {}, projection = {}, sort = {}, limit = 0) => {
    return database.findOne(Customer_Groups, query, projection, sort, limit);
};

const fetchCustomerGroups = (query = {}, projection = {}, sort = {}, limit = 0) => {
    return database.find(Customer_Groups, query, projection, sort, limit);
};

const fetchAllCustomerGroupsForGivenItemQuery = (query) => {
    return database.find(Customer_Groups, query);
};

const insertCustomerGroups = async (properties, userPermissions) => {
    const doc = new Customer_Groups(properties);
    const error = await doc.validate();
    if (!error) {
        // console.log(`User has permission to override?: ${userPermissions.includes(env.WRITE_OVERRIDE_MIN_SALE_PRICE_CLAIM)}`);
        // if (properties.hasOwnProperty('items')) await processItems(doc, !userPermissions.includes(env.WRITE_OVERRIDE_MIN_SALE_PRICE_CLAIM));
        // for(let customer of doc.customers) {
        //     await SERVICE_CUSTOMER_ITEMS.updateCustomerItems(customer.toString(), doc, userPermissions);
        // }
        if(env.NODE_ENV === 'production') {
            await upsertGroupForApp(doc);
        }
        return database.create(Customer_Groups, doc);
    }
    throw new createError(500);
};

const convertItemsListToMap = itemsList => {
    return itemsList.reduce((a, v) => {
        const id = v._id;
        a[id] = v;
        return a;
    }, {});
};

const updateCustomerGroups = async (id, properties, userPermissions) => {
    const doc = new Customer_Groups(properties);
    const error = await doc.validate(Object.keys(properties));
    if (!error) {
        if (properties.hasOwnProperty('items')) {
            await processItems(properties, false);

            //get current customer items, find updated items, compare prices and validate with user permissions
            if(userPermissions && !userPermissions.includes(env.WRITE_OVERRIDE_MIN_SALE_PRICE_CLAIM)) {
                const currentCustomerItemsList = await fetchCustomerGroups({_id: id});
                const currentCustomerItemsMap = convertItemsListToMap(currentCustomerItemsList.items);
                const newCustomerItemsMap = convertItemsListToMap(properties.items);
                const InventoryList = convertItemsListToMap(await SERVICE_INVENTORY.fetchInventory({_id: {$in: properties.items.map(item => validate.id(item._id))}}));
                Object.keys(newCustomerItemsMap).forEach(newItemID => {
                    if(newItemID in currentCustomerItemsMap) {
                        if(newCustomerItemsMap[newItemID].rate < InventoryList[newItemID].min_sale_price && newCustomerItemsMap[newItemID].rate !== currentCustomerItemsMap[newItemID].rate) {
                            throw new Error(`You cannot alter the price of [${InventoryList[newItemID].name}] while it is below the min sale price`);
                        }
                    } else {
                        if(newCustomerItemsMap[newItemID].rate < InventoryList[newItemID].min_sale_price) {
                            throw new Error(`You cannot set the price of [${InventoryList[newItemID].name}] below minimum sale price`);
                        }
                    }
                });
            }
        }
        for(let customer of properties.customers) {
            SERVICE_CUSTOMER_ITEMS.findAndUpdateCustomerItemsFromGroupUpdate(customer.toString(), doc.items, userPermissions);
        }
        if(env.NODE_ENV === 'production') {
            const groupData = {_id: id, name: properties.name, items: properties.items, customers: properties.customers};
            await upsertGroupForApp(groupData);
        }
        return database.findByIdAndUpdate(Customer_Groups, id, properties);
    }
    throw new createError(500);
};

const processItems = async (customerItemsObj, checkValues = true) => {
    const itemsList = customerItemsObj.items;
    await Promise.all([
        SERVICE_INVENTORY.fetchInventory({_id: {$in: itemsList.map(item => validate.id(item._id))}}),
    ]).then(data => {
        [InventoryList] = data.map(list => list.reduce((a, v) => {
            const id = v._id;
            delete v._id;
            a[id] = v;
            return a;
        }, {}));
    });
    if(checkValues) {
        //validate each item rate is above current min sale price
        itemsList.forEach(item => {
            if(item.rate < InventoryList[item._id].min_sale_price) {
                throw new createError(500, `Price for ${InventoryList[item._id].name} cannot be below ${InventoryList[item._id].min_sale_price}`);
            }
        });
    }

    itemsList.sort((x, y) => InventoryList[x._id].name < InventoryList[y._id].name ? -1 : 1);
};

const getItemToUpdateIndex = (id, items) => {
    return items.findIndex(object => object._id.toString() === id);
};

const updateGroupItemPrices = async (item_obj) => {
    //get all customerItems where item_id exists in their list
    const customerGroupsListsToUpdate = await fetchAllCustomerGroupsForGivenItemQuery({items: {$elemMatch: { _id: item_obj._id } } });
    customerGroupsListsToUpdate.forEach(customerItemsEntry => {
        const itemToUpdateIndex = getItemToUpdateIndex(item_obj._id.toString(), customerItemsEntry.items);
        customerItemsEntry.items[itemToUpdateIndex].rate = item_obj.default_sale_price;
        const update_id = customerItemsEntry._id.toString();
        delete customerItemsEntry._id;
        updateCustomerGroups(update_id, customerItemsEntry);
    });
};

const removeDeletedInventoryItemFromCustomerGroupItems = async (item_id) => {
    const customerGroupsToUpdate = await fetchAllCustomerGroupsForGivenItemQuery({items: {$elemMatch: { _id: item_id } } });
    customerGroupsToUpdate.forEach(customerGroupsEntry => {
        const itemToDeleteIndex = getItemToUpdateIndex(item_id, customerGroupsEntry.items);
        customerGroupsEntry.items.splice(itemToDeleteIndex, 1);
        const update_id = customerGroupsEntry._id.toString();
        delete customerGroupsEntry._id;
        updateCustomerGroups(update_id, customerGroupsEntry);
    });
};

const removeDisabledInventoryItemFromCustomerGroupItems = async (item_id) => {
    await removeDeletedInventoryItemFromCustomerGroupItems(item_id);
};

const deleteCustomerGroup = async id => {
    if(env.NODE_ENV === 'production'){ await removeCustomerGroupItemsInApp(id); }
    return database.findByIdAndDelete(Customer_Groups, id);
}

module.exports = {
    fetchOneCustomerGroup,
    fetchCustomerGroups,
    insertCustomerGroups,
    updateGroupItemPrices,
    updateCustomerGroups,
    removeDeletedInventoryItemFromCustomerGroupItems,
    removeDisabledInventoryItemFromCustomerGroupItems,
    deleteCustomerGroup
};

//prevent circular dependency issue
exports.updateCustomerGroups = updateCustomerGroups;
exports.removeDeletedInventoryItemFromCustomerGroupItems = removeDeletedInventoryItemFromCustomerGroupItems;
exports.removeDisabledInventoryItemFromCustomerGroupItems = removeDisabledInventoryItemFromCustomerGroupItems;