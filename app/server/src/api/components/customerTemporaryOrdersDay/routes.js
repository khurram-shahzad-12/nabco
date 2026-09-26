const express = require('express');
const controller = require('./controller');
const {readCustomersCheck, writeCustomerCancelOrderDayCheck} = require('../../../middleware/auth0');
const {authenticate} = require('../../../middleware/auth');
const router = express.Router();

router.get('/:ot_date',authenticate, readCustomersCheck, controller.getTemporaryCustomersForDate);
router.post('/',authenticate, writeCustomerCancelOrderDayCheck, controller.addTemporaryCustomerForDate);
router.delete('/:id',authenticate, writeCustomerCancelOrderDayCheck, controller.deleteTemporaryCustomerForDate);

module.exports = router;
