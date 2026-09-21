import KnowYourselfQuestion from '../models/KnowYourselfQuestion.js';
import Domain from '../models/Domain.js';
import KYCategory from '../models/KYCategory.js';
import { isAnswerColour } from '../config/optionColors.js';
import { logAudit, auditFrom } from '../services/auditService.js';

const BUSINESS_TYPE_KEYS = ['service', 'product', 'ngo'];

// Validates a single option's colour. Returns null when the colour is absent
// (the render defaults apply), { error } when present but not a valid hex.
function sanitizeOptionColor(value) {
  if (value === undefined || value === null || value === '') return null;
  if (!isAnswerColour(String(value))) {
    return {
      error: `Invalid option colour "${value}" — use a valid hex colour such as #0A78CF.`,
    };
  }
  return null;
}

// Returns:
//   undefined — glossary not provided in the payload (leave untouched)
//   null      — glossary provided but invalid
//   array     — sanitized [{ abbreviation, fullForm }]
// Rejects duplicate abbreviations (case-insensitive) within a single question.
function sanitizeGlossary(raw) {
  if (raw === undefined) return undefined;
  if (!Array.isArray(raw)) return null;
  const seen = new Set();
  const out = [];
  for (const item of raw) {
    const abbreviation = typeof item?.abbreviation === 'string' ? item.abbreviation.trim() : '';
    if (!abbreviation) return null;
    const fullForm = typeof item?.fullForm === 'string' ? item.fullForm.trim() : '';
    if (!fullForm) return null;
    const key = abbreviation.toLowerCase();
    if (seen.has(key)) return null;
    seen.add(key);
    out.push({ abbreviation, fullForm });
  }
  return out;
}

