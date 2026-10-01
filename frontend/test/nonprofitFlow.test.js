/* ─────────────────────────────────────────────────────────────────────────
   NON-PROFIT PARTICIPANT FLOW REGRESSION
   ─────────────────────────────────────────────────────────────────────────
   The Non-Profit path the user actually walks:

     Landing → Business Type (Non-Profit) → onboarding questions
            → onboarding result → Disclaimer → Q1/18 … Q18/18
            → Foundation Health Score

   with no second Business Type selector, no Domain selector, no
   Generic/Domain toggle and no "Other" step anywhere.

   These tests walk the routing functions with a real-shaped `meta` payload
   and additionally assert on the SCREEN SOURCE that no Non-Profit-only branch
   has crept back in — a routing function can pass while the component
   re-introduces a selector on top of it.
   ───────────────────────────────────────────────────────────────────────── */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import {
  SCREEN,
  requiresDomainSelection,
  isKnownBusinessType,
  isFirstTimeSelection,
  SELECTION_MODE,
  nextScreenAfterDisclaimer,
  screenAfterBusinessTypeSelect,
  screenAfterBusinessEntry,
  screenAfterFirstTimeOnboarding,
  kyRootFor,
  rootShowsOnboardingResult,
  rootContentFor,
  resultActionLabelFor,
  resultHeadingLabelFor,
} from '../src/lib/kyFlow.js';

const SRC = resolve(dirname(fileURLToPath(import.meta.url)), '../src');
const read = (p) => readFileSync(resolve(SRC, p), 'utf8');

const APP_JSX = read('App.jsx');
const QUESTION_SCREEN_RAW = read('screens/KnowYourselfScreen.jsx');
// Comments explain WHY the flag is used and name the roots as examples; only
// executable code is subject to the "no root id in the screen" rule.
const stripComments = (src) =>
  src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s+\/\/.*$/gm, '');
const QUESTION_SCREEN = stripComments(QUESTION_SCREEN_RAW);
const DISCLAIMER_SCREEN = read('screens/DisclaimerScreen.jsx');
const RESULT_SCREEN = read('screens/ResultScreen.jsx');
const BUSINESS_TYPE_SCREEN = read('screens/BusinessTypeScreen.jsx');

/* The real `/know-yourself/meta` shape, with the Non-Profit entry carrying
   the exact disclaimer copy the backend serves. */
const NONPROFIT_DISCLAIMER =
  "This diagnostic evaluates your non-profit\u2019s governance, operations, compliance, and organizational maturity across six core pillars. It is based on key Indian regulations, including 12AB, 80G, FCRA, CSR, and NGO-DARPAN requirements.";

const contentFor = (id, label, entity, terms) => ({
  id,
  entity,
  resultActionLabel: label,
  resultHeadingLabel: label,
  screenTitle: 'Welcome to the Profit Architecture Diagnostic (PAD)',
  terms: { title: 'Disclaimer & Terms of Use', body: terms },
  about: { title: 'About', body: `about ${entity}` },
});

const META_CONTENT = {
  'manufacturing-services': contentFor('manufacturing-services', 'Your Business', 'your business', 'mfg terms'),
  startup: contentFor('startup', 'Your Enterprise', 'your venture', 'startup terms'),
  'non-profit': contentFor('non-profit', 'Your Foundation', 'your organization', NONPROFIT_DISCLAIMER),
};

const META = {
  businessTypes: [
    { key: 'service', kyRoot: 'manufacturing-services', requiresDomainSelection: true, content: META_CONTENT['manufacturing-services'] },
    { key: 'product', kyRoot: 'manufacturing-services', requiresDomainSelection: true, content: META_CONTENT['manufacturing-services'] },
    { key: 'ngo', kyRoot: 'non-profit', requiresDomainSelection: false, content: META_CONTENT['non-profit'] },
    { key: 'startup', kyRoot: 'startup', requiresDomainSelection: false, content: META_CONTENT.startup },
  ],
  kyRoots: Object.entries(META_CONTENT).map(([id, content]) => ({ id, content })),
};

const NGO = { key: 'ngo', label: 'Non-Profit' };
const STARTUP = { key: 'startup', label: 'Start-Up' };
const SERVICE = { key: 'service', label: 'Services' };
const PRODUCT = { key: 'product', label: 'Manufacturing' };

