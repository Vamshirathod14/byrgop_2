import { asyncHandler } from '../middleware/errors.js';
import Domain, { slugify } from '../models/Domain.js';
import BusinessType from '../models/BusinessType.js';
import KnowYourselfQuestion from '../models/KnowYourselfQuestion.js';
import KnowYourselfSession from '../models/KnowYourselfSession.js';
import { logAudit, auditFrom } from '../services/auditService.js';

// ─── Public ───────────────────────────────────────────────

/**
 * GET /domains
 * Optional ?businessType=<key> → only active domains belonging to that
 * business type (relationship resolved in MongoDB, never in the client).
 */
export const listActiveDomains = asyncHandler(async (req, res) => {
  const filter = { active: true };
  if (req.query.businessType) {
    const bt = await BusinessType.findOne({
      key: String(req.query.businessType).toLowerCase().trim(),
      active: true,
    });
    // Unknown/inactive business type → no domains rather than all domains.
    if (!bt) return res.json([]);
    filter.businessTypeId = bt._id;
  }
  const domains = await Domain.find(filter).sort({ name: 1 });
  res.json(
    domains.map((d) => ({
      id: d._id,
      slug: d.slug,
      name: d.name,
      active: d.active,
      businessTypeId: d.businessTypeId || null,
    }))
  );
});

// ─── Admin ────────────────────────────────────────────────

export const listAdminDomains = asyncHandler(async (req, res) => {
  const { includeInactive } = req.query;
  const filter = includeInactive === 'true' ? {} : { active: true };
  const domains = await Domain.find(filter).sort({ name: 1 });
  res.json(domains);
});

export const getAdminDomain = asyncHandler(async (req, res) => {
  const domain = await Domain.findById(req.params.id);
  if (!domain) return res.status(404).json({ error: 'Domain not found' });
  res.json(domain);
});

/** Validate a business type id for domain assignment. */
async function resolveBusinessTypeId(input) {
  if (input === undefined) return { skip: true };
  if (input === null || input === '') {
    return { value: null };
  }
  const bt = await BusinessType.findById(String(input));
  if (!bt) return { error: 'Selected business type does not exist' };
  return { value: bt._id };
}

export const createDomain = asyncHandler(async (req, res) => {
  const { name, slug, description, active, businessTypeId } = req.body || {};
  const trimmedName = typeof name === 'string' ? name.trim() : '';
  if (!trimmedName) return res.status(400).json({ error: 'Domain name is required' });

  const rawSlug = typeof slug === 'string' && slug.trim() ? slug : trimmedName;
  const domainSlug = slugify(rawSlug);
  if (!domainSlug) return res.status(400).json({ error: 'A valid slug is required' });

  const existing = await Domain.findOne({ slug: domainSlug });
  if (existing) {
    return res.status(409).json({ error: `A domain with slug "${domainSlug}" already exists` });
  }

  const bt = await resolveBusinessTypeId(businessTypeId);
  if (bt.error) return res.status(400).json({ error: bt.error });

  const domain = await Domain.create({
    name: trimmedName,
    slug: domainSlug,
    description: typeof description === 'string' ? description.trim() : '',
    active: active !== false,
    businessTypeId: bt.value ?? null,
  });

  await logAudit({
    ...auditFrom(req),
    action: 'domain.created',
    entity: 'domain',
    entityId: domain._id,
    metadata: {
      name: domain.name,
      slug: domain.slug,
      active: domain.active,
      businessTypeId: domain.businessTypeId,
    },
  });

  res.status(201).json(domain);
});

export const updateDomain = asyncHandler(async (req, res) => {
  const domain = await Domain.findById(req.params.id);
  if (!domain) return res.status(404).json({ error: 'Domain not found' });

  const { name, slug, description, active, businessTypeId } = req.body || {};

  if (typeof name === 'string') {
    const trimmedName = name.trim();
    if (!trimmedName) return res.status(400).json({ error: 'Domain name cannot be empty' });
    domain.name = trimmedName;
  }
  if (typeof description === 'string') domain.description = description.trim();
  if (active !== undefined) domain.active = active === true;

  const bt = await resolveBusinessTypeId(businessTypeId);
  if (bt.error) return res.status(400).json({ error: bt.error });
  if (!bt.skip) domain.businessTypeId = bt.value ?? null;

  if (typeof slug === 'string' && slug.trim()) {
    const nextSlug = slugify(slug);
    if (nextSlug !== domain.slug) {
      const existing = await Domain.findOne({ slug: nextSlug, _id: { $ne: domain._id } });
      if (existing) {
        return res.status(409).json({ error: `A domain with slug "${nextSlug}" already exists` });
      }
      const oldSlug = domain.slug;
      domain.slug = nextSlug;
      await domain.save();
      await Promise.all([
        KnowYourselfQuestion.updateMany({ domain: oldSlug }, { $set: { domain: nextSlug } }),
        KnowYourselfSession.updateMany({ domain: oldSlug }, { $set: { domain: nextSlug } }),
      ]);
      await logAudit({
        ...auditFrom(req),
        action: 'domain.updated',
        entity: 'domain',
        entityId: domain._id,
        metadata: { name: domain.name, slug: domain.slug, active: domain.active, oldSlug },
      });
      return res.json(domain);
    }
  }

  await domain.save();

  await logAudit({
    ...auditFrom(req),
    action: 'domain.updated',
    entity: 'domain',
    entityId: domain._id,
    metadata: { name: domain.name, slug: domain.slug, active: domain.active },
  });

  res.json(domain);
});

export const deleteDomain = asyncHandler(async (req, res) => {
  const domain = await Domain.findById(req.params.id);
  if (!domain) return res.status(404).json({ error: 'Domain not found' });

  const [questionCount, sessionCount] = await Promise.all([
    KnowYourselfQuestion.deleteMany({ type: 'domain', domain: domain.slug }),
    KnowYourselfSession.deleteMany({ domain: domain.slug }),
  ]);

  await Domain.findByIdAndDelete(domain._id);
  await logAudit({
    ...auditFrom(req),
    action: 'domain.deleted',
    entity: 'domain',
    entityId: domain._id,
    metadata: {
      name: domain.name,
      slug: domain.slug,
      deletedQuestions: questionCount.deletedCount,
      deletedSessions: sessionCount.deletedCount,
    },
  });
  res.json({
    ok: true,
    deleted: {
      questions: questionCount.deletedCount,
      sessions: sessionCount.deletedCount,
    },
  });
});