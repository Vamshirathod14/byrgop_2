/* ─────────────────────────────────────────────────────────────
   BYRGOP CHART COLOR SYSTEM + EXACT VISUALIZATION SET

   1. Exactly six BYRGOP brand colors exist (the official mark values),
      reused verbatim from theme/brand.js — nothing invented.
   2. The result page offers EXACTLY the Radar, Bubble, Bullet and Bar
      charts (the Heat Map and every other chart type are gone).
   3. Every chart takes its pillar colors from the single centralized
      palette (byrgopChartColors.js): deterministic pillar → color, the
      same color across all four charts, and no 7th color or chart-library
      default ever appears in the rendered SVG.
   ───────────────────────────────────────────────────────────── */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(ROOT, rel), 'utf8');

const { brand } = await import('../src/theme/brand.js');
const { BYRGOP_CHART_COLORS, BYRGOP_CHART_COLOR_COUNT, pillarChartColor } = await import('../src/components/byrgopChartColors.js');

const PALETTE_LOWER = BYRGOP_CHART_COLORS.map((c) => c.toLowerCase());

/* Design-system neutrals already sanctioned for axes/labels/tracks (premium
   whites, ink darks, transparent/none). Data colors must come only from the
   palette — the assertion below fails on any hue outside these two sets. */
const APPROVED_BASE = new Set([
  ...PALETTE_LOWER,
  '#ffffff', '#f8f6f0', '#f5f0e8', '#f6f7fa', // premium white hierarchy
  '#06080e', '#0a0e16', '#0d1220', '#111728', '#1a2336', '#08080e', // ink/halo
  'none', 'transparent',
]);

function baseHex(color) {
  const s = String(color).trim().toLowerCase();
  let m = /^#([0-9a-f]{8})$/.exec(s);
  if (m) return `#${m[1].slice(0, 6)}`;
  m = /^#([0-9a-f]{6})$/.exec(s);
  if (m) return `#${m[1]}`;
  m = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(s);
  if (m) {
    const hex = m.slice(1, 4).map((v) => Number(v).toString(16).padStart(2, '0')).join('');
    return `#${hex}`;
  }
  return s;
}

/* ── 1. Exactly six approved colors ────────────────────────── */

test('exactly 6 approved BYRGOP chart colors, matching the official mark', () => {
  assert.equal(BYRGOP_CHART_COLOR_COUNT, 6, 'there must be exactly 6 colors');
  assert.deepEqual(
    BYRGOP_CHART_COLORS.map((c) => c.toUpperCase()),
    [...brand.mark].map((c) => c.toUpperCase()),
    'the chart palette must reuse the existing official BYRGOP mark hexes verbatim'
  );
  assert.equal(new Set(PALETTE_LOWER).size, 6, 'the six colors must be distinct');
});

test('same pillar → same color, deterministically, and never a 7th color', () => {
  for (let i = 0; i < 6; i++) {
    assert.equal(pillarChartColor(i), BYRGOP_CHART_COLORS[i], `pillar ${i} must map to palette color ${i}`);
  }
  // Any further index reuses the palette — a 7th color can never appear.
  for (let i = 6; i < 60; i++) {
    assert.ok(PALETTE_LOWER.includes(String(pillarChartColor(i)).toLowerCase()), `index ${i} introduced a non-palette color`);
  }
  assert.ok(new Set([0, 1, 2, 3, 4, 5].map(pillarChartColor)).size === 6, 'six pillars → all six colors exactly once');
});

/* ── 2. Exactly Radar / Bubble / Bullet / Bar ──────────────── */

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

const CHART_IDS = ['radar', 'bubble', 'bullet', 'bar'];

test('the result page offers exactly Radar, Bubble, Bullet and Bar (no others)', async () => {
  const mod = await bundleModule('src/components/ResultVisualizations.jsx');
  const ids = mod.VIEWS.map((v) => v.id);
  assert.deepEqual(ids, CHART_IDS, `VIEWS must be exactly ${CHART_IDS.join(', ')} — got ${JSON.stringify(ids)}`);
  for (const banned of ['heatmap', 'bullseye', 'polar', 'nested', 'diverging', 'scatter']) {
    assert.ok(!ids.includes(banned), `VIEWS still offers ${banned}`);
  }
});

