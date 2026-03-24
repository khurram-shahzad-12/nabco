const express = require('express');
const controller = require('./controller');
const {readCustomersCheck, writeCustomerCancelOrderDayCheck} = require('../../../middleware/auth0');

const router = express.Router();

router.get('/:ot_date', readCustomersCheck, controller.getTemporaryCustomersForDate);
router.post('/', writeCustomerCancelOrderDayCheck, controller.addTemporaryCustomerForDate);
router.delete('/:id', writeCustomerCancelOrderDayCheck, controller.deleteTemporaryCustomerForDate);

module.exports = router;
