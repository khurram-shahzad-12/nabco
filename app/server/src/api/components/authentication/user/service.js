const createError = require('http-errors');
const mongoose = require('mongoose');
const UserModel = require('./model');
const RoleModel = require('../roles/model');
const MessageModel = require("../../messages/model");
const jwt = require('jsonwebtoken');
const env = require("../../../../config.env");

const generateToken = async (user) => {
    const permissions = await user.getPermissionStrings();
    return jwt.sign(
        { 
            id: user._id, 
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role ? user.role.name : 'sales_rep',
            permissions: permissions
        },
        env.JWT_SECRET,{ expiresIn: '24h' }
    );
};
const verifyToken = (token) => {
  try {
    return jwt.verify(token, env.JWT_SECRET); } catch (error) { return null; }
};
const generateRefreshToken = (user) => {
    return jwt.sign(
        { id: user._id, email: user.email },env.JWT_REFRESH_SECRET,{ expiresIn: '30d' }
    );
};
const verifyRefreshToken = (token) => {
    try {
        return jwt.verify(token, env.JWT_REFRESH_SECRET);
    } catch (error) { return null; }
};
const register = async (userData) => {
    const { email, password, firstName, lastName, phone, position, role = 'admin' } = userData;
    if (!email || !password || !firstName || !lastName ||!role ||!position) { throw createError(400, 'Please provide all required fields'); }
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) { throw createError(400, 'User already exists'); }
    let roleDoc;
    if (mongoose.Types.ObjectId.isValid(role)) {
        roleDoc = await RoleModel.findById(role);
    } else { roleDoc = await RoleModel.findOne({ name: role }); }
    if (!roleDoc) { throw createError(400, `Invalid role: ${role}`); }
    const user = new UserModel({ email, password, firstName, lastName, phone, position, role: roleDoc._id });
    await user.save();
    const populatedUser = await UserModel.findById(user._id).populate('role', 'name displayName');
    return {
        success: true,
        user: {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: populatedUser.role ? populatedUser.role.name : 'sales_rep',
            roleDisplayName: populatedUser.role ? populatedUser.role.displayName : 'Sales Representative',
            phone: user.phone,
            position: user.position
        }
    };
};
const login = async (loginData) => {
    const { email, password } = loginData;
    if (!email || !password) { throw createError(400, 'Please provide email and password'); }
    const user = await UserModel.findOne({ email }).populate('role', 'name displayName');
    if (!user) { throw createError(401, 'Invalid credentials'); }
    if (!user.isActive) { throw createError(401, 'Account is deactivated'); }
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) { throw createError(401, 'Invalid credentials'); }
    user.lastLogin = new Date();
    await user.save();
    const token = await generateToken(user);
    const refreshToken = generateRefreshToken(user);
    user.refreshToken = refreshToken;
    await user.save();
    return {
        success:true,
        token,
        refreshToken,
        user: {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role ? user.role.name : 'sales_rep',
            roleDisplayName: user.role ? user.role.displayName : 'Sales Representative',
            phone: user.phone,
            position: user.position,
            user_name: user.user_name,
        }
    };
};
const refreshToken = async (refreshTokenData) => {
    const { refreshToken } = refreshTokenData;
    if (!refreshToken) { throw createError(401, 'Refresh token required'); }
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) { throw createError(401, 'Invalid refresh token'); }
    const user = await UserModel.findById(decoded.id).populate('role', 'name displayName');
    if (!user || user.refreshToken !== refreshToken) { throw createError(401, 'Invalid refresh token'); }
    const newToken = await generateToken(user);
    const newRefreshToken = generateRefreshToken(user);
    user.refreshToken = newRefreshToken;
    await user.save();
    return {
        success: true,
        token: newToken,
        refreshToken: newRefreshToken
    };
};
const logout = async (userId) => {
    const user = await UserModel.findById(userId);
    if (user) {
        user.refreshToken = null;
        await user.save(); }
    return { success: true, message: 'Logged out successfully' };
};
const mySelf = async (userId) => {
    const user = await UserModel.findById(userId).populate('role', 'name displayName').select('-password -refreshToken');
    if (!user) { throw createError(404, 'User not found'); }
    return {user,success:true};
};
const getAllUsers = async () => {
    const users = await UserModel.find().populate('role', 'name displayName').select('-password -refreshToken').sort({ createdAt: -1 });
    return {users, success:true};
};
const updateUser = async (userId, updateData) => {
    const { firstName, lastName, email, phone, position, role, isActive, password } = updateData;
    const user = await UserModel.findById(userId);
    if (!user) { throw createError(404, 'User not found'); }
    if (email && email !== user.email) {
        const existingUser = await UserModel.findOne({ email, _id: { $ne: userId } });
        if (existingUser) { throw createError(400, 'Email already in use'); }
        user.email = email;
    }
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;
    if (position) user.position = position;
    if (role) {
        const roleDoc = await RoleModel.findById(role);
        if (!roleDoc) { throw createError(400, 'Invalid role'); }
        user.role = roleDoc._id;
    }
    if (isActive !== undefined && isActive !== null) { user.isActive = isActive; }
    if (password && password.trim() !== '') { user.password = password; }
    await user.save();
    const updatedUser = await UserModel.findById(userId).populate('role', 'name displayName').select('-password -refreshToken');
    return {updatedUser, success:true};
};
const deleteUser = async (userId) => {
    const user = await UserModel.findById(userId).populate('role', 'name');
    if (!user) { throw createError(404, 'User not found'); }
    if(user.role && user.role.name === 'admin') {
        const adminRole = await RoleModel.findOne({name: 'admin'});
        if(!adminRole) {throw createError(400, 'Admin role not found')}
        const adminCount = await UserModel.countDocuments({role: adminRole._id, isActive: true});
        if(adminCount <= 1) {throw createError(400, 'Cannot delete the last active admin user');}
    }
    await MessageModel.deleteMany({$or:[{senderId: userId},{receiverId: userId}]});
    await user.deleteOne();
    return { success: true, message: 'User deleted successfully' };
};
const toggleUserStatus = async (userId, isActive) => { 
    const user = await UserModel.findById(userId).populate('role', 'name');
    if (!user) { throw createError(404, 'User not found'); }
    if(user.role && user.role.name === 'admin' && isActive === false) {
        const adminRole = await RoleModel.findOne({name: 'admin'});
        if(!adminRole) {throw createError(400, 'Admin role not found')}
        const adminCount = await UserModel.countDocuments({role: adminRole._id, isActive: true});
        if(adminCount <= 1) {throw createError(400, 'Cannot deactivate the last active admin user');}
    }
    user.isActive = isActive;
    user.updatedAt = Date.now();
    await user.save();
    const updatedUser = await UserModel.findById(userId).populate('role', 'name displayName').select('-password -refreshToken');
    return {
        success: true,
        user: updatedUser
    };
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
    verifyToken,
    toggleUserStatus,
};