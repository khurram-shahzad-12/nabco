const express = require('express');
const controller = require('./controller');
const {claimCheck} = require("express-oauth2-jwt-bearer");
const {allUpdateCustomerZonesCheck} = require("../../../middleware/auth0");
const {readCustomersCheck, writeCustomersCheck} = require('../../../middleware/auth0');

const router = express.Router();

router.get('/:id?', readCustomersCheck, controller.getCustomers);
router.post('/', writeCustomersCheck, controller.addCustomer);
router.put('/:id?', writeCustomersCheck, controller.updateCustomer);
router.post('/updateCustomerZoneDelivery', claimCheck(allUpdateCustomerZonesCheck, "Failed update customer zones check"), controller.updateCustomerZoneDelivery);
router.delete('/:id', writeCustomersCheck, controller.deleteCustomer);

module.exports = router;
