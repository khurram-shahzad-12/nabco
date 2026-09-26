const express = require('express');
const controller = require('./controller');
const {readInventoryCategoriesCheck, writeInventoryCategoriesCheck} = require('../../../middleware/auth0');
const {authenticate} = require('../../../middleware/auth');
const router = express.Router();

router.get('/:id?',authenticate, readInventoryCategoriesCheck, controller.getInventoryCategories);
router.post('/',authenticate, writeInventoryCategoriesCheck, controller.addInventoryCategory);
router.put('/:id',authenticate, writeInventoryCategoriesCheck, controller.updateInventoryCategory);
router.delete('/:id',authenticate, writeInventoryCategoriesCheck, controller.deleteInventoryCategory);

module.exports = router;
