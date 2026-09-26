const { verifyToken } = require('../api/components/authentication/user/service');
const User = require('../api/components/authentication/user/model');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
    const user = await User.findById(decoded.id).populate({path:'role', populate: {path: 'permissions'}}).select('-password -refreshToken');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found'
      });
    }
    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account is deactivated'
      });
    }
    const allPermissions = await user.getPermissionStrings();
    req.user = {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      permissions: allPermissions,
    };
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ success: false, message: 'Authentication failed' });
  }
};

module.exports = {authenticate};