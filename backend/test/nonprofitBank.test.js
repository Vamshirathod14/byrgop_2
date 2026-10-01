/* ─────────────────────────────────────────────────────────────────────────
   NON-PROFIT BANK REGRESSION — the 18-question dataset, end to end.

   This file is the tripwire for the failure that actually happened: the
   question bank was correct in src/config, but the Admin API and the
   participant flow read a DIFFERENT database, so all 18 were invisible.
   A config-only assertion cannot catch that. Everything here therefore
   checks the layer the bug lived in — the served dataset and the two API
   surfaces that consume it — and the assertions are deliberately literal
   (exact texts, exact counts, exact pillars) so a later edit that silently
   drops, renames or re-pillars a question fails here rather than in
   production.

   These tests skip when no database is reachable, so the suite still runs
   in a checkout with no Mongo.
   ───────────────────────────────────────────────────────────────────────── */

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

import { connectDB } from '../src/config/db.js';
import mongoose from 'mongoose';
import KnowYourselfQuestion from '../src/models/KnowYourselfQuestion.js';
import KnowYourselfSession from '../src/models/KnowYourselfSession.js';
import { listKYQuestions } from '../src/controllers/knowYourselfController.js';
import {
  startKYAssignment,
  getKYQuestion,
  submitKYAnswer,
  getKYResult,
} from '../src/services/knowYourselfService.js';
import { PILLARS_BY_ROOT, pillarsForRoot } from '../src/config/kyQuestionRoots.js';

/* The 18 required questions, in the required order. Each entry is
   [canonical pillar key, exact expected opening]. */
const REQUIRED_NONPROFIT_BANK = [
  ['nonprofit-strategy', 'Does your organization have a clear plan for long-term change'],
  ['nonprofit-strategy', 'How do you collect and check the results of your programs'],
  ['nonprofit-strategy', 'How do leaders decide which grants'],
  ['nonprofit-revenue', 'Where does your yearly money come from'],
  ['nonprofit-revenue', 'How well do you keep donors and follow the tax rules for donations'],
  ['nonprofit-revenue', 'How do you share money reports with donors and CSR committees'],
  ['nonprofit-operations', 'How well are your on-ground field execution procedures written down and followed'],
  ['nonprofit-operations', 'How do you find and fix problems that slow down field work'],
  ['nonprofit-operations', 'How can community members give feedback or make complaints'],
  ['nonprofit-finance', 'How many months of spare cash do you have in case payments are late'],
  ['nonprofit-finance', 'Are your tax and legal registrations up to date'],
  ['nonprofit-finance', 'How do you manage admin costs across different funders'],
  ['nonprofit-people-culture', 'How do you check staff pay, workload, and burnout'],
  ['nonprofit-people-culture', 'How do you manage and screen volunteers'],
  ['nonprofit-people-culture', 'What happens if a top leader or key program head leaves suddenly'],
  ['nonprofit-governance', 'How does your governing body/ board oversee the organization'],
  ['nonprofit-governance', 'Do you file all required reports on on time'.replace('on on time', 'on time')],
  ['nonprofit-governance', 'How open are your accounts, reports and governance details'],
];

/** Every pillar key that must NEVER appear on a Non-Profit question. */
const FORBIDDEN_PILLARS = [
  'strategic-direction',
  'financial-performance',
  'sales-market-growth',
  'operations-execution',
  'people-organization',
  'digital-innovation',
];

/** Substrings that identify Manufacturing/Services and Humanitarian content. */
const FOREIGN_QUESTION_MARKERS = [
  'cold chain',
  'voucher assistance',
  'relief supplies',
  'relief vehicle',
  'emergency kits',
  'coordination clusters',
  'spontaneous and registered volunteers',
  'onset of an emergency',
];

let dbUp = false;
let createdSessions = [];

before(async () => {
  try {
    await connectDB();
    dbUp = true;
  } catch {
    dbUp = false;
  }
});

after(async () => {
  if (!dbUp) return;
  if (createdSessions.length) {
    await KnowYourselfSession.deleteMany({ sessionId: { $in: createdSessions } });
  }
  await mongoose.disconnect();
});

