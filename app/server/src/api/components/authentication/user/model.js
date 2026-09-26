const mongoose = require('mongoose');
const bcrypt = require("bcryptjs");
const MODEL_NAME = 'User';
const COLLECTION_NAME = 'Users';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  phone: { type: String, trim: true },
  position: { type: String, trim: true },
  role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true },
  refreshToken: { type: String },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  online: { type: Boolean, default: false },
  lastSeen: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
}, {
  collection: COLLECTION_NAME,
  versionKey: false,
});

userSchema.pre('save', async function(next) {
  this.updatedAt = Date.now();
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) { next(error); }
});
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
}
userSchema.methods.getAllPermissions = async function () {
    if (!this.role) { return []; }
    const role = await mongoose.model('Role').findById(this.role).populate('permissions');
    return role?.permissions || [];
};
userSchema.methods.getPermissionStrings = async function() {
  const permissions = await this.getAllPermissions();
  return permissions.map(p => `${p.action}:${p.module}`);
};
userSchema.methods.hasPermission = async function(module, action) {
  const permissions = await this.getAllPermissions();
  return permissions.some(p => p.module === module && p.action === action);
};
userSchema.methods.hasAnyPermissionStrings = async function(arrayOfPermissionStrings) {  
  const permissions = await this.getAllPermissions();
  return arrayOfPermissionStrings.some(permStr => {
    const [action, module] = permStr.split(':');
    return permissions.some(p => p.module === module && p.action === action);
  });
};
userSchema.methods.hasAllPermissionStrings = async function(arrayOfPermissionStrings) {
  const permissions = await this.getAllPermissions();
  return arrayOfPermissionStrings.every(permStr => {
    const [action, module] = permStr.split(':');
    return permissions.some(p => p.module === module && p.action === action);
  });
};
userSchema.methods.getDisplayName = function() {
  const name = [this.firstName, this.lastName].filter(Boolean).join(' ');
  return name || this.email || 'UNKNOWN USER';
};
userSchema.virtual('user_name').get(function() {
  return this.getDisplayName();
});
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

const User = mongoose.model(MODEL_NAME, userSchema);
module.exports = User;