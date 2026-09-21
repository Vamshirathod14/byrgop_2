import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateActiveQuestion } from '../src/models/Question.js';

// Unit tests for the intro onboarding question system. There is NO generic /
// common question bank and NO fallback:
//   - each of the four business types resolves exactly its own active questions,
//   - a type with zero active questions is "unavailable" (empty config, no
//     substitution of another type's questions),
//   - sessions pin the selected business type and can never switch sets,
//   - the dedicated admin endpoints/service are strictly businessType-scoped.
// Mongoose models are mocked at the module level (node --experimental-test-module-mocks).

const CATS = [
  { _id: 'C1', key: 'strategic', name: 'Strategic', color: '#0A78CF', sortOrder: 1 },
  { _id: 'C2', key: 'operational', name: 'Operational', color: '#0D8845', sortOrder: 2 },
  { _id: 'C3', key: 'revenue', name: 'Revenue', color: '#F5630D', sortOrder: 3 },
];
const BY_CAT = new Map(CATS.map((c) => [String(c._id), c]));

const SERVICE_STRAT = 'Do you spend 80% of your day firefighting operational issues rather than focusing on strategic growth?';
const SERVICE_OPS = 'Can you take 15 days off without work calling you?';
const SERVICE_REV = "Do you think despite increasing your revenue, your bottom line net profit isn't growing?";

const MANUFACTURING_STRAT = 'Do you spend 80% of your day firefighting operational issues rather than focusing on strategic growth?';
const MANUFACTURING_OPS = 'Can you take 15 days off without work calling you?';
const MANUFACTURING_REV = "Do you think despite increasing your revenue, your bottom line net profit isn't growing?";

const STARTUP_STRAT = 'Are you spending excessive cycles refining capabilities and presenting, instead of confirming PMF and sustained user retention?';
const STARTUP_OPS = 'Do solution implementation, client onboarding, and routine fulfillment execute seamlessly without requiring continual founder oversight?';
const STARTUP_REV = 'Are you finding that notwithstanding successful capital raises or user growth, your unit-level profitability and cash runway diminish rapidly?';

const NONPROFIT_STRAT = 'Are you spending more time chasing grant requirements and writing proposals than checking if your programs actually create real impact?';
const NONPROFIT_OPS = 'Can your team run daily community programs and field activities without you stepping in to handle every issue?';
const NONPROFIT_REV = 'Are you struggling to keep the lights on and cover basic costs, even when you win new grants or receive donations?';

const LEGACY_GENERIC_STRAT = 'Legacy generic strategy record (must never be served)';
const LEGACY_GENERIC_OPS = 'Legacy generic operations record (must never be served)';
const LEGACY_GENERIC_REV = 'Legacy generic revenue record (must never be served)';

function q(businessType, key, text, displayOrder, overrides = {}) {
  return {
    _id: `q-${businessType}-${key}`,
    text,
    category: CATS.find((c) => c.key === key)._id,
    businessType,
    weight: 10,
    stageKey: null,
    displayOrder,
    active: true,
    options: [
      { text: 'Yes', score: 1, stageKey: 'recommendations', active: true },
      { text: 'No', score: 0, stageKey: 'initiation', active: true },
    ],
    save: async function () {
      return this;
    },
    ...overrides,
  };
}