function db(name, fn) {
  return test(name, async (t) => {
    if (!dbUp) return t.skip('no database reachable');
    return fn(t);
  });
}

/** A minimal stand-in for the Express response the controllers write to. */
function fakeRes() {
  const r = {
    statusCode: 200,
    body: undefined,
    status(c) {
      r.statusCode = c;
      return r;
    },
    json(b) {
      r.body = b;
      return r;
    },
  };
  return r;
}

const ngoActive = () =>
  KnowYourselfQuestion.find({ businessType: 'ngo', active: true }).lean();

/* ══ DB ══════════════════════════════════════════════════════════════ */

db('DB: exactly 18 active Non-Profit questions exist', async () => {
  assert.equal((await ngoActive()).length, 18);
});

db('DB: the six canonical Non-Profit pillars hold exactly 3 active questions each', async () => {
  const rows = await ngoActive();
  const keys = PILLARS_BY_ROOT['non-profit'].map((p) => p.key);
  for (const key of keys) {
    assert.equal(
      rows.filter((q) => q.category === key).length,
      3,
      `${key} must hold exactly 3 active questions`
    );
  }
  assert.equal(keys.length, 6, 'the Non-Profit root must declare six pillars');
});

db('DB: every active question carries the exact Non-Profit ownership fields', async () => {
  for (const q of await ngoActive()) {
    assert.equal(q.businessType, 'ngo', `businessType of "${q.text.slice(0, 40)}…"`);
    assert.equal(q.kyRoot, 'non-profit', `kyRoot of "${q.text.slice(0, 40)}…"`);
    assert.equal(q.type, 'generic', `type of "${q.text.slice(0, 40)}…"`);
    assert.equal(q.domain, null, `domain of "${q.text.slice(0, 40)}…"`);
    assert.notEqual(q.active, false);
  }
});

db('DB: all 18 required questions are present, each in its required pillar', async () => {
  const rows = await ngoActive();
  for (const [pillar, opening] of REQUIRED_NONPROFIT_BANK) {
    const q = rows.find((x) => x.text.startsWith(opening));
    assert.ok(q, `missing required question: "${opening}…"`);
    assert.equal(q.category, pillar, `"${opening}…" must sit in ${pillar}`);
  }
});

db('DB: no duplicate or leftover versions of the 18 are still active', async () => {
  const rows = await ngoActive();
  assert.equal(rows.length, 18, 'an extra/superseded active copy exists');
  const texts = rows.map((q) => q.text);
  assert.equal(new Set(texts).size, 18, 'duplicate question text among the active 18');
  const superseded = rows.filter((q) => /conflicts of interest/i.test(q.text));
  assert.equal(superseded.length, 0, 'the retired conflicts-of-interest question is still active');
});

db('DB: every active option list is A/B/C/D scored best→worst 4/3/2/1', async () => {
  for (const q of await ngoActive()) {
    assert.equal(q.options.length, 4, `"${q.text.slice(0, 40)}…" must have 4 options`);
    assert.deepEqual(
      q.options.map((o) => o.score),
      [4, 3, 2, 1],
      `"${q.text.slice(0, 40)}…" options must be stored best→worst`
    );
  }
});

db('DB: no Non-Profit question sits on a Manufacturing/Services pillar', async () => {
  for (const q of await ngoActive()) {
    assert.ok(!FORBIDDEN_PILLARS.includes(q.category), `Non-Profit question on Mfg/Services pillar ${q.category}`);
  }
});

db('DB: no Non-Profit question carries Humanitarian / domain content', async () => {
  for (const q of await ngoActive()) {
    for (const marker of FOREIGN_QUESTION_MARKERS) {
      assert.ok(
        !q.text.toLowerCase().includes(marker),
        `Non-Profit question contains domain content "${marker}"`
      );
    }
  }
});

