import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { connectDB } from '../src/config/db.js';
import Admin from '../src/models/Admin.js';
import { ALL_PERMISSIONS } from '../src/models/Admin.js';
import { logAudit } from '../src/services/auditService.js';

/**
 * Bootstrap the initial SUPER_ADMIN from environment variables:
 *
 *   SUPER_ADMIN_EMAIL=admin@byrgop.com
 *   SUPER_ADMIN_PASSWORD=a-strong-password
 *
 * Safe to run multiple times: it will not overwrite an existing Super Admin
 * unless SUPER_ADMIN_FORCE=1 and the email matches.
 */
async function bootstrap() {
  await connectDB();

  const email = (process.env.SUPER_ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.SUPER_ADMIN_PASSWORD || '';

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error('[bootstrap] SUPER_ADMIN_EMAIL must be a valid email address.');
    process.exit(1);
  }
  if (!password || password.length < 10) {
    console.error('[bootstrap] SUPER_ADMIN_PASSWORD must be set and at least 10 characters.');
    process.exit(1);
  }

  const existing = await Admin.findOne({ email });
  if (existing) {
    if (process.env.SUPER_ADMIN_FORCE !== '1') {
      console.log('[bootstrap] Super Admin already exists. Nothing to do.');
      process.exit(0);
    }
    existing.passwordHash = await bcrypt.hash(password, 12);
    existing.active = true;
    existing.role = 'SUPER_ADMIN';
    existing.permissions = [...ALL_PERMISSIONS];
    await existing.save();
    console.log('[bootstrap] Super Admin credentials refreshed (FORCE).');
    process.exit(0);
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

  console.log(`[bootstrap] SUPER_ADMIN created: ${admin.email}`);
  process.exit(0);
}

bootstrap()
  .catch((e) => {
    console.error('[bootstrap] failed', e.message);
    process.exit(1);
  });