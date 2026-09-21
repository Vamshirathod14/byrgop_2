import KYCategory from '../models/KYCategory.js';
import KnowYourselfQuestion from '../models/KnowYourselfQuestion.js';
import { asyncHandler } from '../middleware/errors.js';
import { logAudit, auditFrom } from '../services/auditService.js';

function slugifyKey(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const listKYCategories = asyncHandler(async (req, res) => {
  const filter = req.query.includeInactive === 'true' ? {} : { active: true };
  const categories = await KYCategory.find(filter).sort({ sortOrder: 1, name: 1 });
  res.json(categories);
});

export const createKYCategory = asyncHandler(async (req, res) => {
  const { name, description, color, sortOrder, active } = req.body || {};
  const trimmedName = typeof name === 'string' ? name.trim() : '';
  if (!trimmedName) return res.status(400).json({ error: 'Category name is required' });

  const key = slugifyKey(req.body?.key || trimmedName);
  if (!key) return res.status(400).json({ error: 'A valid category key is required' });

  const existing = await KYCategory.findOne({ key });
  if (existing) {
    return res.status(409).json({ error: `A category with key "${key}" already exists` });
  }

  const category = await KYCategory.create({
    key,
    name: trimmedName,
    description: typeof description === 'string' ? description.trim() : '',
    color: typeof color === 'string' && color.trim() ? color.trim() : '#0A78CF',
    sortOrder: Number.isInteger(sortOrder) ? sortOrder : 0,
    active: active !== false,
  });

  await logAudit({
    ...auditFrom(req),
    action: 'ky_category.created',
    entity: 'ky_category',
    entityId: category._id,
    metadata: { key: category.key, name: category.name },
  });
  res.status(201).json(category);
});

export const updateKYCategory = asyncHandler(async (req, res) => {
  const category = await KYCategory.findById(req.params.id);
  if (!category) return res.status(404).json({ error: 'Category not found' });

  const { name, description, color, sortOrder, active } = req.body || {};
  if (typeof name === 'string') {
    const trimmed = name.trim();
    if (!trimmed) return res.status(400).json({ error: 'Category name cannot be empty' });
    category.name = trimmed;
  }
  if (typeof description === 'string') category.description = description.trim();
  if (typeof color === 'string' && color.trim()) category.color = color.trim();
  if (sortOrder !== undefined && Number.isInteger(sortOrder)) category.sortOrder = sortOrder;
  if (active !== undefined) category.active = active === true;

  await category.save();
  await logAudit({
    ...auditFrom(req),
    action: 'ky_category.updated',
    entity: 'ky_category',
    entityId: category._id,
    metadata: { key: category.key, name: category.name, active: category.active },
  });
  res.json(category);
});

export const reorderKYCategories = asyncHandler(async (req, res) => {
  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  if (items.length === 0) return res.status(400).json({ error: 'items[] is required' });

  for (const [index, item] of items.entries()) {
    if (!item?.id) continue;
    await KYCategory.updateOne({ _id: item.id }, { sortOrder: item.sortOrder ?? index });
  }
  const categories = await KYCategory.find({}).sort({ sortOrder: 1, name: 1 });
  await logAudit({
    ...auditFrom(req),
    action: 'ky_category.reordered',
    entity: 'ky_category',
    metadata: { count: items.length },
  });
  res.json(categories);
});

export const deleteKYCategory = asyncHandler(async (req, res) => {
  const category = await KYCategory.findById(req.params.id);
  if (!category) return res.status(404).json({ error: 'Category not found' });

  const questionCount = await KnowYourselfQuestion.countDocuments({ category: category.key });
  if (questionCount > 0) {
    return res.status(409).json({
      error: `Category "${category.name}" is assigned to ${questionCount} question(s). Reassign those questions before deleting.`,
      referenced: { questions: questionCount },
    });
  }

  await KYCategory.findByIdAndDelete(category._id);
  await logAudit({
    ...auditFrom(req),
    action: 'ky_category.deleted',
    entity: 'ky_category',
    entityId: category._id,
    metadata: { key: category.key, name: category.name },
  });
  res.json({ ok: true });
});
