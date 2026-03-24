const express = require('express');
const controller = require('./controller');
const controllerPDF = require('./controller.pdf');
const multer  = require('multer')();
const {readInventoryCheck, writeInventoryCheck, deleteInventoryCheck, resetInventoryNegativesPermissions} = require('../../../middleware/auth0');

const router = express.Router();

router.post('/items.pdf',readInventoryCheck, controllerPDF.generateItemsList);
router.post('/itemsInStock.pdf',readInventoryCheck, controllerPDF.generateItemsInStockList);
router.get('/:id?', readInventoryCheck, controller.getInventory);
router.get('/admin/resetNegativeQuantities', resetInventoryNegativesPermissions, controller.resetInventoryNegatives);
router.post('/',writeInventoryCheck, controller.addInventory);
router.put('/:id',writeInventoryCheck, controller.updateInventory);
router.get('/image/:id?', controller.getInventoryItemImage);
router.post('/updateInventoryImage/:id',writeInventoryCheck, multer.single('image'), controller.updateInventoryImage);
router.delete('/removeInventoryImage/:id',writeInventoryCheck, controller.removeInventoryImage);
router.delete('/:id',deleteInventoryCheck, controller.deleteInventory);

module.exports = router;
