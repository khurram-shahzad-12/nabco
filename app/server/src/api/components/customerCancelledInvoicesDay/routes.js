const express = require('express');
const controller = require('./controller');
const {readCustomersCheck, writeCustomerCancelOrderDayCheck} = require('../../../middleware/auth0');

const router = express.Router();

router.get('/:ot_date', readCustomersCheck, controller.getCustomerCancelledInvoicesForDate);
router.post('/', writeCustomerCancelOrderDayCheck, controller.addCustomerCancelledInvoicesForDate);
router.delete('/:id', writeCustomerCancelOrderDayCheck, controller.deleteCustomerCancelledInvoicesForDate);

module.exports = router;