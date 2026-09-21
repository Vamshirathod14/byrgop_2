import { asyncHandler } from '../middleware/errors.js';
import AuditLog from '../models/AuditLog.js';

export const listActivity = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
  const filter = {};
  if (req.query.action) filter.action = req.query.action;
  if (req.query.entity) filter.entity = req.query.entity;
  const logs = await AuditLog.find(filter).sort({ timestamp: -1 }).limit(limit);
  res.json({ logs });
});