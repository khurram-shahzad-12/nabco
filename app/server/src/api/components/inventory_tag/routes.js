const express = require('express');
const controller = require('./controller');
const {readInventoryTagsCheck, writeInventoryTagsCheck} = require('../../../middleware/auth0');

const router = express.Router();

router.get('/:id?', readInventoryTagsCheck, controller.getInventoryTags);
router.post('/',writeInventoryTagsCheck, controller.addInventoryTag);
router.put('/:id',writeInventoryTagsCheck, controller.updateInventoryTag);
router.delete('/:id',writeInventoryTagsCheck, controller.deleteInventoryTag);

module.exports = router;
