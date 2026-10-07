import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import {
  NEUTRAL_COLOR,
  onboardingQuestionsFromConfig,
  makeSnapshotResult,
  applyServerResult,
  resolveAnswerDisplayColor,
  optionColorFrom,
} from '../src/onboarding.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/* ─────────────────────────────────────────────────────────────────────────
   Fixtures: the REAL Startup onboarding payload as served by
   GET /api/v1/assessments/onboarding?businessType=startup. Admin-configured
   answer-option colours and the (distinct) category/pillar colours.
   ───────────────────────────────────────────────────────────────────────── */
const STARTUP_CONFIG = [
  {
    categoryKey: 'strategic',
    categoryLabel: 'Strategy',
    pillar: 'Strategy',
    categoryColor: '#0A78CF',
    questionText: 'Strategy question',
    options: [
      { text: 'Yes', score: 1, color: '#E52032' },
      { text: 'No', score: 0, color: '#0D8845' },
    ],
  },
  {
    categoryKey: 'operational',
    categoryLabel: 'Operations',
    pillar: 'Operations',
    categoryColor: '#0D8845',
    questionText: 'Operations question',
    options: [
      { text: 'Yes', score: 1, color: '#4CAF50' },
      { text: 'No', score: 0, color: '#E53935' },
    ],
  },
  {
    categoryKey: 'revenue',
    categoryLabel: 'Finances',
    pillar: 'Finances',
    categoryColor: '#F5630D',
    questionText: 'Finances question',
    options: [
      { text: 'Yes', score: 1, color: '#E52032' },
      { text: 'No', score: 0, color: '#0D8845' },
    ],
  },
];

const configQuestion = (key) => STARTUP_CONFIG.find((q) => q.categoryKey === key);
// Works on both shapes: parsed questions (optionId: 'yes'/'no') and the raw
// API payload (options keyed by text: 'Yes'/'No').
const optionHex = (q, optId) => {
  const o = (q?.options || []).find(
    (x) => x.optionId === optId || String(x.text || '').trim().toLowerCase() === optId
  );
  return o ? o.color : null;
};
const truncatedServer = (rows) => ({ scores: rows });

/* ── 1. Admin-configured Startup option colour is preserved ─────────────── */

test('onboarding config carries the Admin Startup option colours verbatim', () => {
  const parsed = onboardingQuestionsFromConfig(STARTUP_CONFIG);
  assert.equal(parsed.length, 3);
  // Custom hexes…
  assert.equal(parsed[0].options.find((o) => o.optionId === 'yes').color, '#E52032');
  assert.equal(parsed[0].options.find((o) => o.optionId === 'no').color, '#0D8845');
  // …and hexes that happen to equal the default Yes/No values are still kept
  // verbatim — never nulled, remapped, or replaced.
  assert.equal(parsed[1].options.find((o) => o.optionId === 'yes').color, '#4CAF50');
  assert.equal(parsed[1].options.find((o) => o.optionId === 'no').color, '#E53935');
});

/* ── 2. Startup onboarding renders the configured colour ────────────────── */

test('the instant snapshot renders every answer with its Admin colour', () => {
  const snap = makeSnapshotResult([
    { category: 'strategic', categoryColor: '#0A78CF', name: 'Strategy', optionText: 'Yes', optionColor: '#E52032', stage: null },
    { category: 'operational', categoryColor: '#0D8845', name: 'Operations', optionText: 'Yes', optionColor: '#4CAF50', stage: null },
    { category: 'revenue', categoryColor: '#F5630D', name: 'Finances', optionText: 'No', optionColor: '#0D8845', stage: null },
  ]);
  assert.deepEqual(snap.scores.map((s) => s.color), ['#E52032', '#4CAF50', '#0D8845']);
});

test('the donut renders the configured colour after the server result lands', () => {
  const entries = [
    { category: 'strategic', categoryColor: '#0A78CF', name: 'Strategy', optionText: 'Yes', optionColor: '#E52032' },
    { category: 'operational', categoryColor: '#0D8845', name: 'Operations', optionText: 'Yes', optionColor: '#4CAF50' },
  ];
  const snap = makeSnapshotResult(entries);
  const merged = applyServerResult(
    snap,
    truncatedServer([
      { categoryKey: 'strategic', answer: 'Yes', color: '#0A78CF', optionColor: '#E52032', selectedOptionColor: '#E52032' },
      { categoryKey: 'operational', answer: 'Yes', color: '#0D8845', optionColor: '#4CAF50', selectedOptionColor: '#4CAF50' },
    ])
  );
  assert.deepEqual(merged.scores.map((s) => resolveAnswerDisplayColor(s)), ['#E52032', '#4CAF50']);
});