const SERVICE = {
  strategic: q('service', 'strategic', SERVICE_STRAT, 1),
  operational: q('service', 'operational', SERVICE_OPS, 2),
  revenue: q('service', 'revenue', SERVICE_REV, 3),
};
const MANUFACTURING = {
  strategic: q('manufacturing', 'strategic', MANUFACTURING_STRAT, 1),
  operational: q('manufacturing', 'operational', MANUFACTURING_OPS, 2),
  revenue: q('manufacturing', 'revenue', MANUFACTURING_REV, 3),
};
const STARTUP = {
  strategic: q('startup', 'strategic', STARTUP_STRAT, 1),
  operational: q('startup', 'operational', STARTUP_OPS, 2),
  revenue: q('startup', 'revenue', STARTUP_REV, 3),
};
const NONPROFIT = {
  strategic: q('nonprofit', 'strategic', NONPROFIT_STRAT, 1),
  operational: q('nonprofit', 'operational', NONPROFIT_OPS, 2),
  revenue: q('nonprofit', 'revenue', NONPROFIT_REV, 3),
};
// Legacy generic (businessType null) records that must never be returned.
const LEGACY_GENERIC = {
  strategic: q(null, 'strategic', LEGACY_GENERIC_STRAT, 1),
  operational: q(null, 'operational', LEGACY_GENERIC_OPS, 2),
  revenue: q(null, 'revenue', LEGACY_GENERIC_REV, 3),
};

// Every valid type fully configured.
const ALL = { service: SERVICE, manufacturing: MANUFACTURING, nonprofit: NONPROFIT, startup: STARTUP };

// Bucket factories: { businessTypeKey -> { categoryKey -> doc|doc[] } }
function bucketsFrom(typeMap) {
  return { ...typeMap };
}

// ---------------------------------------------------------------------------
// Mock factories (chainable-sync so `.sort(...).lean()` chains keep working)
// ---------------------------------------------------------------------------

function makeCategoryMock(cats) {
  return {
    find: () => ({ sort: () => ({ lean: async () => cats.map((c) => ({ ...c })) }) }),
    findOne: async (query) => cats.find((c) => c.key === query.key) || null,
    findById: async (id) => cats.find((c) => c._id === id) || null,
  };
}

// Question documents live flat in `docs` (businessType + category + active).
function flatten(bucket) {
  const out = [];
  for (const [bt, byCat] of Object.entries(bucket)) {
    for (const [, entry] of Object.entries(byCat || {})) {
      const arr = Array.isArray(entry) ? entry : [entry];
      for (const d of arr) out.push(d);
    }
  }
  return out;
}

function makeQuestionMock(bucket, { createdHook } = {}) {
  const docs = flatten(bucket);
  const byId = new Map(docs.map((d) => [String(d._id), d]));

  const docForCat = (query) => {
    if (!query || query.category == null) return null;
    const cat = BY_CAT.get(String(query.category));
    if (!cat) return null;
    const entries = (bucket[query.businessType ?? 'null'] || {})[cat.key] || [];
    const arr = Array.isArray(entries) ? entries : [entries];
    return (
      arr
        .filter((d) => !query.active || d.active)
        .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))[0] || null
    );
  };

  const listFor = (query) => {
    const bt = query.businessType;
    const out = docs.filter(
      (d) => d.businessType === bt && (!query.category || String(d.category) === String(query.category)) && (!query.active || d.active)
    );
    return out.map((d) => ({ ...d, category: BY_CAT.get(String(d.category)) || null }));
  };

  return {
    findOne: (query) => {
      const doc = docForCat(query);
      return {
        sort: () => ({ lean: async () => (doc ? { ...doc } : null) }),
        lean: async () => (doc ? { ...doc } : null),
      };
    },
    find: (query) => ({
      populate: () => ({ sort: () => ({ lean: async () => listFor(query) }) }),
    }),
    findById: (id) => {
      // Awaitable directly AND chainable with .populate(...) for both the
      // submitAnswer path and the admin service reads.
      const run = async () => {
        const doc = byId.get(String(id)) || null;
        return doc ? { ...doc, category: BY_CAT.get(String(doc.category)) || null } : null;
      };
      const value = Promise.resolve().then(run);
      value.populate = () => value;
      return value;
    },
    create: async (doc) => {
      const created = {
        ...doc,
        _id: `q-created-${createdHook?.callCount ? createdHook.callCount++ : 0}`,
        save: async function () {
          return this;
        },
      };
      if (createdHook) createdHook(created);
      return created;
    },
    deleteOne: async () => true,
  };
}

