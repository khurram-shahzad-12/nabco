const express = require('express');
const controller = require('./controller');
const controllerPDF = require('./controller.pdf');
const {readCustomersCheck, writeCustomersCheck} = require('../../../middleware/auth0');
const { authenticate } = require('../../../middleware/auth');
const router = express.Router();

router.get('/getCustomersWithPriceBelowCost',authenticate, readCustomersCheck, controller.getCustomersWithPriceBelowCost);
router.get('/customerItemNames',authenticate, readCustomersCheck, controller.getCustomerItemsNames);
router.get('/:id',authenticate, readCustomersCheck, controller.getCustomerItems);
router.post('/',authenticate, writeCustomersCheck, controller.addCustomerItems);
router.put('/upsertCustomerItems/:id',authenticate, writeCustomersCheck, controller.upsertCustomerItems);
router.put('/:id',authenticate, writeCustomersCheck, controller.updateCustomerItems);
router.get('/printCustomerItems/:id',authenticate, readCustomersCheck, controllerPDF.printCustomerItems);

module.exports = router;