async function resolveCategoryKey(raw) {
  const value = typeof raw === 'string' ? raw.trim() : '';
  if (!value) return null;
  const cat = await KYCategory.findOne({
    $or: [{ key: value.toLowerCase() }, { name: new RegExp(`^${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }],
  });
  return cat ? cat.key : undefined; // undefined = invalid, null = explicitly none
}

export const listKYDomains = async (_req, res, next) => {
  try {
    const domains = await Domain.find({ active: true }).sort({ name: 1 });
    res.json(domains.map((d) => ({ id: d._id, slug: d.slug, name: d.name, active: d.active })));
  } catch (err) { next(err); }
};

async function resolveDomainSlug(raw) {
  const slug = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  if (!slug) return null;
  const domain = await Domain.findOne({ slug });
  return domain ? domain.slug : null;
}

export const listKYQuestions = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.includeInactive !== 'true') filter.active = true;
    if (req.query.type) filter.type = req.query.type;
    if (req.query.domain) filter.domain = req.query.domain;
    const questions = await KnowYourselfQuestion.find(filter).sort({ createdAt: -1 });
    res.json(questions);
  } catch (err) { next(err); }
};

export const getKYQuestion = async (req, res, next) => {
  try {
    const q = await KnowYourselfQuestion.findById(req.params.id);
    if (!q) return res.status(404).json({ error: 'Question not found' });
    res.json(q);
  } catch (err) { next(err); }
};

export const createKYQuestion = async (req, res, next) => {
  try {
    const { text, options, active, type, domain, category, businessType } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ error: 'Question text is required' });
    if (!options || options.length !== 4) return res.status(400).json({ error: 'Exactly 4 options are required' });
    for (const o of options) {
      if (!o.text || !o.text.trim()) return res.status(400).json({ error: 'Each option must have text' });
      const s = Number(o.score);
      if (!Number.isInteger(s) || s < 1 || s > 4) return res.status(400).json({ error: 'Each option score must be 1, 2, 3, or 4' });
      const colour = sanitizeOptionColor(o.color);
      if (colour?.error) return res.status(400).json({ error: colour.error });
    }
    const glossary = sanitizeGlossary(req.body.glossary);
    if (glossary === null) {
      return res.status(400).json({
        error: 'Glossary must be an array of { abbreviation, fullForm } with unique abbreviations per question',
      });
    }
    const qType = type === 'domain' ? 'domain' : 'generic';
    const qDomain = qType === 'domain' ? await resolveDomainSlug(domain) : null;
    if (qType === 'domain' && !qDomain) {
      return res.status(400).json({ error: 'Invalid domain. Select a domain from the list.' });
    }
    const categoryKey = await resolveCategoryKey(category);
    if (categoryKey === undefined) {
      return res.status(400).json({ error: 'Invalid category. Select a result category from the list.' });
    }
    let qBusinessType = businessType || null;
    if (qBusinessType && !BUSINESS_TYPE_KEYS.includes(qBusinessType)) {
      return res.status(400).json({ error: 'Invalid business type' });
    }
    const q = await KnowYourselfQuestion.create({
      text: text.trim(),
      options,
      active: active !== false,
      type: qType,
      domain: qDomain,
      category: categoryKey,
      businessType: qBusinessType,
      glossary,
    });
    await logAudit({ ...auditFrom(req), action: 'ky_question.created', entity: 'ky_question', entityId: q._id, metadata: { text: q.text, type: qType, domain: qDomain, category: categoryKey } });
    res.status(201).json(q);
  } catch (err) { next(err); }
};

export const updateKYQuestion = async (req, res, next) => {
  try {
    const q = await KnowYourselfQuestion.findById(req.params.id);
    if (!q) return res.status(404).json({ error: 'Question not found' });
    const { text, options, active, type, domain, category, businessType } = req.body;
    if (text !== undefined) q.text = text.trim();
    if (active !== undefined) q.active = active;
    if (type !== undefined) q.type = type === 'domain' ? 'domain' : 'generic';
    if (q.type === 'domain' && domain !== undefined) {
      const valid = await resolveDomainSlug(domain);
      if (!valid) return res.status(400).json({ error: 'Invalid domain. Select a domain from the list.' });
      q.domain = valid;
    } else if (q.type === 'generic') {
      q.domain = null;
    }
    if (category !== undefined) {
      const categoryKey = await resolveCategoryKey(category);
      if (categoryKey === undefined) {
        return res.status(400).json({ error: 'Invalid category. Select a result category from the list.' });
      }
      q.category = categoryKey;
    }
    if (businessType !== undefined) {
      if (businessType && !BUSINESS_TYPE_KEYS.includes(businessType)) {
        return res.status(400).json({ error: 'Invalid business type' });
      }
      q.businessType = businessType || null;
    }
    if (options !== undefined) {
      if (options.length !== 4) return res.status(400).json({ error: 'Exactly 4 options are required' });
      for (const o of options) {
        if (!o.text || !o.text.trim()) return res.status(400).json({ error: 'Each option must have text' });
        const s = Number(o.score);
        if (!Number.isInteger(s) || s < 1 || s > 4) return res.status(400).json({ error: 'Each option score must be 1, 2, 3, or 4' });
        const colour = sanitizeOptionColor(o.color);
        if (colour?.error) return res.status(400).json({ error: colour.error });
      }
      q.options = options;
    }
    if (req.body.glossary !== undefined) {
      const glossary = sanitizeGlossary(req.body.glossary);
      if (glossary === null) {
        return res.status(400).json({
          error: 'Glossary must be an array of { abbreviation, fullForm } with unique abbreviations per question',
        });
      }
      q.glossary = glossary;
    }
    await q.save();
    await logAudit({ ...auditFrom(req), action: 'ky_question.updated', entity: 'ky_question', entityId: q._id, metadata: { text: q.text, type: q.type, domain: q.domain } });
    res.json(q);
  } catch (err) { next(err); }
};

export const deleteKYQuestion = async (req, res, next) => {
  try {
    const q = await KnowYourselfQuestion.findByIdAndDelete(req.params.id);
    if (!q) return res.status(404).json({ error: 'Question not found' });
    await logAudit({ ...auditFrom(req), action: 'ky_question.deleted', entity: 'ky_question', entityId: q._id, metadata: { text: q.text } });
    res.json({ ok: true });
  } catch (err) { next(err); }
};