function makeSessionMock(sessions = {}) {
  const created = [];
  return {
    create: async (doc) => {
      const s = {
        ...doc,
        answers: [],
        save: async function () {
          this.__saved = true;
          return this;
        },
      };
      created.push(s);
      sessions[doc.sessionId] = s;
      return s;
    },
    findOne: async ({ sessionId }) => sessions[sessionId] || null,
    created,
  };
}

async function loadModules(t, { bucket = ALL, sessions = {} } = {}) {
  const sessionMock = makeSessionMock(sessions);
  await t.mock.module('../src/models/Question.js', {
    defaultExport: makeQuestionMock(bucket),
    namedExports: { validateActiveQuestion },
    cache: false,
  });
  await t.mock.module('../src/models/Category.js', { defaultExport: makeCategoryMock(CATS), cache: false });
  await t.mock.module('../src/models/AssessmentSession.js', { defaultExport: sessionMock, cache: false });
  await t.mock.module('../src/models/Stage.js', {
    defaultExport: { find: () => ({ sort: () => ({ lean: async () => [] }) }) },
    cache: false,
  });
  await t.mock.module('../src/models/ResultContent.js', { defaultExport: { findOne: async () => null }, cache: false });

  const nonce = `${Date.now()}-${Math.random()}`;
  const questionPool = await import(`../src/services/questionPool.js?t=${nonce}`);
  const sessionFlow = await import(`../src/services/sessionFlow.js?t=${nonce}`);
  const onboardingAdminService = await import(`../src/services/onboardingAdminService.js?t=${nonce}`);
  return { questionPool, sessionFlow, onboardingAdminService, created: sessionMock.created };
}

const resolveForType = async (pool, type) => pool.getOnboardingQuestionsForType(type);

// ── Config: four types ──────────────────────────────────────────────────────

test('config exposes exactly the four intro onboarding business types', async () => {
  const { ONBOARDING_BUSINESS_TYPES, ONBOARDING_BUSINESS_TYPE_KEYS } = await import('../src/config/onboarding.js');
  assert.deepEqual(ONBOARDING_BUSINESS_TYPE_KEYS, ['service', 'manufacturing', 'nonprofit', 'startup']);
  assert.deepEqual(
    ONBOARDING_BUSINESS_TYPES.map((t) => t.label),
    ['Services', 'Manufacturing', 'Non-Profit', 'Startup']
  );
});

// ── #1-6: each type returns ONLY its own questions ─────────────────────────

test('1 — Services returns Services questions only', async (t) => {
  const { questionPool } = await loadModules(t, { bucket: ALL });
  const list = await resolveForType(questionPool, 'service');
  assert.deepEqual(list.map((q) => q.questionText), [SERVICE_STRAT, SERVICE_OPS, SERVICE_REV]);
  for (const q of list) assert.equal(q.businessType, 'service');
  // Manufacturing shares the same wording historically, so only startup /
  // non-profit / legacy generic texts would prove leakage here.
  const foreign = [STARTUP_STRAT, STARTUP_OPS, STARTUP_REV, NONPROFIT_STRAT, NONPROFIT_OPS, NONPROFIT_REV, LEGACY_GENERIC_STRAT];
  for (const q of list) assert.ok(!foreign.includes(q.questionText), 'leaked a non-Service question');
});

test('2 — Manufacturing returns Manufacturing questions only', async (t) => {
  const { questionPool } = await loadModules(t, { bucket: ALL });
  const list = await resolveForType(questionPool, 'manufacturing');
  assert.deepEqual(list.map((q) => q.questionText), [MANUFACTURING_STRAT, MANUFACTURING_OPS, MANUFACTURING_REV]);
  for (const q of list) assert.equal(q.businessType, 'manufacturing');
});

