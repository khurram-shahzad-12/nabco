const createError = require('http-errors');
const mongoose = require("mongoose");
const RoleModel = require('./model');
const PermissionModel = require('../permissions/model');
const UserModel = require('../user/model');

const getAllRoles = async () => {
    const roles = await RoleModel.find().populate('permissions', 'module action description').populate('userCount').sort({ name: 1 });
    return {success: true,data: roles, count: roles.length};
};
const createRole = async (roleData) => {
    const { name, displayName, description, permissions } = roleData;
    if (!name || !displayName) { throw createError(400, 'Name and displayName are required'); }
    const existingRole = await RoleModel.findOne({ name: name.toLowerCase() });
    if (existingRole) { throw createError(400, `Role with name "${name}" already exists`); }
    if (permissions && permissions.length > 0) {
        const validPermissions = await PermissionModel.find({ _id: { $in: permissions } });
        if (validPermissions.length !== permissions.length) { throw createError(400, 'One or more permissions are invalid'); }
    }
    const role = new RoleModel({
        name: name.toLowerCase(),
        displayName,
        description: description || '',
        permissions: permissions || [],
        isSystemRole: false,
        isActive: true
    });
    await role.save();
    const populatedRole = await RoleModel.findById(role._id).populate('permissions', 'module action description');
    return {success: true, data:populatedRole};
};
const updateRole = async (roleId, updateData) => {
    const { displayName, description, permissions } = updateData;
    if (!mongoose.Types.ObjectId.isValid(roleId)) { throw createError(400, 'Invalid role ID format'); }
    const role = await RoleModel.findById(roleId);
    if (!role) { throw createError(404, 'Role not found'); }
    if (!displayName && description === undefined && !permissions) {
        throw createError(400, 'At least one field (displayName, description, or permissions) must be provided for update');
    }
    if (permissions && permissions.length > 0) {
        const validPermissions = await PermissionModel.find({ _id: { $in: permissions } });
        if (validPermissions.length !== permissions.length) { throw createError(400, 'One or more permissions are invalid'); }
    }
    if (displayName) role.displayName = displayName;
    if (description !== undefined) role.description = description;
    if (permissions) role.permissions = permissions;
    role.updatedAt = Date.now();
    await role.save();
    const updatedRole = await RoleModel.findById(role._id).populate('permissions', 'module action description');
    return {success:true, data: updatedRole};
};
const deleteRole = async (roleId) => {
    if (!mongoose.Types.ObjectId.isValid(roleId)) { throw createError(400, 'Invalid role ID format'); }
    const role = await RoleModel.findById(roleId);
    if (!role) { throw createError(404, 'Role not found'); }
    const usersWithRole = await UserModel.find({ role: roleId });
    if (usersWithRole.length > 0) {
        await UserModel.updateMany(
            { role: roleId },
            { 
                $unset: { role: "" },
                updatedAt: Date.now()
            }
        );
    }
    await RoleModel.findByIdAndDelete(roleId);
    return { 
        success: true, 
        roleId: roleId,
    };
};
const getRolePermissions = async (roleId) => {
    if (!mongoose.Types.ObjectId.isValid(roleId)) { throw createError(400, 'Invalid role ID format'); }
    const role = await RoleModel.findById(roleId).populate('permissions', 'module action description');  
    if (!role) { throw createError(404, 'Role not found'); }
    return {
        roleId: role._id,
        roleName: role.name,
        permissions: role.permissions
    };
};
const assignPermissionsToRole = async (roleId, permissionIds) => {
    if (!mongoose.Types.ObjectId.isValid(roleId)) { throw createError(400, 'Invalid role ID format'); }
    const role = await RoleModel.findById(roleId);
    if (!role) { throw createError(404, 'Role not found'); }
    if (permissionIds && permissionIds.length > 0) {
        for (const permId of permissionIds) {
            if (!mongoose.Types.ObjectId.isValid(permId)) {
                throw createError(400, `Invalid permission ID format: ${permId}`);
            }
        }
        const validPermissions = await PermissionModel.find({ _id: { $in: permissionIds } });
        if (validPermissions.length !== permissionIds.length) { throw createError(400, 'One or more permissions are invalid'); }
    }
    role.permissions = permissionIds || [];
    role.updatedAt = Date.now();
    await role.save();
    const updatedRole = await RoleModel.findById(role._id).populate('permissions', 'module action description');
    return updatedRole;
};
module.exports = {
    getAllRoles,
    createRole,
    updateRole,
    deleteRole,
    getRolePermissions,
    assignPermissionsToRole,
};