test('toPillarData colors every pillar from the centralized palette by index', async () => {
  const mod = await bundleModule('src/components/ResultVisualizations.jsx');
  const cats = ['A', 'B', 'C', 'D', 'E', 'F'].map((k, i) => ({ key: k, name: `Pillar ${i}`, percent: [82, 71, 64, 90, 45, 100][i] }));
  const data = mod.toPillarData(cats);
  assert.deepEqual(
    data.map((c) => c.color.toUpperCase()),
    [...brand.mark].map((c) => c.toUpperCase()),
    'the same six pillars must receive the same six BYRGOP colors, in order, for every chart'
  );
});

async function renderChart(entry, component, props, exportsCheck) {
  const mod = await bundleModule(entry);
  assert.equal(typeof mod[component], 'function', `${component} must be exported for render testing`);
  const React = (await import('react')).default;
  const { renderToString } = await import('react-dom/server');
  return renderToString(React.createElement(mod[component], props));
}

function collectColors(svg) {
  const colors = [];
  for (const attr of ['fill', 'stroke']) {
    for (const m of svg.matchAll(new RegExp(`${attr}="([^"]+)"`, 'g'))) colors.push(m[1]);
  }
  return colors;
}

/* ── 3. Every chart uses only the approved colors ──────────── */

const SIX_PILLARS = ['Strategic Direction', 'Financial Performance', 'Sales & Market Growth', 'Operations & Execution', 'People & Organization', 'Digital & Innovation'];
const SCORES = [82, 71, 64, 90, 45, 100];
const sampleData = SIX_PILLARS.map((name, i) => ({ key: `p${i}`, name, percent: SCORES[i], color: '#0A78CF' }));

test('Bubble, Bullet and Bar render with palette colors only (no defaults, no 7th color)', async () => {
  const mod = await bundleModule('src/components/ResultVisualizations.jsx');
  const React = (await import('react')).default;
  const { renderToString } = await import('react-dom/server');

  const rendered = {
    bubble: renderToString(React.createElement(mod.BubblePlotView, { data: sampleData })),
    bullet: renderToString(React.createElement(mod.BulletChartView, { data: sampleData })),
    bar: renderToString(React.createElement(mod.BarChartView, { data: sampleData })),
  };

  for (const [name, svg] of Object.entries(rendered)) {
    const colors = collectColors(svg);
    assert.ok(colors.length > 0, `${name} rendered no color-bearing elements`);
    for (const c of colors) {
      const base = baseHex(c);
      assert.ok(
        APPROVED_BASE.has(base),
        `${name} used disallowed color ${c} (base ${base}) — charts may only use the six BYRGOP colors and design-system neutrals`
      );
    }
    // Every pillar bar/bubble must actually show a palette color (not a neutral).
    const paletteMarks = colors.filter((c) => PALETTE_LOWER.includes(baseHex(c)));
    assert.ok(paletteMarks.length >= 6, `${name} must colour each pillar from the palette (found ${paletteMarks.length})`);
  }
});

test('Radar vertex dots use the same palette order as the other three charts', async () => {
  const svg = await renderChart('src/screens/KnowYourselfResult.jsx', 'RadarChart', { categories: sampleData, overall: 50 });
  // Vertex dots render as <circle> with a 6-digit hex fill, in axis order.
  const fills = [...svg.matchAll(/<circle[^>]*fill="(#[0-9a-fA-F]{6})"/g)].map((m) => m[1].toUpperCase());
  assert.equal(fills.length, 6, 'the radar must draw one vertex dot per pillar');
  assert.deepEqual(fills, [...brand.mark].map((c) => c.toUpperCase()), 'radar vertices must share the exact palette order with Bubble/Bullet/Bar');
});

test('no hardcoded color arrays or chart-library defaults in the result charts', () => {
  const viz = read('src/components/ResultVisualizations.jsx');
  // Strip comments (the reference notes legitimately mention example hexes);
  // then the only literal hex allowed is the neutral white (#FFFFFF) — every
  // data color flows from the centralized palette module.
  const code = viz.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  const hexes = [...code.matchAll(/#[0-9a-fA-F]{6}\b/g)].map((m) => m[0].toUpperCase());
  assert.deepEqual([...new Set(hexes)], ['#FFFFFF'], `hardcoded color literals found in ResultVisualizations: ${hexes}`);
  assert.ok(!/recharts/.test(viz) && !/Recharts/.test(viz), 'result charts must not use chart-library default palettes');

  const radarSrc = read('src/screens/KnowYourselfResult.jsx');
  assert.match(radarSrc, /pillarChartColor\(/, 'the radar must consume the centralized palette');
});