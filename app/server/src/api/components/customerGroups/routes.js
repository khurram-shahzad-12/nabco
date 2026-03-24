const express = require('express');
const controller = require('./controller');
const controllerPDF = require('./controller.pdf');
const {readCustomerGroupsCheck, writeCustomerGroupsCheck} = require('../../../middleware/auth0');

const router = express.Router();

// router.get('/getCustomersWithPriceBelowCost', readCustomersCheck, controller.getCustomersWithPriceBelowCost);
router.get('/', readCustomerGroupsCheck, controller.getCustomerGroups);
router.get('/:groupId', readCustomerGroupsCheck, controller.getCustomerGroups);
router.post('/', writeCustomerGroupsCheck, controller.addCustomerGroups);
router.put('/:groupId', writeCustomerGroupsCheck, controller.updateCustomerGroups);
router.get('/printCustomerGroupItems/:id', readCustomerGroupsCheck, controllerPDF.printCustomerGroupItems);
router.delete('/:groupId', writeCustomerGroupsCheck, controller.deleteCustomerGroup);

module.exports = router;
