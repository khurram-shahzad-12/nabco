const mongoose = require('mongoose');
const MODEL_NAME = 'Permission';
const COLLECTION_NAME = 'Permissions';

const permissionSchema = new mongoose.Schema({
    module: { type: String, required: true, },
    action: {
        type: String, required: true,
        enum: ['create', 'read', 'update', 'delete', 'export', 'import', 'approve', 'write', 'edit']
    },
    isProtected: {type: Boolean, default: false},
    description: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
}, {
    collection: COLLECTION_NAME,
    versionKey: false,
});
permissionSchema.index({ module: 1, action: 1 }, { unique: true });
const Permission = mongoose.model(MODEL_NAME, permissionSchema);
module.exports = Permission;