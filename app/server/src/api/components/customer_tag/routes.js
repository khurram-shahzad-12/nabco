const express = require('express');
const controller = require('./controller');
const {readCustomerTagsCheck, writeCustomerTagsCheck} = require('../../../middleware/auth0');

const router = express.Router();

router.get('/:id?', readCustomerTagsCheck, controller.getCustomerTags);
router.post('/',writeCustomerTagsCheck, controller.addCustomerTag);
router.put('/:id',writeCustomerTagsCheck, controller.updateCustomerTag);
router.delete('/:id',writeCustomerTagsCheck, controller.deleteCustomerTag);

module.exports = router;
