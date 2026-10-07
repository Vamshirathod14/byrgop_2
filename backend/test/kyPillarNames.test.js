import { test } from 'node:test';
import assert from 'node:assert/strict';

// Regression coverage for DYNAMIC PILLAR NAMES on the Know Yourself Result
// page. Admin is the single source of truth for pillar/category names:
//
//   1. The participant flow must read the SAME pillar rows the Admin category
//      pages edit. The shared Manufacturing & Services set is stored under a
//      null kyRoot; a root-id query must not read (or lazily seed) a second
//      'manufacturing-services' copy.
//   2. getKYResult must re-resolve each category's display name from the
//      CURRENT KYCategory record (matched by stable key) at read time, so an
//      Admin rename made AFTER a session completed is still shown on a fresh
//      Result page — without any frontend rebuild.
//   3. Only the display label changes: keys, scores, colours, sort order and
//      percents are the persisted values, and a deleted pillar keeps the name
//      the result was completed with.
//
// Uses module mocks (node --experimental-test-module-mocks), no database.

const SHARED_PILLARS = [
  { key: 'strategic-direction', name: 'Strategy', color: '#0A78CF', sortOrder: 1, kyRoot: null, active: true },
  { key: 'financial-performance', name: 'Finances', color: '#FCA700', sortOrder: 2, kyRoot: null, active: true },
  { key: 'sales-market-growth', name: 'Marketing', color: '#E52032', sortOrder: 3, kyRoot: null, active: true },
  { key: 'operations-execution', name: 'Operations', color: '#0D8845', sortOrder: 4, kyRoot: null, active: true },
  { key: 'people-organization', name: 'People', color: '#F5630D', sortOrder: 5, kyRoot: null, active: true },
  { key: 'digital-innovation', name: 'Technology', color: '#7038A5', sortOrder: 6, kyRoot: null, active: true },
];

const STARTUP_PILLARS = [
  { key: 'startup-market-validation', name: 'Market Validation', color: '#0A78CF', sortOrder: 1, kyRoot: 'startup', active: true },
  { key: 'startup-product-technology', name: 'Product & Technology', color: '#FCA700', sortOrder: 2, kyRoot: 'startup', active: true },
  { key: 'startup-unit-economics', name: 'Unit Economics', color: '#E52032', sortOrder: 3, kyRoot: 'startup', active: true },
  { key: 'startup-growth-engine', name: 'Growth Engine', color: '#0D8845', sortOrder: 4, kyRoot: 'startup', active: true },
  { key: 'startup-operations-velocity', name: 'Operations Velocity', color: '#F5630D', sortOrder: 5, kyRoot: 'startup', active: true },
  { key: 'startup-team-governance', name: 'Team & Governance', color: '#7038A5', sortOrder: 6, kyRoot: 'startup', active: true },
];

// A completed result as it was snapshot at completion — i.e. with the OLD
// pillar names ("Strategic Direction", "Financial Performance", …). These are
// the names the pre-fix build persisted; the current Admin rows above carry
// the renamed ("Strategy", "Finances", …) labels.
function makeResult(over = {}) {
  return {
    version: 2,
    attemptNumber: 1,
    overallPercent: 60,
    band: 'MODERATE PERFORMANCE',
    message: 'Targeted Improvements Needed',
    strongest: { key: 'operations-execution', name: 'Operations & Execution' },
    priority: { key: 'people-organization', name: 'People & Organization' },
    categories: [
      { key: 'strategic-direction', name: 'Strategic Direction', color: '#0A78CF', sortOrder: 1, score: 8, maxScore: 12, percent: 50, previousPercent: null, delta: null },
      { key: 'financial-performance', name: 'Financial Performance', color: '#FCA700', sortOrder: 2, score: 9, maxScore: 12, percent: 75, previousPercent: null, delta: null },
      { key: 'sales-market-growth', name: 'Sales & Market Growth', color: '#E52032', sortOrder: 3, score: 10, maxScore: 12, percent: 83, previousPercent: null, delta: null },
      { key: 'operations-execution', name: 'Operations & Execution', color: '#0D8845', sortOrder: 4, score: 8, maxScore: 12, percent: 50, previousPercent: null, delta: null },
      { key: 'people-organization', name: 'People & Organization', color: '#F5630D', sortOrder: 5, score: 6, maxScore: 12, percent: 33, previousPercent: null, delta: null },
      { key: 'digital-innovation', name: 'Digital & Innovation', color: '#7038A5', sortOrder: 6, score: 7, maxScore: 12, percent: 42, previousPercent: null, delta: null },
    ],
    ...over,
  };
}

