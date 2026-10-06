/* ─────────────────────────────────────────────────────────────
   RESULT VISUALIZATION GUARDS

   1. The Heat Map is GONE from the result layer: no source file may
      mention it, and the selector's VIEWS list can never offer it.
   2. The radar's grid rings, tick labels and plotted polygon all come
      from ONE configuration (RADAR_SCALE, domain 0–100, ticks
      0/25/50/75/100) — verified both on the module and on the SVG the
      component actually renders, including calibration runs with every
      pillar pinned to 25 / 50 / 75 / 100.
   ───────────────────────────────────────────────────────────── */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, writeFileSync, rmSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src');
const EPS = 1e-6; // geometry tolerance in SVG user units (sub-micron)

function sourceFiles(dir) {
  return readdirSync(dir, { recursive: true }).map((f) => join(dir, String(f)));
}
function read(rel) {
  return readFileSync(join(ROOT, rel), 'utf8');
}
function dist(x, y, cx = 168, cy = 130) {
  return Math.hypot(x - cx, y - cy);
}
function attrsOf(tag) {
  const out = {};
  for (const m of tag.matchAll(/([a-zA-Z-]+)="([^"]*)"/g)) out[m[1]] = m[2];
  return out;
}

/* ── 1. Heat Map completely removed ───────────────────────────── */

test('Heat Map: no trace of it anywhere in the result source tree', () => {
  const offenders = sourceFiles(SRC)
    .filter((f) => /\.(jsx?|mjs)$/.test(f))
    .map((f) => [f, readFileSync(f, 'utf8')])
    .filter(([, code]) => /heat[\s_-]?map/i.test(code))
    .map(([f]) => f);
  assert.deepEqual(offenders, [], `Heat Map code still present in: ${offenders.join(', ')}`);
});

test('Heat Map: the selector cannot offer a tab/button/toggle for it', async () => {
  // VIEWS drives VisualizationSelector and VisualizationArea. Bundle the real
  // module (JSX needs a transform) and read the real list.
  const mod = await bundleModule('src/components/ResultVisualizations.jsx');
  const ids = mod.VIEWS.map((v) => v.id);
  assert.ok(!ids.includes('heatmap'), `VIEWS still contains heatmap: ${JSON.stringify(ids)}`);
  assert.equal(ids[0], 'radar', 'the radar must remain the primary/first visualization');
  assert.equal(new Set(ids).size, ids.length, 'duplicate view ids');
});

/* ── 2/3/4. Radar scale configuration ─────────────────────────── */

test('Radar scale: domain 0–100, ticks exactly 0/25/50/75/100', async () => {
  const { RADAR_SCALE } = await import('../src/components/radarScale.js');
  assert.equal(RADAR_SCALE.min, 0);
  assert.equal(RADAR_SCALE.max, 100);
  assert.deepEqual([...RADAR_SCALE.ticks], [0, 25, 50, 75, 100]);
});

test('Radar scale: radiusFor maps the canonical percentages with a zero baseline', async () => {
  const { RADAR_SCALE, RADAR_VIEW, radiusFor } = await import('../src/components/radarScale.js');
  assert.equal(radiusFor(0), 0, '0 must be the centre');
  for (const tick of [25, 50, 75, 100]) {
    assert.ok(Math.abs(radiusFor(tick) - (RADAR_VIEW.r * tick) / RADAR_SCALE.max) < EPS);
  }
  assert.equal(radiusFor(100), RADAR_VIEW.r, '100 must reach the outer ring');
  assert.equal(radiusFor(25) * 2, radiusFor(50), 'strictly linear');
  assert.equal(radiusFor(50) * 1.5, radiusFor(75), 'strictly linear');
  assert.equal(radiusFor(-10), 0, 'clamped below');
  assert.equal(radiusFor(400), RADAR_VIEW.r, 'clamped above');
});

test('Radar scale: every tick label point sits EXACTLY on its own ring', async () => {
  const { RADAR_SCALE, radiusFor, tickLabelPoint, ringPoints } = await import('../src/components/radarScale.js');
  for (const n of [5, 6, 7, 8]) {
    for (const tick of RADAR_SCALE.ticks) {
      const [lx, ly] = tickLabelPoint(tick, n);
      const r = radiusFor(tick);
      assert.ok(Math.abs(dist(lx, ly) - r) < EPS, `label ${tick} (n=${n}) is ${dist(lx, ly)} from centre, ring is ${r}`);
      // …and it is a vertex of the drawn ring polygon, i.e. on the line itself.
      const onRing = ringPoints(n, tick).some(([x, y]) => Math.abs(x - lx) < EPS && Math.abs(y - ly) < EPS);
      assert.ok(onRing, `label ${tick} (n=${n}) does not sit on a vertex of its ring polygon`);
    }
  }
});

