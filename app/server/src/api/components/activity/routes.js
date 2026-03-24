const express = require('express');
const controller = require('./controller');
const {writeActivityCheck} = require('../../../middleware/auth0')
const router = express.Router();

router.post('/',writeActivityCheck ,controller.createActivity);
module.exports = router;