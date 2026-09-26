const express = require('express');
const controller = require('./controller');
const {writeCustomerSalesRepPermission, readCustomerSalesRepPermission} = require('../../../middleware/auth0');
const {authenticate} = require('../../../middleware/auth');
const router = express.Router();

router.get('/:id?',authenticate, readCustomerSalesRepPermission, controller.getCustomerSalesRep);
router.post('/',authenticate, writeCustomerSalesRepPermission, controller.addCustomerSalesRep);
router.put('/:id',authenticate, writeCustomerSalesRepPermission, controller.updateCustomerSalesRep);
router.delete('/:id',authenticate, writeCustomerSalesRepPermission, controller.deleteCustomerSalesRep);

module.exports = router;
