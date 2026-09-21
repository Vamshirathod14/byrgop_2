import KnowYourselfQuestion from '../models/KnowYourselfQuestion.js';
import KnowYourselfSession from '../models/KnowYourselfSession.js';
import Domain from '../models/Domain.js';
import KYCategory from '../models/KYCategory.js';
import BusinessType from '../models/BusinessType.js';
import { buildReportPdf } from './reportPdfService.js';
import { sendReportEmail } from './reportEmailService.js';
import { resolveOptionColor, resolveOptionHex } from '../config/optionColors.js';

// ─── Business-type configuration ──────────────────────────
// The canonical list lives in the BusinessType collection (Admin-managed).
// These defaults are inserted once if the collection is empty.
export const DEFAULT_BUSINESS_TYPES = [
  { key: 'service', name: 'Service Based', description: 'Consulting, agencies, professional & financial services.', sortOrder: 1 },
  { key: 'product', name: 'Product Based', description: 'Manufacturing, retail, distribution and product brands.', sortOrder: 2 },
  { key: 'ngo', name: 'NGO / Non-Profit', description: 'Non-profit organisations, foundations and social impact.', sortOrder: 3 },
];

export const ASSESSMENT_SIZE = { generic: 9, domain: 9, total: 18 };

// Sentinel used in the resume `answers` array to represent a "Not Applicable"
// response (which has no optionId). It is a tracking-only answer: it counts
// toward progress but is excluded from scoring.
export const NOT_APPLICABLE_SENTINEL = '__NOT_APPLICABLE__';

// Domain slug the frontend sends when the user picks "Others" during domain
// selection. There is no matching Domain document — the backend treats it as a
// non-domain and serves the existing generic pool unchanged.
export const OTHERS_DOMAIN_SLUG = 'others';
export const OTHERS_DOMAIN_LABEL = 'Others';

// Seed defaults used the first time categories are needed; afterwards they are
// fully admin-managed through /admin/know-yourself/categories.
export const DEFAULT_KY_CATEGORIES = [
  { key: 'strategic-direction', name: 'Strategic Direction', color: '#0A78CF', sortOrder: 1 },
  { key: 'financial-performance', name: 'Financial Performance', color: '#FCA700', sortOrder: 2 },
  { key: 'sales-market-growth', name: 'Sales & Market Growth', color: '#E52032', sortOrder: 3 },
  { key: 'operations-execution', name: 'Operations & Execution', color: '#0D8845', sortOrder: 4 },
  { key: 'people-organization', name: 'People & Organization', color: '#F5630D', sortOrder: 5 },
  { key: 'digital-innovation', name: 'Digital & Innovation', color: '#7038A5', sortOrder: 6 },
];

