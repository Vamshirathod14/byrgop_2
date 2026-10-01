import test from 'node:test';
import assert from 'node:assert/strict';
import {
  toPercent,
  percentToUnit,
  percentToAngle,
  percentToExtent,
  PERCENT_MIN,
  PERCENT_MAX,
} from '../src/components/kyPercentScale.js';

/* Controlled values required by the spec. */
const CANONICAL = [0, 20, 50, 80, 100];

test('canonical scale is 0..100', () => {
  assert.equal(PERCENT_MIN, 0);
  assert.equal(PERCENT_MAX, 100);
});

test('toPercent passes the backend 0..100 integer through untouched', () => {
  for (const p of CANONICAL) assert.equal(toPercent(p), p);
  assert.equal(toPercent(20), 20, '20 must NOT be read as 0.20');
  assert.equal(toPercent(0.2), 0.2, '0.2 is not a percentage and must not be rescaled to 20');
  assert.equal(toPercent('63'), 63);
});

test('toPercent clamps and never yields a fraction of the real value', () => {
  assert.equal(toPercent(-10), 0);
  assert.equal(toPercent(140), 100);
  assert.equal(toPercent(null), 0);
  assert.equal(toPercent(undefined), 0);
  assert.equal(toPercent(NaN), 0);
});

test('percentToUnit is a single 0..1 conversion', () => {
  const expected = { 0: 0, 20: 0.2, 50: 0.5, 80: 0.8, 100: 1 };
  for (const p of CANONICAL) assert.equal(percentToUnit(p), expected[p]);
});

test('percentToAngle is a single 0..360 conversion', () => {
  const expected = { 0: 0, 20: 72, 50: 180, 80: 288, 100: 360 };
  for (const p of CANONICAL) assert.equal(percentToAngle(p), expected[p]);
});

/* The regression that matters most: a zero-baseline extent map. */
test('percentToExtent is strictly proportional with a ZERO baseline', () => {
  const max = 40;
  const expected = { 0: 0, 20: 8, 50: 20, 80: 32, 100: 40 };
  for (const p of CANONICAL) assert.equal(percentToExtent(p, max), expected[p]);
  assert.equal(percentToExtent(0, max), 0, '0% must land on the origin, never on a head offset');
  assert.equal(percentToExtent(100, max), max, '100% must reach the full extent');
});

/* Old buggy formulas, kept here to prove the regression is real. */
test('REGRESSION: old bullseye head offset made 20% look like ~47%', () => {
  const old = (p) => 15 + (p / 100) * 30;
  const fix = (p) => percentToExtent(p, 40);
  // Old: 20% -> 21 of 45 = 46.7% of the available radius.
  assert.ok(old(20) / 45 > 0.45, 'old formula pushed 20% past 45% of the radius');
  // Fixed: exactly 20% of the radius.
  assert.equal(fix(20) / 40, 0.2);
  assert.equal(fix(0) / 40, 0);
  assert.equal(fix(100) / 40, 1);
});

test('REGRESSION: old bubble floor radius made 0% visible and 20% ~43% of max', () => {
  const old = (p) => 9 + (p / 100) * 22;
  const fix = (p) => percentToExtent(p, 31);
  assert.ok(old(0) > 0, 'old formula drew a bubble for 0%');
  assert.ok(old(20) / old(100) > 0.4, 'old 20% bubble read as >40% of the largest');
  assert.equal(fix(0), 0);
  assert.equal(fix(20) / fix(100), 0.2);
  assert.equal(fix(50) / fix(100), 0.5);
  assert.equal(fix(80) / fix(100), 0.8);
  assert.equal(fix(100), 31, '100% keeps the previous maximum bubble radius');
});

/* The nested donut used to normalise every pillar against the SUM of the
   pillars instead of against 100. */
test('REGRESSION: nested donut must not normalise a pillar against the pillar sum', () => {
  const pillars = [20, 50, 80];
  const sum = pillars.reduce((s, p) => s + p, 0);
  const oldShare = pillars.map((p) => p / sum);
  const fixedShare = pillars.map((p) => percentToUnit(p));

  // Old: 20% of a 150 total -> 13.3% of the ring, i.e. it looked like 13%.
  assert.equal(oldShare[0], 20 / 150);
  assert.ok(oldShare[0] < 0.2, 'old donut drew 20% as less than a fifth of its ring');
  // Fixed: each ring is its own 0..100 gauge.
  assert.deepEqual(fixedShare, [0.2, 0.5, 0.8]);
});

/* Mixed-result case from the spec: 20 / 50 / 80 must keep correct
   relative magnitudes on the same absolute 0..100 scale. */
test('mixed result 20/50/80 keeps correct relative magnitudes', () => {
  const data = [
    { key: 'strategy', percent: 20 },
    { key: 'operations', percent: 50 },
    { key: 'finance', percent: 80 },
  ];

  const scales = {
    'unit fraction': percentToUnit,
    'degrees / 360': (p) => percentToAngle(p) / 360,
    'extent of 100': (p) => percentToExtent(p, 100),
    'extent of 84 (radar R)': (p) => percentToExtent(p, 84),
  };

  for (const [name, scale] of Object.entries(scales)) {
    const rendered = data.map((c) => scale(c.percent));
    const full = scale(100);
    // Every pillar sits at its own percentage of the SAME absolute 0-100 scale.
    rendered.forEach((got, i) => {
      assert.ok(
        Math.abs(got / full - data[i].percent / 100) < 1e-9,
        `${name}: ${data[i].key} ${data[i].percent}% rendered as ${((got / full) * 100).toFixed(4)}%`
      );
    });
    // Relative magnitudes preserved.
    assert.ok(Math.abs(rendered[0] / rendered[2] - 0.25) < 1e-9, `${name}: 20/80`); // 20/80
    assert.ok(Math.abs(rendered[1] / rendered[2] - 0.625) < 1e-9, `${name}: 50/80`); // 50/80
  }
});

