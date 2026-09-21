import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scoreCategories, roundPct } from '../src/services/scoringEngine.js';
import { validateActiveQuestion } from '../src/models/Question.js';
import { isValidQuestion } from '../src/services/questionPool.js';

const categories = [
  { key: 'strategic', name: 'Strategic', color: '#0A78CF', sortOrder: 1 },
  { key: 'operational', name: 'Operational', color: '#0D8845', sortOrder: 2 },
  { key: 'revenue', name: 'Revenue', color: '#F5630D', sortOrder: 3 },
];

function mk(categoryKey, weight, score) {
  return { categoryKey, weight, score, optionId: 'o1', timedOut: false };
}

function totals(answers, stageMap) {
  const scores = scoreCategories(answers, categories, stageMap);
  const scored = Object.values(scores).filter((s) => s !== null);
  const earned = scored.reduce((sum, s) => sum + s.earned, 0);
  const possible = scored.reduce((sum, s) => sum + s.possible, 0);
  return { scores, earned, possible, overallPct: possible > 0 ? roundPct(earned / possible) : 0 };
}

test('spec example: Yes, No, Yes with weights 2/5/3 = 50%', () => {
  const r = totals([
    mk('strategic', 2, 1),
    mk('operational', 5, 0),
    mk('revenue', 3, 1),
  ]);
  assert.equal(r.earned, 5);
  assert.equal(r.possible, 10);
  assert.equal(r.overallPct, 50);
});

test('all Yes = 100%, all No = 0%', () => {
  const yes = totals([mk('strategic', 2, 1), mk('operational', 5, 1), mk('revenue', 3, 1)]);
  assert.equal(yes.earned, 10);
  assert.equal(yes.possible, 10);
  assert.equal(yes.overallPct, 100);

  const no = totals([mk('strategic', 2, 0), mk('operational', 5, 0), mk('revenue', 3, 0)]);
  assert.equal(no.earned, 0);
  assert.equal(no.overallPct, 0);
});

test('Yes, Yes, No with weights 10/1/7 = 11/18 = 61%', () => {
  const r = totals([mk('strategic', 10, 1), mk('operational', 1, 1), mk('revenue', 7, 0)]);
  assert.equal(r.earned, 11);
  assert.equal(r.possible, 18);
  assert.equal(r.overallPct, 61);
});

test('weight differences matter: heavier Yes lifts overall', () => {
  const heavyYes = totals([mk('strategic', 9, 1), mk('operational', 1, 0), mk('revenue', 1, 0)]);
  assert.equal(heavyYes.overallPct, 82); // 9/11

  const heavyNo = totals([mk('strategic', 9, 0), mk('operational', 1, 1), mk('revenue', 1, 1)]);
  assert.equal(heavyNo.overallPct, 18); // 2/11
});

test('overall is NOT the mean of category percentages', () => {
  const answers = [mk('strategic', 2, 1), mk('operational', 5, 0), mk('revenue', 3, 1)];
  const r = totals(answers);
  const pcts = Object.values(r.scores).map((s) => s.pct); // [100, 0, 100]
  const mean = Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length); // 67
  assert.equal(mean, 67);
  assert.equal(r.overallPct, 50); // weighted, not the mean
});

test('per-category pct is 100 for Yes and 0 for No', () => {
  const r = totals([mk('strategic', 2, 1), mk('operational', 5, 0), mk('revenue', 3, 1)]);
  assert.equal(r.scores.strategic.pct, 100);
  assert.equal(r.scores.operational.pct, 0);
  assert.equal(r.scores.revenue.pct, 100);
});

test('display labels map internal keys to user-facing names (revenue → Finances)', () => {
  const r = totals([mk('strategic', 2, 1), mk('operational', 5, 0), mk('revenue', 3, 1)]);
  assert.equal(r.scores.strategic.categoryName, 'Strategy');
  assert.equal(r.scores.operational.categoryName, 'Operations');
  assert.equal(r.scores.revenue.categoryName, 'Finances');
  // The internal keys themselves never change.
  assert.ok(Object.keys(r.scores).includes('revenue'));
});

test('timed-out and unanswered entries are excluded', () => {
  const r = totals([
    mk('strategic', 2, 1),
    { categoryKey: 'operational', weight: 5, score: 0, optionId: null, timedOut: true },
    { categoryKey: 'revenue', weight: 3, score: 0, optionId: null, timedOut: false },
  ]);
  assert.equal(r.scores.strategic.earned, 2);
  assert.equal(r.scores.operational, null);
  assert.equal(r.scores.revenue, null);
  assert.equal(r.overallPct, 100); // only scored category counted
});