test('3 — Startup returns Startup questions only', async (t) => {
  const { questionPool } = await loadModules(t, { bucket: ALL });
  const list = await resolveForType(questionPool, 'startup');
  assert.deepEqual(list.map((q) => q.questionText), [STARTUP_STRAT, STARTUP_OPS, STARTUP_REV]);
  for (const q of list) assert.equal(q.businessType, 'startup');
  for (const q of list) {
    assert.equal(q.answerType, 'yes_no');
    assert.deepEqual(q.options.map((o) => o.text), ['Yes', 'No']);
    assert.ok(q.pillar && q.displayOrder >= 1);
  }
});

test('4 — Non-Profit returns Non-Profit questions only', async (t) => {
  const { questionPool } = await loadModules(t, { bucket: ALL });
  const list = await resolveForType(questionPool, 'nonprofit');
  assert.deepEqual(list.map((q) => q.questionText), [NONPROFIT_STRAT, NONPROFIT_OPS, NONPROFIT_REV]);
  for (const q of list) assert.equal(q.businessType, 'nonprofit');
});

test('5 — Startup never receives Services questions', async (t) => {
  const { questionPool } = await loadModules(t, { bucket: ALL });
  const list = await resolveForType(questionPool, 'startup');
  assert.ok(!list.some((q) => [SERVICE_STRAT, SERVICE_OPS, SERVICE_REV].includes(q.questionText)));
  assert.ok(!list.some((q) => [MANUFACTURING_STRAT, NONPROFIT_STRAT].includes(q.questionText)));
});

test('6 — Non-Profit never receives Manufacturing questions', async (t) => {
  const { questionPool } = await loadModules(t, { bucket: ALL });
  const list = await resolveForType(questionPool, 'nonprofit');
  assert.ok(!list.some((q) => [MANUFACTURING_STRAT, MANUFACTURING_OPS, MANUFACTURING_REV].includes(q.questionText)));
  assert.ok(!list.some((q) => [SERVICE_STRAT, STARTUP_STRAT].includes(q.questionText)));
});

// ── #7-10: zero active questions → unavailable, no fallback ─────────────────

for (const [type, label] of [
  ['manufacturing', 'Manufacturing'],
  ['service', 'Services'],
  ['startup', 'Startup'],
  ['nonprofit', 'Non-Profit'],
]) {
  test(`7/8/9/10 — ${label} with zero active questions resolves to an empty config`, async (t) => {
    // Every other type is fully configured: an unavailable type MUST NOT
    // substitute or fall back to any of them.
    const bucket = bucketsFrom({ ...ALL, [type]: {} });
    const { questionPool } = await loadModules(t, { bucket });
    const list = await resolveForType(questionPool, type);
    assert.deepEqual(list, []);
  });
}

// ── #11: inactive questions are never returned ──────────────────────────────

test('11 — inactive questions are not returned', async (t) => {
  const inactive = {
    strategic: q('startup', 'strategic', STARTUP_STRAT, 1),
    operational: { ...q('startup', 'operational', STARTUP_OPS, 2), active: false },
    revenue: q('startup', 'revenue', STARTUP_REV, 3),
  };
  const bucket = bucketsFrom({ ...ALL, startup: inactive });
  const { questionPool } = await loadModules(t, { bucket });
  const list = await resolveForType(questionPool, 'startup');
  assert.deepEqual(list.map((q) => q.questionText), [STARTUP_STRAT, STARTUP_REV]);
});

// ── #12: business type validation ───────────────────────────────────────────

