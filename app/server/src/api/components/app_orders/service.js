const createError = require('http-errors');
const appOrderModel = require('./model');
const database = require('./../../../db/database');

const fetchLastOrder = async() => {
    try {
        const lastInsertOrder = await appOrderModel.findOne().sort({_id: -1}); return lastInsertOrder;
    } catch (error) {
        console.log("error fetching last app order", error)
    }}
    
const insertAppOrder = async (ordid) => {
    try {
        if(ordid){
            const doc = new appOrderModel({appOrder_Id: ordid}); 
            const error = await doc.validate();
            if (!error) return database.create(appOrderModel, doc);
        }
    } catch (error) {
        console.error('Error inserting order:', error);
    throw new createError(500, 'Error inserting order');
    }     
};

module.exports = {
    fetchLastOrder,
    insertAppOrder,
   
};
