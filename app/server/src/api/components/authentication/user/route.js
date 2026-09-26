const express = require('express');
const controller = require('./controller');
const {authenticate} = require('../../../../middleware/auth');
const {writeCustomersCheck, readCustomersCheck} = require("../../../../middleware/auth0");
const router = express.Router();

router.post('/login', controller.login);
router.post('/refresh-token', controller.refreshToken);
router.get('/me',authenticate, controller.mySelf);
router.post('/logout',authenticate, controller.logout);
router.get('/',authenticate, readCustomersCheck, controller.getAllUsers);
router.post('/register',authenticate, writeCustomersCheck, controller.register);
router.put('/:id',authenticate,writeCustomersCheck, controller.updateUser);
router.delete('/:id',authenticate, writeCustomersCheck, controller.deleteUser);
router.patch('/:id/status', authenticate, writeCustomersCheck, controller.toggleUserStatus);

module.exports = router;