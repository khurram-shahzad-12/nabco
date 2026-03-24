const createError = require('http-errors');
const Customer_Items = require('./model');
const database = require('./../../../db/database');
const SERVICE_INVENTORY = require('./../inventory/service');
const SERVICE_CUSTOMER = require('./../customer/service');
const validate = require('../../../utils/validate');
const env = require('./../../../config.env');
const axios = require("axios");
const { query } = require('express');

const updateCustomerItemPricesInAppBulk = async (id, price) => {
    try {
        const resp = await axios.post(`${env.SDW_APP_API}/api/update_customer_item`, {id, price},{
            headers: { Authorization: `Bearer ${env.SYNC_SECRET_TOKEN}` }
        });
        if(resp.status === 200){console.log("updated successfully")}else{"no product items found to update"}
    } catch (error) {
        console.log("error to update customer item prices in App", error)
    }
}

const removeCustomerItemsInApp = async (id) => {
     try {
        const resp = await axios.delete(`${env.SDW_APP_API}/api/remove_customer_item_product`, {data:{id}, headers: { Authorization: `Bearer ${env.SYNC_SECRET_TOKEN}` }});
        if(resp.status === 200){console.log("customer item deleted successfully")}else{"no product items found to delete"}
    } catch (error) {
        console.log("error to delete customer item prices in App", error)
    }
}

const upsertSingleCustomeritem = async(doc) => {
     const cleanDoc = {
            _id: doc._id.toString(),
            customer: doc.customer.toString(),
            items: doc.items.map(item => ({
                _id:item._id.toString(),
                rate: item.rate
            }))
        }
        const resultApp = await axios.post(`${env.SDW_APP_API}/api/customeritem_single_product`, cleanDoc, {
             headers: { Authorization: `Bearer ${env.SYNC_SECRET_TOKEN}` }
        });
        if(resultApp.status === 200){console.log("customerItem add/updated successfully")}else{console.log("unable to add/update customerItems")}
}

const fetchCustomerItems = (query = {}, projection = {}, sort = {}, limit = 0) => {
        return database.findOne(Customer_Items, query, projection, sort, limit);
};

const fetchCustomerItemsNames = async(query = {}, projection = {}, sort = {}, limit = 0) => {
        const result = await database.find(Customer_Items,query, projection, sort, limit);    
        const customerIdsArray = result.map(item=>item.customer);
        const customerNamesList =await SERVICE_CUSTOMER.getCustomerNamesInBulk(customerIdsArray);
        return customerNamesList;
};

const fetchAllCustomerItemsForGivenItemQuery = (query) => {
    return database.find(Customer_Items, query);
};

