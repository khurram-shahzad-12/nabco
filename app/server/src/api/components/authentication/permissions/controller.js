const permissionService = require('./service');

const getAllPermissions = async (req, res, next) => {
    try { res.status(200).json(await permissionService.getAllPermissions()); } catch (e) {next(e); }
};
const createPermission = async (req, res, next) => {
    try { res.status(201).json(await permissionService.createPermission(req.body)); } catch (e) {next(e); }
};
const updatePermission = async (req, res, next) => {
    try {
        res.status(200).json(await permissionService.updatePermission(req.params.id, req.body));
    } catch (e) {next(e); }
};
const deletePermission = async (req, res, next) => {
    try {
        res.status(200).json(await permissionService.deletePermission(req.params.id));
    } catch (e) {next(e); }
};

module.exports = {
    getAllPermissions,
    createPermission,
    updatePermission,
    deletePermission
};