test('Radar scale: data points use the same radial system as the rings', async () => {
  const { RADAR_SCALE, radiusFor, dataPoint, ringPoints, tickLabelPoint } = await import('../src/components/radarScale.js');
  for (const tick of [25, 50, 75, 100]) {
    for (let i = 0; i < 6; i++) {
      const [dx, dy] = dataPoint(6, i, tick); // a score equal to the ring value
      const [rx, ry] = ringPoints(6, tick)[i]; // the ring vertex on the same axis
      assert.ok(Math.abs(dx - rx) < EPS && Math.abs(dy - ry) < EPS, `score ${tick} on axis ${i} missed its ring`);
      assert.ok(Math.abs(dist(dx, dy) - radiusFor(tick)) < EPS);
    }
  }
  const [cx0, cy0] = tickLabelPoint(0, 6);
  assert.ok(Math.abs(cx0 - 168) < EPS && Math.abs(cy0 - 130) < EPS, 'the 0 label must be at the centre');
  assert.ok(RADAR_SCALE.max === 100 && RADAR_SCALE.min === 0);
});

/* ── 5. The SVG the component ACTUALLY renders ────────────────── */

let cachedBundle = null;
async function bundleModule(entry) {
  if (cachedBundle && cachedBundle.entry === entry) return cachedBundle.mod;
  const esbuild = await import('esbuild');
  const build = esbuild.build || esbuild.default.build;
  const out = await build({
    entryPoints: [join(ROOT, entry)],
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'browser',
    jsx: 'automatic',
    external: ['react', 'react/jsx-runtime', 'react-dom', 'framer-motion'],
    loader: { '.css': 'empty', '.png': 'dataurl', '.jpg': 'dataurl', '.jpeg': 'dataurl', '.svg': 'dataurl', '.webp': 'dataurl', '.gif': 'dataurl' },
    define: { 'import.meta.env': '{}' },
    logLevel: 'silent',
  });
  const tmp = join(ROOT, 'test', `.bundle-${Date.now()}-${Math.random().toString(36).slice(2)}.mjs`);
  writeFileSync(tmp, out.outputFiles[0].text);
  let mod;
  try {
    mod = await import(pathToFileURL(tmp).href);
  } finally {
    rmSync(tmp, { force: true });
  }
  cachedBundle = { entry, mod };
  return mod;
}

async function renderRadar(categories) {
  const mod = await bundleModule('src/screens/KnowYourselfResult.jsx');
  assert.equal(typeof mod.RadarChart, 'function', 'RadarChart must be exported for render testing');
  const React = (await import('react')).default;
  const { renderToString } = await import('react-dom/server');
  return renderToString(React.createElement(mod.RadarChart, { categories }));
}

function parseRadar(svg) {
  const viewBox = /viewBox="([^"]+)"/.exec(svg);
  assert.ok(viewBox, 'the radar must render an SVG with a viewBox (fluid scaling)');
  assert.match(svg, /class="[^"]*w-full[^"]*"/, 'the radar must scale with its container (w-full)');

  const polygons = [...svg.matchAll(/<polygon\s+([^>]+)>/g)].map((m) => {
    const a = attrsOf(m[1]);
    const pts = [...a.points.matchAll(/(-?[\d.]+),(-?[\d.]+)/g)].map((p) => [Number(p[1]), Number(p[2])]);
    return { stroke: a.stroke, pts };
  });
  const rings = polygons.filter((p) => p.stroke === 'rgba(255,255,255,0.35)');
  const data = polygons.filter((p) => p.stroke === '#FCA700');

  const labels = {};
  for (const m of svg.matchAll(/<text\s+([^>]+)>([\s\S]*?)<\/text>/g)) {
    const a = attrsOf(m[1]);
    const inner = m[2].replace(/<!-- -->/g, ''); // React SSR comment markers
    const t = /^(\d+)%$/.exec(inner);
    if (t && a.x !== undefined) labels[Number(t[1])] = [Number(a.x), Number(a.y)];
  }
  return { rings, data, labels, viewBox: viewBox[1] };
}

const PILLARS = ['Strategic Direction', 'Operations', 'Finance', 'People', 'Sales', 'Digital'];