test('12 — businessType is strictly validated everywhere', async (t) => {
  const { isValidOnboardingBusinessType } = await import('../src/config/onboarding.js');
  assert.equal(isValidOnboardingBusinessType('service'), true);
  assert.equal(isValidOnboardingBusinessType('manufacturing'), true);
  assert.equal(isValidOnboardingBusinessType('nonprofit'), true);
  assert.equal(isValidOnboardingBusinessType('startup'), true);
  assert.equal(isValidOnboardingBusinessType('garbage'), false);
  assert.equal(isValidOnboardingBusinessType(''), false);
  assert.equal(isValidOnboardingBusinessType(null), false);
  assert.equal(isValidOnboardingBusinessType(undefined), false);

  const { questionPool, sessionFlow } = await loadModules(t);

  // rollQuestion refuses to roll without a valid business type.
  const cat = CATS[0];
  const { error } = await questionPool.rollQuestion({ categoryKey: cat.key, category: cat, businessType: null });
  assert.match(error, /valid businessType is required/);

  // createSession refuses missing / unknown / invalid business types.
  await assert.rejects(() => sessionFlow.createSession(), /not one of the four supported types/);
  await assert.rejects(() => sessionFlow.createSession({ businessType: null }), /not one of the four supported types/);
  await assert.rejects(() => sessionFlow.createSession({ businessType: 'garbage' }), /not one of the four supported types/);
});

// ── #13: session pinning ────────────────────────────────────────────────────

test('13 — createSession pins the selected business type on the session', async (t) => {
  const { sessionFlow, created } = await loadModules(t);
  const session = await sessionFlow.createSession({ businessType: 'service' });
  assert.equal(session.categories.length, 3);
  assert.equal(created[0].businessType, 'service');
});

// ── #14: resume / continue can never switch sets ────────────────────────────

test('14 — a pinned session always rolls its own type, never another set', async (t) => {
  const startupSession = {
    sessionId: 'S-STARTUP',
    status: 'in_progress',
    businessType: 'startup',
    answers: [],
    save: async function () {
      return this;
    },
  };
  const sessions = { 'S-STARTUP': startupSession };
  // The DB holds all four types AND legacy generic records: the pinned session
  // (startup) must still resolve its own question every time.
  const { sessionFlow } = await loadModules(t, { bucket: ALL, sessions });

  const strategic = await sessionFlow.getNextQuestion('S-STARTUP', 'strategic');
  assert.equal(strategic.category, 'strategic');
  assert.equal(strategic.question.text, STARTUP_STRAT);
  assert.equal(String(startupSession.answers[0].questionText), STARTUP_STRAT);

  const operational = await sessionFlow.getNextQuestion('S-STARTUP', 'operational');
  assert.equal(operational.question.text, STARTUP_OPS);
});

// ── #15: dedicated admin service, strictly businessType-scoped ──────────────

test('15 — admin CRUD is scoped by businessType', async (t) => {
  const createdDocs = [];
  const bucket = ALL;
  await t.mock.module('../src/models/Question.js', {
    defaultExport: makeQuestionMock(bucket, { createdHook: (d) => createdDocs.push(d) }),
    namedExports: { validateActiveQuestion },
    cache: false,
  });
  await t.mock.module('../src/models/Category.js', { defaultExport: makeCategoryMock(CATS), cache: false });
  await t.mock.module('../src/models/Stage.js', { defaultExport: { find: () => ({ sort: () => ({ lean: async () => [] }) }) }, cache: false });

  const nonce = `${Date.now()}-${Math.random()}`;
  const svc = await import(`../src/services/onboardingAdminService.js?t=${nonce}`);

  // List: only Startup questions, active first.
  const list = await svc.listOnboardingQuestions({ businessType: 'startup' });
  assert.equal(list.length, 3);
  assert.ok(list.every((q) => q.businessType === 'startup'));
  assert.deepEqual(
    list.map((q) => q.text).sort(),
    [STARTUP_STRAT, STARTUP_OPS, STARTUP_REV].sort()
  );

  // List with includeInactive=true still only returns that type.
  const listAll = await svc.listOnboardingQuestions({ businessType: 'startup', includeInactive: true });
  assert.equal(listAll.length, 3);
  assert.ok(listAll.every((q) => q.businessType === 'startup'));

  // Create: builds a Startup-scoped Yes/No question.
  const created = await svc.createOnboardingQuestion({
    businessType: 'startup',
    category: 'C1',
    text: 'A brand new startup strategy question?',
  });
  assert.equal(created.businessType, 'startup');
  assert.deepEqual(created.options.map((o) => o.text), ['Yes', 'No']);
  assert.equal(created.weight, 10);

  // Update: same business type required, edits applied.
  const updated = await svc.updateOnboardingQuestion({
    id: 'q-startup-strategic',
    businessType: 'startup',
    patch: { text: 'Reworded startup strategy question?' },
  });
  assert.equal(updated.text, 'Reworded startup strategy question?');

  // Activate/deactivate: scoped to the type.
  const deactivated = await svc.setOnboardingQuestionActive({
    id: 'q-startup-operational',
    businessType: 'startup',
    active: false,
  });
  assert.equal(deactivated.active, false);
  const reactivated = await svc.setOnboardingQuestionActive({
    id: 'q-startup-operational',
    businessType: 'startup',
    active: true,
  });
  assert.equal(reactivated.active, true);

  // Delete: scoped to the type.
  const removed = await svc.deleteOnboardingQuestion({
    id: 'q-startup-revenue',
    businessType: 'startup',
  });
  assert.equal(removed.text, STARTUP_REV);
});

