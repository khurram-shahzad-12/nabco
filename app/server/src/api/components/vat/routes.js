const express = require('express');
const controller = require('./controller');
const {readVatCheck, writeVatCheck} = require('../../../middleware/auth0');
const {authenticate} = require('../../../middleware/auth');
const router = express.Router();

router.get('/:id?',authenticate, readVatCheck, controller.getVAT);
router.post('/',authenticate, writeVatCheck, controller.addVAT);
router.put('/:id',authenticate, writeVatCheck, controller.updateVAT);
router.delete('/:id',authenticate, writeVatCheck, controller.deleteVAT);

module.exports = router;
