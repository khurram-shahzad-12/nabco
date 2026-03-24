const express = require('express');
const controller = require('./controller');
const {readCustomersCheck} = require('../../../middleware/auth0');

const router = express.Router();

router.get('/', readCustomersCheck, controller.getCustomerCallbackTimers);
router.post('/', controller.addCustomerCallbackTimer);
router.delete('/:id', controller.deleteCustomerCallbackTimer);

module.exports = router;
