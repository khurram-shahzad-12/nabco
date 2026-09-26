const mongoose = require('mongoose');
const SERVICE_PERMISSION = require('../permissions/service');
const MODEL_NAME = 'Role';
const COLLECTION_NAME = 'Roles';

const validatePermissions = async (permissionIds) => {
    return await SERVICE_PERMISSION.checkPermissions(permissionIds);
};

const roleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true, lowercase: true },
  displayName: { type: String, required: true, trim: true, },
  description: { type: String, default: '' },
  permissions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Permission',
    validate:{validator: validatePermissions, message: 'One or more permissions are invalid or do not exist'}
   }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  collection: COLLECTION_NAME,
  versionKey: false,
  toJSON: {virtuals: true},
  toObject: {virtuals: true}
});
roleSchema.virtual('userCount', {
  ref: 'User', localField: '_id', foreignField: 'role', count: true
})
roleSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});
const Role = mongoose.model(MODEL_NAME, roleSchema);
module.exports = Role;