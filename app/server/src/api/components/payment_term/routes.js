const express = require('express');
const controller = require('./controller');
const {readPaymentTermCheck, writePaymentTermCheck} = require('../../../middleware/auth0');
const {authenticate} = require("../../../middleware/auth");
const router = express.Router();

router.get('/:id?',authenticate, readPaymentTermCheck, controller.getPaymentTerms);
router.post('/',authenticate, writePaymentTermCheck, controller.addPaymentTerm);
router.put('/:id',authenticate, writePaymentTermCheck, controller.updatePaymentTerm);
router.delete('/:id',authenticate, writePaymentTermCheck, controller.deletePaymentTerm);

module.exports = router;
