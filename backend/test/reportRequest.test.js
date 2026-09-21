import { test } from 'node:test';
import assert from 'node:assert/strict';

// Unit tests for the report-request phone persistence path in
// knowYourselfService.submitKYReportRequest. The Mongoose model is mocked at
// the module level so the service logic can be exercised without a database.
// Requires node --experimental-test-module-mocks (see package.json "test").

async function loadService(t, sessionsById) {
  await t.mock.module('../src/models/KnowYourselfSession.js', {
    defaultExport: {
      findOne: async ({ sessionId }) => sessionsById[sessionId] || null,
    },
  });
  // Query string forces a fresh module instance so this test sees its own mock.
  return import(`../src/services/knowYourselfService.js?t=${Date.now()}-${Math.random()}`);
}

function makeSession(over = {}) {
  const total = 18;
  const answers = Array.from({ length: total }, (_, i) => ({ questionIndex: i, optionId: 'o' + i }));
  const selectedQuestions = Array.from({ length: total }, (_, i) => ({ questionId: String(i) }));
  return {
    sessionId: 'S1',
    status: 'completed',
    answers,
    selectedQuestions,
    reportRequest: over.reportRequest || null,
    saved: 0,
    async save() {
      this.saved += 1;
    },
  };
}

const valid = {
  ownerName: 'Neha Sharma',
  companyName: 'Spark Manufacturing',
  email: 'neha@spark.example',
  website: 'https://spark.example',
  countryCode: '+91',
  phone: '9876543210',
};

test('report request: phone + countryCode submitted are both persisted (and reported happy)', async (t) => {
  const session = makeSession();
  const svc = await loadService(t, { S1: session });
  const res = await svc.submitKYReportRequest('S1', valid);
  assert.equal(session.reportRequest.countryCode, '+91');
  assert.equal(session.reportRequest.phone, '9876543210');
  assert.equal(res.requested, true);
  assert.equal(session.saved, 1, 'session saved exactly once');
});

test('report request: countryCode stored separately from local phone number', async (t) => {
  const session = makeSession();
  const svc = await loadService(t, { S1: session });
  await svc.submitKYReportRequest('S1', { ...valid, countryCode: '+44', phone: '7700900123' });
  assert.equal(session.reportRequest.countryCode, '+44');
  assert.equal(session.reportRequest.phone, '7700900123');
});

test('report request: India (+91) phone must be exactly 10 digits', async (t) => {
  const session = makeSession();
  const svc = await loadService(t, { S1: session });
  await svc.submitKYReportRequest('S1', { ...valid, countryCode: '+91', phone: '9876543210' });
  assert.equal(session.reportRequest.countryCode, '+91');
  assert.equal(session.reportRequest.phone, '9876543210');
});

test('report request: India (+91) rejects 9 digits', async (t) => {
  const session = makeSession();
  const svc = await loadService(t, { S1: session });
  await assert.rejects(
    () => svc.submitKYReportRequest('S1', { ...valid, countryCode: '+91', phone: '987654321' }),
    /exactly 10 digits/i
  );
});

test('report request: India (+91) rejects 11 digits', async (t) => {
  const session = makeSession();
  const svc = await loadService(t, { S1: session });
  await assert.rejects(
    () => svc.submitKYReportRequest('S1', { ...valid, countryCode: '+91', phone: '98765432101' }),
    /exactly 10 digits/i
  );
});

test('report request: India (+91) rejects non-numeric characters', async (t) => {
  const session = makeSession();
  const svc = await loadService(t, { S1: session });
  await assert.rejects(
    () => svc.submitKYReportRequest('S1', { ...valid, countryCode: '+91', phone: '98765abc10' }),
    /exactly 10 digits/i
  );
});

test('report request: other countries keep a generic digit range (not India rule)', async (t) => {
  const session = makeSession();
  const svc = await loadService(t, { S1: session });
  await svc.submitKYReportRequest('S1', { ...valid, countryCode: '+44', phone: '7700900123' });
  assert.equal(session.reportRequest.countryCode, '+44');
  assert.equal(session.reportRequest.phone, '7700900123');
});

test('report request: other countries reject too-short numbers', async (t) => {
  const session = makeSession();
  const svc = await loadService(t, { S1: session });
  await assert.rejects(
    () => svc.submitKYReportRequest('S1', { ...valid, countryCode: '+44', phone: '12' }),
    /valid phone number/i
  );
});

test('report request: phone is required (missing is rejected)', async (t) => {
  const session = makeSession();
  const svc = await loadService(t, { S1: session });
  const { phone, ...withoutPhone } = valid;
  await assert.rejects(
    () => svc.submitKYReportRequest('S1', withoutPhone),
    /valid phone|phone number/i
  );
});

test('report request: phone is required (blank is rejected)', async (t) => {
  const session = makeSession();
  const svc = await loadService(t, { S1: session });
  await assert.rejects(
    () => svc.submitKYReportRequest('S1', { ...valid, phone: '   ' }),
    /valid phone|phone number/i
  );
});

test('report request: updating same session preserves record and updates phone (no duplicate)', async (t) => {
  const session = makeSession();
  const svc = await loadService(t, { S1: session });
  const first = await svc.submitKYReportRequest('S1', { ...valid, countryCode: '+91', phone: '9876543210' });
  const submittedAt = session.reportRequest.submittedAt;
  const second = await svc.submitKYReportRequest('S1', { ...valid, countryCode: '+44', phone: '7700900123' });
  // Same record, same submission timestamp, updated phone/country.
  assert.equal(session.reportRequest.countryCode, '+44');
  assert.equal(session.reportRequest.phone, '7700900123');
  assert.equal(second.submittedAt.getTime(), submittedAt.getTime(), 'submission timestamp preserved across update');
  assert.equal(first.submittedAt.getTime(), submittedAt.getTime());
  assert.ok(second.submittedAt instanceof Date);
});

test('report request: invalid provided phone is rejected', async (t) => {
  const session = makeSession();
  const svc = await loadService(t, { S1: session });
  await assert.rejects(
    () => svc.submitKYReportRequest('S1', { ...valid, countryCode: '+91', phone: '12' }),
    /phone/i
  );
});