/* End-to-end check of every rendering rule the graphs use, per pillar. */
test('every graph geometry agrees with the displayed percentage', () => {
  const graphs = {
    'donut ring (fractions of own circumference)': (p) => percentToUnit(p),
    'donut ring (degrees)': (p) => percentToAngle(p),
    'bullseye node offset (% of box)': (p) => percentToExtent(p, 40),
    'bubble radius (units)': (p) => percentToExtent(p, 31),
    'bar / bubble / scatter height (units)': (p) => percentToExtent(p, 222),
    'diverging bar length (units)': (p) => percentToExtent(p, 306),
    'radar / polar radius (units)': (p) => percentToExtent(p, 84),
    'score ring dash fraction': (p) => percentToUnit(p),
  };

  for (const [name, render] of Object.entries(graphs)) {
    for (const p of CANONICAL) {
      const max = render(100);
      const got = render(p) / max;
      assert.ok(
        Math.abs(got - p / 100) < 1e-9,
        `${name}: ${p}% rendered as ${(got * 100).toFixed(4)}%`
      );
    }
  }
});

/* ── Diverging bar: signed deviation from 50% → absolute 0–100 ──────── */

test('diverging bar length is now absolute, not distance from the 50% centerline', () => {
  const plotW = 306; // plotRight 430 − plotLeft 124
  const barLength = (p) => percentToExtent(p, plotW);

  // The spec's required mapping.
  assert.deepEqual(
    CANONICAL.map((p) => Number(barLength(p).toFixed(4))),
    [0, 61.2, 153, 244.8, 306]
  );

  // 20% must be shorter than 80% — the old formula drew them identically.
  assert.ok(barLength(20) < barLength(80), '20% must be shorter than 80%');
  assert.ok(barLength(20) * 4 <= barLength(80) + 1e-9);

  // Zero length at 0%, full plot width at 100%.
  assert.equal(barLength(0), 0, '0% must draw zero length');
  assert.equal(barLength(100), plotW, '100% must fill the plot width');
});

test('REGRESSION: old diverging bar drew 20% and 80% as the same length', () => {
  const scale = 2.8;
  const oldLength = (p) => Math.abs(p - 50) * scale;
  const plotW = 306;
  const barLength = (p) => percentToExtent(p, plotW);

  // Old: equal lengths for 20% and 80%, and a 0% bar that was the LONGEST.
  assert.equal(oldLength(20), oldLength(80));
  assert.ok(oldLength(0) > oldLength(20));

  // Fixed: strictly monotonic in the percentage, zero at the origin.
  assert.equal(oldLength(20), 84);
  assert.equal(barLength(0), 0);
  assert.ok(barLength(20) < barLength(50) && barLength(50) < barLength(80));
});

/* Structural guard: the spec forbids dataset-relative normalisation and
   arbitrary offsets anywhere in the result graphs. */
test('ResultVisualizations.jsx contains no dataset-relative normalisation', async () => {
  const { readFile } = await import('node:fs/promises');
  const { fileURLToPath } = await import('node:url');
  const path = fileURLToPath(new URL('../src/components/ResultVisualizations.jsx', import.meta.url));
  const src = await readFile(path, 'utf8');

  // Strip comments so the documentation block explaining the removed
  // formulas does not trip the guards.
  const code = src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');

  const banned = [
    // signed deviation from a 50% centerline (the old diverging bar)
    [/\bpercent\b\s*-\s*50\b/, 'a percentage is still treated as a deviation from 50'],
    [/\b50\s*-\s*[A-Za-z_$][\w$]*\.?percent\b/, 'a percentage is still treated as a deviation from 50'],
    // dynamic normalisation against the dataset (max / spread / total)
    [/Math\.max\([^()]*\.map\(/, 'a percentage is normalised against the dataset maximum'],
    [/Math\.max\([^()]*\.\.\./, 'a percentage is normalised against the dataset maximum'],
    [/\.reduce\(/, 'percentages are being summed for normalisation'],
    // arbitrary non-zero baseline added to a radius / offset / length
    [/\d+\s*\+\s*\(\s*[A-Za-z_$][\w$.]*\s*\/\s*100\s*\)/, 'a fixed head offset is added to a percentage extent'],
  ];

  for (const [re, why] of banned) {
    assert.ok(!re.test(code), `ResultVisualizations.jsx: ${why} (${re})`);
  }

  // Every view must go through the single conversion point.
  assert.ok(
    /import\s*\{[^}]*percentToExtent[^}]*\}\s*from\s*'\.\/kyPercentScale\.js'/.test(code),
    'the canonical scale helper must be imported'
  );
  const rawDivisions = code.match(/\/\s*100\b/g) || [];
  assert.equal(
    rawDivisions.length,
    0,
    `percentages must not be divided by 100 outside kyPercentScale.js (found ${rawDivisions.length})`
  );
});

