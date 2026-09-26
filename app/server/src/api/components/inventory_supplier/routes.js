const express = require('express');
const controller = require('./controller');
const {readInventorySuppliersCheck, writeInventorySuppliersCheck} = require('../../../middleware/auth0');
const {authenticate} = require('../../../middleware/auth');
const router = express.Router();

router.get('/:id?',authenticate, readInventorySuppliersCheck, controller.getInventorySuppliers);
router.post('/',authenticate, writeInventorySuppliersCheck, controller.addInventorySupplier);
router.put('/:id',authenticate, writeInventorySuppliersCheck, controller.updateInventorySupplier);
router.delete('/:id',authenticate, writeInventorySuppliersCheck, controller.deleteInventorySupplier);

module.exports = router;
