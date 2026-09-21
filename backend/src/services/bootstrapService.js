import bcrypt from 'bcryptjs';
import Admin, { ALL_PERMISSIONS } from '../models/Admin.js';
import { logAudit } from './auditService.js';

export async function bootstrapSuperAdminIfConfigured() {
  const email = (process.env.SUPER_ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.SUPER_ADMIN_PASSWORD || '';

  if (!email || !password) return;

  const existing = await Admin.findOne({ role: 'SUPER_ADMIN' });
  if (existing) {
    // Do not overwrite an already-configured Super Admin during normal startup.
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const admin = await Admin.create({
    name: 'Super Admin',
    email,
    passwordHash,
    role: 'SUPER_ADMIN',
    active: true,
    permissions: [...ALL_PERMISSIONS],
  });

  await logAudit({
    adminId: admin._id,
    adminEmail: admin.email,
    action: 'admin.bootstrap_super_admin',
    entity: 'admin',
    entityId: admin._id,
  });

  console.log(`[bootstrap] SUPER_ADMIN created during startup: ${admin.email}`);
}