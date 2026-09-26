const createError = require('http-errors');
const PermissionModel = require('./model');

const checkPermissions = async (permissionIds) => {
    if (!permissionIds || !Array.isArray(permissionIds) || permissionIds.length === 0) { return true;}
    const validPermissions = await PermissionModel.find({ _id: { $in: permissionIds }});
    return validPermissions.length === permissionIds.length;
}
const getAllPermissions = async () => {
    const permissions = await PermissionModel.find({}).sort({ module: 1, action: 1 }).lean();
    const permissionData = permissions.map(perm => ({
        id: perm._id,
        _id: perm._id,
        module: perm.module,
        action: perm.action,
        description: perm.description || '',
        isProtected: perm.isProtected || false,
        createdAt: perm.createdAt
    }))
    return { success: true, data: permissionData }
};
const createPermission = async (permissionData) => {
    const { module, action, description, isProtected } = permissionData;
    if (!module || !action) { throw createError(400, 'Module and action are required'); }
    const existingPermission = await PermissionModel.findOne({ module: module.toLowerCase(), action: action.toLowerCase() });
    if (existingPermission) { throw createError(400, `Permission "${action}:${module}" already exists`); }
    const permission = new PermissionModel({
        module: module.toLowerCase(),
        action: action.toLowerCase(),
        description: description || '',
        isProtected: isProtected === true
    });
    await permission.save();
    const newPermission = {
        id: permission._id,
        _id: permission._id,
        module: permission.module,
        action: permission.action,
        description: permission.description,
        isProtected: permission.isProtected || false,
        createdAt: permission.createdAt
    };
    return { success: true, data: newPermission }
};
const deletePermission = async (permissionId) => {
    const permission = await PermissionModel.findById(permissionId);
    if (!permission) { throw createError(404, 'Permission not found'); }
     if (permission.isProtected) { throw createError(403, 'Cannot delete protected permission'); }
    const RoleModel = require('../roles/model');
    const rolesWithPermission = await RoleModel.find({ permissions: permissionId });
    if (rolesWithPermission.length > 0) {
        const roleNames = rolesWithPermission.map(r => r.name).join(', ');
        throw createError(400, `Cannot delete permission as it is assigned to role(s): ${roleNames}`);
    }
    await PermissionModel.findByIdAndDelete(permissionId);
    return {
        success: true,
        message: 'Permission deleted successfully',
        permissionId: permissionId
    };
};
const updatePermission = async (permissionId, updateData) => {
    const { module, action, description, isProtected } = updateData;
    const permission = await PermissionModel.findById(permissionId);
    if (!permission) { throw createError(404, 'Permission not found'); }
     if (permission.isProtected) { throw createError(403, 'Cannot update protected permission'); }
    if (module) permission.module = module.toLowerCase();
    if (action) permission.action = action.toLowerCase();
    if (description !== undefined) permission.description = description;
    if (isProtected !== undefined && permission.isProtected !== isProtected) { permission.isProtected = isProtected === true || isProtected === 'true'; }
    await permission.save();
    const updatedPermission = {
        id: permission._id,
        _id: permission._id,
        module: permission.module,
        action: permission.action,
        description: permission.description,
        isProtected: permission.isProtected || false,
        createdAt: permission.createdAt
    };
    return {success: true, data:updatedPermission}
};
module.exports = {
    getAllPermissions,
    createPermission,
    deletePermission,
    updatePermission,
    checkPermissions,
};