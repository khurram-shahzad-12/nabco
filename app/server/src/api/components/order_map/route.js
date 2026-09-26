const express = require('express');
const controller = require('./controller');
const {authenticate} = require('../../../middleware/auth');
const router = express.Router();

router.get('/',authenticate, controller.fetchOrderMapData);
router.put('/:id',authenticate, controller.updateRoute);
router.post('/',authenticate, controller.unassignedroute);

module.exports = router;
