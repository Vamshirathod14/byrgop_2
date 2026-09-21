import { test } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import Question, { validateActiveQuestion } from '../src/models/Question.js';
import KnowYourselfQuestion from '../src/models/KnowYourselfQuestion.js';
import {
  ANSWER_COLOURS,
  answerColourHex,
  answerColourLabel,
  resolveOptionColor,
  resolveOptionHex,
  isAnswerColour,
  DEFAULT_YES_COLOR,
  DEFAULT_NO_COLOR,
} from '../src/config/optionColors.js';

// Colour regression coverage for the ORIGINAL (pre-refactor) behaviour:
//   - colours are HEX strings stored on options; any valid hex is accepted and
//     passed through exactly, colour NAMES (e.g. 'green') are rejected,
//   - missing Yes/No colours backfill to the defaults (Yes → #4CAF50, No →
//     #E53935) by text, and for KY options by index (1–2 YES, 3–4 NO),
//   - the six brand colours are the admin swatch convenience list, NOT a schema,
//   - Question model backfills defaults / rejects names while leaving legacy
//     documents (and scores/text/ordering) untouched,
//   - KnowYourselfQuestion model takes no role in colour validation (legacy /
//     null colours stay valid),
//   - public APIs serve the hex; session snapshots and answer optionColor store
//     the hex as-is,
//   - saved colours load back on edit through the admin services.
// No database is needed: validation covers pre-validate.

// ── defaults + brand swatch list ─────────────────────────────────────────

