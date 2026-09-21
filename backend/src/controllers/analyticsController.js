import { asyncHandler } from '../middleware/errors.js';
import AssessmentSession from '../models/AssessmentSession.js';
import KnowYourselfSession from '../models/KnowYourselfSession.js';
import Category from '../models/Category.js';
import { categoryDisplayName } from '../config/categoryLabels.js';
import { getActiveKYCategories } from '../services/knowYourselfService.js';

// ─── Date handling ─────────────────────────────────────────────────────────
// Dates arrive as server-local calendar days. MongoDB stores UTC, so the
// boundaries are computed with setFullYear/hours in the server's local time
// (the same convention the dashboard uses for its "today" bounds) and then
// used directly against the stored ISODates.
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function parseDateParam(value) {
  if (typeof value !== 'string' || !DATE_RE.test(value)) {
    return { ok: false, error: 'Dates must use YYYY-MM-DD format' };
  }
  const [y, m, d] = value.split('-').map((n) => parseInt(n, 10));
  const date = new Date(y, m - 1, d, 0, 0, 0, 0);
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== m - 1 ||
    date.getDate() !== d
  ) {
    return { ok: false, error: `Not a valid calendar date: ${value}` };
  }
  return { ok: true, date };
}

export const toLocalDateStr = (date) => {
  if (!date) return null;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Resolves ?from=&to= into an inclusive/exclusive local-midnight interval.
// Neither given -> all-time. Exactly one given -> rejected (a range or a
// single custom day should always supply both bounds).
export function resolveRange(query) {
  const hasFrom = query.from != null && query.from !== '';
  const hasTo = query.to != null && query.to !== '';
  if (!hasFrom && !hasTo) {
    return { from: null, toExclusive: null, error: null };
  }
  if (hasFrom !== hasTo) {
    return { ok: false, error: 'Provide both from and to dates (YYYY-MM-DD)' };
  }
  const parsedFrom = parseDateParam(query.from);
  if (!parsedFrom.ok) return { ok: false, error: parsedFrom.error };
  const parsedTo = parseDateParam(query.to);
  if (!parsedTo.ok) return { ok: false, error: parsedTo.error };
  if (parsedFrom.date.getTime() > parsedTo.date.getTime()) {
    return { ok: false, error: 'from must be on or before to' };
  }
  const toExclusive = new Date(parsedTo.date);
  toExclusive.setDate(toExclusive.getDate() + 1);
  return { ok: true, from: parsedFrom.date, toExclusive, error: null };
}

const rangeMatch = (field, from, toExclusive) => {
  const m = {};
  if (from) m[field] = { $gte: from };
  if (toExclusive) m[field] = { ...(m[field] || {}), $lt: toExclusive };
  return m;
};

const BUSINESS_TYPE_LABELS = {
  service: 'Services',
  product: 'Manufacturing',
  ngo: 'Non-Profit',
};

const BAND_ORDER = [
  'STRONG FOUNDATION',
  'MODERATE PERFORMANCE',
  'SIGNIFICANT GAPS',
  'CRITICAL WEAKNESSES',
];

function cappedLimit(value, fallback = 100, max = 500) {
  const n = parseInt(value, 10);
  if (Number.isNaN(n) || n <= 0) return fallback;
  return Math.min(n, max);
}

// Whether a stored timestamp falls inside the requested interval.
function inRange(d, from, toExclusive) {
  if (d == null) return false;
  const t = new Date(d).getTime();
  if (from && t < from.getTime()) return false;
  if (toExclusive && t >= toExclusive.getTime()) return false;
  return true;
}

export async function analyticsData(query) {
  const range = resolveRange(query);
  if (range.error) {
    const err = new Error(range.error);
    err.status = 400;
    throw err;
  }
  const { from, toExclusive } = range;
  const limit = cappedLimit(query.limit);

  const [kyCategories, categoryDocs] = await Promise.all([
    getActiveKYCategories(),
    Category.find({ active: true }).sort({ sortOrder: 1 }).lean(),
  ]);
  const kyCatByKey = new Map(kyCategories.map((c) => [c.key, c]));
  const catNames = new Map(categoryDocs.map((c) => [c.key, c]));

  const matchCompletedOnboarding = {
    status: 'completed',
    ...rangeMatch('updatedAt', from, toExclusive),
  };

  const [onboardingStarted, onboardingCompleted, kyStarted, kyFacet, emailFacet] =
    await Promise.all([
      AssessmentSession.countDocuments(rangeMatch('createdAt', from, toExclusive)),
      AssessmentSession.aggregate([
        { $match: { ...matchCompletedOnboarding, 'result.overallPct': { $type: 'number' } } },
        {
          $facet: {
            totals: [{ $group: { _id: null, n: { $sum: 1 }, avg: { $avg: '$result.overallPct' } } }],
            areas: [
              { $unwind: '$answers' },
              { $match: { 'answers.categoryKey': { $in: ['strategic', 'operational', 'revenue'] }, 'answers.optionId': { $ne: null }, 'answers.timedOut': { $ne: true } } },
              { $group: { _id: '$answers.categoryKey', n: { $sum: 1 }, avgPct: { $avg: { $multiply: ['$answers.score', 100] } } } },
            ],
          },
        },
      ]),
      KnowYourselfSession.countDocuments(rangeMatch('startedAt', from, toExclusive)),
      KnowYourselfSession.aggregate([
        { $match: { status: 'completed', ...rangeMatch('completedAt', from, toExclusive), result: { $type: 'object' } } },
        {
          $facet: {
            totals: [{ $group: { _id: null, n: { $sum: 1 }, avg: { $avg: '$result.overallPercent' } } }],
            bands: [
              { $group: { _id: '$result.band', n: { $sum: 1 } } },
            ],
            domains: [
              { $group: { _id: { $ifNull: ['$domainLabel', '$domain'] }, n: { $sum: 1 } } },
              { $sort: { n: -1 } },
            ],
            businessTypes: [{ $group: { _id: '$businessType', n: { $sum: 1 } } }],
            pillars: [
              { $unwind: '$result.categories' },
              { $match: { 'result.categories.maxScore': { $gt: 0 } } },
              { $group: { _id: '$result.categories.key', n: { $sum: 1 }, avgPct: { $avg: '$result.categories.percent' } } },
            ],
          },
        },
      ]),
      KnowYourselfSession.aggregate([
        { $match: { 'reportRequest.requested': true } },
        {
          $facet: {
            requested: [{ $match: rangeMatch('reportRequest.submittedAt', from, toExclusive) }, { $count: 'n' }],
            pdfs: [{ $match: rangeMatch('reportRequest.pdfGeneratedAt', from, toExclusive) }, { $count: 'n' }],
            sent: [{ $match: { 'reportRequest.emailStatus': 'sent', ...rangeMatch('reportRequest.emailSentAt', from, toExclusive) } }, { $count: 'n' }],
            failed: [{ $match: { 'reportRequest.emailStatus': 'failed', ...rangeMatch('reportRequest.emailAttemptedAt', from, toExclusive) } }, { $count: 'n' }],
            pending: [{ $match: { 'reportRequest.emailStatus': 'pending', ...rangeMatch('reportRequest.emailAttemptedAt', from, toExclusive) } }, { $count: 'n' }],
            skipped: [{ $match: { 'reportRequest.emailStatus': 'skipped', ...rangeMatch('reportRequest.emailAttemptedAt', from, toExclusive) } }, { $count: 'n' }],
            untracked: [
              { $match: { $or: [{ 'reportRequest.emailStatus': null }, { 'reportRequest.emailStatus': { $exists: false } }], ...rangeMatch('reportRequest.submittedAt', from, toExclusive) } },
              { $count: 'n' },
            ],
          },
        },
      ]),
    ]);

  const firstValue = (facet, key) => {
    const rows = facet?.[0]?.[key] || [];
    const tally = rows[0] || null;
    return { n: tally?.n || 0, avg: tally?.avg ?? null };
  };

  const onboardingTotal = firstValue(onboardingCompleted, 'totals');
  const kyTotal = firstValue(kyFacet, 'totals');

  const areaRows = (onboardingCompleted?.[0]?.areas || []);
  const areas = ['strategic', 'operational', 'revenue'].map((key) => {
    const row = areaRows.find((r) => r._id === key);
    return {
      key,
      name: categoryDisplayName(key, catNames.get(key)?.name || key),
      color: catNames.get(key)?.color ?? null,
      n: row?.n || 0,
      avgPct: row?.avgPct != null ? Math.round(row.avgPct) : null,
    };
  });

  const pillarRows = (kyFacet?.[0]?.pillars || []);
  const pillars = kyCategories.map((c) => {
    const row = pillarRows.find((r) => r._id === c.key);
    return {
      key: c.key,
      name: c.name,
      color: c.color,
      sortOrder: c.sortOrder,
      n: row?.n || 0,
      avgPct: row?.avgPct != null ? Math.round(row.avgPct) : null,
    };
  });

  const bandRows = (kyFacet?.[0]?.bands || []);
  const bands = BAND_ORDER.map((band) => {
    const row = bandRows.find((r) => r._id === band);
    return { band, n: row?.n || 0 };
  });
  const otherBands = bandRows.filter((r) => !BAND_ORDER.includes(r._id));
  for (const r of otherBands) bands.push({ band: r._id || 'Unknown', n: r.n });

  const domainRows = kyFacet?.[0]?.domains || [];
  const domains = domainRows.map((r) => ({ domain: r._id, n: r.n }));

  const typeRows = kyFacet?.[0]?.businessTypes || [];
  const businessTypes = typeRows.map((r) => ({
    type: r._id,
    label: r._id ? BUSINESS_TYPE_LABELS[r._id] || r._id : 'Not specified',
    n: r.n,
  }));

  const email = (key) => {
    const rows = emailFacet?.[0]?.[key] || [];
    return rows?.[0]?.n || 0;
  };

  const emailStatuses = {
    sent: email('sent'),
    failed: email('failed'),
    pending: email('pending'),
    skipped: email('skipped'),
    untracked: email('untracked'),
  };

  // ─── Session table: latest activities in range, both flows merged ───────
  const [kySessions, onboardingSessions] = await Promise.all([
    KnowYourselfSession.find({
      $or: [
        rangeMatch('startedAt', from, toExclusive),
        rangeMatch('completedAt', from, toExclusive),
        rangeMatch('reportRequest.submittedAt', from, toExclusive),
      ],
    })
      .sort({ startedAt: -1 })
      .limit(limit * 2)
      .select('sessionId status email contactConsent domain domainLabel businessType startedAt completedAt result reportRequest.progress reportRequest.requested reportRequest.submittedAt reportRequest.emailStatus')
      .lean(),
    AssessmentSession.find({
      $or: [
        rangeMatch('createdAt', from, toExclusive),
        rangeMatch('updatedAt', from, toExclusive),
      ],
    })
      .sort({ createdAt: -1 })
      .limit(limit * 2)
      .select('sessionId status createdAt updatedAt result.overallPct')
      .lean(),
  ]);

  const makeKyRow = (s) => {
    const candidates = [s.startedAt, s.completedAt, s.reportRequest?.submittedAt, s.reportRequest?.emailSentAt];
    const activityAt = candidates
      .filter((d) => inRange(d, from, toExclusive))
      .sort((a, b) => new Date(b) - new Date(a))[0] || s.startedAt || s.completedAt;
    return {
      type: 'ky',
      source: 'Know Yourself',
      sessionId: s.sessionId,
      status: s.status,
      businessType: s.businessType || null,
      businessTypeLabel: s.businessType ? BUSINESS_TYPE_LABELS[s.businessType] || s.businessType : null,
      domain: s.domain || null,
      domainLabel: s.domainLabel || s.domain || null,
      email: s.contactConsent ? s.email : null,
      startedAt: s.startedAt || null,
      completedAt: s.completedAt || null,
      scorePct: s.result?.overallPercent ?? null,
      band: s.result?.band || null,
      emailStatus: s.reportRequest?.emailStatus || null,
      activityAt,
    };
  };

  const makeOnboardingRow = (s) => {
    const candidates = [s.createdAt, s.updatedAt];
    const activityAt = candidates
      .filter((d) => inRange(d, from, toExclusive))
      .sort((a, b) => new Date(b) - new Date(a))[0] || s.createdAt;
    return {
      type: 'onboarding',
      source: 'Onboarding',
      sessionId: s.sessionId,
      status: s.status,
      businessType: null,
      businessTypeLabel: null,
      domain: null,
      domainLabel: null,
      email: null,
      startedAt: s.createdAt || null,
      // Onboarding has no dedicated completedAt; completion is written on the
      // final save (the result build), which is the last update on the session.
      completedAt: s.status === 'completed' ? s.updatedAt || null : null,
      scorePct: typeof s.result?.overallPct === 'number' ? s.result.overallPct : null,
      band: null,
      emailStatus: null,
      activityAt,
    };
  };

  const sessions = [...kySessions.map(makeKyRow), ...onboardingSessions.map(makeOnboardingRow)]
    .sort((a, b) => new Date(b.activityAt) - new Date(a.activityAt))
    .slice(0, limit);

  return {
    range: {
      from: toLocalDateStr(from),
      to: toLocalDateStr(from ? new Date(toExclusive.getTime() - 86400000) : null),
      allTime: !from && !toExclusive,
      utcOffsetMinutes: -new Date().getTimezoneOffset(),
    },
    activity: {
      onboarding: {
        started: onboardingStarted,
        completed: onboardingTotal.n,
        avgScore: onboardingTotal.avg != null ? Math.round(onboardingTotal.avg) : null,
        areas,
      },
      knowYourself: {
        started: kyStarted,
        completed: kyTotal.n,
        avgScore: kyTotal.avg != null ? Math.round(kyTotal.avg) : null,
        bands,
        pillars,
        domains,
        businessTypes,
      },
    },
    email: {
      requested: email('requested'),
      pdfGenerated: email('pdfs'),
      byStatus: emailStatuses,
    },
    sessions,
    meta: { limit, total: sessions.length },
  };
}

export const analytics = asyncHandler(async (req, res) => {
  res.json(await analyticsData(req.query));
});