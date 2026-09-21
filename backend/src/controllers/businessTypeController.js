import { asyncHandler } from '../middleware/errors.js';
import BusinessType, { slugifyTypeKey } from '../models/BusinessType.js';
import Domain from '../models/Domain.js';
import { logAudit, auditFrom } from '../services/auditService.js';

// ─── Admin: main business types (hierarchy root) ──────────

export const listBusinessTypes = asyncHandler(async (req, res) => {
  const filter = req.query.includeInactive === 'true' ? {} : { active: true };
  const types = await BusinessType.find(filter).sort({ sortOrder: 1, name: 1 }).lean();
  // Include domain counts so Admin can see each type's domain tree at a glance.
  const counts = await Domain.aggregate([
    { $group: { _id: '$businessTypeId', n: { $sum: 1 } } },
  ]);
  const countByType = new Map(counts.map((c) => [String(c._id), c.n]));
  res.json(
    types.map((t) => ({ ...t, domainCount: countByType.get(String(t._id)) || 0 }))
  );
});

export const getBusinessType = asyncHandler(async (req, res) => {
  const bt = await BusinessType.findById(req.params.id);
  if (!bt) return res.status(404).json({ error: 'Business type not found' });
  const domains = await Domain.find({ businessTypeId: bt._id }).sort({ name: 1 });
  res.json({ ...bt.toObject(), domains });
});

export const createBusinessType = asyncHandler(async (req, res) => {
  const { name, key, description, sortOrder, active } = req.body || {};
  const trimmedName = typeof name === 'string' ? name.trim() : '';
  if (!trimmedName) return res.status(400).json({ error: 'Business type name is required' });

  const typeKey = slugifyTypeKey(key && String(key).trim() ? key : trimmedName);
  if (!typeKey) return res.status(400).json({ error: 'A valid key is required' });

  const existing = await BusinessType.findOne({ key: typeKey });
  if (existing) {
    return res.status(409).json({ error: `A business type with key "${typeKey}" already exists` });
  }

  const bt = await BusinessType.create({
    name: trimmedName,
    key: typeKey,
    description: typeof description === 'string' ? description.trim() : '',
    sortOrder: Number.isFinite(Number(sortOrder)) ? Number(sortOrder) : 0,
    active: active !== false,
  });

  await logAudit({
    ...auditFrom(req),
    action: 'business_type.created',
    entity: 'business_type',
    entityId: bt._id,
    metadata: { name: bt.name, key: bt.key },
  });

  res.status(201).json(bt);
});

export const updateBusinessType = asyncHandler(async (req, res) => {
  const bt = await BusinessType.findById(req.params.id);
  if (!bt) return res.status(404).json({ error: 'Business type not found' });

  const { name, description, sortOrder, active } = req.body || {};
  if (typeof name === 'string') {
    const trimmedName = name.trim();
    if (!trimmedName) return res.status(400).json({ error: 'Business type name cannot be empty' });
    bt.name = trimmedName;
  }
  if (typeof description === 'string') bt.description = description.trim();
  if (sortOrder !== undefined) bt.sortOrder = Number(sortOrder) || 0;
  if (active !== undefined) bt.active = active === true;
  // Key is immutable — it is referenced by existing sessions and questions.
  if (req.body?.key && slugifyTypeKey(req.body.key) !== bt.key) {
    return res.status(400).json({ error: 'Business type key cannot be changed' });
  }

  await bt.save();

  await logAudit({
    ...auditFrom(req),
    action: 'business_type.updated',
    entity: 'business_type',
    entityId: bt._id,
    metadata: { name: bt.name, key: bt.key, active: bt.active },
  });

  res.json(bt);
});

export const deleteBusinessType = asyncHandler(async (req, res) => {
  const bt = await BusinessType.findById(req.params.id);
  if (!bt) return res.status(404).json({ error: 'Business type not found' });

  const domainCount = await Domain.countDocuments({ businessTypeId: bt._id });
  if (domainCount > 0) {
    return res.status(409).json({
      error: `"${bt.name}" has ${domainCount} domain(s) assigned. Reassign or delete its domains first, or deactivate the business type instead.`,
      referenced: { domains: domainCount },
    });
  }

  await BusinessType.findByIdAndDelete(bt._id);
  await logAudit({
    ...auditFrom(req),
    action: 'business_type.deleted',
    entity: 'business_type',
    entityId: bt._id,
    metadata: { name: bt.name, key: bt.key },
  });
  res.json({ ok: true });
});
