const express = require('express');
const controller = require('./controller');
const {authenticate} = require("../../../../middleware/auth");
const {readUserRoleCheck, writeUserRoleCheck} = require('../../../../middleware/auth0');
const router = express.Router();

router.get('/',authenticate,readUserRoleCheck, controller.getAllRoles);
router.post('/',authenticate, writeUserRoleCheck, controller.createRole);
router.put('/:id',authenticate, writeUserRoleCheck, controller.updateRole);
router.delete('/:id',authenticate, writeUserRoleCheck, controller.deleteRole);
router.get('/:id/permissions',authenticate,readUserRoleCheck, controller.getRolePermissions);
router.put('/:id/permissions',authenticate, writeUserRoleCheck, controller.assignPermissionsToRole);

module.exports = router;