/* ── Landing: Business Type is the single source of truth ───────────── */

test('a Non-Profit picked on the Landing page routes to onboarding, not to any selector', () => {
  assert.ok(isFirstTimeSelection(SELECTION_MODE.SELECT));
  assert.equal(screenAfterBusinessTypeSelect(NGO, META), SCREEN.QUESTIONS,
    'Non-Profit has no domain step, so it goes straight to the questions');
});

test('re-entering Business with Non-Profit already chosen lands on the Disclaimer', () => {
  // The Business tab is the normal way back in. It must NOT re-ask the type.
  assert.equal(screenAfterBusinessEntry(NGO), SCREEN.DISCLAIMER);
  assert.equal(screenAfterBusinessEntry(null), SCREEN.BUSINESS_TYPE);
});

/* ── Onboarding → Disclaimer → Q1 ──────────────────────────────────── */

test('Non-Profit shows the onboarding result, then the Disclaimer, then Q1', () => {
  // Landing → onboarding questions → onboarding pie result → Disclaimer → Q1.
  assert.equal(rootShowsOnboardingResult(NGO, META), true);
  assert.equal(screenAfterFirstTimeOnboarding(NGO, META), SCREEN.ONBOARDING_RESULT);
  // From the onboarding result the Business button lands on the Disclaimer,
  // because the type is already saved — so the consent gate is never skipped.
  assert.equal(screenAfterBusinessEntry(NGO), SCREEN.DISCLAIMER);
  // And the Disclaimer hands straight to the questions.
  assert.equal(nextScreenAfterDisclaimer(NGO, META), SCREEN.QUESTIONS);
});

test('Start-Up shows no onboarding result and goes onboarding → Disclaimer → Q1', () => {
  assert.equal(rootShowsOnboardingResult(STARTUP, META), false);
  assert.equal(screenAfterFirstTimeOnboarding(STARTUP, META), SCREEN.DISCLAIMER);
  assert.equal(nextScreenAfterDisclaimer(STARTUP, META), SCREEN.QUESTIONS);
});

/* ── No second selector, no domain selector ────────────────────────── */

test('Non-Profit never routes to the Business Type or Domain screens again', () => {
  const reachable = new Set([
    screenAfterBusinessTypeSelect(NGO, META),
    screenAfterFirstTimeOnboarding(NGO, META),
    screenAfterBusinessEntry(NGO),
    nextScreenAfterDisclaimer(NGO, META),
  ]);
  assert.equal(reachable.has(SCREEN.BUSINESS_TYPE), false, 'Non-Profit fell back to Business Type selection');
  assert.equal(reachable.has(SCREEN.DOMAIN_SELECT), false, 'Non-Profit fell through to Domain selection');
});

test('Non-Profit needs no domain selection and is a known business type', () => {
  assert.equal(requiresDomainSelection(NGO, META), false);
  assert.equal(isKnownBusinessType(NGO, META), true);
  assert.equal(kyRootFor(NGO, META), 'non-profit');
});

test('a Non-Profit key the backend no longer knows falls back to selection, never to a domain', () => {
  // Stale localStorage from a previous key must not strand the user in a
  // domain screen they cannot complete.
  const stale = { key: 'ngo-renamed', label: 'Non-Profit' };
  assert.equal(isKnownBusinessType(stale, META), false);
  assert.equal(nextScreenAfterDisclaimer(stale, META), SCREEN.BUSINESS_TYPE);
});

/* ── The 18 questions and the result ───────────────────────────────── */

test('Non-Profit is scored and labelled as a Foundation, not a Business', () => {
  assert.equal(resultActionLabelFor(NGO, META), 'Your Foundation');
  assert.equal(resultHeadingLabelFor(NGO, META), 'Your Foundation');
  const content = rootContentFor(NGO, META);
  assert.equal(content.id, 'non-profit');
  assert.equal(content.entity, 'your organization');
});

test('the Non-Profit Disclaimer copy is served by the API, not hardcoded in the app', () => {
  const content = rootContentFor(NGO, META);
  assert.equal(content.terms.body, NONPROFIT_DISCLAIMER);
  // The screen must render the backend copy rather than carry its own string,
  // so the legal text can only ever change in one place.
  assert.doesNotMatch(DISCLAIMER_SCREEN, /12AB/);
  assert.match(DISCLAIMER_SCREEN, /terms\.body|terms\?\.body/);
});

