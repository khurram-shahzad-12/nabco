const express = require('express');
const controller = require('./controller');
const {readInventoryTagsCheck, writeInventoryTagsCheck} = require('../../../middleware/auth0');
const {authenticate} = require('../../../middleware/auth');
const router = express.Router();

router.get('/:id?',authenticate, readInventoryTagsCheck, controller.getInventoryTags);
router.post('/',authenticate, writeInventoryTagsCheck, controller.addInventoryTag);
router.put('/:id',authenticate, writeInventoryTagsCheck, controller.updateInventoryTag);
router.delete('/:id',authenticate, writeInventoryTagsCheck, controller.deleteInventoryTag);

module.exports = router;