function makeSession(over = {}) {
  return {
    sessionId: over.sessionId || 'S1',
    status: 'completed',
    kyRoot: over.kyRoot ?? 'manufacturing-services',
    businessType: over.businessType ?? 'service',
    email: over.email ?? 'founder@example.in',
    domain: over.domain ?? null,
    domainLabel: over.domainLabel ?? null,
    answers: [],
    result: over.result ?? null,
    reportRequest: null,
  };
}

function matches(row, filter = {}) {
  for (const [k, v] of Object.entries(filter)) {
    if (k === 'kyRoot') {
      if ((row.kyRoot ?? null) !== (v ?? null)) return false;
    } else if (row[k] !== v) {
      return false;
    }
  }
  return true;
}

async function loadService(t, sessions, rows) {
  const state = { findFilters: [] };
  await t.mock.module('../src/models/KnowYourselfSession.js', {
    defaultExport: {
      findOne: async ({ sessionId }) => sessions[sessionId] || null,
    },
  });
  await t.mock.module('../src/models/KYCategory.js', {
    defaultExport: {
      find: (filter) => {
        state.findFilters.push(filter ? { ...filter } : {});
        const out = rows.filter((r) => matches(r, filter)).map((r) => ({ ...r }));
        const chain = {
          select: () => chain,
          sort: () => chain,
          lean: async () => out,
        };
        return chain;
      },
      countDocuments: async (filter) => rows.filter((r) => matches(r, filter)).length,
      insertMany: async (docs) => {
        rows.push(...docs.map((d) => ({ ...d })));
        return docs;
      },
    },
  });
  // Query string forces a fresh module instance so each test sees its own mock.
  const svc = await import(`../src/services/knowYourselfService.js?t=${Date.now()}-${Math.random()}`);
  return { svc, state };
}

const OLD_NAMES = ['Strategic Direction', 'Financial Performance', 'Sales & Market Growth',
  'Operations & Execution', 'People & Organization', 'Digital & Innovation'];

/* ── 1. The participant flow reads the Admin-edited (null-rooted) rows ──── */

test('getActiveKYCategories reads the shared set from the null-rooted rows, not a root-id copy', async (t) => {
  // Add an ORPHANED duplicate copy keyed by the root id (the pre-existing bug:
  // rows stored under kyRoot "manufacturing-services"). The participant flow
  // must ignore it and use the Admin-edited null-rooted rows.
  const rows = [
    ...SHARED_PILLARS.map((r) => ({ ...r })),
    { key: 'strategic-direction', name: 'Orphan Copy', color: '#0A78CF', sortOrder: 1, kyRoot: 'manufacturing-services', active: true },
  ];
  const { svc, state } = await loadService(t, {}, rows);

  const cats = await svc.getActiveKYCategories('manufacturing-services');
  assert.equal(cats.length, 6);
  assert.deepEqual(cats.map((c) => c.name), ['Strategy', 'Finances', 'Marketing', 'Operations', 'People', 'Technology']);
  assert.ok(cats.every((c) => (c.kyRoot ?? null) === null), 'no root-id copy may be served');
  // The query that ran was scoped to the ADMIN rows: { active: true, kyRoot: null }.
  assert.ok(state.findFilters.some((f) => f.active === true && (f.kyRoot ?? null) === null));
  assert.ok(!state.findFilters.some((f) => f.kyRoot === 'manufacturing-services'), 'must never query the duplicate root-id copy');
});