test('the question session is not hardwired to any question count', () => {
  // The pool size comes from the assignment payload. Any literal count baked
  // into the screen would silently mis-report progress for a bank of a
  // different size. Numbers here are matched only in a length/progress
  // position, so the framer-motion offsets (y: 18, x: -20) do not trip it.
  assert.doesNotMatch(QUESTION_SCREEN, /\btotal\s*=\s*\d/);
  assert.doesNotMatch(QUESTION_SCREEN, /(length|count|size|total)\s*[=:]\s*(9|18|20)\b/i);
  assert.doesNotMatch(QUESTION_SCREEN, /\b(9|18|20)\s*(of|\/)\s*(9|18|20)\b/i);
  // The count arrives as the `total` prop and progress is derived from it, so a
  // bank of any size reports itself correctly.
  assert.match(QUESTION_SCREEN, /\btotal,/);
  assert.match(QUESTION_SCREEN, /\(effective \/ total\) \* 100/);
});

test('the session screen gates Business Type / Domain controls on the backend flag', () => {
  // canChangeSelection is what hides the Change control and the Domain row.
  // It must be driven by the same requiresDomainSelection() the routing uses,
  // never by a hardcoded root list.
  assert.match(APP_JSX, /canChangeSelection=\{requiresDomainSelection\(kyBusinessType, kyMeta\)\}/);
  // Both controls are individually gated by that flag, so a Non-Profit
  // participant (requiresDomainSelection === false) sees neither.
  assert.match(QUESTION_SCREEN, /onChangeBusiness && canChangeSelection/);
  assert.match(QUESTION_SCREEN, /\{canChangeSelection && \(/);
  // And no root id appears in executable code at all — only in comments.
  assert.doesNotMatch(QUESTION_SCREEN, /startup|non-profit|ngo|manufacturing-services/i);
  assert.match(QUESTION_SCREEN_RAW, /"Start-Up and Non-Profit have no domain"/,
    'the flag\'s provenance should stay documented for the next reader');
});

test('the question screen exposes no Generic/Domain or "Other" choice for any root', () => {
  assert.doesNotMatch(QUESTION_SCREEN, /\bOther\b/);
  assert.doesNotMatch(QUESTION_SCREEN, /generic.*domain|domain.*generic/i);
});

test('the result screen renders the pillar scores the API returns', () => {
  assert.doesNotMatch(RESULT_SCREEN, /strategic-direction|financial-performance|sales-market-growth/i);
  assert.match(RESULT_SCREEN, /categories/);
});

/* ── Services / Manufacturing must be untouched ────────────────────── */

test('Services and Manufacturing still route through Domain selection', () => {
  for (const bt of [SERVICE, PRODUCT]) {
    assert.equal(requiresDomainSelection(bt, META), true);
    assert.equal(nextScreenAfterDisclaimer(bt, META), SCREEN.DOMAIN_SELECT);
    assert.equal(screenAfterBusinessTypeSelect(bt, META), SCREEN.DOMAIN_SELECT);
    assert.equal(kyRootFor(bt, META), 'manufacturing-services');
  }
  assert.equal(resultActionLabelFor(SERVICE, META), 'Your Business');
});

test('an explicit Change Business is distinguishable from a first-time pick', () => {
  // Change mode is the ONE legitimate way back to selection, and it must be
  // explicit: isFirstTimeSelection() is what tells the two apart, so that
  // re-entering Business never silently re-runs onboarding. It is not
  // reachable from the Non-Profit happy path, which stays on QUESTIONS.
  assert.equal(isFirstTimeSelection(SELECTION_MODE.CHANGE), false);
  assert.equal(isFirstTimeSelection(SELECTION_MODE.SELECT), true);
  assert.equal(isFirstTimeSelection(undefined), true, 'unknown mode must be treated as first time');
  assert.equal(nextScreenAfterDisclaimer(NGO, META), SCREEN.QUESTIONS);
});

test('the Business Type screen still lists the Non-Profit choice', () => {
  assert.match(BUSINESS_TYPE_SCREEN, /businessTypes|meta/);
});