/* ── 3. Startup Q1–Q18 carry the configured colour (no re-colouring) ────── */

test('Q1–Q18 option seeding returns each configured colour verbatim', () => {
  const q = {
    options: [
      { optionId: 'a', text: 'Option A', color: '#0A78CF', stage: { color: '#FCA700' } },
      { optionId: 'b', text: 'Option B', color: '#4CAF50' },
      { optionId: 'c', text: 'Option C', stage: { color: '#7038A5' } },
      { optionId: 'd', text: 'Option D', color: '#E53935' },
    ],
  };
  // Direct configured colour wins over a stage colour…
  assert.equal(optionColorFrom(q, 'Option A'), '#0A78CF');
  // …default-equal hexes are preserved…
  assert.equal(optionColorFrom(q, 'Option B'), '#4CAF50');
  assert.equal(optionColorFrom(q, 'Option D'), '#E53935');
  // …and only a genuinely missing colour falls back to the stage colour.
  assert.equal(optionColorFrom(q, 'Option C'), '#7038A5');
});

/* ── 4. Answer text does not determine colour ───────────────────────────── */

test('the answer text never determines the colour', () => {
  // A "Yes" that Admin coloured red stays red through the entire chain.
  const q = configQuestion('strategic');
  assert.equal(optionColorFrom(q, 'Yes'), '#E52032');
  const rendered = resolveAnswerDisplayColor({ optionColor: '#E52032', categoryColor: '#0A78CF', answer: 'Yes' });
  assert.equal(rendered, '#E52032');
  const snap = makeSnapshotResult([
    { category: 'strategic', categoryColor: '#0A78CF', optionText: 'Yes', optionColor: '#E52032' },
  ]);
  assert.equal(snap.scores[0].color, '#E52032');
});

/* ── 5. Answer letter A/B/C/D does not determine colour ─────────────────── */

test('the option letter/position never determines the colour', () => {
  const q = {
    options: [
      { optionId: 'a', text: 'Alpha', color: '#0A78CF' },
      { optionId: 'b', text: 'Bravo', color: '#FCA700' },
      { optionId: 'c', text: 'Charlie', color: '#E52032' },
      { optionId: 'd', text: 'Delta', color: '#0D8845' },
    ],
  };
  const expected = ['#0A78CF', '#FCA700', '#E52032', '#0D8845'];
  for (const [i, o] of q.options.entries()) {
    assert.equal(optionColorFrom(q, o.text), expected[i], `letter 'ABCD'[${i}] colour changed`);
  }
  // The renderer rule takes only the score object — there is no letter or
  // index input that could re-colour by position.
  assert.equal(resolveAnswerDisplayColor.length, 1);
});

/* ── 6. Pillar colour does not override answer colour (the regression) ──── */

test('the pillar/category colour never overrides a configured answer colour', () => {
  // The exact reported bug: a YES configured as Admin green #4CAF50 on the
  // blue Strategy pillar (#0A78CF) rendered BLUE. It must render #4CAF50.
  assert.equal(
    resolveAnswerDisplayColor({ optionColor: '#4CAF50', categoryColor: '#0A78CF' }),
    '#4CAF50'
  );
  // And a NO configured as Admin red #E53935 on the green Operations pillar
  // (#0D8845) must render red — the old code rendered the pillar green.
  assert.equal(
    resolveAnswerDisplayColor({ optionColor: '#E53935', categoryColor: '#0D8845' }),
    '#E53935'
  );
  // Custom hexes always win over the pillar too.
  assert.equal(
    resolveAnswerDisplayColor({ optionColor: '#E52032', categoryColor: '#0A78CF' }),
    '#E52032'
  );
  assert.equal(
    resolveAnswerDisplayColor({ optionColor: '#0D8845', categoryColor: '#F5630D' }),
    '#0D8845'
  );
});