test('getActiveKYCategories resolves the shared set for a generic (no-root) session too', async (t) => {
  const { svc } = await loadService(t, {}, SHARED_PILLARS.map((r) => ({ ...r })));
  const cats = await svc.getActiveKYCategories(undefined);
  assert.equal(cats.length, 6);
  assert.equal(cats.find((c) => c.key === 'operations-execution').name, 'Operations');
});

test('first-use seeding writes the shared set under a null kyRoot, never the root id', async (t) => {
  const rows = [];
  const { svc } = await loadService(t, {}, rows);
  const cats = await svc.getActiveKYCategories('manufacturing-services');
  assert.equal(cats.length, 6, 'empty set is seeded on first use');
  assert.ok(rows.every((r) => (r.kyRoot ?? null) === null), 'seeded rows must use the stored null kyRoot');
  assert.ok(!rows.some((r) => r.kyRoot === 'manufacturing-services'), 'seeding must not recreate the duplicate copy');
  // The seed writes pillarForRoot's config defaults (the fallback names), keyed
  // into the SAME null-rooted set the Admin edits.
  assert.deepEqual(rows.map((r) => r.name).sort(), [
    'Digital & Innovation',
    'Financial Performance',
    'Operations & Execution',
    'People & Organization',
    'Sales & Market Growth',
    'Strategic Direction',
  ]);
});

/* ── 2. An Admin rename is reflected by the result API at read time ─────── */

test('getKYResult returns the current Admin pillar name after a rename (not the persisted one)', async (t) => {
  const session = makeSession({ result: makeResult() });
  const { svc } = await loadService(t, { S1: session }, SHARED_PILLARS.map((r) => ({ ...r })));

  const res = await svc.getKYResult('S1');
  const names = res.result.categories.map((c) => c.name);
  assert.deepEqual(names, ['Strategy', 'Finances', 'Marketing', 'Operations', 'People', 'Technology']);
  // strongest/priority re-labelled from the same current rows.
  assert.equal(res.result.strongest.name, 'Operations');
  assert.equal(res.result.priority.name, 'People');
});

test('the result never falls back to the old name while the current name exists', async (t) => {
  const session = makeSession({ result: makeResult() });
  const { svc } = await loadService(t, { S1: session }, SHARED_PILLARS.map((r) => ({ ...r })));

  const res = await svc.getKYResult('S1');
  // No presentation surface may show a name we no longer own — every returned
  // label is the CURRENT Admin name, never the value written at completion.
  assert.ok(!res.result.categories.some((c) => OLD_NAMES.includes(c.name)), 'an old name leaked into the result');
  assert.ok(![res.result.strongest.name, res.result.priority.name].some((n) => OLD_NAMES.includes(n)));
});

test('only the display label changes — keys, scores, colours, percents and order are preserved', async (t) => {
  const persisted = makeResult();
  const session = makeSession({ result: persisted });
  const { svc } = await loadService(t, { S1: session }, SHARED_PILLARS.map((r) => ({ ...r })));

  const res = await svc.getKYResult('S1');
  assert.equal(res.result.version, 2);
  assert.equal(res.result.overallPercent, persisted.overallPercent);
  assert.equal(res.result.band, persisted.band);
  res.result.categories.forEach((c, i) => {
    const before = persisted.categories[i];
    assert.equal(c.key, before.key);
    assert.equal(c.color, before.color);
    assert.equal(c.sortOrder, before.sortOrder);
    assert.equal(c.score, before.score);
    assert.equal(c.maxScore, before.maxScore);
    assert.equal(c.percent, before.percent);
  });
  // The stored session document is untouched — re-resolution is read-time only.
  assert.equal(persisted.categories[0].name, 'Strategic Direction');
  assert.equal(session.result.categories[0].name, 'Strategic Direction');
});

