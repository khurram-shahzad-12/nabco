const express = require('express');
const controller = require('./controller');
const {writeActivityCheck} = require('../../../middleware/auth0');
const {authenticate} = require('../../../middleware/auth');
const router = express.Router();

router.post('/',authenticate, writeActivityCheck ,controller.createActivity);
module.exports = router;