db('DB: retired questions are retained, not deleted', async () => {
  const retired = await KnowYourselfQuestion.find({ businessType: 'ngo', active: false }).lean();
  assert.ok(retired.length > 0, 'the superseded Non-Profit history must be kept as inactive');
  const coi = retired.find((q) => /conflicts of interest/i.test(q.text));
  assert.ok(coi, 'the retired conflicts-of-interest question must still exist, inactive');
  assert.equal(coi.active, false);
});

db('DB: a retired question is never what the active query returns', async () => {
  const rows = await ngoActive();
  assert.ok(!rows.some((q) => /conflicts of interest/i.test(q.text)));
});

/* ══ ADMIN API ═══════════════════════════════════════════════════════ */

db('Admin: the Non-Profit questions list returns exactly the 18 active questions', async () => {
  const res = fakeRes();
  await listKYQuestions({ query: { root: 'non-profit' } }, res, (e) => {
    throw e;
  });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.length, 18);
  for (const q of res.body) {
    assert.equal(q.kyRoot, 'non-profit');
    assert.equal(q.type, 'generic');
    assert.equal(q.domain, null);
  }
});

db('Admin: the Non-Profit list shows 3 per pillar on the canonical keys', async () => {
  const res = fakeRes();
  await listKYQuestions({ query: { root: 'non-profit' } }, res, (e) => {
    throw e;
  });
  for (const p of pillarsForRoot('non-profit')) {
    assert.equal(res.body.filter((q) => q.category === p.key).length, 3, `${p.key} in the Admin list`);
  }
});

db('Admin: retired questions are excluded from the default list but reachable on request', async () => {
  const active = fakeRes();
  await listKYQuestions({ query: { root: 'non-profit' } }, active, (e) => {
    throw e;
  });
  const all = fakeRes();
  await listKYQuestions({ query: { root: 'non-profit', includeInactive: 'true' } }, all, (e) => {
    throw e;
  });
  assert.equal(active.body.length, 18);
  assert.ok(all.body.length > active.body.length, 'inactive questions must be requestable for the archive view');
  assert.ok(
    all.body.some((q) => q.active === false && /conflicts of interest/i.test(q.text)),
    'the retired question must be visible in the includeInactive view'
  );
});

db('Admin: the Non-Profit root never lists Start-Up or Manufacturing/Services questions', async () => {
  const res = fakeRes();
  await listKYQuestions({ query: { root: 'non-profit' } }, res, (e) => {
    throw e;
  });
  for (const q of res.body) {
    assert.ok(!String(q.category).startsWith('startup-'), `Start-Up pillar leaked: ${q.category}`);
    assert.ok(!FORBIDDEN_PILLARS.includes(q.category), `Mfg/Services pillar leaked: ${q.category}`);
  }
});

db('Admin: the Start-Up root still lists exactly its own 18', async () => {
  const res = fakeRes();
  await listKYQuestions({ query: { root: 'startup' } }, res, (e) => {
    throw e;
  });
  assert.equal(res.body.length, 18);
  assert.ok(res.body.every((q) => String(q.category).startsWith('startup-')));
  assert.ok(res.body.every((q) => q.domain === null));
});

/* ══ PARTICIPANT ASSIGNMENT API ══════════════════════════════════════ */

async function assign(businessType) {
  const session = await startKYAssignment(
    `regression.${businessType}.${Date.now()}@example.com`,
    null,
    businessType,
    `regression-${businessType}-${Date.now()}`,
    null
  );
  createdSessions.push(session.sessionId);
  return session;
}

db('API: the ngo assignment returns exactly 18 questions on root non-profit', async () => {
  const s = await assign('ngo');
  assert.equal(s.kyRoot, 'non-profit');
  assert.equal(s.businessType, 'ngo');
  assert.equal(s.domain, null);
  assert.equal(s.requiresDomainSelection, false);
  assert.equal(s.totalQuestions, 18);
  assert.equal(s.questions.length, 18);
});

db('API: the assigned Non-Profit pool is 3 per pillar over all six pillars', async () => {
  const s = await assign('ngo');
  const doc = await KnowYourselfSession.findOne({ sessionId: s.sessionId }).lean();
  const snap = doc.selectedQuestions;
  assert.equal(snap.length, 18);
  const counts = {};
  for (const q of snap) counts[q.category] = (counts[q.category] || 0) + 1;
  for (const p of pillarsForRoot('non-profit')) {
    assert.equal(counts[p.key], 3, `${p.key} in the served pool`);
  }
});

