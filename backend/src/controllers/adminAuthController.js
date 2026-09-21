import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import Admin from '../models/Admin.js';
import { signToken } from '../middleware/adminAuth.js';
import { asyncHandler } from '../middleware/errors.js';
import { logAudit, getClientIp } from '../services/auditService.js';

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again later.' },
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};
  const normalized = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const ip = getClientIp(req);

  // Safe, uniform failure regardless of whether the account exists.
  const fail = async () => {
    await logAudit({
      adminEmail: normalized || 'unknown',
      action: 'auth.login_failed',
      entity: 'admin',
      metadata: { reason: 'invalid_credentials' },
      ip,
    });
    return res.status(401).json({ error: 'Invalid email or password' });
  };

  if (!normalized || typeof password !== 'string' || !password) return fail();

  const admin = await Admin.findOne({ email: normalized });
  if (!admin) return fail();

  const ok = await bcrypt.compare(password, admin.passwordHash);
  if (!ok) return fail();

  if (!admin.active) {
    await logAudit({ adminId: admin._id, adminEmail: admin.email, action: 'auth.login_denied', entity: 'admin', metadata: { reason: 'inactive' }, ip });
    return res.status(403).json({ error: 'Account is disabled' });
  }

  admin.lastLoginAt = new Date();
  await admin.save();

  await logAudit({ adminId: admin._id, adminEmail: admin.email, action: 'auth.login', entity: 'admin', entityId: admin._id, ip });

  const token = signToken(admin);
  res.json({ token, admin: admin.toSafeJSON() });
});

export const logout = asyncHandler(async (req, res) => {
  const admin = await Admin.findById(req.admin.id);
  if (admin) {
    admin.tokenVersion += 1;
    await admin.save();
    await logAudit({ adminId: admin._id, adminEmail: admin.email, action: 'auth.logout', entity: 'admin', entityId: admin._id, ip: getClientIp(req) });
  }
  res.json({ ok: true });
});

export const me = asyncHandler(async (req, res) => {
  const admin = await Admin.findById(req.admin.id);
  if (!admin || !admin.active) return res.status(401).json({ error: 'Account not found' });
  res.json({ admin: admin.toSafeJSON() });
});
