import { Router } from 'express';
import { asyncHandler } from '../middleware/errors.js';
import { requireAdminAuth } from '../middleware/adminAuth.js';
import {
  submitVisitorRegistration,
  getVisitor,
  resolveQr,
  attendance,
} from '../controllers/visitorController.js';

// ─── Visitor registration + check-in routes ─────────────
// Mounted at "/visitors" (i.e. /api/v1/visitors/*).
const router = Router();

// Public — visitors register themselves at the venue.
router.post('/register', asyncHandler(submitVisitorRegistration));

// Staff-only — resolving a QR token or a visitor id exposes visitor details and
// marks attendance. Attendance is deliberately gated behind admin auth so the
// public registration endpoint can NEVER be used to mark check-ins.
router.get('/qr/:token', requireAdminAuth, asyncHandler(resolveQr));
router.post('/qr/:token/attendance', requireAdminAuth, asyncHandler(attendance));
router.get('/:visitorId', requireAdminAuth, asyncHandler(getVisitor));

export default router;