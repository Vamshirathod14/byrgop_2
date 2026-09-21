import AuditLog from '../models/AuditLog.js';

export async function logAudit({ adminId = null, adminEmail = null, action, entity = null, entityId = null, metadata = null, ip = null }) {
  try {
    await AuditLog.create({
      adminId,
      adminEmail,
      action,
      entity,
      entityId,
      metadata,
      ip,
      timestamp: new Date(),
    });
  } catch (err) {
    console.error('[audit] failed to log:', err.message);
  }
}

export function getClientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (fwd) return String(fwd).split(',')[0].trim();
  return req.ip || req.socket?.remoteAddress || null;
}

export function auditFrom(req) {
  return {
    adminId: req.admin?.id || null,
    adminEmail: req.admin?.email || null,
    ip: getClientIp(req),
  };
}
