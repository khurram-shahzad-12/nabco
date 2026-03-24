const express = require('express');
const controller = require('./controller');
const {writeCustomerSalesRepPermission, readCustomersCheck} = require('../../../middleware/auth0');

const router = express.Router();

router.get('/:id?', readCustomersCheck, controller.getCustomerSalesRep);
router.post('/', writeCustomerSalesRepPermission, controller.addCustomerSalesRep);
router.put('/:id', writeCustomerSalesRepPermission, controller.updateCustomerSalesRep);
router.delete('/:id', writeCustomerSalesRepPermission, controller.deleteCustomerSalesRep);

module.exports = router;
