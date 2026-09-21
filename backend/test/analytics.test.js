import { test } from 'node:test';
import assert from 'node:assert/strict';

// Unit tests for the date/range helpers and the pure aggregation-building
// logic in analyticsController. The controller's model calls are mocked at the
// module level so the response shape can be exercised without a database.
// Requires node --experimental-test-module-mocks (see package.json "test").

async function loadController(t, { collections = {}, kyCategories = [] } = {}) {
  const drag = {
    countDocuments: async () => (collections.counts ? collections.counts() : 0),
    aggregate: async () => [],
    find: () => ({ sort: () => ({ limit: () => ({ select: () => ({ lean: async () => [] }) }) }) }),
  };

  const mock = {
    AssessmentSession: drag,
    KnowYourselfSession: drag,
    Category: { find: () => ({ sort: () => ({ lean: async () => [] }) }) },
  };

  const svcMock = !kyCategories.length ? {} : { getActiveKYCategories: async () => kyCategories };

  for (const [name, impl] of Object.entries(mock)) {
    await t.mock.module(`../src/models/${name}.js`, { defaultExport: impl });
  }
  await t.mock.module('../src/services/knowYourselfService.js', { namedExports: { ...svcMock, getActiveKYCategories: async () => kyCategories } });

  return import(`../src/controllers/analyticsController.js?t=${Date.now()}-${Math.random()}`);
}

test('parseDateParam: accepts YYYY-MM-DD', async (t) => {
  const c = await loadController(t);
  const r = c.parseDateParam('2026-09-10');
  assert.equal(r.ok, true);
  assert.equal(r.date.getFullYear(), 2026);
  assert.equal(r.date.getMonth(), 8);
  assert.equal(r.date.getDate(), 10);
});

test('parseDateParam: rejects wrong format', async (t) => {
  const c = await loadController(t);
  assert.equal(c.parseDateParam('10/09/2026').ok, false);
  assert.equal(c.parseDateParam('abc').ok, false);
  assert.match(c.parseDateParam('10/09/2026').error, /YY-MM-DD/);
});

test('parseDateParam: rejects impossible calendar dates', async (t) => {
  const c = await loadController(t);
  const leap = c.parseDateParam('2024-02-29');
  assert.equal(leap.ok, true);
});
test('parseDateParam: rejects non-leap Feb 29', async (t) => {
  const c = await loadController(t);
  assert.equal(c.parseDateParam('2026-02-29').ok, false);
  assert.equal(c.parseDateParam('2026-02-30').ok, false);
});

test('resolveRange: no params means all-time', async (t) => {
  const c = await loadController(t);
  const r = c.resolveRange({});
  assert.equal(r.from, null);
  assert.equal(r.toExclusive, null);
  assert.equal(r.error, null);
});

test('resolveRange: single day becomes inclusive-exclusive window', async (t) => {
  const c = await loadController(t);
  const r = c.resolveRange({ from: '2026-09-09', to: '2026-09-09' });
  assert.equal(r.error, null);
  assert.equal(r.from.getDate(), 9);
  assert.equal(r.toExclusive.getDate(), 10);
  assert.equal(r.toExclusive.getTime() - r.from.getTime(), 86400000);
});

test('resolveRange: requires both bounds together', async (t) => {
  const c = await loadController(t);
  assert.match(c.resolveRange({ from: '2026-09-09' }).error, /both from and to/);
  assert.match(c.resolveRange({ to: '2026-09-09' }).error, /both from and to/);
});

test('resolveRange: rejects reversed order', async (t) => {
  const c = await loadController(t);
  assert.match(c.resolveRange({ from: '2026-09-09', to: '2026-09-01' }).error, /on or before/);
});

test('resolveRange: rejects malformed date values', async (t) => {
  const c = await loadController(t);
  assert.match(c.resolveRange({ from: 'nope', to: '2026-09-09' }).error, /YY-MM-DD/);
  assert.match(c.resolveRange({ from: '2026-02-30', to: '2026-09-09' }).error, /valid calendar date/);
});

test('analyticsData: empty db yields zeroed response with no errors', async (t) => {
  const c = await loadController(t, {
    kyCategories: [
      { key: 'strategic-direction', name: 'Strategic Direction', color: '#0A78CF', sortOrder: 1 },
    ],
  });
  const data = await c.analyticsData({ from: '2026-09-01', to: '2026-09-10' });
  assert.equal(data.activity.onboarding.started, 0);
  assert.equal(data.activity.onboarding.completed, 0);
  assert.equal(data.activity.knowYourself.completed, 0);
  assert.equal(data.email.requested, 0);
  assert.equal(data.email.byStatus.sent, 0);
  assert.equal(data.sessions.length, 0);
  // Pillar + area scaffolds are present so the UI can render zero states.
  assert.equal(data.activity.knowYourself.pillars.length, 1);
  assert.equal(data.activity.onboarding.areas.length, 3);
  // Area display labels use the canonical mapping (revenue → Finances).
  const names = data.activity.onboarding.areas.map((a) => a.name);
  assert.deepEqual(names, ['Strategy', 'Operations', 'Finances']);
});

test('analyticsData: response exposes full aggregate shape', async (t) => {
  const c = await loadController(t);
  const data = await c.analyticsData({});
  const k = data.activity.knowYourself;
  assert.ok(typeof data.activity.onboarding.started === 'number');
  assert.ok(data.activity.onboarding.avgScore === null || typeof data.activity.onboarding.avgScore === 'number');
  assert.ok(Array.isArray(k.bands));
  assert.ok(Array.isArray(k.domains));
  assert.ok(Array.isArray(k.businessTypes));
  for (const s of ['sent', 'failed', 'pending', 'skipped', 'untracked']) {
    assert.equal(typeof data.email.byStatus[s], 'number');
  }
  // Bands reflect the KY result band enum.
  assert.ok(k.bands.some((b) => b.band === 'STRONG FOUNDATION'));
});