function generateSessionId() {
  const chars = '0123456789ABCDEF';
  let id = '';
  for (let i = 0; i < 12; i++) id += chars[Math.floor(Math.random() * 16)];
  return id;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Serialize a glossary array to only { abbreviation, fullForm }. A legacy
// `description` field may exist on historical documents; it is intentionally
// omitted from all API responses (and never re-saved).
function serializeGlossary(glossary) {
  return (glossary || []).map((g) => ({ abbreviation: g.abbreviation, fullForm: g.fullForm }));
}

// Best-effort colour for a snapshot option. New snapshots always store the
// hex colour; historical session snapshots without one fall back to the
// position defaults so the UI never receives a null colour.
function snapshotOptionColor(opt, index = 0) {
  if (opt && opt.color) return opt.color;
  const { color, error } = resolveOptionColor({
    text: opt ? opt.text : null,
    color: opt ? opt.color : null,
    index,
  });
  return error ? null : color;
}

function snapshotQuestions(questions, source) {
  return questions.map((q) => ({
    questionId: q._id,
    text: q.text,
    source,
    category: q.category || null,
    glossary: q.glossary || [],
    options: q.options
      .filter((o) => o.active)
      .map((o, j) => ({
        optionId: o._id,
        text: o.text,
        score: o.score,
        color: snapshotOptionColor(o, j),
      })),
  }));
}

export async function getAvailableDomains() {
  const domains = await Domain.find({ active: true }).sort({ name: 1 });
  return domains.map((d) => ({ slug: d.slug, name: d.name }));
}

/**
 * Resolve an active business type by key. Returns the doc or null.
 */
export async function resolveActiveBusinessType(typeKey) {
  if (!typeKey) return null;
  return BusinessType.findOne({ key: String(typeKey).toLowerCase().trim(), active: true });
}

/**
 * Resolve an active domain by slug. Returns the domain doc or null.
 * Used by the assignment flow so only active, known domains are accepted.
 */
export async function resolveActiveDomain(domainKey) {
  if (!domainKey) return null;
  return Domain.findOne({ slug: String(domainKey).toLowerCase().trim(), active: true });
}

/** Active KY result categories, seeded from defaults on first use. */
export async function getActiveKYCategories() {
  let cats = await KYCategory.find({ active: true }).sort({ sortOrder: 1, name: 1 }).lean();
  if (cats.length === 0) {
    await KYCategory.insertMany(
      DEFAULT_KY_CATEGORIES.map((c) => c),
      { ordered: false }
    ).catch(() => {});
    cats = await KYCategory.find({ active: true }).sort({ sortOrder: 1, name: 1 }).lean();
  }
  return cats;
}

/** Active business types, seeded from defaults on first use. Admin-managed. */
export async function getActiveBusinessTypes() {
  let types = await BusinessType.find({ active: true }).sort({ sortOrder: 1, name: 1 }).lean();
  if (types.length === 0) {
    await BusinessType.insertMany(DEFAULT_BUSINESS_TYPES).catch(() => {});
    types = await BusinessType.find({ active: true }).sort({ sortOrder: 1, name: 1 }).lean();
  }
  return types;
}

/** Public configuration for the assessment entry flow. */
export async function getKYMeta() {
  const [cats, bts] = await Promise.all([getActiveKYCategories(), getActiveBusinessTypes()]);
  return {
    businessTypes: bts.map((b) => ({
      key: b.key,
      label: b.name,
      name: b.name,
      description: b.description || '',
    })),
    categories: cats.map((c) => ({ key: c.key, name: c.name, color: c.color })),
    requirements: ASSESSMENT_SIZE,
  };
}

// ─── Generic session (unchanged) ──────────────────────────

export async function startKYSession() {
  const activeQuestions = await KnowYourselfQuestion.find({ active: true, type: 'generic' }).lean();
  if (activeQuestions.length < 20) {
    throw Object.assign(
      new Error(`Need at least 20 active generic Know Yourself questions (found ${activeQuestions.length})`),
      { status: 400 }
    );
  }
  const selected = shuffle(activeQuestions).slice(0, 20);
  const snapshot = snapshotQuestions(selected, 'generic');
  const sessionId = generateSessionId();
  const session = await KnowYourselfSession.create({
    sessionId,
    status: 'in_progress',
    startedAt: new Date(),
    selectedQuestions: snapshot,
    answers: [],
  });
  return {
    sessionId: session.sessionId,
    totalQuestions: 20,
    questions: snapshot.map((q, i) => ({
      questionIndex: i,
      questionId: q.questionId,
      text: q.text,
      glossary: serializeGlossary(q.glossary),
      options: q.options.map((o, j) => ({ optionId: o.optionId, text: o.text, color: resolveOptionHex({ text: o.text, color: o.color, index: j }) })),
    })),
  };
}

// ─── Domain assignment (18 questions: G D G D …) ──────────

function businessTypePoolFilter(businessType) {
  // Questions without businessType apply to every type.
  return { $or: [{ businessType: null }, { businessType: '' }, { businessType }] };
}

// ─── "Others" assignment (18 generic questions) ──────────
// When a user selects "Others" in domain selection there is no specific
// domain. Reuses the existing categorized generic question pool (no new
// questions, no duplicates) and returns exactly ASSESSMENT_SIZE.total generic
// questions so the rest of the flow is identical to a domain assignment.
async function buildGenericAssignment({ email, bt, browserId }) {
  const poolFilter = {
    active: true,
    category: { $ne: null },
    ...businessTypePoolFilter(bt.key),
  };

  const genericQuestions = await KnowYourselfQuestion.find({
    ...poolFilter,
    type: 'generic',
  }).lean();

  if (genericQuestions.length < ASSESSMENT_SIZE.total) {
    throw Object.assign(
      new Error(
        `Need at least ${ASSESSMENT_SIZE.total} active categorized generic questions for the Others option (found ${genericQuestions.length}). Add or categorize generic questions and try again.`
      ),
      { status: 400 }
    );
  }

  const selected = shuffle(genericQuestions).slice(0, ASSESSMENT_SIZE.total);
  const snap = snapshotQuestions(selected, 'generic');

  const sessionId = generateSessionId();
  const now = new Date();
  const session = await KnowYourselfSession.create({
    sessionId,
    status: 'in_progress',
    email,
    browserId: browserId || null,
    domain: OTHERS_DOMAIN_SLUG,
    domainLabel: OTHERS_DOMAIN_LABEL,
    domainId: null,
    businessType: bt.key,
    businessTypeId: bt._id,
    startedAt: now,
    selectedQuestions: snap,
    answers: [],
  });

  return {
    sessionId: session.sessionId,
    businessType: bt.key,
    businessTypeLabel: bt.name,
    domain: OTHERS_DOMAIN_SLUG,
    domainLabel: OTHERS_DOMAIN_LABEL,
    totalQuestions: snap.length,
    questions: snap.map((q, i) => ({
      questionIndex: i,
      questionId: q.questionId,
      text: q.text,
      glossary: serializeGlossary(q.glossary),
      options: q.options.map((o, j) => ({ optionId: o.optionId, text: o.text, color: resolveOptionHex({ text: o.text, color: o.color, index: j }) })),
    })),
  };
}

// Email is OPTIONAL for the assignment: it is collected (per consent) on the
// Disclaimer page and can be supplied later on the Result page. Only validate
// when an email is actually provided; otherwise the session is created without
// one (session.email stays null).
export async function startKYAssignment(email, domainKey, businessTypeKey, browserId) {
  let normalizedEmail = null;
  if (email && String(email).trim()) {
    normalizedEmail = String(email).trim().toLowerCase();
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!EMAIL_RE.test(normalizedEmail)) {
      throw Object.assign(new Error('A valid email address is required'), { status: 400 });
    }
  }
  const normalizedBrowserId = browserId ? String(browserId).trim() : null;

  const bt = await resolveActiveBusinessType(businessTypeKey);
  if (!bt) {
    throw Object.assign(new Error('Select a valid business type to continue'), { status: 400 });
  }

  // "Others" is not a real domain — serve the generic 18-question pool.
  const domainKeyNormalized = String(domainKey || '').trim().toLowerCase();
  if (domainKeyNormalized === OTHERS_DOMAIN_SLUG) {
    return buildGenericAssignment({ email: normalizedEmail, bt, browserId: normalizedBrowserId });
  }

  const domain = await resolveActiveDomain(domainKey);
  if (!domain) {
    throw Object.assign(
      new Error(`Invalid or inactive domain: ${domainKey || '(none provided)'}`),
      { status: 400 }
    );
  }

  // Hierarchy enforcement (source of truth = DB):
  // the selected domain must belong to the selected business type.
  if (!domain.businessTypeId || String(domain.businessTypeId) !== String(bt._id)) {
    throw Object.assign(
      new Error(`"${domain.name}" does not belong to ${bt.name}. Select a domain under this business type.`),
      { status: 400 }
    );
  }
  const domainSlug = domain.slug;

  // Only categorized questions take part in the six-dimension scoring.
  const poolFilter = {
    active: true,
    category: { $ne: null },
    ...businessTypePoolFilter(bt.key),
  };

  const [genericQuestions, domainQuestions] = await Promise.all([
    KnowYourselfQuestion.find({ ...poolFilter, type: 'generic' }).lean(),
    KnowYourselfQuestion.find({ ...poolFilter, type: 'domain', domain: domainSlug }).lean(),
  ]);

  if (genericQuestions.length < ASSESSMENT_SIZE.generic) {
    throw Object.assign(
      new Error(
        `Need at least ${ASSESSMENT_SIZE.generic} active generic questions for this business type (found ${genericQuestions.length}). Add or categorize questions in Admin → KY Questions.`
      ),
      { status: 400 }
    );
  }
  if (domainQuestions.length < ASSESSMENT_SIZE.domain) {
    throw Object.assign(
      new Error(
        `Need at least ${ASSESSMENT_SIZE.domain} active questions for "${domain.name}" (found ${domainQuestions.length}). Add or categorize questions in Admin → KY Questions.`
      ),
      { status: 400 }
    );
  }

  const selectedGeneric = shuffle(genericQuestions).slice(0, ASSESSMENT_SIZE.generic);
  const selectedDomain = shuffle(domainQuestions).slice(0, ASSESSMENT_SIZE.domain);

  // Strict alternation: G D G D G D … ending with a domain question.
  const genericSnap = snapshotQuestions(selectedGeneric, 'generic');
  const domainSnap = snapshotQuestions(selectedDomain, 'domain');
  const allSnap = [];
  for (let i = 0; i < ASSESSMENT_SIZE.generic; i++) {
    allSnap.push(genericSnap[i], domainSnap[i]);
  }

  const sessionId = generateSessionId();
  const now = new Date();
  const session = await KnowYourselfSession.create({
    sessionId,
    status: 'in_progress',
    email: normalizedEmail,
    browserId: normalizedBrowserId,
    domain: domainSlug,
    domainLabel: domain.name,
    domainId: domain._id,
    businessType: bt.key,
    businessTypeId: bt._id,
    startedAt: now,
    selectedQuestions: allSnap,
    answers: [],
  });

  return {
    sessionId: session.sessionId,
    businessType: bt.key,
    businessTypeLabel: bt.name,
    domain: domainSlug,
    domainLabel: domain.name,
    totalQuestions: allSnap.length,
    questions: allSnap.map((q, i) => ({
      questionIndex: i,
      questionId: q.questionId,
      text: q.text,
      glossary: serializeGlossary(q.glossary),
      options: q.options.map((o, j) => ({ optionId: o.optionId, text: o.text, color: resolveOptionHex({ text: o.text, color: o.color, index: j }) })),
    })),
  };
}

