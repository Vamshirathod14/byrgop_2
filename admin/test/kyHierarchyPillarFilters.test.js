/* ─────────────────────────────────────────────────────────────────────────
   KY QUESTIONS PILLAR FILTERS — dynamic, per-view, per-domain counts
   ─────────────────────────────────────────────────────────────────────────
   Every root/domain gets a pillar filter row whose counts are calculated from
   the ACTUAL active questions in the CURRENT scope, then rendered as buttons:

     [ All 9 ] [ Strategic Direction 2 ] [ Financial Performance 1 ] ...

   · Mfg & Services: counts are scoped to the SELECTED DOMAIN only (never
     across Retail / Healthcare / Technology, never across Manufacturing).
   · Start-Up & Non-Profit: no domain layer — pillar filters count the whole
     root's active questions.
   · Clicking a pillar shows only that pillar's questions in the scope; `All`
     restores the complete active list.
   · A configured pillar with zero active questions renders as "Name 0" and is
     disabled — never hidden, never padded with fake questions.
   ───────────────────────────────────────────────────────────────────────── */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const src = (rel) => readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), rel), 'utf8');
const PAGE = src('../src/pages/KnowYourselfQuestions.jsx');

/* ── 1–5. Mfg & Services: per-domain pillar counts ──────────────────── */

test('1. a selected domain shows its total active question count', () => {
  // The `All N` chip and the active-domain heading both measure the scope.
  assert.match(PAGE, /All \{pillarScope\.length\}/);
  assert.match(PAGE, /\{activeCountFor\(selectedDomain\.slug\)\} active question/);
});

