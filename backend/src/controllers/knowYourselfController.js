import KnowYourselfQuestion from '../models/KnowYourselfQuestion.js';
import Domain from '../models/Domain.js';
import KYCategory from '../models/KYCategory.js';
import { isAnswerColour } from '../config/optionColors.js';
import { logAudit, auditFrom } from '../services/auditService.js';
import { activeBusinessTypeKeys } from '../services/knowYourselfService.js';
import {
  KY_ROOT_IDS,
  DEFAULT_KY_ROOT,
  rootRequiresDomainSelection,
  resolveKyRoot,
  businessTypesForRoot,
} from '../config/kyQuestionRoots.js';

// The shared Manufacturing & Services pillar set is stored with a null kyRoot.
const DEFAULT_KY_CATEGORY_ROOT = DEFAULT_KY_ROOT;

/**
 * The KY root a question document belongs to.
 *
 * Mirrors the KYCategory convention: a question with no `businessType` is part
 * of the SHARED pool, so its root is `null`, not a guess at a default. A
 * question that names a business type inherits that type's root.
 */
function rootForQuestion(businessTypeKey) {
  return businessTypeKey ? resolveKyRoot(businessTypeKey) : null;
}

// Business-type keys are NOT hardcoded. They are admin-managed rows in the
// BusinessType collection (Services, Manufacturing, Start-Up, Non-Profit and
// anything added later), so validity is checked against that collection. This
// is what lets a newly configured Start-Up type be used without a code change.
async function assertKnownBusinessType(key) {
  if (!key) return null; // null = applies to every business type
  const keys = await activeBusinessTypeKeys();
  const normalized = String(key).toLowerCase().trim();
  if (!keys.includes(normalized)) {
    return { error: `Invalid business type "${key}". Select a business type from the list.` };
  }
  return normalized;
}

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

/**
 * Resolve a pillar/category key for a question.
 *
 * A question is scoped to a KY root (derived from its business type), and it
 * may only be assigned a pillar from that root. Without this, a Start-Up
 * question could be tagged with a Services pillar and then be dropped at
 * scoring time because the Start-Up result has no such pillar.
 *
 *   undefined = invalid, null = explicitly none
 */
async function resolveCategoryKey(raw, businessTypeKey) {
  const value = typeof raw === 'string' ? raw.trim() : '';
  if (!value) return null;
  const rootId = resolveKyRoot(businessTypeKey);
  // The shared Manufacturing & Services pillars are stored with a null kyRoot.
  const rootClause =
    rootId === DEFAULT_KY_CATEGORY_ROOT ? { $in: [null, ''] } : { $in: [rootId] };
  const cat = await KYCategory.findOne({
    kyRoot: rootClause,
    $or: [{ key: value.toLowerCase() }, { name: new RegExp(`^${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }],
  });
  return cat ? cat.key : undefined;
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
    if (req.query.category) filter.category = String(req.query.category).toLowerCase();
    if (req.query.businessType) filter.businessType = String(req.query.businessType).toLowerCase();
    // `?root=<id>` scopes the list to one of the three Admin roots. For a
    // business type that requires domain selection the shared questions (those
    // with no businessType) belong to the root too; for Start-Up and Non-Profit
    // the filter is strict so their roots can never show each other's questions.
    if (req.query.root) {
      const rootId = String(req.query.root).toLowerCase().trim();
      const keys = businessTypesForRoot(rootId);
      if (rootRequiresDomainSelection(rootId)) {
        filter.$or = [{ businessType: null }, { businessType: '' }, { businessType: { $in: keys } }];
      } else {
        filter.businessType = { $in: keys };
      }
    }
    const questions = await KnowYourselfQuestion.find(filter).sort({ createdAt: -1 });
    // `kyRoot` is reported for EVERY question, stored or derived, so an Admin
    // client can see which root each row belongs to without re-implementing the
    // resolver. Documents written before the field existed fall back to the
    // value their `businessType` resolves to, which is the same rule the
    // seeder applies.
    res.json(
      questions.map((q) => ({
        ...q.toObject(),
        kyRoot: q.kyRoot ?? rootForQuestion(q.businessType),
      }))
    );
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
    const qBusinessType = await assertKnownBusinessType(businessType);
    if (qBusinessType?.error) return res.status(400).json({ error: qBusinessType.error });

    // The pillar must belong to the same KY root as the question's business
    // type, so a Start-Up question can never be scored on a Services pillar.
    const categoryKey = await resolveCategoryKey(category, qBusinessType);
    if (categoryKey === undefined) {
      return res.status(400).json({
        error: 'Invalid category. Select a result category that belongs to this business type\'s pillar set.',
      });
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
    // Stamp the root the question now belongs to. The shared pool (no business
    // type) is deliberately left without the field, exactly as it already is.
    if (qBusinessType) {
      q.kyRoot = rootForQuestion(qBusinessType);
      await q.save();
    }
    await logAudit({ ...auditFrom(req), action: 'ky_question.created', entity: 'ky_question', entityId: q._id, metadata: { text: q.text, type: qType, domain: qDomain, category: categoryKey, kyRoot: q.kyRoot ?? null } });
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
    if (businessType !== undefined) {
      const checked = await assertKnownBusinessType(businessType);
      if (checked?.error) return res.status(400).json({ error: checked.error });
      q.businessType = checked || null;
    }
    if (category !== undefined) {
      const categoryKey = await resolveCategoryKey(category, q.businessType);
      if (categoryKey === undefined) {
        return res.status(400).json({
          error: 'Invalid category. Select a result category that belongs to this business type\'s pillar set.',
        });
      }
      q.category = categoryKey;
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
    // Re-derive the root from the (possibly just-changed) business type so the
    // stored `kyRoot` can never drift from it. A question in the shared pool
    // that has never carried the field is left without one.
    const derivedRoot = rootForQuestion(q.businessType);
    if (derivedRoot !== null || q.kyRoot != null) q.kyRoot = derivedRoot;

    await q.save();
    await logAudit({ ...auditFrom(req), action: 'ky_question.updated', entity: 'ky_question', entityId: q._id, metadata: { text: q.text, type: q.type, domain: q.domain, kyRoot: derivedRoot } });
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