// ─── Resume / continue an unfinished assignment ──────────
// Find the most recent in-progress assignment for the caller: by email when
// available (the persisted user/session information), otherwise by the
// anonymous browser identifier. Only useful once some questions are answered
// and the session is not complete — otherwise the normal start is preferred.
// Returns everything the frontend needs to restore the exact state (questions,
// stored answers, next unanswered index) without recreating the session.
export async function resumeKYAssignment({ email, browserId }) {
  const normalizedEmail = email ? String(email).trim().toLowerCase() : null;
  const browser = browserId ? String(browserId).trim() : null;
  if (!normalizedEmail && !browser) return { session: null };

  const query = normalizedEmail
    ? { status: 'in_progress', email: normalizedEmail }
    : { status: 'in_progress', browserId: browser };

  const session = await KnowYourselfSession.findOne(query)
    .sort({ lastActiveAt: -1, startedAt: -1 })
    .select('sessionId email status businessType domain domainLabel selectedQuestions answers lastActiveAt startedAt')
    .lean();

  if (!session) return { session: null };

  const totalQuestions = (session.selectedQuestions || []).length;
  const byIndex = new Map(
    (session.answers || [])
      .filter((a) => a.questionIndex != null)
      .map((a) => [a.questionIndex, a])
  );
  const answeredCount = byIndex.size;

  // No useful resume state: nothing answered yet (fresh start) or complete.
  if (answeredCount === 0 || answeredCount >= totalQuestions) return { session: null };

  // Next unanswered question (sequential flow normally stops right after the
  // last answered index, so the first gap is where the user left off).
  let nextQuestionIndex = 0;
  for (let i = 0; i < totalQuestions; i++) {
    if (!byIndex.has(i)) {
      nextQuestionIndex = i;
      break;
    }
  }

  let businessTypeLabel = session.businessType;
  if (session.businessType) {
    const bt = await resolveActiveBusinessType(session.businessType);
    if (bt) businessTypeLabel = bt.name;
  }

  const questions = (session.selectedQuestions || []).map((q, i) => ({
    questionIndex: i,
    questionId: q.questionId,
    text: q.text,
    glossary: serializeGlossary(q.glossary),
    options: q.options.map((o, j) => ({ optionId: o.optionId, text: o.text, color: resolveOptionHex({ text: o.text, color: o.color, index: j }) })),
  }));

  const answers = new Array(totalQuestions).fill(null);
  let notApplicableCount = 0;
  for (const [idx, a] of byIndex.entries()) {
    if (a.isNotApplicable) {
      answers[idx] = NOT_APPLICABLE_SENTINEL;
      notApplicableCount += 1;
    } else {
      answers[idx] = a.optionId;
    }
  }

  return {
    session: {
      sessionId: session.sessionId,
      email: session.email || null,
      businessType: session.businessType,
      businessTypeLabel,
      domain: session.domain,
      domainLabel: session.domainLabel || session.domain,
      totalQuestions,
      answeredCount,
      nextQuestionIndex,
      questions,
      answers,
      notApplicableCount,
    },
  };
}

