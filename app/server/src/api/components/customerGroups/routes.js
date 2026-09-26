const express = require('express');
const controller = require('./controller');
const controllerPDF = require('./controller.pdf');
const {readCustomerGroupsCheck, writeCustomerGroupsCheck} = require('../../../middleware/auth0');
const {authenticate} = require('../../../middleware/auth')
const router = express.Router();

router.get('/',authenticate, readCustomerGroupsCheck, controller.getCustomerGroups);
router.get('/:groupId',authenticate, readCustomerGroupsCheck, controller.getCustomerGroups);
router.post('/',authenticate, writeCustomerGroupsCheck, controller.addCustomerGroups);
router.put('/:groupId', authenticate, writeCustomerGroupsCheck, controller.updateCustomerGroups);
router.get('/printCustomerGroupItems/:id',authenticate, readCustomerGroupsCheck, controllerPDF.printCustomerGroupItems);
router.delete('/:groupId',authenticate, writeCustomerGroupsCheck, controller.deleteCustomerGroup);

module.exports = router;