test('Rendered radar: grid, labels and polygon share one 0–100 coordinate system', async () => {
  const svg = await renderRadar(
    PILLARS.map((name, i) => ({ key: `k${i}`, name, percent: 50, color: '#0A78CF' }))
  );
  const { rings, data, labels, viewBox } = parseRadar(svg);
  assert.equal(viewBox, '0 0 336 264');

  // Exactly four grid rings, at 21/42/63/84 user units (= 25/50/75/100% of R=84).
  assert.equal(rings.length, 4, `expected 4 grid rings, got ${rings.length}`);
  const ringRadii = rings
    .map((r) => r.pts.map(([x, y]) => dist(x, y)))
    .map((rs) => {
      for (const r of rs) assert.ok(Math.abs(r - rs[0]) < EPS, 'ring is not a regular polygon');
      return rs[0];
    })
    .sort((a, b) => a - b);
  assert.deepEqual(ringRadii.map((r) => Math.round(r * 1000) / 1000), [21, 42, 63, 84]);

  // Exactly one label per tick — and each label is ON its ring (same radius).
  assert.deepEqual(Object.keys(labels).map(Number).sort((a, b) => a - b), [0, 25, 50, 75, 100]);
  for (const [tick, [x, y]] of Object.entries(labels)) {
    const expected = (84 * Number(tick)) / 100;
    assert.ok(Math.abs(dist(x, y) - expected) < EPS, `label ${tick}% is ${dist(x, y)} from centre, ring is ${expected}`);
  }
  const [z0x, z0y] = labels[0];
  assert.ok(Math.abs(dist(z0x, z0y)) < EPS, `0% label is ${dist(z0x, z0y)} from the centre, expected 0`);

  // The plotted polygon uses the same radii: all pillars = 50 → on the 50 ring.
  assert.equal(data.length, 1, 'exactly one plotted polygon');
  for (const [x, y] of data[0].pts) {
    assert.ok(Math.abs(dist(x, y) - 42) < EPS, `data vertex at ${dist(x, y)}, expected exactly 42 (the 50 ring)`);
  }
});

test('Rendered radar: calibration — every pillar at 25 / 50 / 75 / 100', async () => {
  const expected = { 25: 21, 50: 42, 75: 63, 100: 84 };
  for (const [value, ringR] of Object.entries(expected)) {
    const pct = Number(value);
    const svg = await renderRadar(
      PILLARS.map((name, i) => ({ key: `k${i}`, name, percent: pct, color: '#0A78CF' }))
    );
    const { rings, data, labels } = parseRadar(svg);

    // The label for this tick sits exactly on the ring of the same value.
    const [lx, ly] = labels[pct];
    assert.ok(Math.abs(dist(lx, ly) - ringR) < EPS, `${pct}% label not on its ring`);

    // The polygon for an all-pct dataset sits exactly on that ring too.
    assert.equal(data.length, 1);
    for (const [x, y] of data[0].pts) {
      assert.ok(Math.abs(dist(x, y) - ringR) < EPS, `all=${pct}: vertex ${dist(x, y)} ≠ ${ringR}`);
    }

    // …and each ring's own radius matches its label's radius, one-to-one.
    const radii = rings.map((r) => dist(...r.pts[0])).sort((a, b) => a - b);
    assert.ok(Math.abs(radii[pct === 25 ? 0 : pct === 50 ? 1 : pct === 75 ? 2 : 3] - ringR) < EPS);
  }
});

test('Rendered radar: real scores are plotted verbatim (no re-scaling)', async () => {
  const scores = [82, 71, 64, 90, 45, 100];
  const svg = await renderRadar(
    PILLARS.map((name, i) => ({ key: `k${i}`, name, percent: scores[i], color: '#0A78CF' }))
  );
  const { data } = parseRadar(svg);
  assert.equal(data.length, 1);
  scores.forEach((pct, i) => {
    const [x, y] = data[0].pts[i];
    assert.ok(Math.abs(dist(x, y) - (84 * pct) / 100) < EPS, `pillar ${pct}% plotted at radius ${dist(x, y)}`);
  });
});

/* ── 6. Source-level guard: nothing bypasses the shared scale ─── */

test('Radar source: rings, labels and polygon are all derived from RADAR_SCALE', () => {
  const code = read('src/screens/KnowYourselfResult.jsx');

  // Rings come from the configured ticks…
  assert.match(code, /RADAR_SCALE\.ticks\.filter\(\(ring\) => ring > 0\)\.map\(/);
  // …labels come from the SAME ticks through the shared point helper…
  assert.match(code, /RADAR_SCALE\.ticks\.map\(\(tick\) => \{/);
  assert.match(code, /tickLabelPoint\(tick, n\)/);
  // …and the polygon goes through the shared data-point helper.
  assert.match(code, /dataPoint\(n, i, value\)/);
  assert.match(code, /point\(i, c\.percent\)/);

  // The old drift-prone placements must not come back.
  assert.ok(!/\[\s*25\s*,\s*50\s*,\s*75\s*,\s*100\s*\]/.test(code), 'hardcoded ring array reintroduced');
  assert.ok(!/CX\s*-\s*30/.test(code), 'fixed-pixel label offset reintroduced');
  assert.ok(!/\(\s*R\s*\*\s*\w+\s*\/\s*100\s*\)/.test(code), 'radial maths bypassing radarScale.js reintroduced');
});