// ─── Shared question/answer/result (unchanged logic) ──────

export async function getKYQuestion(sessionId, questionIndex) {
  const session = await KnowYourselfSession.findOne({ sessionId });
  if (!session) throw Object.assign(new Error('Session not found'), { status: 404 });
  if (session.status !== 'in_progress') throw Object.assign(new Error('Session already completed'), { status: 400 });
  if (questionIndex < 0 || questionIndex >= session.selectedQuestions.length) {
    throw Object.assign(new Error('Invalid question index'), { status: 400 });
  }
  const alreadyAnswered = session.answers.some((a) => a.questionIndex === questionIndex);
  if (alreadyAnswered) throw Object.assign(new Error('Question already answered'), { status: 400 });
  const q = session.selectedQuestions[questionIndex];
  session.lastActiveAt = new Date();
  await session.save();
  return {
    questionIndex,
    questionId: q.questionId,
    text: q.text,
    glossary: serializeGlossary(q.glossary),
    options: q.options.map((o, j) => ({ optionId: o.optionId, text: o.text, color: resolveOptionHex({ text: o.text, color: o.color, index: j }) })),
  };
}

// ─── Scoring (six categories, normalized to percent) ──────

function bandForPercent(pct) {
  if (pct >= 80) return { band: 'STRONG FOUNDATION', message: 'Ready for Accelerated Growth' };
  if (pct >= 63) return { band: 'MODERATE PERFORMANCE', message: 'Targeted Improvements Needed' };
  if (pct >= 44) return { band: 'SIGNIFICANT GAPS', message: 'Strategic Overhaul Recommended' };
  return { band: 'CRITICAL WEAKNESSES', message: 'Immediate Action Required' };
}