db('API: the served pool contains only generic, domain-free, active, Non-Profit questions', async () => {
  const s = await assign('ngo');
  const doc = await KnowYourselfSession.findOne({ sessionId: s.sessionId }).lean();
  for (const q of doc.selectedQuestions) {
    assert.notEqual(q.active, false, `retired question served: ${q.text.slice(0, 40)}`);
    assert.ok(!q.domain, `domain question served: ${q.text.slice(0, 40)}`);
    assert.ok(!String(q.category).startsWith('startup-'), `Start-Up question served: ${q.text.slice(0, 40)}`);
    assert.ok(!FORBIDDEN_PILLARS.includes(q.category), `Mfg/Services question served: ${q.category}`);
    assert.deepEqual(q.options.map((o) => o.score), [4, 3, 2, 1]);
  }
});

db('API: the served pool contains no Humanitarian / domain content', async () => {
  const s = await assign('ngo');
  const doc = await KnowYourselfSession.findOne({ sessionId: s.sessionId }).lean();
  for (const q of doc.selectedQuestions) {
    for (const marker of FOREIGN_QUESTION_MARKERS) {
      assert.ok(!q.text.toLowerCase().includes(marker), `served question contains "${marker}"`);
    }
  }
});

db('API: all 18 questions are served and answerable in sequence', async () => {
  const s = await assign('ngo');
  for (let i = 0; i < 18; i++) {
    const q = await getKYQuestion(s.sessionId, i);
    assert.ok(q, `question ${i} must be served`);
    assert.equal(q.text, s.questions[i].text, `question ${i} must match the assigned pool`);
    assert.equal(q.options.length, 4);
  }
});

db('API: a completed Non-Profit session scores on the six Non-Profit pillars', async () => {
  const s = await assign('ngo');
  for (let i = 0; i < 18; i++) {
    const q = await getKYQuestion(s.sessionId, i);
    await submitKYAnswer(s.sessionId, { questionIndex: i, optionId: q.options[0].optionId });
  }
  const r = await getKYResult(s.sessionId);
  const result = r.result || r;
  assert.equal(result.categories.length, 6);
  assert.equal(result.overallPercent, 100, 'all-best answers must give 100%');
  assert.match(String(result.band), /FOUNDATION/);
  const keys = result.categories.map((c) => c.key);
  assert.deepEqual(keys, PILLARS_BY_ROOT['non-profit'].map((p) => p.key));
  assert.ok(keys.every((k) => !FORBIDDEN_PILLARS.includes(k)), 'no Mfg/Services pillar on the result');
});

db('API: Start-Up stays isolated — its pool never contains a Non-Profit question', async () => {
  const s = await assign('startup');
  assert.equal(s.kyRoot, 'startup');
  assert.equal(s.questions.length, 18);
  const doc = await KnowYourselfSession.findOne({ sessionId: s.sessionId }).lean();
  assert.ok(
    doc.selectedQuestions.every((q) => !String(q.category).startsWith('nonprofit-')),
    'a Non-Profit question leaked into the Start-Up pool'
  );
});

db('API: Services and Manufacturing still require a domain, Non-Profit does not', async () => {
  // The invariant that separates the two roots is behavioural, not declarative:
  // a Mfg/Services business type cannot even be assigned without a domain,
  // while Non-Profit gets its full pool in one call with domain=null.
  for (const key of ['service', 'product']) {
    await assert.rejects(
      () =>
        startKYAssignment(
          `regression.${key}.${Date.now()}@example.com`,
          null,
          key,
          `regression-${key}-${Date.now()}`,
          null
        ),
      (err) => /domain/i.test(err.message),
      `${key} must refuse to assign without domain selection`
    );
  }
  const s = await assign('ngo');
  assert.equal(s.domain, null, 'Non-Profit must still assign with no domain at all');
  assert.equal(s.requiresDomainSelection, false);
});
