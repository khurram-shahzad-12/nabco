const User = require('../api/components/authentication/user/model');

const checkPermission = (permissionString) => {
    return async (req, res, next) => {
        try {
            const userId = req.user?.id;
            if (!userId) { return res.status(401).json({ success: false, message: 'User not authenticated' }); }
            const user = await User.findById(userId).populate({ path: 'role', populate: { path: 'permissions' } });
            if (!user) { return res.status(401).json({ success: false, message: 'User not found' }); }
            const [action, module] = permissionString.split(':');
            const hasPermission = await user.hasPermission(module, action);
            if (!hasPermission) {
                return res.status(403).json({ success: false, message: `You do not have permission to ${action} ${module}`, });
            }
            next();
        } catch (error) {
            console.error('Permission check error:', error);
            res.status(500).json({ success: false, message: 'Permission check failed' });
        }
    };
};

const checkAnyPermission = (arrayOfPermissionStrings) => {
    return async (req, res, next) => {
        try {
            const userId = req.user?.id;
            if (!userId) { return res.status(401).json({ success: false, message: 'User not authenticated' }); }
            const user = await User.findById(userId).populate({ path: 'role', populate: { path: 'permissions' } });
            if (!user) { return res.status(401).json({ success: false, message: 'User not found' }); }
            const hasAny = await user.hasAnyPermissionStrings(arrayOfPermissionStrings);
            if (!hasAny) { return res.status(403).json({ success: false, message: `You do not have permission to perform any of these actions`, }); }
            next();
        } catch (error) {
            console.error('Permission check error:', error);
            res.status(500).json({ success: false, message: 'Permission check failed' });
        }
    };
};

const checkAllPermissions = (arrayOfPermissionStrings) => {
    return async (req, res, next) => {
        try {
            const userId = req.user?.id;
            if (!userId) { return res.status(401).json({ success: false, message: 'User not authenticated' }); }
            const user = await User.findById(userId).populate({ path: 'role', populate: { path: 'permissions' } });
            if (!user) { return res.status(401).json({ success: false, message: 'User not found' }); }
            const hasAll = await user.hasAllPermissionStrings(arrayOfPermissionStrings);
            if (!hasAll) { return res.status(403).json({ success: false, message: `You need all of these permissions`, }); }
            next();
        } catch (error) {
            console.error('Permission check error:', error);
            res.status(500).json({ success: false, message: 'Permission check failed' });
        }
    };
};

const createPermissionCheck = (permissionString) => {
    return (req, res, next) => checkPermission(permissionString)(req, res, next);
};
const createAnyPermissionCheck = (arrayOfPermissionStrings) => {
    return (req, res, next) => checkAnyPermission(arrayOfPermissionStrings)(req, res, next);
};
const createAllPermissionCheck = (arrayOfPermissionStrings) => {
    return (req, res, next) => checkAllPermissions(arrayOfPermissionStrings)(req, res, next);
};

module.exports = {
    checkPermission,
    checkAnyPermission,
    checkAllPermissions,
    createPermissionCheck,
    createAnyPermissionCheck,
    createAllPermissionCheck
};