import bcrypt from 'bcryptjs';
import Admin, { ADMIN_ROLES, ALL_PERMISSIONS } from '../models/Admin.js';
import { asyncHandler } from '../middleware/errors.js';
import { normalizePermissions } from '../middleware/adminAuth.js';
import { logAudit, getClientIp } from '../services/auditService.js';

const BCRYPT_ROUNDS = parseInt(process.env.ADMIN_BCRYPT_ROUNDS || '12', 10);

export const listAdmins = asyncHandler(async (req, res) => {
  const admins = await Admin.find({}).sort({ createdAt: -1 });
  res.json({ admins: admins.map((a) => a.toSafeJSON()) });
});

export const getAdmin = asyncHandler(async (req, res) => {
  const admin = await Admin.findById(req.params.id);
  if (!admin) return res.status(404).json({ error: 'Admin not found' });
  res.json({ admin: admin.toSafeJSON() });
});

export const createAdmin = asyncHandler(async (req, res) => {
  const { name, email, password, role, active, permissions } = req.body || {};

  if (typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Name is required' });
  }
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return res.status(400).json({ error: 'A valid email is required' });
  }
  if (typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }
  const roleValue = role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ADMIN';
  if (roleValue === 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Cannot create SUPER_ADMIN accounts through this endpoint' });
  }

  const existing = await Admin.findOne({ email: normalizedEmail });
  if (existing) return res.status(409).json({ error: 'An admin with this email already exists' });

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const admin = await Admin.create({
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    role: 'ADMIN',
    active: active !== false,
    permissions: normalizePermissions(permissions),
  });

  await logAudit({
    adminId: req.admin.id,
    adminEmail: req.admin.email,
    action: 'admin.created',
    entity: 'admin',
    entityId: admin._id,
    metadata: { email: admin.email, role: admin.role, active: admin.active },
    ip: getClientIp(req),
  });

  res.status(201).json({ admin: admin.toSafeJSON() });
});

export const updateAdmin = asyncHandler(async (req, res) => {
  const target = await Admin.findById(req.params.id);
  if (!target) return res.status(404).json({ error: 'Admin not found' });
  if (target.role === 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Super Admin accounts cannot be edited through this endpoint' });
  }

  const { name, password } = req.body || {};
  if (typeof name === 'string') target.name = name.trim();
  if (typeof password === 'string') {
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
    target.passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    target.tokenVersion += 1;
  }
  await target.save();

  await logAudit({
    adminId: req.admin.id,
    adminEmail: req.admin.email,
    action: 'admin.updated',
    entity: 'admin',
    entityId: target._id,
    metadata: { email: target.email },
    ip: getClientIp(req),
  });

  res.json({ admin: target.toSafeJSON() });
});

export const setAdminStatus = asyncHandler(async (req, res) => {
  const target = await Admin.findById(req.params.id);
  if (!target) return res.status(404).json({ error: 'Admin not found' });

  const { active } = req.body || {};
  const nextActive = active === true;

  if (!nextActive && target.role === 'SUPER_ADMIN') {
    const activeSuperAdmins = await Admin.countDocuments({ role: 'SUPER_ADMIN', active: true });
    if (activeSuperAdmins <= 1) {
      return res.status(400).json({ error: 'Cannot deactivate the last active Super Admin' });
    }
  }
  if (target._id.toString() === req.admin.id && !nextActive) {
    return res.status(400).json({ error: 'You cannot deactivate your own account' });
  }

  target.active = nextActive;
  if (!nextActive) target.tokenVersion += 1;
  await target.save();

  await logAudit({
    adminId: req.admin.id,
    adminEmail: req.admin.email,
    action: nextActive ? 'admin.activated' : 'admin.deactivated',
    entity: 'admin',
    entityId: target._id,
    metadata: { email: target.email },
    ip: getClientIp(req),
  });

  res.json({ admin: target.toSafeJSON() });
});

export const setAdminPermissions = asyncHandler(async (req, res) => {
  const target = await Admin.findById(req.params.id);
  if (!target) return res.status(404).json({ error: 'Admin not found' });
  if (target.role === 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Super Admin permissions cannot be modified' });
  }

  const perms = normalizePermissions(req.body?.permissions);
  const removed = target.permissions.filter((p) => !perms.includes(p));
  target.permissions = perms;
  await target.save();

  await logAudit({
    adminId: req.admin.id,
    adminEmail: req.admin.email,
    action: 'admin.permissions_changed',
    entity: 'admin',
    entityId: target._id,
    metadata: { email: target.email, removed },
    ip: getClientIp(req),
  });

  res.json({ admin: target.toSafeJSON() });
});

export const deleteAdmin = asyncHandler(async (req, res) => {
  const target = await Admin.findById(req.params.id);
  if (!target) return res.status(404).json({ error: 'Admin not found' });
  if (target.role === 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Super Admin accounts cannot be deleted' });
  }

  await Admin.findByIdAndDelete(target._id);

  await logAudit({
    adminId: req.admin.id,
    adminEmail: req.admin.email,
    action: 'admin.deleted',
    entity: 'admin',
    entityId: target._id,
    metadata: { email: target.email },
    ip: getClientIp(req),
  });

  res.json({ ok: true });
});

export { ADMIN_ROLES, ALL_PERMISSIONS };