async function buildKYResult(session) {
  const cats = await getActiveKYCategories();
  const catByKey = new Map(cats.map((c) => [c.key, c]));

  // Aggregate answered scores per category using the session snapshot.
  // "Not Applicable" responses are tracking-only and never take part in the
  // per-category aggregation or any score/maxScore/percent/overall math.
  const totals = new Map(); // key -> { score, count }
  let notApplicableCount = 0;
  for (const a of session.answers) {
    if (a.isNotApplicable) {
      notApplicableCount += 1;
      continue;
    }
    const key = a.category || null;
    if (!key || !catByKey.has(key)) continue;
    const t = totals.get(key) || { score: 0, count: 0 };
    t.score += a.score;
    t.count += 1;
    totals.set(key, t);
  }

  let previousPercents = null;
  if (session.email && session.attemptNumber && session.attemptNumber >= 2) {
    const prev = await KnowYourselfSession.findOne({
      email: session.email,
      status: 'completed',
      _id: { $ne: session._id },
      completedAt: { $ne: null },
    })
      .sort({ completedAt: -1, startedAt: -1 })
      .lean();
    if (prev?.result?.categories) {
      previousPercents = new Map(prev.result.categories.map((c) => [c.key, c.percent]));
    }
  }

  const categories = cats.map((c) => {
    const t = totals.get(c.key) || { score: 0, count: 0 };
    const maxScore = t.count * 4;
    // Normalize consistently: earned points over the 4-point maximum of the
    // questions actually asked in this category.
    const percent = maxScore > 0 ? Math.round((t.score / maxScore) * 100) : 0;
    const previousPercent = previousPercents ? previousPercents.get(c.key) ?? null : null;
    return {
      key: c.key,
      name: c.name,
      color: c.color,
      sortOrder: c.sortOrder,
      score: t.score,
      maxScore,
      percent,
      previousPercent,
      delta: previousPercent != null ? percent - previousPercent : null,
    };
  });

  const scoredCats = categories.filter((c) => c.maxScore > 0);
  const overallPercent =
    scoredCats.length > 0
      ? Math.round(scoredCats.reduce((s, c) => s + c.percent, 0) / scoredCats.length)
      : 0;

  const totalScore = session.answers.reduce((sum, a) => (a.isNotApplicable ? sum : sum + a.score), 0);
  const maxScore = scoredCats.reduce((s, c) => s + c.maxScore, 0);
  const { band, message } = bandForPercent(overallPercent);

  const strongest = [...scoredCats].sort(
    (a, b) => b.percent - a.percent || a.sortOrder - b.sortOrder
  )[0] || null;
  const priority = [...scoredCats].sort(
    (a, b) => a.percent - b.percent || a.sortOrder - b.sortOrder
  )[0] || null;

  return {
    version: 2,
    attemptNumber: session.attemptNumber || 1,
    score: totalScore, // legacy compatibility
    maxScore,
    overallPercent,
    band,
    message,
    strongest,
    priority,
    businessType: session.businessType || null,
    domain: session.domain || null,
    domainLabel:
      session.domainLabel || (session.domain ? session.domain : null),
    categories,
    // Informational count of tracking-only "Not Applicable" responses. Not
    // included in the donut/overall calculation.
    notApplicableCount,
  };
}