test('engine uses the snapshotted answer weight, not any external value', () => {
  const answers = [mk('strategic', 2, 1), mk('operational', 5, 1), mk('revenue', 3, 0)];
  const r1 = totals(answers);
  assert.equal(r1.overallPct, 70); // (2+5)/10
  const r2 = totals(answers.map((a) => ({ ...a, weight: a.weight * 1000 })));
  assert.equal(r2.overallPct, 70); // scales, ratio unchanged
});

test('zero/missing weight yields 0 possible and does not break totals', () => {
  const r = totals([
    mk('strategic', 2, 1),
    { categoryKey: 'operational', weight: 0, score: 1, optionId: 'x', timedOut: false },
    mk('revenue', 3, 0),
  ]);
  assert.equal(r.scores.operational.pct, 0);
  assert.equal(r.overallPct, 40); // 2/5
});

test('final percentage is always clamped 0..100', () => {
  const over = totals([mk('strategic', 2, 1), mk('operational', 5, 1), mk('revenue', 3, 1)]);
  const under = totals([mk('strategic', 2, 0), mk('operational', 5, 0), mk('revenue', 3, 0)]);
  assert.equal(over.overallPct, 100);
  assert.equal(under.overallPct, 0);
  assert.ok(over.overallPct <= 100 && over.overallPct >= 0);
});

test('validation: active question requires Yes=1 and No=0', () => {
  const valid = {
    active: true,
    weight: 2,
    options: [
      { text: 'Yes', score: 1, active: true },
      { text: 'No', score: 0, active: true },
    ],
  };
  assert.deepEqual(validateActiveQuestion(valid), []);

  assert.ok(validateActiveQuestion({ ...valid, options: [{ text: 'Yes', score: 1, active: true }] }).some((e) => /No option/.test(e)));
  assert.ok(validateActiveQuestion({ ...valid, options: [
    { text: 'Yes', score: 1, active: true },
    { text: 'No', score: 0, active: false },
  ] }).some((e) => /No option/.test(e)));
  assert.ok(validateActiveQuestion({ ...valid, options: [
    { text: 'Yes', score: 3, active: true },
    { text: 'No', score: 0, active: true },
  ] }).some((e) => /Yes option score/.test(e)));
  assert.ok(validateActiveQuestion({ ...valid, options: [
    { text: 'Yes', score: 1, active: true },
    { text: 'No', score: 1, active: true },
  ] }).some((e) => /No option score/.test(e)));
});

test('validation: weight must be greater than 0', () => {
  assert.ok(validateActiveQuestion({ active: false, weight: 0, options: [] }).some((e) => /Weight/.test(e)));
  assert.ok(validateActiveQuestion({ active: false, weight: -3, options: [] }).some((e) => /Weight/.test(e)));
  assert.deepEqual(validateActiveQuestion({ active: false, weight: 5, options: [] }), []);
});

test('inactive questions are exempt from Yes/No requirement', () => {
  assert.deepEqual(validateActiveQuestion({ active: false, weight: 5, options: [] }), []);
});

test('isValidQuestion reflects active + valid', () => {
  const valid = {
    active: true,
    weight: 2,
    options: [
      { text: 'Yes', score: 1, active: true },
      { text: 'No', score: 0, active: true },
    ],
  };
  assert.equal(isValidQuestion(valid), true);
  assert.equal(isValidQuestion({ ...valid, active: false }), false);
  assert.equal(isValidQuestion({ ...valid, options: [{ text: 'Yes', score: 1, active: true }] }), false);
  assert.equal(isValidQuestion({ ...valid, weight: 0 }), false);
});

test('answer stage snapshot flows through without affecting the weighted total', () => {
  const answers = [
    { categoryKey: 'strategic', weight: 2, score: 1, optionId: 'o1', timedOut: false, stage: { key: 'analysis', name: 'Analysis', color: '#E52032' } },
    { categoryKey: 'operational', weight: 5, score: 0, optionId: 'o2', timedOut: false, stage: { key: 'initiation', name: 'Initiation', color: '#0A78CF' } },
    { categoryKey: 'revenue', weight: 3, score: 1, optionId: 'o3', timedOut: false, stage: { key: 'monitoring', name: 'Monitoring', color: '#7038A5' } },
  ];
  const r = totals(answers);
  assert.equal(r.overallPct, 50);
  assert.equal(r.scores.strategic.stage.name, 'Analysis');
  assert.equal(r.scores.strategic.stage.color, '#E52032');
  assert.equal(r.scores.operational.stage.name, 'Initiation');
  assert.equal(r.scores.revenue.stage.color, '#7038A5');
});

