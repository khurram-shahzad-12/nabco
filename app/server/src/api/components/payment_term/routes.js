const express = require('express');
const controller = require('./controller');
const {readPaymentTermCheck, writePaymentTermCheck} = require('../../../middleware/auth0');

const router = express.Router();

router.get('/:id?', readPaymentTermCheck, controller.getPaymentTerms);
router.post('/', writePaymentTermCheck, controller.addPaymentTerm);
router.put('/:id', writePaymentTermCheck, controller.updatePaymentTerm);
router.delete('/:id', writePaymentTermCheck, controller.deletePaymentTerm);

module.exports = router;
