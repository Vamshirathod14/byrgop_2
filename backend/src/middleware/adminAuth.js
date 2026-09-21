import jwt from 'jsonwebtoken';
import Admin, { ALL_PERMISSIONS } from '../models/Admin.js';

const JWT_SECRET = process.env.ADMIN_JWT_SECRET;
const JWT_EXPIRES_IN = process.env.ADMIN_JWT_EXPIRES || '8h';

export function signToken(admin) {
  return jwt.sign(
    {
      sub: admin._id.toString(),
      role: admin.role,
      tv: admin.tokenVersion,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export async function requireAdminAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }
    const admin = await Admin.findById(payload.sub);
    if (!admin || !admin.active) {
      return res.status(401).json({ error: 'Account is disabled or no longer exists' });
    }
    if (admin.tokenVersion !== payload.tv) {
      return res.status(401).json({ error: 'Session has been invalidated' });
    }
    req.admin = { id: admin._id, name: admin.name, email: admin.email, role: admin.role, permissions: admin.permissions || [] };
    next();
  } catch (err) {
    next(err);
  }
}

export function requirePermission(...perms) {
  return (req, res, next) => {
    if (!req.admin) return res.status(401).json({ error: 'Authentication required' });
    if (req.admin.role === 'SUPER_ADMIN') return next();
    const hasAll = perms.length === 0;
    const ok = hasAll || perms.some((p) => req.admin.permissions.includes(p));
    if (!ok) return res.status(403).json({ error: 'Forbidden: missing permission' });
    next();
  };
}

export function isSuperAdmin(req, res, next) {
  if (!req.admin) return res.status(401).json({ error: 'Authentication required' });
  if (req.admin.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Forbidden: requires SUPER_ADMIN' });
  }
  next();
}

export function normalizePermissions(input) {
  if (!Array.isArray(input)) return [];
  const set = new Set(ALL_PERMISSIONS);
  return [...new Set(input.filter((p) => typeof p === 'string' && set.has(p)))];
}