test('the snapshot and server merge also keep the option colour over the pillar', () => {
  const snap = makeSnapshotResult([
    { category: 'operational', categoryColor: '#0D8845', name: 'Operations', optionText: 'No', optionColor: '#E53935' },
  ]);
  assert.equal(snap.scores[0].color, '#E53935');
  const merged = applyServerResult(
    snap,
    truncatedServer([
      { categoryKey: 'operational', answer: 'No', color: '#0D8845', optionColor: '#E53935', selectedOptionColor: '#E53935' },
    ])
  );
  assert.equal(merged.scores[0].color, '#E53935');
  assert.equal(resolveAnswerDisplayColor(merged.scores[0]), '#E53935');
});

/* ── 7. Mfg/Services existing colours remain unchanged ──────────────────── */

test('Mfg/Services option colours are preserved unchanged by the same rule', () => {
  // Real service/manufacturing rows (same palette as startup in the DB).
  const snap = makeSnapshotResult([
    { category: 'strategic', categoryColor: '#0A78CF', optionText: 'Yes', optionColor: '#E52032' },
    { category: 'operational', categoryColor: '#0D8845', optionText: 'No', optionColor: '#E53935' },
    { category: 'revenue', categoryColor: '#F5630D', optionText: 'No', optionColor: '#0D8845' },
  ]);
  assert.deepEqual(snap.scores.map((s) => s.color), ['#E52032', '#E53935', '#0D8845']);
  const parsed = onboardingQuestionsFromConfig([
    { categoryKey: 'strategic', categoryColor: '#0A78CF', options: [{ text: 'Yes', color: '#E52032' }, { text: 'No', color: '#0D8845' }] },
    { categoryKey: 'operational', categoryColor: '#0D8845', options: [{ text: 'Yes', color: '#4CAF50' }, { text: 'No', color: '#E53935' }] },
  ]);
  assert.equal(parsed[0].options[0].color, '#E52032');
  assert.equal(parsed[1].options[1].color, '#E53935');
});

/* ── 8. Non-Profit existing colours remain unchanged ────────────────────── */

test('Non-Profit option colours are preserved unchanged by the same rule', () => {
  // Real nonprofit rows: its Operations question is Yes #0D8845 / No #E52032.
  const snap = makeSnapshotResult([
    { category: 'operational', categoryColor: '#0D8845', name: 'Operations', optionText: 'No', optionColor: '#E52032' },
    { category: 'strategic', categoryColor: '#0A78CF', name: 'Strategy', optionText: 'No', optionColor: '#0D8845' },
  ]);
  assert.deepEqual(snap.scores.map((s) => s.color), ['#E52032', '#0D8845']);
  const merged = applyServerResult(
    snap,
    truncatedServer([
      { categoryKey: 'operational', answer: 'No', color: '#0D8845', optionColor: '#E52032', selectedOptionColor: '#E52032' },
      { categoryKey: 'strategic', answer: 'No', color: '#0A78CF', optionColor: '#0D8845', selectedOptionColor: '#0D8845' },
    ])
  );
  assert.deepEqual(merged.scores.map((s) => resolveAnswerDisplayColor(s)), ['#E52032', '#0D8845']);
});

/* ── 9. Missing colour uses only the existing fallback ──────────────────── */

test('a missing colour uses only the documented fallbacks', () => {
  // No colour anywhere → neutral placeholder.
  assert.equal(
    makeSnapshotResult([{ category: 'strategic', categoryColor: null, optionText: 'Yes' }]).scores[0].color,
    NEUTRAL_COLOR
  );
  // No option colour, but a category colour → category colour (unanswered track).
  assert.equal(resolveAnswerDisplayColor({ optionColor: null, categoryColor: '#0A78CF' }), '#0A78CF');
  // No option colour but a legacy stage colour → the stage colour.
  assert.equal(
    resolveAnswerDisplayColor({ optionColor: null, selectedOptionColor: null, stage: { color: '#F5630D' }, categoryColor: '#0A78CF' }),
    '#F5630D'
  );
  // Everything missing → neutral.
  assert.equal(resolveAnswerDisplayColor({}), NEUTRAL_COLOR);
});

/* ── 10. Configured colour always takes precedence over fallback ────────── */