test('colours: default Yes/No hexes and the six brand swatch colours are stable', () => {
  assert.equal(DEFAULT_YES_COLOR, '#4CAF50');
  assert.equal(DEFAULT_NO_COLOR, '#E53935');
  assert.equal(ANSWER_COLOURS.length, 6);
  const hexes = ANSWER_COLOURS.map((c) => c.hex);
  assert.equal(new Set(hexes).size, 6, 'brand swatch hexes must be unique');
  for (const c of ANSWER_COLOURS) {
    assert.match(c.hex, /^#[0-9A-F]{6}$/, `bad hex for ${c.key}`);
    assert.ok(c.label && c.label.length, `missing label for ${c.key}`);
  }
});

test('colours: any valid hex is a legal answer colour; colour names are not', () => {
  assert.ok(isAnswerColour('#12B76A'));
  assert.ok(isAnswerColour('#4CAF50'));
  assert.ok(isAnswerColour('#e53935'));
  assert.ok(!isAnswerColour('green'));
  assert.ok(!isAnswerColour('teal'));
  assert.ok(!isAnswerColour('#GGGGGG'));
  assert.ok(!isAnswerColour(42));

  assert.equal(resolveOptionColor({ text: 'Yes', color: '#12B76A', index: 0 }).color, '#12B76A');
  assert.equal(resolveOptionHex({ text: 'Yes', color: '#12B76A', index: 0 }), '#12B76A');
  assert.equal(answerColourHex('#12B76A'), '#12B76A');
  assert.equal(answerColourLabel('#12B76A'), null, 'custom hex has no brand label');
  assert.equal(answerColourLabel('#0A78CF'), 'Blue');

  const r = resolveOptionColor({ text: 'Yes', color: 'green', index: 0 });
  assert.ok(r.error, '"green" must be rejected as not a hex colour');
  assert.equal(resolveOptionHex({ text: 'Yes', color: 'green', index: 0 }), null);
});

test('colours: missing Yes/No colours backfill to the default hexes', () => {
  assert.equal(resolveOptionColor({ text: 'Yes', color: null, index: 0 }).color, DEFAULT_YES_COLOR);
  assert.equal(resolveOptionColor({ text: 'No', color: undefined, index: 1 }).color, DEFAULT_NO_COLOR);
  assert.equal(resolveOptionColor({ text: 'YES', color: '', index: 0 }).color, DEFAULT_YES_COLOR);
  assert.equal(resolveOptionColor({ text: 'No', color: '', index: 1 }).color, DEFAULT_NO_COLOR);
  assert.equal(resolveOptionHex({ text: 'Yes', color: null, index: 0 }), '#4CAF50');
  assert.equal(resolveOptionHex({ text: 'No', color: null, index: 1 }), '#E53935');
});

test('colours: non-yes/no options fall back by position (1–2 YES default, 3–4 NO default)', () => {
  for (let i = 0; i < 4; i++) {
    const expected = i < 2 ? DEFAULT_YES_COLOR : DEFAULT_NO_COLOR;
    assert.equal(resolveOptionColor({ text: `Option ${i}`, color: null, index: i }).color, expected);
  }
});

// ── Question (onboarding Yes/No) model ───────────────────────────────────

test('Question pre-validate: backfills Yes/No default hexes when colours are missing', async () => {
  const doc = new Question({
    text: 'Backfill color question?',
    category: new mongoose.Types.ObjectId(),
    businessType: 'service',
    weight: 10,
    options: [
      { text: 'Yes', score: 1, stageKey: 'recommendations', active: true },
      { text: 'No', score: 0, stageKey: 'initiation', active: true },
    ],
  });
  await doc.validate();
  assert.equal(doc.options[0].color, '#4CAF50');
  assert.equal(doc.options[1].color, '#E53935');
});

test('Question pre-validate: rejects a non-hex answer colour', async () => {
  for (const bad of ['green', 'teal']) {
    const doc = new Question({
      text: 'Bad color question?',
      category: new mongoose.Types.ObjectId(),
      businessType: 'service',
      weight: 10,
      options: [
        { text: 'Yes', score: 1, stageKey: 'recommendations', active: true, color: bad },
        { text: 'No', score: 0, stageKey: 'initiation', active: true },
      ],
    });
    await assert.rejects(() => doc.validate(), /Invalid answer colour/);
  }
});

test('Question pre-validate: preserves an explicit hex colour verbatim', async () => {
  const doc = new Question({
    text: 'Custom color question?',
    category: new mongoose.Types.ObjectId(),
    businessType: 'startup',
    weight: 10,
    options: [
      { text: 'Yes', score: 1, stageKey: 'recommendations', active: true, color: '#12B76A' },
      { text: 'No', score: 0, stageKey: 'initiation', active: true, color: '#B42318' },
    ],
  });
  await doc.validate();
  assert.equal(doc.options[0].color, '#12B76A');
  assert.equal(doc.options[1].color, '#B42318');
});

test('validateActiveQuestion: legacy documents without colours and with unchanged scores remain valid', () => {
  const legacy = {
    text: 'Legacy question without colors?',
    weight: 10,
    active: true,
    options: [
      { text: 'Yes', score: 1, active: true },
      { text: 'No', score: 0, active: true },
    ],
  };
  assert.deepEqual(validateActiveQuestion(legacy), []);
  assert.equal(legacy.options.length, 2);
});

test('Question pre-validate: never rewrites scores or text, only backfills colours', async () => {
  const doc = new Question({
    text: 'Keep score text question?',
    category: new mongoose.Types.ObjectId(),
    businessType: 'manufacturing',
    weight: 10,
    options: [
      { text: 'Yes', score: 1, stageKey: 'recommendations', active: true, color: '#7038A5' },
      { text: 'No', score: 0, stageKey: 'initiation', active: true },
    ],
  });
  await doc.validate();
  assert.equal(doc.text, 'Keep score text question?');
  assert.equal(doc.options[0].text, 'Yes');
  assert.equal(doc.options[0].score, 1);
  assert.equal(doc.options[0].color, '#7038A5');
  assert.equal(doc.options[1].text, 'No');
  assert.equal(doc.options[1].score, 0);
  assert.equal(doc.options[1].color, '#E53935');
});

// ── KnowYourselfQuestion model ──────────────────────────────────────────

function kyDoc(options) {
  return new KnowYourselfQuestion({
    text: 'How is production planning handled?',
    type: 'domain',
    domain: 'manufacturing',
    active: true,
    options,
  });
}

test('KnowYourselfQuestion: legacy docs without colours stay valid and uncoloured', async () => {
  const doc = kyDoc([
    { text: 'A1', score: 4, active: true },
    { text: 'B1', score: 3, active: true },
    { text: 'C1', score: 2, active: true },
    { text: 'D1', score: 1, active: true },
  ]);
  await doc.validate();
  assert.deepEqual(doc.options.map((o) => o.color), [null, null, null, null]);
  assert.deepEqual(doc.options.map((o) => o.score), [4, 3, 2, 1]);
});

test('KnowYourselfQuestion: explicit hex colours are preserved untouched', async () => {
  const explicit = ['#0A78CF', '#0A78CF', '#E53935', '#E53935'];
  const doc = kyDoc([
    { text: 'A1', score: 4, active: true, color: explicit[0] },
    { text: 'B1', score: 3, active: true, color: explicit[1] },
    { text: 'C1', score: 2, active: true, color: explicit[2] },
    { text: 'D1', score: 1, active: true, color: explicit[3] },
  ]);
  await doc.validate();
  assert.deepEqual(doc.options.map((o) => o.color), explicit);
  assert.deepEqual(doc.options.map((o) => o.text), ['A1', 'B1', 'C1', 'D1']);
});

// ── Know Yourself assignment + answer snapshots ─────────────────────────

const GENERIC_TEXTS = Array.from(
  { length: 18 },
  (_, i) => `Generic question ${i + 1}?`
);

function makeKYQuestion(i) {
  return {
    _id: new mongoose.Types.ObjectId(),
    text: GENERIC_TEXTS[i],
    type: 'generic',
    source: 'generic',
    category: 'strategic-direction',
    active: true,
    displayOrder: i + 1,
    glossary: [],
    // Option colours: YES half explicit hex (blue), NO half missing (should
    // fall back to the NO default red by position).
    options: [
      { _id: new mongoose.Types.ObjectId(), text: `G${i + 1} Alpha`, score: 4, active: true, color: '#0A78CF' },
      { _id: new mongoose.Types.ObjectId(), text: `G${i + 1} Beta`, score: 3, active: true, color: '#0A78CF' },
      { _id: new mongoose.Types.ObjectId(), text: `G${i + 1} Gamma`, score: 2, active: true },
      { _id: new mongoose.Types.ObjectId(), text: `G${i + 1} Delta`, score: 1, active: true },
    ],
  };
}

async function loadKYService(t) {
  const pool = Array.from({ length: 18 }, (_, i) => makeKYQuestion(i));
  let createdSession = null;
  await t.mock.module('../src/models/KnowYourselfQuestion.js', {
    defaultExport: { find: () => ({ lean: async () => pool }) },
  });
  await t.mock.module('../src/models/KnowYourselfSession.js', {
    defaultExport: {
      create: async (doc) => {
        const s = { ...doc, answers: [], save: async function () { return this; } };
        createdSession = s;
        return s;
      },
      findOne: async () => createdSession,
    },
  });
  await t.mock.module('../src/models/BusinessType.js', {
    defaultExport: {
      findOne: async ({ key }) => ({ _id: new mongoose.Types.ObjectId(), key, name: 'Service Based', active: true }),
    },
  });
  await t.mock.module('../src/models/Domain.js', {
    defaultExport: { find: async () => [], findOne: async () => null },
  });
  await t.mock.module('../src/models/KYCategory.js', {
    defaultExport: { find: () => ({ sort: () => ({ lean: async () => [] }) }), insertMany: async () => [] },
  });
  const nonce = `${Date.now()}-${Math.random()}`;
  const svc = await import(`../src/services/knowYourselfService.js?t=${nonce}`);
  return { svc, getSession: () => createdSession };
}

test('KY assignment: served options carry the stored hex colours', async (t) => {
  const { svc } = await loadKYService(t);
  const assignment = await svc.startKYAssignment('user@example.com', 'others', 'service', 'browser-1');

  assert.equal(assignment.totalQuestions, 18);
  for (const q of assignment.questions) {
    assert.equal(q.options[0].color, '#0A78CF'); // blue (YES half, explicit)
    assert.equal(q.options[1].color, '#0A78CF');
    // Missing NO-half colours defaulted by position → default red
    assert.equal(q.options[2].color, '#E53935');
    assert.equal(q.options[3].color, '#E53935');
  }
});

test('KY assignment: snapshot persists the hex colours for historical integrity', async (t) => {
  const { svc, getSession } = await loadKYService(t);
  await svc.startKYAssignment('user@example.com', 'others', 'service', 'browser-1');
  const session = getSession();
  assert.equal(session.selectedQuestions.length, 18);
  for (const q of session.selectedQuestions) {
    assert.equal(q.options[0].color, '#0A78CF');
    assert.equal(q.options[1].color, '#0A78CF');
    assert.equal(q.options[2].color, '#E53935'); // legacy fallback stored as hex
  }
});

test('KY answer: stores the hex as optionColor; colour never changes scoring', async (t) => {
  const { svc, getSession } = await loadKYService(t);
  const assignment = await svc.startKYAssignment('user@example.com', 'others', 'service', 'browser-1');

  // Answer question index 1 (of 18) with option index 0 (blue, score 4).
  const q = assignment.questions[1];
  const res = await svc.submitKYAnswer(assignment.sessionId, {
    questionIndex: 1,
    optionId: q.options[0].optionId,
  });
  assert.equal(res.accepted, true);
  assert.equal(res.answered, 1);
  assert.equal(res.complete, false);

  const session = getSession();
  const entry = session.answers.find((a) => a.questionIndex === 1);
  assert.ok(entry, 'answer recorded');
  assert.equal(entry.optionColor, '#0A78CF');
  assert.equal(entry.optionText, q.options[0].text);
  assert.equal(entry.score, 4);
});

// ── Admin services: saved colours load back on edit, malformed rejected ─

test('onboarding admin: create/update apply Yes/No hex colours and reject colour names', async (t) => {
  const createdDocs = [];
  const CATS = [
    { _id: 'C1', key: 'strategic', name: 'Strategic', color: '#0A78CF', sortOrder: 1, active: true },
    { _id: 'C2', key: 'operational', name: 'Operational', color: '#0D8845', sortOrder: 2, active: true },
    { _id: 'C3', key: 'revenue', name: 'Revenue', color: '#F5630D', sortOrder: 3, active: true },
  ];
  const docs = {};
  await t.mock.module('../src/models/Question.js', {
    defaultExport: {
      create: async (d) => {
        const doc = { ...d, _id: `n${createdDocs.length + 1}`, options: (d.options || []).map((o) => ({ ...o })) };
        createdDocs.push(doc);
        return doc;
      },
      findById: (id) => {
        // Awaitable directly AND chainable with .populate(...) like Mongoose.
        const target = id === 'q-startup-strategic'
          ? {
              _id: id,
              businessType: 'startup',
              category: 'C1',
              text: 'Existing startup question?',
              options: [
                { text: 'Yes', score: 1, stageKey: 'recommendations', active: true, color: '#4CAF50' },
                { text: 'No', score: 0, stageKey: 'initiation', active: true, color: '#E53935' },
              ],
              save: async function () { return this; },
            }
          : null;
        const value = Promise.resolve(target);
        value.populate = () => value;
        return value;
      },
      findOne: async (q) => {
        const found = docs[`${q.category}:${q.businessType}`] || null;
        if (!found) return null;
        return { ...found, options: [...found.options] };
      },
      findOneAndUpdate: async (q, patch) => ({ _id: q, ...patch }),
      findByIdAndDelete: async () => null,
      deleteOne: async () => ({}),
      find: async () => ({ populate: () => ({ sort: () => ({ lean: async () => [] }) }) }),
    },
    namedExports: { validateActiveQuestion },
    cache: false,
  });
  await t.mock.module('../src/models/Category.js', {
    defaultExport: { findById: async (id) => CATS.find((c) => c._id === id) || null },
    cache: false,
  });

  const nonce = `${Date.now()}-${Math.random()}`;
  const svc = await import(`../src/services/onboardingAdminService.js?t=${nonce}`);

  // Missing colours fall back to the default hexes on create.
  const d1 = await svc.createOnboardingQuestion({
    businessType: 'startup',
    category: 'C1',
    text: 'Default colours question?',
  });
  assert.deepEqual(d1.options.map((o) => o.color), ['#4CAF50', '#E53935']);
  assert.deepEqual(d1.options.map((o) => o.text), ['Yes', 'No']);

  // Explicit hex colours are preserved.
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

  // A colour name (not a hex) is rejected with 400 before save.
  for (const bad of ['green', 'teal']) {
    await assert.rejects(
      () => svc.createOnboardingQuestion({
        businessType: 'startup',
        category: 'C1',
        text: 'Bad colour question?',
        options: [
          { text: 'Yes', score: 1, active: true, color: bad },
          { text: 'No', score: 0, active: true },
        ],
      }),
      (err) => err.status === 400 && /Invalid answer colour/.test(err.message)
    );
  }
  assert.equal(createdDocs.length, 2, 'rejected creates must not save');

  // Update carries the saved colours through and loads them, defaulting No.
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