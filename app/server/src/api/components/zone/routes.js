const express = require('express');
const controller = require('./controller');
const {readZonesCheck, writeZonesCheck} = require('../../../middleware/auth0');

const router = express.Router();

router.get('/:id?', readZonesCheck, controller.getZones);
router.post('/', writeZonesCheck, controller.addZone);
router.put('/:id', writeZonesCheck, controller.updateZone);
router.delete('/:id', writeZonesCheck, controller.deleteZone);

module.exports = router;
