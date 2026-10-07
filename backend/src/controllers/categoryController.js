import { asyncHandler } from '../middleware/errors.js';
import Category from '../models/Category.js';
import { logAudit, getClientIp, auditFrom } from '../services/auditService.js';

export const listCategories = asyncHandler(async (req, res) => {
  const { includeInactive } = req.query;
  const filter = includeInactive === 'true' ? {} : { active: true };
  const categories = await Category.find(filter).sort({ sortOrder: 1 });
  res.json(categories);
});

export const getCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) return res.status(404).json({ error: 'Category not found' });
  res.json(category);
});

export const createCategory = asyncHandler(async (req, res) => {
  const category = await Category.create(req.body);
  await logAudit({ ...auditFrom(req), action: 'domain.created', entity: 'domain', entityId: category._id, metadata: { key: category.key, name: category.name } });
  res.status(201).json(category);
});

export const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!category) return res.status(404).json({ error: 'Category not found' });
  await logAudit({ ...auditFrom(req), action: 'domain.updated', entity: 'domain', entityId: category._id, metadata: { key: category.key, name: category.name } });
  res.json(category);
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) return res.status(404).json({ error: 'Category not found' });
  await logAudit({ ...auditFrom(req), action: 'domain.deleted', entity: 'domain', entityId: category._id, metadata: { key: category.key } });
  res.json({ ok: true });
});
