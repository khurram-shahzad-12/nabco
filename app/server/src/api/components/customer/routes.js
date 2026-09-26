const express = require('express');
const controller = require('./controller');
const {allUpdateCustomerZonesCheck} = require("../../../middleware/auth0");
const {readCustomersCheck, writeCustomersCheck} = require('../../../middleware/auth0');
const {authenticate} = require("../../../middleware/auth");
const router = express.Router();

router.get('/:id?',authenticate, readCustomersCheck, controller.getCustomers);
router.post('/',authenticate, writeCustomersCheck, controller.addCustomer);
router.put('/:id?',authenticate, writeCustomersCheck, controller.updateCustomer);
router.post('/updateCustomerZoneDelivery',authenticate, allUpdateCustomerZonesCheck, controller.updateCustomerZoneDelivery);
router.delete('/:id',authenticate, writeCustomersCheck, controller.deleteCustomer);

module.exports = router;
