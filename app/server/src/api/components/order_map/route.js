const express = require('express');
const controller = require('./controller');
const router = express.Router();

router.get('/', controller.fetchOrderMapData);
router.put('/:id',controller.updateRoute);
router.post('/', controller.unassignedroute);

module.exports = router;
