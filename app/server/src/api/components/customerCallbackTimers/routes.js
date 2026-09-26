const express = require('express');
const controller = require('./controller');
const {readCustomersCheck} = require('../../../middleware/auth0');
const {authenticate} = require('../../../middleware/auth')
const router = express.Router();

router.get('/',authenticate, readCustomersCheck, controller.getCustomerCallbackTimers);
router.post('/',authenticate, controller.addCustomerCallbackTimer);
router.delete('/:id',authenticate, controller.deleteCustomerCallbackTimer);

module.exports = router;
