const express = require('express');
const controller = require('./controller');
const {readCustomerTagsCheck, writeCustomerTagsCheck} = require('../../../middleware/auth0');
const {authenticate} = require('../../../middleware/auth')
const router = express.Router();

router.get('/:id?',authenticate, readCustomerTagsCheck, controller.getCustomerTags);
router.post('/',authenticate, writeCustomerTagsCheck, controller.addCustomerTag);
router.put('/:id',authenticate, writeCustomerTagsCheck, controller.updateCustomerTag);
router.delete('/:id',authenticate, writeCustomerTagsCheck, controller.deleteCustomerTag);

module.exports = router;