test('unanswered/timed-out categories carry no stage', () => {
  const r = totals([
    { categoryKey: 'strategic', weight: 2, score: 1, optionId: 'o1', timedOut: false, stage: { key: 'analysis', name: 'Analysis', color: '#E52032' } },
    { categoryKey: 'operational', weight: 5, score: 0, optionId: null, timedOut: true },
    { categoryKey: 'revenue', weight: 3, score: 0, optionId: null, timedOut: false },
  ]);
  assert.equal(r.scores.operational, null);
  assert.equal(r.scores.revenue, null);
  assert.equal(r.scores.strategic.stage.name, 'Analysis');
});

test('selected option color reaches the result untouched by the score', () => {
  const stageMap = {
    'due-diligence': { key: 'due-diligence', name: 'Due Diligence', color: '#FCA700' },
    analysis: { key: 'analysis', name: 'Analysis', color: '#E52032' },
  };
  const answers = [
    // Snapshotted stage (current sessions): colour comes straight from option.stage
    { categoryKey: 'operational', weight: 1, score: 1, optionId: 'o1', optionText: 'Yes', timedOut: false, stage: { key: 'due-diligence', name: 'Due Diligence', color: '#FCA700' } },
    // Legacy snapshot with only stageKey: colour resolved once via the stage map
    { categoryKey: 'revenue', weight: 1, score: 0, optionId: 'o1', optionText: 'No', timedOut: false, stageKey: 'analysis' },
  ];
  const r = totals(answers, stageMap);
  assert.equal(r.scores.operational.answer, 'Yes');
  assert.equal(r.scores.operational.selectedOptionColor, '#FCA700');
  assert.equal(r.scores.operational.stage.key, 'due-diligence');
  assert.equal(r.scores.revenue.answer, 'No');
  assert.equal(r.scores.revenue.selectedOptionColor, '#E52032');
  assert.equal(r.scores.revenue.stage.key, 'analysis');
  // score-derived fields stay independent of the colour
  assert.equal(r.scores.operational.earned, 1);
  assert.equal(r.scores.revenue.earned, 0);
});

test('configured option colour wins over the stage colour', () => {
  const stageMap = {
    initiation: { key: 'initiation', name: 'Initiation', color: '#0A78CF' },
    recommendations: { key: 'recommendations', name: 'Recommendations', color: '#0D8845' },
  };
  const answers = [
    // Admin configured NO → RED (#E53935). The stage for the No option is
    // 'initiation' (blue in the seed), so the snapshotted option colour must
    // win — this is the blue-segment bug.
    { categoryKey: 'strategic', weight: 2, score: 0, optionId: 'o1', optionText: 'No', optionColor: '#E53935', timedOut: false, stage: { key: 'initiation', name: 'Initiation', color: '#0A78CF' } },
    { categoryKey: 'operational', weight: 5, score: 1, optionId: 'o2', optionText: 'Yes', optionColor: '#4CAF50', timedOut: false, stage: { key: 'recommendations', name: 'Recommendations', color: '#0D8845' } },
  ];
  const r = totals(answers, stageMap);
  assert.equal(r.scores.strategic.selectedOptionColor, '#E53935');
  assert.equal(r.scores.operational.selectedOptionColor, '#4CAF50');
  // breakdown preserves the snapshotted option colour too
  assert.equal(r.scores.strategic.optionColor, '#E53935');
  assert.equal(r.scores.operational.optionColor, '#4CAF50');
  // weights/score unaffected by the colour plumbing (5 earned / 7 possible)
  assert.equal(r.overallPct, 71);
});

test('legacy session without optionColor falls back to stage colour', () => {
  const stageMap = {
    initiation: { key: 'initiation', name: 'Initiation', color: '#0A78CF' },
  };
  const r = totals([
    { categoryKey: 'strategic', weight: 2, score: 0, optionId: 'o1', optionText: 'No', timedOut: false, stageKey: 'initiation' },
  ], stageMap);
  assert.equal(r.scores.strategic.optionColor, null);
  assert.equal(r.scores.strategic.selectedOptionColor, '#0A78CF');
});

test('a score with no configured option stage has no selected-option colour', () => {
  const r = totals([mk('strategic', 1, 1)]);
  assert.equal(r.scores.strategic.selectedOptionColor, null);
  assert.equal(r.scores.strategic.answer, null);
});
