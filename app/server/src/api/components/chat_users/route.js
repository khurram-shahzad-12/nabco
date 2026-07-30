const express = require('express');
const controller = require('./controller');

const router = express.Router();

router.get('/', controller.getChatUsers);

router.delete('/:id', controller.deleteChatUser);

module.exports = router;
