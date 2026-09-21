import mongoose from 'mongoose';

export const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN'];

export const PERMISSIONS = [
  'dashboard.view',
  'assessments.view',
  'sessions.view',
  'contacts.view',
  'questions.view',
  'questions.create',
  'questions.edit',
  'questions.delete',
  'questions.bulk_upload',
  'domains.view',
  'domains.manage',
  'results.manage',
  'stages.manage',
  'admins.view',
  'admins.create',
  'admins.manage',
  'audit.view',
];

export const ALL_PERMISSIONS = [...PERMISSIONS];

export const DEFAULT_ADMIN_PERMISSIONS = [
  'dashboard.view',
  'assessments.view',
  'sessions.view',
  'contacts.view',
  'questions.view',
  'questions.bulk_upload',
  'domains.view',
];

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ADMIN_ROLES, default: 'ADMIN' },
    active: { type: Boolean, default: true },
    permissions: { type: [String], default: [] },
    lastLoginAt: { type: Date, default: null },
    tokenVersion: { type: Number, default: 0 },
  },
  { timestamps: true }
);

adminSchema.methods.toSafeJSON = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    active: this.active,
    permissions: this.permissions,
    lastLoginAt: this.lastLoginAt,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export default mongoose.model('Admin', adminSchema);
