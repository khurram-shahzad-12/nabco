const express = require('express');
const controller = require('./controller');
const {readVatCheck, writeVatCheck} = require('../../../middleware/auth0');

const router = express.Router();

router.get('/:id?', readVatCheck, controller.getVAT);
router.post('/', writeVatCheck, controller.addVAT);
router.put('/:id', writeVatCheck, controller.updateVAT);
router.delete('/:id', writeVatCheck, controller.deleteVAT);

module.exports = router;