export async function submitKYAnswer(sessionId, { questionIndex, optionId, isNotApplicable }) {
  const session = await KnowYourselfSession.findOne({ sessionId });
  if (!session) throw Object.assign(new Error('Session not found'), { status: 404 });
  if (session.status !== 'in_progress') throw Object.assign(new Error('Session already completed'), { status: 400 });
  const totalQuestions = session.selectedQuestions.length;
  if (!Number.isInteger(questionIndex) || questionIndex < 0 || questionIndex >= totalQuestions) {
    throw Object.assign(new Error('Invalid question index'), { status: 400 });
  }

  const q = session.selectedQuestions[questionIndex];

  // "Not Applicable" is a tracking-only response: it counts toward progress but
  // is stored as a distinct answer type (isNotApplicable) that never takes part
  // in scoring. optionId is deliberately null so it can be identified reliably.
  if (isNotApplicable === true) {
    const naEntry = {
      questionIndex,
      questionId: q.questionId,
      questionText: q.text,
      source: q.source,
      category: q.category,
      optionId: null,
      optionText: 'Not Applicable',
      score: null,
      isNotApplicable: true,
      answeredAt: new Date(),
    };
    const naIdx = session.answers.findIndex((a) => a.questionIndex === questionIndex);
    if (naIdx >= 0) session.answers[naIdx] = naEntry;
    else session.answers.push(naEntry);
    session.lastActiveAt = new Date();

    const distinctAnswered = new Set(session.answers.map((a) => a.questionIndex)).size;
    if (distinctAnswered >= totalQuestions) {
      if (!session.attemptNumber) {
        const priorCompleted = await KnowYourselfSession.countDocuments({
          email: session.email,
          status: 'completed',
          _id: { $ne: session._id },
          startedAt: { $lt: session.startedAt },
        });
        session.attemptNumber = priorCompleted + 1;
      }
      session.result = await buildKYResult(session);
      session.status = 'completed';
      session.completedAt = new Date();
    }

    await session.save();
    return { accepted: true, answered: session.answers.length, complete: session.status === 'completed' };
  }

  const option = q.options.find((o) => String(o.optionId) === String(optionId));
  if (!option) throw Object.assign(new Error('Invalid option for this question'), { status: 400 });
  const optionIndex = q.options.findIndex((o) => String(o.optionId) === String(optionId));

  // Upsert semantics: navigating back with Previous and changing an answer
  // replaces the stored answer for that index instead of rejecting it.
  const existingIdx = session.answers.findIndex((a) => a.questionIndex === questionIndex);
  const entry = {
    questionIndex,
    questionId: q.questionId,
    questionText: q.text,
    source: q.source,
    category: q.category,
    optionId: option.optionId,
    optionText: option.text,
    optionColor: snapshotOptionColor(option, optionIndex),
    score: option.score,
    answeredAt: new Date(),
  };
  if (existingIdx >= 0) session.answers[existingIdx] = entry;
  else session.answers.push(entry);
  session.lastActiveAt = new Date();

  // Complete once every question has a (distinct) answer.
  const distinctAnswered = new Set(session.answers.map((a) => a.questionIndex)).size;
  if (distinctAnswered >= totalQuestions) {
    // Attempt number = completed sessions for this email before this one, +1.
    if (!session.attemptNumber) {
      const priorCompleted = await KnowYourselfSession.countDocuments({
        email: session.email,
        status: 'completed',
        _id: { $ne: session._id },
        startedAt: { $lt: session.startedAt },
      });
      session.attemptNumber = priorCompleted + 1;
    }
    session.result = await buildKYResult(session);
    session.status = 'completed';
    session.completedAt = new Date();
  }

  await session.save();
  return { accepted: true, answered: session.answers.length, complete: session.status === 'completed' };
}

export async function getKYResult(sessionId) {
  const session = await KnowYourselfSession.findOne({ sessionId });
  if (!session) throw Object.assign(new Error('Session not found'), { status: 404 });
  if (session.status !== 'completed') throw Object.assign(new Error('Session not completed'), { status: 400 });
  let btLabel = session.businessType || null;
  if (session.businessTypeId) {
    const btDoc = await BusinessType.findById(session.businessTypeId).lean();
    if (btDoc) btLabel = btDoc.name;
  }
  return {
    sessionId: session.sessionId,
    status: session.status,
    email: session.email,
    domain: session.domain,
    domainLabel: session.domainLabel || session.domain || null,
    businessType: session.businessType || null,
    businessTypeLabel: btLabel,
    attemptNumber: session.result?.attemptNumber ?? session.attemptNumber ?? 1,
    result: session.result,
    notApplicableCount: session.result?.notApplicableCount ?? 0,
    proBono: {
      requested: session.proBonoRequested || false,
      submittedAt: session.proBonoSubmittedAt || null,
    },
    reportRequest: session.reportRequest || null,
    answers: session.answers.map((a) => ({
      questionIndex: a.questionIndex,
      source: a.source,
      category: a.category,
      questionText: a.questionText,
      optionText: a.optionText,
      score: a.score,
      isNotApplicable: a.isNotApplicable || false,
    })),
  };
}

