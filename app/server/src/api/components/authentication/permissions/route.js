const express = require('express');
const controller = require('./controller');
const { authenticate } = require('../../../../middleware/auth');
const {readUserPermissionCheck, writeUserPermissionCheck} = require('../../../../middleware/auth0');
const router = express.Router();

router.get('/', authenticate, readUserPermissionCheck, controller.getAllPermissions);
router.post('/', authenticate,writeUserPermissionCheck, controller.createPermission);
router.put('/:id', authenticate, writeUserPermissionCheck, controller.updatePermission);
router.delete('/:id', authenticate, writeUserPermissionCheck, controller.deletePermission);

module.exports = router;