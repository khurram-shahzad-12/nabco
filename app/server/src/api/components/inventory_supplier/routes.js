const express = require('express');
const controller = require('./controller');
const {readInventorySuppliersCheck, writeInventorySuppliersCheck} = require('../../../middleware/auth0');

const router = express.Router();

router.get('/:id?', readInventorySuppliersCheck, controller.getInventorySuppliers);
router.post('/', writeInventorySuppliersCheck, controller.addInventorySupplier);
router.put('/:id', writeInventorySuppliersCheck, controller.updateInventorySupplier);
router.delete('/:id', writeInventorySuppliersCheck, controller.deleteInventorySupplier);

module.exports = router;