function normalizePhone(input) {
  if (typeof input !== 'string') return null;
  const digits = input.replace(/[^\d]/g, '');
  if (digits.length < 7 || digits.length > 15) return null;
  const plus = /^\+/.test(input.trim()) ? '+' : '';
  return `${plus}${digits}`;
}

export async function submitKYContact(sessionId, { phone, contactConsent }) {
  const session = await KnowYourselfSession.findOne({ sessionId });
  if (!session) throw Object.assign(new Error('Session not found'), { status: 404 });
  if (session.status !== 'completed') {
    throw Object.assign(new Error('Contact can only be submitted after the assessment is completed'), { status: 400 });
  }
  if (contactConsent !== true) {
    throw Object.assign(new Error('Contact consent is required'), { status: 400 });
  }
  const normalized = normalizePhone(phone);
  if (!normalized) {
    throw Object.assign(new Error('A valid phone number is required'), { status: 400 });
  }
  if (session.contactSubmittedAt) {
    throw Object.assign(new Error('Contact request already submitted'), { status: 409 });
  }
  session.phone = normalized;
  session.contactConsent = true;
  session.contactSubmittedAt = new Date();
  await session.save();
  return {
    sessionId: session.sessionId,
    submitted: true,
    contactSubmittedAt: session.contactSubmittedAt,
  };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Backfill an email onto an existing session (after Result) . Email stays
// optional: an empty payload clears the value. Saving the email again is
// allowed (same value or a corrected one) — it only must be valid when set.
export async function submitKYEmail(sessionId, { email }) {
  const session = await KnowYourselfSession.findOne({ sessionId });
  if (!session) throw Object.assign(new Error('Session not found'), { status: 404 });
  const raw = typeof email === 'string' ? email.trim() : '';
  if (!raw) {
    session.email = null;
    await session.save();
    return { sessionId: session.sessionId, submitted: true, email: null };
  }
  const normalized = raw.toLowerCase();
  if (!EMAIL_RE.test(normalized)) {
    throw Object.assign(new Error('A valid email address is required'), { status: 400 });
  }
  session.email = normalized;
  await session.save();
  return { sessionId: session.sessionId, submitted: true, email: normalized };
}

export async function submitKYProBono(sessionId, { email, phone, consent }) {
  const session = await KnowYourselfSession.findOne({ sessionId });
  if (!session) throw Object.assign(new Error('Session not found'), { status: 404 });
  if (session.status !== 'completed') {
    throw Object.assign(new Error('Pro Bono request is only available after the assessment is completed'), { status: 400 });
  }
  if (session.answers.length < session.selectedQuestions.length) {
    throw Object.assign(new Error('Complete all assessment questions before requesting consideration'), { status: 400 });
  }
  if (session.proBonoSubmittedAt) {
    throw Object.assign(new Error('Pro Bono request already submitted'), { status: 409 });
  }
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (!EMAIL_RE.test(normalizedEmail)) {
    throw Object.assign(new Error('A valid email address is required'), { status: 400 });
  }
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) {
    throw Object.assign(new Error('A valid phone number is required'), { status: 400 });
  }
  if (consent !== true) {
    throw Object.assign(new Error('Consent is required'), { status: 400 });
  }
  session.proBonoEmail = normalizedEmail;
  session.proBonoPhone = normalizedPhone;
  session.proBonoConsent = true;
  session.proBonoRequested = true;
  session.proBonoSubmittedAt = new Date();
  await session.save();
  return {
    sessionId: session.sessionId,
    submitted: true,
    proBonoSubmittedAt: session.proBonoSubmittedAt,
  };
}

const URL_RE = /^(https?:\/\/)?([\w-]+\.)+[a-z]{2,}(\/\S*)?$/i;

// Phone validation rules keyed by country code. India (+91) is strict: exactly
// 10 digits. All other countries use a generic international digit range (the
// local number must be 4–15 digits, matching plausible E.164 lengths).
const PHONE_RULES = {
  '+91': { exact: 10, error: 'Indian phone number must be exactly 10 digits' },
};

function validatePhone(countryCode, raw) {
  const ccDigits = String(countryCode || '').replace(/\D/g, '');
  if (!ccDigits) throw Object.assign(new Error('Country code is required'), { status: 400 });
  const cc = `+${ccDigits}`;
  const localDigits = String(raw || '').replace(/\D/g, '');

  const rule = PHONE_RULES[cc];
  if (rule) {
    if (localDigits.length !== rule.exact) {
      throw Object.assign(new Error(rule.error), { status: 400 });
    }
  } else if (localDigits.length < 4 || localDigits.length > 15) {
    throw Object.assign(new Error('A valid phone number is required for the selected country'), { status: 400 });
  }
  return { countryCode: cc, number: localDigits };
}

