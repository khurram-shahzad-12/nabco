const express = require('express');
const controller = require('./controller');
const controllerPDF = require('./controller.pdf');
const multer  = require('multer')();
const {readInventoryCheck, writeInventoryCheck, deleteInventoryCheck, resetInventoryNegativesPermissions} = require('../../../middleware/auth0');
const {authenticate} = require('../../../middleware/auth');
const router = express.Router();

router.post('/items.pdf',authenticate, readInventoryCheck, controllerPDF.generateItemsList);
router.post('/itemsInStock.pdf',authenticate,readInventoryCheck, controllerPDF.generateItemsInStockList);
router.get('/:id?',authenticate, readInventoryCheck, controller.getInventory);
router.get('/admin/resetNegativeQuantities',authenticate, resetInventoryNegativesPermissions, controller.resetInventoryNegatives);
router.post('/',authenticate, writeInventoryCheck, controller.addInventory);
router.put('/:id',authenticate, writeInventoryCheck, controller.updateInventory);
router.get('/image/:id?',authenticate, controller.getInventoryItemImage);
router.post('/updateInventoryImage/:id',authenticate,writeInventoryCheck, multer.single('image'), controller.updateInventoryImage);
router.delete('/removeInventoryImage/:id',authenticate,writeInventoryCheck, controller.removeInventoryImage);
router.delete('/:id',authenticate,deleteInventoryCheck, controller.deleteInventory);

module.exports = router;
