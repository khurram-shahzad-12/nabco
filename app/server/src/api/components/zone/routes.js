const express = require('express');
const controller = require('./controller');
const {readZonesCheck, writeZonesCheck} = require('../../../middleware/auth0');
const {authenticate} = require('../../../middleware/auth');
const router = express.Router();

router.get('/:id?',authenticate, readZonesCheck, controller.getZones);
router.post('/',authenticate, writeZonesCheck, controller.addZone);
router.put('/:id',authenticate, writeZonesCheck, controller.updateZone);
router.delete('/:id',authenticate, writeZonesCheck, controller.deleteZone);

module.exports = router;
