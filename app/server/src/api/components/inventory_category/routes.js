const express = require('express');
const controller = require('./controller');
const {readInventoryCategoriesCheck, writeInventoryCategoriesCheck} = require('../../../middleware/auth0');

const router = express.Router();

router.get('/:id?', readInventoryCategoriesCheck, controller.getInventoryCategories);
router.post('/', writeInventoryCategoriesCheck, controller.addInventoryCategory);
router.put('/:id', writeInventoryCategoriesCheck, controller.updateInventoryCategory);
router.delete('/:id', writeInventoryCategoriesCheck, controller.deleteInventoryCategory);

module.exports = router;