// Collect the complete-report delivery request details from the Result page.
// Persists the request and automatically triggers the delivery pipeline:
//   1) save the request
//   2) generate the 3-page PDF report
//   3) send it from the BYRGOP Customer Care mailbox (SMTP)
//   4) attach the generated PDF
//   5) record the delivery status on the request
// A session that was already delivered is not emailed again on UPDATE DETAILS —
// only the contact details change. Available to every completed session
// regardless of whether an email was captured on the Disclaimer page.
export async function submitKYReportRequest(
  sessionId,
  { ownerName, companyName, email, website, countryCode, phone }
) {
  const session = await KnowYourselfSession.findOne({ sessionId });
  if (!session) throw Object.assign(new Error('Session not found'), { status: 404 });
  if (session.status !== 'completed') {
    throw Object.assign(new Error('Report request is only available after the assessment is completed'), { status: 400 });
  }
  if (session.answers.length < session.selectedQuestions.length) {
    throw Object.assign(new Error('Complete all assessment questions before requesting the report'), { status: 400 });
  }

  const name = (v) => (typeof v === 'string' ? v.trim() : '');
  const owner = name(ownerName);
  const company = name(companyName);
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const web = name(website);
  const cc = name(countryCode);
  const ph = name(phone);

  if (!owner) throw Object.assign(new Error('Business owner name is required'), { status: 400 });
  if (!company) throw Object.assign(new Error('Company name is required'), { status: 400 });
  if (!EMAIL_RE.test(normalizedEmail)) {
    throw Object.assign(new Error('A valid email address is required'), { status: 400 });
  }
  if (web && !URL_RE.test(web)) {
    throw Object.assign(new Error('A valid website url is required'), { status: 400 });
  }
  const parsed = validatePhone(cc, ph);
  return saveReportRequest(session, {
    owner,
    company,
    email: normalizedEmail,
    website: web || null,
    countryCode: parsed.countryCode,
    phone: parsed.number,
  });
}

// Generate the PDF + email the report, then fold the delivery status into the
// request object. Never throws to the caller: delivery problems are persisted
// as a "failed"/"skipped" status so the request is still saved and the user is
// not blocked. Skips re-sending when this session was already delivered.
async function deliverReport(session, reportRequest) {
  if (reportRequest.emailStatus === 'sent') return;

  reportRequest.emailAttemptedAt = new Date();
  reportRequest.emailStatus = 'pending';
  reportRequest.emailError = null;

  let pdfBuffer = null;
  try {
    pdfBuffer = await buildReportPdf({ session, reportRequest });
    reportRequest.pdfGeneratedAt = new Date();
  } catch (err) {
    reportRequest.emailStatus = 'failed';
    reportRequest.emailError = `PDF generation failed: ${err.message}`;
    return;
  }

  try {
    const delivery = await sendReportEmail({
      to: reportRequest.email,
      session,
      reportRequest,
      pdfBuffer,
    });
    if (delivery.skipped) {
      reportRequest.emailStatus = 'skipped';
      reportRequest.emailError = delivery.reason || 'Email not sent';
    } else {
      reportRequest.emailStatus = 'sent';
      reportRequest.emailSentAt = new Date();
      reportRequest.emailMessageId = delivery.messageId || null;
    }
  } catch (err) {
    reportRequest.emailStatus = 'failed';
    reportRequest.emailError = err.message;
  }
}

async function saveReportRequest(session, data) {
  const prev = session.reportRequest || {};
  session.reportRequest = {
    ownerName: data.owner,
    companyName: data.company,
    email: data.email,
    website: data.website,
    countryCode: data.countryCode,
    phone: data.phone,
    requested: true,
    submittedAt: prev.submittedAt || new Date(),
    pdfGeneratedAt: prev.pdfGeneratedAt || null,
    emailStatus: prev.emailStatus || null,
    emailAttemptedAt: prev.emailAttemptedAt || null,
    emailSentAt: prev.emailSentAt || null,
    emailMessageId: prev.emailMessageId || null,
    emailError: prev.emailError || null,
  };

  await deliverReport(session, session.reportRequest);
  await session.save();

  return {
    sessionId: session.sessionId,
    requested: session.reportRequest.requested,
    submittedAt: session.reportRequest.submittedAt,
    emailStatus: session.reportRequest.emailStatus || null,
    emailMessageId: session.reportRequest.emailMessageId || null,
  };
}

