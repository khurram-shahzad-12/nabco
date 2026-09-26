const express = require('express');
const controller = require('./controller');
const {readCustomersCheck, writeCustomerCancelOrderDayCheck} = require('../../../middleware/auth0');
const {authenticate} = require('../../../middleware/auth');
const router = express.Router();

router.get('/:ot_date',authenticate, readCustomersCheck, controller.getCustomerCancelledInvoicesForDate);
router.post('/',authenticate, writeCustomerCancelOrderDayCheck, controller.addCustomerCancelledInvoicesForDate);
router.delete('/:id',authenticate, writeCustomerCancelOrderDayCheck, controller.deleteCustomerCancelledInvoicesForDate);

module.exports = router;