test('a configured colour always beats the fallback, even when it equals a default hex', () => {
  assert.equal(resolveAnswerDisplayColor({ optionColor: '#4CAF50', categoryColor: '#0D8845' }), '#4CAF50');
  assert.equal(resolveAnswerDisplayColor({ optionColor: '#E53935', categoryColor: '#F5630D' }), '#E53935');
  const snap = makeSnapshotResult([
    { category: 'revenue', categoryColor: '#F5630D', optionText: 'No', optionColor: '#0D8845' },
  ]);
  const merged = applyServerResult(
    snap,
    truncatedServer([
      { categoryKey: 'revenue', answer: 'No', color: '#F5630D', optionColor: '#0D8845', selectedOptionColor: '#0D8845' },
    ])
  );
  assert.equal(merged.scores[0].color, '#0D8845');
});

/* ── 11. API payload preserves the configured colour ────────────────────── */

test('the Startup API payload reaches the renderer with no local remapping', () => {
  const parsed = onboardingQuestionsFromConfig(STARTUP_CONFIG);
  const snapshot = makeSnapshotResult(
    parsed.map((q) => ({
      category: q.category,
      categoryColor: q.categoryColor,
      name: q.name,
      optionText: 'Yes',
      optionColor: optionHex(q, 'yes'),
    }))
  );
  const merged = applyServerResult(
    snapshot,
    truncatedServer(
      STARTUP_CONFIG.map((q) => ({
        categoryKey: q.categoryKey,
        answer: 'Yes',
        color: q.categoryColor,
        optionColor: optionHex(q, 'yes'),
        selectedOptionColor: optionHex(q, 'yes'),
        stage: null,
        score: 1,
        earned: 1,
        possible: 1,
        answerScore: null,
        weight: 1,
        hasScore: true,
        content: null,
      }))
    )
  );
  assert.deepEqual(
    merged.scores.map((s) => resolveAnswerDisplayColor(s)),
    STARTUP_CONFIG.map((q) => optionHex(q, 'yes'))
  );
});

/* ── 12. Browser/deployed UI uses the same colour as the API/Admin value ── */

test('the donut colour equals the Admin/API colour for every real Startup option', () => {
  const adminColours = [
    ['strategic', 'yes', '#E52032'],
    ['strategic', 'no', '#0D8845'],
    ['operational', 'yes', '#4CAF50'],
    ['operational', 'no', '#E53935'],
    ['revenue', 'yes', '#E52032'],
    ['revenue', 'no', '#0D8845'],
  ];
  for (const [cat, optId, adminHex] of adminColours) {
    const payloadQ = configQuestion(cat);
    const parsed = onboardingQuestionsFromConfig([payloadQ])[0];
    const optColour = parsed.options.find((o) => o.optionId === optId).color;
    assert.equal(optColour, adminHex, `config ${cat} ${optId}`);
    const entry = {
      category: parsed.category,
      categoryColor: parsed.categoryColor,
      name: parsed.name,
      optionText: optId === 'yes' ? 'Yes' : 'No',
      optionColor: optColour,
    };
    const snap = makeSnapshotResult([entry]);
    assert.equal(snap.scores[0].color, adminHex, `snapshot ${cat} ${optId}`);
    assert.equal(resolveAnswerDisplayColor(snap.scores[0]), adminHex, `snapshot render ${cat} ${optId}`);
    const merged = applyServerResult(
      snap,
      truncatedServer([
        {
          categoryKey: parsed.category,
          answer: entry.optionText,
          color: parsed.categoryColor,
          optionColor: optColour,
          selectedOptionColor: optColour,
          stage: null,
        },
      ])
    );
    assert.equal(merged.scores[0].color, adminHex, `merge ${cat} ${optId}`);
    assert.equal(resolveAnswerDisplayColor(merged.scores[0]), adminHex, `render ${cat} ${optId}`);
  }
});

/* ── Guard: the second frontend mapping is gone from the renderer ──────── */

test('ResultScreen has no second colour mapping that overrides the Admin colour', () => {
  const src = readFileSync(resolve(ROOT, 'src/screens/ResultScreen.jsx'), 'utf8');
  // The renderer resolves sector colours through the single shared rule.
  assert.match(src, /resolveAnswerDisplayColor/);
  // The old text/hex heuristic (which swapped default-hex options for the
  // pillar colour) must not come back.
  assert.doesNotMatch(src, /isCustomOptionColor/);
  assert.doesNotMatch(src, /#4caf50|#e53935/);
});