const insertCustomerItems = async (properties, userPermissions) => {
    const doc = new Customer_Items(properties);
    const error = await doc.validate();
    if (!error) {
        console.log(`User has permission to override?: ${userPermissions.includes(env.WRITE_OVERRIDE_MIN_SALE_PRICE_CLAIM)}`);
        if (properties.hasOwnProperty('items')) await processItems(doc, !userPermissions.includes(env.WRITE_OVERRIDE_MIN_SALE_PRICE_CLAIM));
        const resp = await database.create(Customer_Items, doc);
        if(env.NODE_ENV === 'production') {
            await upsertSingleCustomeritem(doc)
         }
        return resp;
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

const updateCustomerItems = async (id, properties, userPermissions) => {
    const doc = new Customer_Items(properties);
    const error = await doc.validate(Object.keys(properties));
    if (!error) {
        if (properties.hasOwnProperty('items')) {
            await processItems(properties, false);

            //get current customer items, find updated items, compare prices and validate with user permissions
            if (userPermissions && !userPermissions.includes(env.WRITE_OVERRIDE_MIN_SALE_PRICE_CLAIM)) {
                const currentCustomerItemsList = await fetchCustomerItems({ _id: id });
                const currentCustomerItemsMap = convertItemsListToMap(currentCustomerItemsList.items);
                const newCustomerItemsMap = convertItemsListToMap(properties.items);
                const InventoryList = convertItemsListToMap(await SERVICE_INVENTORY.fetchInventory({ _id: { $in: properties.items.map(item => validate.id(item._id)) } }));
                Object.keys(newCustomerItemsMap).forEach(newItemID => {
                    if (newItemID in currentCustomerItemsMap) {
                        if (newCustomerItemsMap[newItemID].rate < InventoryList[newItemID].min_sale_price && newCustomerItemsMap[newItemID].rate !== currentCustomerItemsMap[newItemID].rate) {
                            throw new Error(`You cannot alter the price of [${InventoryList[newItemID].name}] while it is below the min sale price`);
                        }
                    } else {
                        if (newCustomerItemsMap[newItemID].rate < InventoryList[newItemID].min_sale_price) {
                            throw new Error(`You cannot set the price of [${InventoryList[newItemID].name}] below minimum sale price`);
                        }
                    }
                });
            }
        };
        if(env.NODE_ENV === 'production') {
            const docData = {_id: id, customer:properties.customer, items: properties.items}
            await upsertSingleCustomeritem(docData);
        }
         return database.findByIdAndUpdate(Customer_Items, id, properties);
    }
    throw new createError(500);
};

const findAndUpdateCustomerItemsFromGroupUpdate = async (customerId, items, userPermissions) => {
    const customerItemsEntry = await fetchCustomerItems({customer: customerId});
    if(customerItemsEntry) {
        updateCustomerItems(customerItemsEntry._id, {customer: customerId, items: items});
    } else {
        insertCustomerItems({customer: customerId, items: items}, userPermissions);
    }

};

const processItems = async (customerItemsObj, checkValues = true) => {
    const itemsList = customerItemsObj.items;
    await Promise.all([
        SERVICE_INVENTORY.fetchInventory({ _id: { $in: itemsList.map(item => validate.id(item._id)) } }),
    ]).then(data => {
        [InventoryList] = data.map(list => list.reduce((a, v) => {
            const id = v._id;
            delete v._id;
            a[id] = v;
            return a;
        }, {}));
    });
    if (checkValues) {
        //validate each item rate is above current min sale price
        itemsList.forEach(item => {
            if (item.rate < InventoryList[item._id].min_sale_price) {
                throw new createError(500, `Price for ${InventoryList[item._id].name} cannot be below ${InventoryList[item._id].min_sale_price}`);
            }
        });
    }

    itemsList.sort((x, y) => InventoryList[x._id].name < InventoryList[y._id].name ? -1 : 1);
};

const getItemToUpdateIndex = (id, items) => {
    return items.findIndex(object => object._id.toString() === id);
};

const updateItemPrices = async (item_obj) => {
    //get all customerItems where item_id exists in their list
    const customerListsToUpdate = await fetchAllCustomerItemsForGivenItemQuery({ items: { $elemMatch: { _id: item_obj._id } } });
    customerListsToUpdate.forEach(customerItemsEntry => {
        const itemToUpdateIndex = getItemToUpdateIndex(item_obj._id.toString(), customerItemsEntry.items);
        customerItemsEntry.items[itemToUpdateIndex].rate = item_obj.default_sale_price;
        customerItemsEntry.updateCustomerItemId = customerItemsEntry.items[itemToUpdateIndex]._id;
        const update_id = customerItemsEntry._id.toString();
        delete customerItemsEntry._id;
        updateCustomerItems(update_id, customerItemsEntry);
    });
    if(env.NODE_ENV === 'production') {
        await updateCustomerItemPricesInAppBulk(item_obj._id.toString(), item_obj.default_sale_price)
    }
};

const removeDeletedInventoryItemFromCustomerItems = async (item_id) => {
    const customerListsToUpdate = await fetchAllCustomerItemsForGivenItemQuery({ items: { $elemMatch: { _id: item_id } } });
    customerListsToUpdate.forEach(customerItemsEntry => {
        const itemToDeleteIndex = getItemToUpdateIndex(item_id, customerItemsEntry.items);
        customerItemsEntry.items.splice(itemToDeleteIndex, 1);
        const update_id = customerItemsEntry._id.toString();
        delete customerItemsEntry._id;
        updateCustomerItems(update_id, customerItemsEntry);
    });
    if(env.NODE_ENV === 'production'){
        await removeCustomerItemsInApp(item_id);
    }
};

const getCustomersWithPriceBelowCost = async () => {
    const inventoryItems = await SERVICE_INVENTORY.fetchInventory({}, ['_id', 'name', 'cost_price']);
    const customerIDsBelowCost = [];
    for (const item of inventoryItems) {
        let customerItems = await fetchAllCustomerItemsForGivenItemQuery({ items: { $elemMatch: { _id: item._id.toString(), rate: { $lt: item.cost_price } } } });

        for (const customerItem of customerItems) {
            const customer = await SERVICE_CUSTOMER.fetchOneCustomer({ _id: customerItem.customer.toString() }, ['customer_name']);
            customerIDsBelowCost.push({
                customerName: customer.customer_name,
                itemName: item.name
            });
        }
    }
    return customerIDsBelowCost;
};

const removeDisabledInventoryItemFromCustomerItems = async (item_id) => {
    await removeDeletedInventoryItemFromCustomerItems(item_id);
};
const upsertCustomerItems = async (customerId, items, userPermissions) => {
    const customerItemsEntry = await fetchCustomerItems({customer: customerId});
    if(customerItemsEntry) { updateCustomerItems(customerItemsEntry._id, {customer: customerId, items});
    } else { insertCustomerItems({customer: customerId, items}, userPermissions); }

};

module.exports = {
    fetchCustomerItems,
    insertCustomerItems,
    updateCustomerItems,
    getCustomersWithPriceBelowCost,
    fetchCustomerItemsNames,
    upsertCustomerItems,
};

//prevent circular dependency issue
exports.updateItemPrices = updateItemPrices;
exports.findAndUpdateCustomerItemsFromGroupUpdate = findAndUpdateCustomerItemsFromGroupUpdate;
exports.updateCustomerItems = updateCustomerItems;
exports.removeDeletedInventoryItemFromCustomerItems = removeDeletedInventoryItemFromCustomerItems;
exports.removeDisabledInventoryItemFromCustomerItems = removeDisabledInventoryItemFromCustomerItems;