test('a pillar deleted from Admin keeps the name the result was completed with', async (t) => {
  // Remove "operations-execution" from the current Admin set (the row was
  // deleted). Its result entry must keep its persisted name, not become empty.
  const rows = SHARED_PILLARS.filter((r) => r.key !== 'operations-execution').map((r) => ({ ...r }));
  const session = makeSession({ result: makeResult() });
  const { svc } = await loadService(t, { S1: session }, rows);

  const res = await svc.getKYResult('S1');
  const byKey = new Map(res.result.categories.map((c) => [c.key, c.name]));
  assert.equal(byKey.get('operations-execution'), 'Operations & Execution', 'deleted pillar keeps its completed name');
  assert.equal(byKey.get('strategic-direction'), 'Strategy', 'live pillars still show the current name');
});

test('an Admin rename is reflected for Start-Up sessions too', async (t) => {
  // Start-Up rows: persisted result carries the old names, current rows carry
  // renamed ones — nudge one rename to prove it is read live, not from config.
  const rows = STARTUP_PILLARS.map((r) => ({ ...r }));
  rows[0] = { ...rows[0], name: 'Market Fit Validation' };
  const persisted = makeResult({ categories: STARTUP_PILLARS.map((p) => ({
    key: p.key, name: p.name, color: p.color, sortOrder: p.sortOrder,
    score: 8, maxScore: 12, percent: 50, previousPercent: null, delta: null,
  })), strongest: { key: 'startup-market-validation', name: 'Market Validation' }, priority: { key: 'startup-team-governance', name: 'Team & Governance' } });
  const session = makeSession({ sessionId: 'S2', kyRoot: 'startup', businessType: 'startup', result: persisted });
  const { svc } = await loadService(t, { S2: session }, rows);

  const res = await svc.getKYResult('S2');
  assert.equal(res.result.categories[0].name, 'Market Fit Validation');
  assert.equal(res.result.strongest.name, 'Market Fit Validation');
  assert.equal(res.result.categories[2].name, 'Unit Economics', 'un-renamed pillars are unchanged');
});

/* ── 3. The emailed PDF report is generated from the current names too ──── */

test('the report PDF is built with the current Admin pillar names, never the persisted ones', async (t) => {
  const result = makeResult();
  const session = {
    sessionId: 'S3',
    status: 'completed',
    kyRoot: 'manufacturing-services',
    businessType: 'service',
    email: 'report@example.in',
    answers: Array.from({ length: 18 }, (_, i) => ({ questionIndex: i, optionId: 'o' + i })),
    selectedQuestions: Array.from({ length: 18 }, (_, i) => ({ questionId: String(i), text: 'Q' + i })),
    result,
    reportRequest: null,
    saved: 0,
    async save() {
      this.saved += 1;
    },
  };
  const sessions = { S3: session };

  let received = null;
  await t.mock.module('../src/services/reportPdfService.js', {
    namedExports: {
      buildReportPdf: async (arg) => {
        received = arg;
        return Buffer.from('%PDF-fake');
      },
    },
  });
  await t.mock.module('../src/models/KnowYourselfSession.js', {
    defaultExport: {
      findOne: async ({ sessionId }) => sessions[sessionId] || null,
    },
  });
  await t.mock.module('../src/models/KYCategory.js', {
    defaultExport: {
      find: () => ({ select: () => ({ lean: async () => SHARED_PILLARS.map((r) => ({ ...r })) }) }),
      countDocuments: async () => 0,
      insertMany: async () => [],
    },
  });
  const svc = await import(`../src/services/knowYourselfService.js?t=${Date.now()}-${Math.random()}`);

  await svc.submitKYReportRequest('S3', {
    ownerName: 'Neha Sharma',
    companyName: 'Spark Manufacturing',
    email: 'report@example.in',
    website: 'https://spark.example',
    countryCode: '+91',
    phone: '9876543210',
  });

  assert.ok(received, 'buildReportPdf was called');
  assert.deepEqual(
    received.session.result.categories.map((c) => c.name),
    ['Strategy', 'Finances', 'Marketing', 'Operations', 'People', 'Technology']
  );
  // The persisted result and the stored session are untouched.
  assert.equal(result.categories[0].name, 'Strategic Direction');
  assert.notEqual(received.session.result.categories[0].name, 'Strategic Direction');
});