test('15b — admin create validates businessType and category', async (t) => {
  const { onboardingAdminService } = await loadModules(t);

  await assert.rejects(
    () => onboardingAdminService.createOnboardingQuestion({ businessType: 'garbage', category: 'C1', text: 'x?' }),
    /valid businessType is required/
  );
  await assert.rejects(
    () => onboardingAdminService.createOnboardingQuestion({ businessType: 'startup', text: 'x?' }),
    /A category is required/
  );
  await assert.rejects(
    () => onboardingAdminService.createOnboardingQuestion({ businessType: 'startup', category: 'C1', text: '' }),
    /Question text is required/
  );
});

// ── #16: mismatched businessType cannot touch another type's question ───────

test('16 — admin cannot edit/read/delete another type\'s question via mismatched businessType', async (t) => {
  const { onboardingAdminService } = await loadModules(t);

  const serviceId = 'q-service-strategic';
  await assert.rejects(
    () => onboardingAdminService.getOnboardingQuestion({ id: serviceId, businessType: 'startup' }),
    /Question not found/
  );
  await assert.rejects(
    () => onboardingAdminService.updateOnboardingQuestion({ id: serviceId, businessType: 'startup', patch: { text: 'hijacked?' } }),
    /Question not found/
  );
  await assert.rejects(
    () => onboardingAdminService.setOnboardingQuestionActive({ id: serviceId, businessType: 'startup', active: false }),
    /Question not found/
  );
  await assert.rejects(
    () => onboardingAdminService.deleteOnboardingQuestion({ id: serviceId, businessType: 'startup' }),
    /Question not found/
  );
});

// ── No generic records are ever queried or served ───────────────────────────

test('legacy generic records are never served', async (t) => {
  // DB contains ONLY legacy businessType:null records plus the null bucket.
  const bucket = bucketsFrom({ null: LEGACY_GENERIC });
  const { questionPool } = await loadModules(t, { bucket });
  for (const type of ['service', 'manufacturing', 'nonprofit', 'startup']) {
    const list = await resolveForType(questionPool, type);
    assert.deepEqual(list, [], `type '${type}' must not fall back to legacy generic records`);
  }
});

test('startup extra scoped questions resolve deterministically by displayOrder', async (t) => {
  const extra = {
    ...STARTUP,
    strategic: [
      q('startup', 'strategic', STARTUP_STRAT, 1),
      q('startup', 'strategic', 'Second scoped strategy question', 2),
    ],
  };
  const bucket = bucketsFrom({ ...ALL, startup: extra });
  const { questionPool } = await loadModules(t, { bucket });
  const cat = CATS[0];
  const { question } = await questionPool.rollQuestion({ categoryKey: cat.key, category: cat, businessType: 'startup' });
  assert.equal(question.text, STARTUP_STRAT);
});

// ── #17-18: per-question answer colours ─────────────────────────────────

