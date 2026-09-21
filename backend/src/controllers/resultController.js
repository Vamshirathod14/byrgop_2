import { asyncHandler } from '../middleware/errors.js';
import ResultContent from '../models/ResultContent.js';
import { logAudit, getClientIp, auditFrom } from '../services/auditService.js';

export const listResults = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.category) filter.category = req.query.category;
  if (req.query.includeInactive !== 'true') filter.active = true;
  const results = await ResultContent.find(filter)
    .populate('category', 'key name color')
    .sort({ category: 1, minScore: 1 });
  res.json(results);
});

export const createResult = asyncHandler(async (req, res) => {
  const r = await ResultContent.create(req.body);
  await logAudit({ ...auditFrom(req), action: 'result.created', entity: 'result', entityId: r._id, metadata: { title: r.title, category: req.body.category } });
  res.status(201).json(r);
});

export const updateResult = asyncHandler(async (req, res) => {
  const r = await ResultContent.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!r) return res.status(404).json({ error: 'Result content not found' });
  await logAudit({ ...auditFrom(req), action: 'result.updated', entity: 'result', entityId: r._id, metadata: { title: r.title } });
  res.json(r);
});

export const deleteResult = asyncHandler(async (req, res) => {
  const r = await ResultContent.findByIdAndDelete(req.params.id);
  if (!r) return res.status(404).json({ error: 'Result content not found' });
  await logAudit({ ...auditFrom(req), action: 'result.deleted', entity: 'result', entityId: r._id, metadata: { title: r.title } });
  res.json({ ok: true });
});