test('2. Services pillar chips carry dynamically calculated counts', () => {
  assert.match(PAGE, /const pillarChips = liveCategories\.map\(\(c\) => \(\{/);
  assert.match(PAGE, /count: pillarScope\.filter\(\(q\) => q\.category === c\.key\)\.length/);
  assert.match(PAGE, /\{p\.name\} \{p\.count\}/);
});

test('3. clicking a Services pillar displays only that pillar’s questions', () => {
  assert.match(PAGE, /onClick=\{\(\) => p\.count > 0 && setPillar\(p\.key\)\}/);
  // The visible list is already filtered by the chosen pillar…
  assert.match(PAGE, /if \(pillar !== 'all' && q\.category !== pillar\) return false;/);
  // …and pillar grouping only happens on `all`, so a picked pillar is a flat list.
  assert.match(PAGE, /if \(pillar === 'all' && \(sectionTab === 'generic' \|\| selectedDomain\)\) \{/);
});

test('4/5. Manufacturing behaves identically, scoped to the selected domain only', () => {
  // There is exactly ONE scope, used by every section — no whole-bank counter
  // that could leak Retail's counts into Financial Services, or a Services
  // count into a Manufacturing domain.
  assert.equal((PAGE.match(/const pillarScope/g) || []).length, 1,
    'there must be exactly one pillar-counting scope, shared by all roots');
  assert.match(PAGE, /const pillarScope = selectedDomain\s*\?/);
  assert.match(
    PAGE,
    /liveQuestions\.filter\(\(q\) => q\.type === 'domain' && q\.domain === selectedDomain\.slug\)/,
    'a domain’s pillar counts must come from that domain’s active questions only'
  );
});

test('14/15. Services and Manufacturing can never leak into each other', () => {
  // A question is "of" a business type only when its DOMAIN is owned by it
  // (Domain.businessTypeId), and a domain's counts come from that domain's
  // questions — so no Retail question can appear under a Manufacturing section
  // and no Manufacturing question under Services.
  assert.match(PAGE, /return q\.type === 'domain' && inBusinessType\(q, sectionTab\);/);
  assert.match(PAGE, /String\(d\.businessTypeId\) === String\(bt\._id\)/);
});

/* ── 6–10. Start-Up / Non-Profit: pillar filters with no domain layer ── */

test('6/7. Start-Up and Non-Profit show pillar filters directly (no domain layer)', () => {
  // The pillar row renders for the single-tab ('all') roots, which have no
  // domain chips at all.
  assert.match(PAGE, /rootHasDomains \? sectionTab === 'generic' \|\| !!selectedDomain : sectionTab === 'all'/);
  assert.match(PAGE, /sectionTab === 'all' && \(/);
  assert.match(PAGE, /const sectionDomains = selectedBtKey\s*\?/,
    'domain chips exist only under a selected business type');
});

test('8/9. Start-Up and Non-Profit pillar filtering works (same mechanism as Mfg/Services)', () => {
  assert.match(PAGE, /onClick=\{\(\) => p\.count > 0 && setPillar\(p\.key\)\}/);
  assert.match(PAGE, /if \(pillar !== 'all' && q\.category !== pillar\) return false;/);
  // The single-tab roots' active total is shown above the chips.
  assert.match(PAGE, /· \{pillarScope\.length\} active question/);
});

test('10. All restores the complete active question list', () => {
  assert.match(PAGE, /onClick=\{\(\) => setPillar\('all'\)\}/);
  assert.match(PAGE, /All \{pillarScope\.length\}/);
  assert.match(PAGE, /if \(pillar !== 'all' && q\.category !== pillar\) return false;/);
});

/* ── 11–13. Integrity ───────────────────────────────────────────────── */

test('11. no question renders twice', () => {
  assert.match(PAGE, /<div key=\{q\._id\} className="card">/);
  assert.match(PAGE, /{g\.items\.map\(renderCard\)}/);
});

test('12. inactive questions never reach the chips or the list', () => {
  // `liveQuestions` (active rows only by default) feeds BOTH the visible list
  // and pillarScope — the retired rows only join when the toggle is explicit.
  assert.match(PAGE, /const liveQuestions = useMemo\(/);
  assert.match(PAGE, /showRetired \? questions : questions\.filter\(\(q\) => q\.active !== false\)/);
  assert.match(
    PAGE,
    /liveQuestions\.filter\(\(q\) => q\.type === 'domain' && q\.domain === selectedDomain\.slug\)/
  );
});

test('13. zero-question configured pillars stay visible and disabled', () => {
  assert.match(PAGE, /disabled=\{p\.count === 0\}/);
  assert.match(PAGE, /title=\{p\.count === 0 \? 'No active questions in this pillar'/);
  // Every configured pillar is mapped to a chip (never pre-filtered by count).
  assert.match(PAGE, /const pillarChips = liveCategories\.map\(\(c\) => \(\{/);
});

/* ── Placement + hierarchy preserved ────────────────────────────────── */

test('the pillar filter row sits below the domain selection and above the question list', () => {
  const domainNav = PAGE.indexOf('{/* Domain sub-navigation');
  const heading = PAGE.indexOf('{/* Active-domain heading');
  const pillarRow = PAGE.indexOf('{/* Pillar filter row');
  const questionList = PAGE.indexOf('{selectedBtKey && !selectedDomain && (');
  assert.ok(domainNav !== -1 && heading !== -1 && pillarRow !== -1 && questionList !== -1);
  assert.ok(domainNav < heading && heading < pillarRow && pillarRow < questionList,
    'order must be: domain selection → domain heading → pillar row → question list');
});

test('16. Start-Up / Non-Profit questions stay root-isolated', () => {
  // Each workspace fetches its own root's bank only, and a domain-less root has
  // a single "All <root> Questions" tab with no domain chips.
  assert.match(PAGE, /api\.kyQuestions\(\{ root, includeInactive: rootHasDomains \}\)/);
  assert.match(PAGE, /\{ key: 'all', label: `All \$\{kyRoot\.short\} Questions` \}\]/);
  assert.doesNotMatch(PAGE, /label: 'All Questions'/);
});

test('17. the existing Generic | Services | Manufacturing hierarchy is unchanged', () => {
  assert.match(PAGE, /const topTabs = rootHasDomains\s*\?\s*\[/);
  assert.match(PAGE, /\{ key: 'generic', label: 'Generic' \}/);
  assert.doesNotMatch(PAGE, /\{ key: 'domain', label: 'Domain-specific' \}/);
  assert.doesNotMatch(PAGE, /topTab === 'domain'/);
});