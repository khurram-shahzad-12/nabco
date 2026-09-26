const SERVICE_ROLES = require('./service');

const getAllRoles = async (req, res, next) => {
    try { res.status(200).json(await SERVICE_ROLES.getAllRoles()); } catch (e) { next(e); }
};
const createRole = async (req, res, next) => {
    try {
        const { name, displayName, description, permissions } = req.body;
        if (!name || !displayName) {
            return res.status(400).json({ success: false, message: 'Name and displayName are required' });
        }
        res.status(201).json(await SERVICE_ROLES.createRole({ name, displayName, description, permissions }));
    } catch (e) { next(e); }
};
const updateRole = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { displayName, description, permissions } = req.body;        
        res.status(200).json(await SERVICE_ROLES.updateRole(id, { displayName, description, permissions }));
    } catch (e) { next(e); }
};
const deleteRole = async (req, res, next) => {
    try {
        const { id } = req.params;
        res.status(200).json(await SERVICE_ROLES.deleteRole(id));
    } catch (e) { next(e); }
};
const getRolePermissions = async (req, res, next) => {
    try {
        const { id } = req.params;       
        res.status(200).json(await SERVICE_ROLES.getRolePermissions(id));
    } catch (e) { next(e); }
};
const assignPermissionsToRole = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { permissions } = req.body;
        if (!permissions || !Array.isArray(permissions)) {
            return res.status(400).json({ success: false, message: 'Permissions must be an array' });
        }        
        res.status(200).json(await SERVICE_ROLES.assignPermissionsToRole(id, permissions));
    } catch (e) { next(e); }
};
module.exports = {
    getAllRoles,
    createRole,
    updateRole,
    deleteRole,
    getRolePermissions,
    assignPermissionsToRole
};