test('17 — config options carry per-question colours (explicit preserved, missing defaulted)', async (t) => {
  const SERVICE_COLOURED = {
    ...SERVICE,
    strategic: q('service', 'strategic', SERVICE_STRAT, 1, {
      options: [
        { text: 'Yes', score: 1, stageKey: 'recommendations', active: true, color: '#12B76A' },
        { text: 'No', score: 0, stageKey: 'initiation', active: true, color: '#B42318' },
      ],
    }),
  };
  const bucket = bucketsFrom({ ...ALL, service: SERVICE_COLOURED });
  const { questionPool } = await loadModules(t, { bucket });
  const list = await resolveForType(questionPool, 'service');
  assert.equal(list.length, 3);

  const strategic = list.find((q) => q.categoryKey === 'strategic');
  assert.deepEqual(strategic.options, [
    { text: 'Yes', score: 1, color: '#12B76A' },
    { text: 'No', score: 0, color: '#B42318' },
  ]);

  const operational = list.find((q) => q.categoryKey === 'operational');
  assert.deepEqual(operational.options, [
    { text: 'Yes', score: 1, color: '#4CAF50' },
    { text: 'No', score: 0, color: '#E53935' },
  ]);
});

test('18 — admin create applies Yes/No colours and rejects malformed colours', async (t) => {
  const createdDocs = [];
  const bucket = ALL;
  await t.mock.module('../src/models/Question.js', {
    defaultExport: makeQuestionMock(bucket, { createdHook: (d) => createdDocs.push(d) }),
    namedExports: { validateActiveQuestion },
    cache: false,
  });
  await t.mock.module('../src/models/Category.js', { defaultExport: makeCategoryMock(CATS), cache: false });
  await t.mock.module('../src/models/Stage.js', { defaultExport: { find: () => ({ sort: () => ({ lean: async () => [] }) }) }, cache: false });

  const nonce = `${Date.now()}-${Math.random()}`;
  const svc = await import(`../src/services/onboardingAdminService.js?t=${nonce}`);

  // Missing colours fall back to the Yes/No defaults on create.
  const d1 = await svc.createOnboardingQuestion({
    businessType: 'startup',
    category: 'C1',
    text: 'Default colours question?',
  });
assert.deepEqual(d1.options.map((o) => o.color), ['#4CAF50', '#E53935']);
  assert.deepEqual(d1.options.map((o) => o.text), ['Yes', 'No']);

  // Explicit colours are preserved.
  const d2 = await svc.createOnboardingQuestion({
    businessType: 'startup',
    category: 'C1',
    text: 'Explicit colour question?',
    options: [
      { text: 'Yes', score: 1, stageKey: 'recommendations', active: true, color: '#12B76A' },
      { text: 'No', score: 0, stageKey: 'initiation', active: true, color: '#B42318' },
    ],
  });
  assert.deepEqual(d2.options.map((o) => o.color), ['#12B76A', '#B42318']);
  assert.equal(createdDocs.length, 2);

  // A malformed colour is rejected with 400 before any create.
  await assert.rejects(
    () => svc.createOnboardingQuestion({
      businessType: 'startup',
      category: 'C1',
      text: 'Bad colour question?',
      options: [
        { text: 'Yes', score: 1, active: true, color: 'green' },
        { text: 'No', score: 0, active: true },
      ],
    }),
    (err) => err.status === 400 && /Invalid answer colour/.test(err.message)
  );
  assert.equal(createdDocs.length, 2, 'rejected create must not save');

  // Update carries colours through as well.
  const updated = await svc.updateOnboardingQuestion({
    id: 'q-startup-strategic',
    businessType: 'startup',
    patch: {
      options: [
        { text: 'Yes', score: 1, active: true, color: '#0A78CF' },
        { text: 'No', score: 0, active: true },
      ],
    },
  });
  assert.deepEqual(updated.options.map((o) => o.color), ['#0A78CF', '#E53935']);
});