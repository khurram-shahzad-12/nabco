const express = require('express');
const controller = require('./controller');
const controllerPDF = require('./controller.pdf');
const {readCustomersCheck, writeCustomersCheck} = require('../../../middleware/auth0');

const router = express.Router();

router.get('/getCustomersWithPriceBelowCost', readCustomersCheck, controller.getCustomersWithPriceBelowCost);
router.get('/customerItemNames', readCustomersCheck, controller.getCustomerItemsNames);
router.get('/:id', readCustomersCheck, controller.getCustomerItems);
router.post('/', writeCustomersCheck, controller.addCustomerItems);
router.put('/upsertCustomerItems/:id', writeCustomersCheck, controller.upsertCustomerItems);
router.put('/:id', writeCustomersCheck, controller.updateCustomerItems);
router.get('/printCustomerItems/:id', readCustomersCheck, controllerPDF.printCustomerItems);

module.exports = router;
