const SERVICE_USER = require('./service');

const register = async (req, res, next) => {
    try { res.status(201).json(await SERVICE_USER.register(req.body)); } catch (e) { next(e); }
};
const login = async (req, res, next) => {
    try { res.status(200).json(await SERVICE_USER.login(req.body)); } catch (e) { next(e); }
};
const refreshToken = async (req, res, next) => {
    try { res.status(200).json(await SERVICE_USER.refreshToken(req.body)); } catch (e) { next(e); }
};
const mySelf = async (req, res, next) => {
    try { res.status(200).json(await SERVICE_USER.mySelf(req.user.id)); } catch (e) { next(e); }
};
const logout = async (req, res, next) => {
    try { res.status(200).json(await SERVICE_USER.logout(req.user.id)); } catch (e) { next(e); }
};
const getAllUsers = async (req, res, next) => {
    try { res.status(200).json(await SERVICE_USER.getAllUsers()) } catch (e) { next(e); }
};
const updateUser = async (req, res, next) => {
    try { res.status(200).json(await SERVICE_USER.updateUser(req.params.id, req.body)) } catch (e) { next(e); }
};
const deleteUser = async (req, res, next) => {
    try { res.status(200).json(await SERVICE_USER.deleteUser(req.params.id)); } catch (e) { next(e); }
};
const toggleUserStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;
        if (isActive === undefined || typeof isActive !== 'boolean') {
            return res.status(400).json({ success: false, message: 'isActive field is required and must be a boolean' });
        }
        res.status(200).json(await SERVICE_USER.toggleUserStatus(id, isActive));
    } catch (e) {next(e) }
};

module.exports = {
    register,
    login,
    refreshToken,
    logout,
    mySelf,
    getAllUsers,
    updateUser,
    deleteUser,
    toggleUserStatus,
};