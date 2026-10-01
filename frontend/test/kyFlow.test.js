import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import {
  SCREEN,
  isValidBusinessType,
  isKnownBusinessType,
  requiresDomainSelection,
  nextScreenAfterDisclaimer,
  screenAfterBusinessTypeSelect,
  screenAfterBusinessEntry,
  isFirstTimeSelection,
  SELECTION_MODE,
  resolveCarriedBusinessType,
  kyRootFor,
  rootShowsOnboardingResult,
  screenAfterFirstTimeOnboarding,
  rootContentFor,
  resultActionLabelFor,
  resultHeadingLabelFor,
} from '../src/lib/kyFlow.js';

/* Mirrors the real `/know-yourself/meta` payload, which derives
   `requiresDomainSelection` and the root's Disclaimer copy from each business
   type's configured question root.

   The `content` blocks below are the shapes the backend actually sends. Only
   the fields these tests assert on are populated — the frontend must not care
   which other fields exist. */
function contentFor(id, label, entity, extra = {}) {
  return {
    id,
    entity,
    resultActionLabel: label,
    resultHeadingLabel: label,
    screenTitle: 'Welcome to the Profit Architecture Diagnostic (PAD)',
    terms: { title: 'Disclaimer & Terms of Use', body: `proprietary terms for ${entity}` },
    about: { title: 'About', body: `about ${entity}` },
    ...extra,
  };
}

const META_CONTENT = {
  'manufacturing-services': contentFor('manufacturing-services', 'Your Business', 'your business'),
  startup: contentFor('startup', 'Your Enterprise', 'your venture'),
  'non-profit': contentFor('non-profit', 'Your Foundation', 'your organization'),
};

const META = {
  businessTypes: [
    {
      key: 'service',
      kyRoot: 'manufacturing-services',
      requiresDomainSelection: true,
      content: META_CONTENT['manufacturing-services'],
    },
    {
      key: 'product',
      kyRoot: 'manufacturing-services',
      requiresDomainSelection: true,
      content: META_CONTENT['manufacturing-services'],
    },
    { key: 'ngo', kyRoot: 'non-profit', requiresDomainSelection: false, content: META_CONTENT['non-profit'] },
    { key: 'startup', kyRoot: 'startup', requiresDomainSelection: false, content: META_CONTENT.startup },
  ],
  kyRoots: Object.entries(META_CONTENT).map(([id, content]) => ({ id, content })),
};

const SERVICE = { key: 'service', label: 'Services' };
const PRODUCT = { key: 'product', label: 'Manufacturing' };
const NGO = { key: 'ngo', label: 'Non-Profit' };
const STARTUP = { key: 'startup', label: 'Start-Up' };

// The exact value `applyResume` used to build and persist for a legacy session
// whose `businessType` is null. `saveBusinessType` treats a missing key as an
// explicit clear, so this object used to wipe `byrgop_ky_business_type`.
const LEGACY_RESUME_VALUE = { key: null, label: null };

const APP_JSX = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), '../src/App.jsx'),
  'utf8'
);

/* ── 1. The Business entry handler ────────────────────────────────────── */

/* There is no fresh-user/returning-user concept: login is temporary and every
   user follows the same session flow. The one and only condition is whether a
   Business Type has already been selected in the current session. */

test('no Business Type selected → Business Type Selection', () => {
  for (const none of [null, undefined, {}, { key: null }, { key: '' }, { key: '   ' }, { key: undefined }]) {
    assert.equal(
      screenAfterBusinessEntry(none),
      SCREEN.BUSINESS_TYPE,
      `input=${JSON.stringify(none)}`
    );
  }
});

test('a Business Type already selected → Disclaimer, never Business Type Selection', () => {
  for (const bt of [SERVICE, PRODUCT, NGO, STARTUP]) {
    assert.equal(screenAfterBusinessEntry(bt), SCREEN.DISCLAIMER, `${bt.key} must skip selection`);
    assert.notEqual(screenAfterBusinessEntry(bt), SCREEN.BUSINESS_TYPE, `${bt.key} must skip selection`);
  }
});

test('the entry decision is deterministic — no fresh-user/returning-user branch', () => {
  // The same selection must always give the same screen. If the rule had a
  // user-type branch, the same input could route two different ways.
  for (let i = 0; i < 5; i++) {
    assert.equal(screenAfterBusinessEntry(STARTUP), SCREEN.DISCLAIMER);
    assert.equal(screenAfterBusinessEntry(null), SCREEN.BUSINESS_TYPE);
  }
});

test('the entry decision does not depend on meta or on the business type', () => {
  // Services needs a domain, Start-Up does not — but BOTH skip selection on
  // re-entry and both show selection when nothing is selected. The entry rule
  // is about existence, not about which route follows.
  assert.equal(screenAfterBusinessEntry(SERVICE), screenAfterBusinessEntry(STARTUP));
  assert.notEqual(nextScreenAfterDisclaimer(SERVICE, META), nextScreenAfterDisclaimer(STARTUP, META));
});

test('Change Business still opens Business Type Selection unconditionally', () => {
  // Change Business must NOT be routed through the entry rule. It has to reach
  // the selection screen even though a perfectly valid Business Type exists,
  // which is the opposite of what the entry handler does.
  const body = APP_JSX.slice(
    APP_JSX.indexOf('const handleChangeBusiness'),
    APP_JSX.indexOf('const handleChangeDomain')
  );
  assert.match(body, /setScreen\('kyBusinessType'\)/, 'Change Business no longer opens selection');
  assert.ok(
    !body.includes('screenAfterBusinessEntry'),
    'Change Business must not be routed through the entry rule'
  );
  assert.ok(
    !body.includes('SCREEN.DISCLAIMER'),
    'Change Business must not go to the Disclaimer'
  );
});

test('only the Business entry handler branches on the entry rule', () => {
  // The Disclaimer's own routing has a separate rule, and Change Business
  // navigates explicitly. If the entry rule were reused anywhere else, a
  // second call site would appear here.
  const callSites = [...APP_JSX.matchAll(/screenAfterBusinessEntry\(/g)].length;
  assert.equal(callSites, 1, `expected 1 call site, found ${callSites}`);

  // The screen decision and the stored selection are made from the SAME value,
  // in that order, so they can never disagree about whether a Business Type
  // exists. Routing off the pre-update state was the original bug.
  assert.match(APP_JSX, /const carried = resolveCarriedBusinessType\(\{/);
  assert.match(
    APP_JSX,
    /setKyBusinessType\(carried\);[\s\S]{0,200}?setScreen\(screenAfterBusinessEntry\(carried\)\);/,
    'the entry decision must be made from the same value that was stored'
  );

  // The live selection is read from a ref, not a possibly-stale closure.
  assert.match(APP_JSX, /current: kyBusinessTypeRef\.current/);
});

/* ── 2. The handler must not overwrite an existing Business Type ───────── */

test('REGRESSION: re-entering Business never downgrades a valid selection', () => {
  // The handler hydrates from in-memory state + `byrgop_ky_business_type`.
  // Any input that is not a valid Business Type must leave the existing one
  // exactly as it was.
  for (const incoming of [null, undefined, {}, { key: null }, { key: '' }, { key: '   ' }, LEGACY_RESUME_VALUE]) {
    const carried = resolveCarriedBusinessType({ current: STARTUP, incoming });
    assert.deepEqual(carried, STARTUP, `incoming=${JSON.stringify(incoming)} overwrote the selection`);
    // …and because the handler routes from the SAME value, it skips selection.
    assert.equal(screenAfterBusinessEntry(carried), SCREEN.DISCLAIMER);
  }
});

test('REGRESSION: wiped storage with a live in-memory selection still skips selection', () => {
  // The original intermittent bug: storage returned null, the handler
  // overwrote the good in-memory value with null, and the user was re-asked.
  const carried = resolveCarriedBusinessType({ current: PRODUCT, incoming: null });
  assert.equal(screenAfterBusinessEntry(carried), SCREEN.DISCLAIMER);
  assert.deepEqual(carried, PRODUCT);
});

test('an empty session asks for selection even when storage is empty too', () => {
  const carried = resolveCarriedBusinessType({ current: null, incoming: null });
  assert.equal(carried, null);
  assert.equal(screenAfterBusinessEntry(carried), SCREEN.BUSINESS_TYPE);
});

test('a selection restored from storage alone is enough to skip selection', () => {
  // The value was selected in this session; the app reloaded, so memory is
  // empty but `byrgop_ky_business_type` still has it.
  const carried = resolveCarriedBusinessType({ current: null, incoming: NGO });
  assert.equal(screenAfterBusinessEntry(carried), SCREEN.DISCLAIMER);
});

test('the two branches are exhaustive — the handler always picks one', () => {
  const allowed = new Set([SCREEN.BUSINESS_TYPE, SCREEN.DISCLAIMER]);
  for (const bt of [null, LEGACY_RESUME_VALUE, { key: '' }, SERVICE, PRODUCT, NGO, STARTUP, { key: 'x' }]) {
    assert.ok(allowed.has(screenAfterBusinessEntry(bt)), JSON.stringify(bt));
  }
});

/* ── 4. A business type is asked exactly once ─────────────────────────── */

test('nothing saved routes to the Business Type screen', () => {
  for (const saved of [null, undefined, {}, { key: '' }, { key: '   ' }, { key: null }]) {
    assert.equal(nextScreenAfterDisclaimer(saved, META), SCREEN.BUSINESS_TYPE, `saved=${JSON.stringify(saved)}`);
  }
});

test('a valid saved business type is never re-asked after the disclaimer', () => {
  // Returning user, Business tab → Disclaimer → continue.
  for (const bt of [SERVICE, PRODUCT, NGO, STARTUP]) {
    const route = nextScreenAfterDisclaimer(bt, META);
    assert.notEqual(route, SCREEN.BUSINESS_TYPE, `${bt.key} must not be re-asked`);
  }
});

test('Services and Manufacturing continue to Domain Selection', () => {
  assert.equal(nextScreenAfterDisclaimer(SERVICE, META), SCREEN.DOMAIN_SELECT);
  assert.equal(nextScreenAfterDisclaimer(PRODUCT, META), SCREEN.DOMAIN_SELECT);
});

test('Start-Up and Non-Profit skip Domain Selection and go straight to the questions', () => {
  assert.equal(nextScreenAfterDisclaimer(STARTUP, META), SCREEN.QUESTIONS);
  assert.equal(nextScreenAfterDisclaimer(NGO, META), SCREEN.QUESTIONS);
});

test('a saved type the backend no longer recognises IS re-asked', () => {
  const stale = { key: 'retired_type', label: 'Retired' };
  assert.equal(nextScreenAfterDisclaimer(stale, META), SCREEN.BUSINESS_TYPE);
});

test('meta that has not loaded yet never invalidates a saved type', () => {
  for (const meta of [null, undefined, {}, { businessTypes: [] }]) {
    assert.notEqual(nextScreenAfterDisclaimer(SERVICE, meta), SCREEN.BUSINESS_TYPE);
  }
  // Until meta is known the safe default is to require a domain: a wrong extra
  // step is recoverable, a missing required step is a dead end.
  assert.equal(nextScreenAfterDisclaimer(SERVICE, null), SCREEN.DOMAIN_SELECT);
});

test('a fresh selection routes the same way the disclaimer does', () => {
  assert.equal(screenAfterBusinessTypeSelect(STARTUP, META), SCREEN.QUESTIONS);
  assert.equal(screenAfterBusinessTypeSelect(NGO, META), SCREEN.QUESTIONS);
  assert.equal(screenAfterBusinessTypeSelect(PRODUCT, META), SCREEN.DOMAIN_SELECT);
  // Change Business: only an invalid selection falls back to the screen.
  assert.equal(screenAfterBusinessTypeSelect({ key: '' }, META), SCREEN.BUSINESS_TYPE);
});

/* ── 5. The resume / re-entry regression ─────────────────────────────── */

// The exact value `applyResume` used to build and persist for a legacy session
// whose `businessType` is null. `saveBusinessType` treats a missing key as an
// explicit clear, so this object wiped `byrgop_ky_business_type`.

test('REGRESSION: hydrating the Business tab never downgrades a valid in-memory type', () => {
  // Business tab re-entry with storage wiped by the old resume bug.
  const carried = resolveCarriedBusinessType({ current: SERVICE, incoming: null });
  assert.deepEqual(carried, SERVICE, 'a valid in-memory selection must survive');
});

test('REGRESSION: a session with a null business type cannot erase the saved type', () => {
  const carried = resolveCarriedBusinessType({ current: STARTUP, incoming: LEGACY_RESUME_VALUE });
  assert.deepEqual(carried, STARTUP);
  assert.ok(isValidBusinessType(carried), 'the saved Start-Up type is still valid afterwards');
});

test('REGRESSION: hydrating from storage restores a type that only exists there', () => {
  // Fresh page load: nothing in memory, but `byrgop_ky_business_type` has it.
  const carried = resolveCarriedBusinessType({ current: null, incoming: NGO });
  assert.deepEqual(carried, NGO);
});

test('a newer in-memory selection wins over a stale stored one', () => {
  assert.deepEqual(resolveCarriedBusinessType({ current: STARTUP, incoming: SERVICE }), STARTUP);
});

test('neither value usable returns null, so the Business Type screen is shown', () => {
  assert.equal(resolveCarriedBusinessType({ current: null, incoming: null }), null);
  assert.equal(resolveCarriedBusinessType({ current: LEGACY_RESUME_VALUE, incoming: null }), null);
  assert.equal(resolveCarriedBusinessType({}), null);
});

test('a type the backend no longer knows is dropped, not carried', () => {
  const stale = { key: 'retired_type', label: 'Retired' };
  assert.equal(resolveCarriedBusinessType({ current: stale, incoming: null, meta: META }), null);
  assert.equal(resolveCarriedBusinessType({ current: null, incoming: stale, meta: META }), null);
});

test('a stale stored type is replaced by a valid in-memory one', () => {
  const carried = resolveCarriedBusinessType({
    current: PRODUCT,
    incoming: { key: 'retired_type' },
    meta: META,
  });
  assert.deepEqual(carried, PRODUCT);
});

/* ── 6. The routing flag itself ──────────────────────────────────────── */

test('isValidBusinessType requires a non-empty string key', () => {
  assert.equal(isValidBusinessType(SERVICE), true);
  assert.equal(isValidBusinessType(LEGACY_RESUME_VALUE), false);
  assert.equal(isValidBusinessType({ key: '' }), false);
  assert.equal(isValidBusinessType({ key: '  ' }), false);
  assert.equal(isValidBusinessType({ label: 'no key' }), false);
  assert.equal(isValidBusinessType('service'), false);
  assert.equal(isValidBusinessType(null), false);
});

test('isKnownBusinessType is case-insensitive and null-safe', () => {
  assert.equal(isKnownBusinessType({ key: 'STARTUP' }, META), true);
  // Padded and mixed case, to prove the key comparison normalises rather than
  // doing an exact string match. The wire key itself stays 'startup'.
  assert.equal(isKnownBusinessType({ key: '  STARTUP ' }, META), true);
  assert.equal(isKnownBusinessType({ key: 'nope' }, META), false);
  assert.equal(isKnownBusinessType(SERVICE, null), true, 'unknown meta must not invalidate');
  assert.equal(isKnownBusinessType(LEGACY_RESUME_VALUE, META), false);
});

test('requiresDomainSelection reads the flag from meta, not from the business type', () => {
  assert.equal(requiresDomainSelection(SERVICE, META), true);
  assert.equal(requiresDomainSelection(STARTUP, META), false);
  // A flag injected onto the saved object is ignored — meta is the only source.
  assert.equal(requiresDomainSelection({ key: 'startup', requiresDomainSelection: true }, META), false);
  // Missing flag falls back to the safe default.
  assert.equal(requiresDomainSelection({ key: 'weird' }, { businessTypes: [{ key: 'weird' }] }), true);
  assert.equal(requiresDomainSelection(LEGACY_RESUME_VALUE, META), true);
});

/* ── 7. First-time selection runs the onboarding step ─────────────────── */

/* A first-time Business Type pick must reach the Disclaimer through the three
   onboarding questions. Only an explicit Change Business skips them, because
   Change Business is not the first time. */

test('a first-time pick is anything that is not an explicit change', () => {
  for (const mode of ['select', undefined, null, '', '  ', 'SELECT', 'first-time']) {
    assert.equal(isFirstTimeSelection(mode), true, `mode=${JSON.stringify(mode)}`);
  }
  assert.equal(isFirstTimeSelection('change'), false);
  assert.equal(isFirstTimeSelection('CHANGE'), false);
  assert.equal(isFirstTimeSelection(' change '), false);
});

test('SELECTION_MODE names exactly the two ways the screen opens', () => {
  assert.equal(SELECTION_MODE.SELECT, 'select');
  assert.equal(SELECTION_MODE.CHANGE, 'change');
  assert.equal(isFirstTimeSelection(SELECTION_MODE.SELECT), true);
  assert.equal(isFirstTimeSelection(SELECTION_MODE.CHANGE), false);
});

test('the onboarding step is required for every business type, not just some', () => {
  // The onboarding + Disclaimer waypoints come BEFORE the type-specific route,
  // so they apply to all four types. None of them may be exempted, and none may
  // be routed differently because of which type it is.
  for (const mode of ['select', undefined]) {
    assert.equal(isFirstTimeSelection(mode), true);
  }
  // …and after the Disclaimer the per-type route is unchanged and still
  // backend-driven.
  assert.equal(nextScreenAfterDisclaimer(SERVICE, META), SCREEN.DOMAIN_SELECT);
  assert.equal(nextScreenAfterDisclaimer(PRODUCT, META), SCREEN.DOMAIN_SELECT);
  assert.equal(nextScreenAfterDisclaimer(STARTUP, META), SCREEN.QUESTIONS);
  assert.equal(nextScreenAfterDisclaimer(NGO, META), SCREEN.QUESTIONS);
});

/* ── 8. Source-level guards on the wiring ──────────────────────────────── */

test('handleBusinessTypeSelect branches on first-time vs change', () => {
  const body = APP_JSX.slice(
    APP_JSX.indexOf('const handleBusinessTypeSelect'),
    APP_JSX.indexOf('// Change actions from the questions screen')
  );
  assert.match(body, /isFirstTimeSelection\(kySelectionModeRef\.current\)/, 'no first-time branch');
  // The first-time branch must return before the direct route, so it can never
  // fall through to Domain Selection / the 18 questions.
  assert.match(
    body,
    /if \(isFirstTimeSelection\(kySelectionModeRef\.current\)\) \{[\s\S]*?startOnboardingForBusinessType\(next\);\s*return;\s*\}[\s\S]*?goToRoute\(screenAfterBusinessTypeSelect\(next, kyMeta\), next\);/
  );
  // The Business Type is still saved exactly as before, before any routing.
  assert.match(body, /setKyBusinessType\(next\);\s*saveBusinessType\(next\);/);
});

test('the onboarding step reuses the existing onboarding machinery', () => {
  const body = APP_JSX.slice(
    APP_JSX.indexOf('const startOnboardingForBusinessType'),
    APP_JSX.indexOf('// Business Type chosen.')
  );
  // Same resolver the Intro screen uses — no new question source, no new bank.
  assert.match(body, /api\s*\.\s*onboardingMeta\(obKey\)/);
  assert.match(body, /onboardingQuestionsFromConfig\(meta && meta\.questions\)/);
  // Same entry point, so the questions run through the untouched onboarding flow.
  assert.match(body, /handleBegin\(obKey, bt\.label, questions\)/);
  // The onboarding key is translated, never the raw Know Yourself key.
  assert.match(body, /onboardingKeyFor\(bt\.key\)/);
  // Every "nothing configured" branch still lands on the Disclaimer.
  const disclaimerHops = body.match(/setScreen\(SCREEN\.DISCLAIMER\)/g) || [];
  assert.ok(disclaimerHops.length >= 3, `expected every fallback to reach the Disclaimer, found ${disclaimerHops.length}`);
  // The flag is armed only when questions actually start.
  assert.match(body, /kyAfterOnboardingRef\.current = true;/);
  assert.match(body, /kyAfterOnboardingRef\.current = false;/);
});

test('completing that onboarding routes by root, never straight to the questions', () => {
  const body = APP_JSX.slice(
    APP_JSX.indexOf('const handleAnswer'),
    APP_JSX.indexOf('// Reset onboarding state and return to landing')
  );
  // The intent is consumed exactly where the last answer lands, and the
  // destination is DECIDED BY THE ROOT rather than hard-coded.
  assert.match(
    body,
    /if \(kyAfterOnboardingRef\.current\) \{[\s\S]*?kyAfterOnboardingRef\.current = false;[\s\S]*?screenAfterFirstTimeOnboarding\([\s\S]*?setScreen\(nextStop\);[\s\S]*?\} else \{[\s\S]*?setScreen\('result'\);/
  );
  // It must not jump to the questions or to domain selection from here: the
  // Disclaimer is the consent gate for both.
  assert.doesNotMatch(body, /setScreen\(SCREEN\.QUESTIONS\)/);
  assert.doesNotMatch(body, /setScreen\(SCREEN\.DOMAIN_SELECT\)/);
  // The snapshot is still built, so declining the Disclaimer — and the
  // Non-Profit pie — land on a real Result screen.
  assert.match(body, /makeSnapshotResult\(next\)/);
  assert.match(body, /finishBackground\(\)/);
});

test('the onboarding destination comes from the root, not the business-type key', () => {
  // Non-Profit sees the onboarding pie, which is the Result screen, and reaches
  // the Disclaimer from there via the Business button.
  assert.equal(SCREEN.ONBOARDING_RESULT, 'result');
  assert.equal(screenAfterFirstTimeOnboarding(NGO, META), SCREEN.ONBOARDING_RESULT);
  // Every other root keeps the chain it already had, untouched.
  for (const bt of [SERVICE, PRODUCT, STARTUP]) {
    assert.equal(
      screenAfterFirstTimeOnboarding(bt, META),
      SCREEN.DISCLAIMER,
      `${bt.key} should go straight to the Disclaimer`
    );
  }
});

test('an unknown root falls to the Disclaimer, never past the consent gate', () => {
  // Skipping the consent screen is the worse failure, so the fallback is the
  // Disclaimer — both when meta has not loaded and when the root is unknown.
  assert.equal(screenAfterFirstTimeOnboarding(NGO, null), SCREEN.DISCLAIMER);
  assert.equal(screenAfterFirstTimeOnboarding(NGO, undefined), SCREEN.DISCLAIMER);
  assert.equal(screenAfterFirstTimeOnboarding(NGO, { businessTypes: [] }), SCREEN.DISCLAIMER);
  assert.equal(screenAfterFirstTimeOnboarding(null, META), SCREEN.DISCLAIMER);
  assert.equal(screenAfterFirstTimeOnboarding({ key: 'mystery' }, META), SCREEN.DISCLAIMER);
  const MUTATED = { businessTypes: [{ key: 'ngo', kyRoot: 'sasquatch' }] };
  assert.equal(screenAfterFirstTimeOnboarding(NGO, MUTATED), SCREEN.DISCLAIMER);
  // The same for the root query itself.
  assert.equal(rootShowsOnboardingResult(NGO, MUTATED), false);
  assert.equal(rootShowsOnboardingResult(NGO, META), true);
});

test('kyRootFor reads the root the backend reports, or null', () => {
  assert.equal(kyRootFor(NGO, META), 'non-profit');
  assert.equal(kyRootFor(SERVICE, META), 'manufacturing-services');
  assert.equal(kyRootFor(STARTUP, META), 'startup');
  // Trims, and treats a blank/typo root as "no root" rather than passing it on.
  const PADDED = { businessTypes: [{ key: 'ngo', kyRoot: '  non-profit  ' }] };
  assert.equal(kyRootFor(NGO, PADDED), 'non-profit');
  assert.equal(kyRootFor(NGO, { businessTypes: [{ key: 'ngo', kyRoot: '   ' }] }), null);
  assert.equal(kyRootFor(NGO, { businessTypes: [{ key: 'ngo', kyRoot: 42 }] }), null);
  // No business type, or no meta at all.
  assert.equal(kyRootFor(null, META), null);
  assert.equal(kyRootFor(LEGACY_RESUME_VALUE, META), null);
  assert.equal(kyRootFor(NGO, null), null);
});

test('the pie is a root property, so a future root opts in by name', () => {
  // Guards the mechanism rather than one hard-coded type: whatever root is
  // listed as showing the onboarding result must be the one that does.
  const withPie = {
    businessTypes: [
      { key: 'x', kyRoot: 'non-profit' },
      { key: 'y', kyRoot: 'startup' },
    ],
  };
  assert.equal(rootShowsOnboardingResult({ key: 'x' }, withPie), true);
  assert.equal(screenAfterFirstTimeOnboarding({ key: 'x' }, withPie), SCREEN.ONBOARDING_RESULT);
  assert.equal(rootShowsOnboardingResult({ key: 'y' }, withPie), false);
  assert.equal(screenAfterFirstTimeOnboarding({ key: 'y' }, withPie), SCREEN.DISCLAIMER);
});

test('the flag cannot leak into an unrelated onboarding run', () => {
  const restart = APP_JSX.slice(
    APP_JSX.indexOf('const handleRestartOnboarding'),
    APP_JSX.indexOf('// ─── Know Yourself')
  );
  assert.match(
    restart,
    /kyAfterOnboardingRef\.current = false;/,
    'abandoning an onboarding run must drop the intent'
  );
});

test('the fixed Business entry handler is untouched by this change', () => {
  const body = APP_JSX.slice(
    APP_JSX.indexOf('const handleKYExplore'),
    APP_JSX.indexOf('// Offer to resume an in-progress assessment')
  );
  // Same one-condition rule, same single call site, same carried value.
  assert.equal([...APP_JSX.matchAll(/screenAfterBusinessEntry\(/g)].length, 1);
  assert.match(body, /const carried = resolveCarriedBusinessType\(\{/);
  assert.match(body, /setKyBusinessType\(carried\);/);
  assert.match(body, /setScreen\(screenAfterBusinessEntry\(carried\)\);/);
  // It must not have grown an onboarding branch.
  assert.ok(!body.includes('startOnboardingForBusinessType'), 'the Business entry handler must not start onboarding');
  assert.ok(!body.includes('isFirstTimeSelection'), 'the Business entry handler must not branch on selection mode');
});

test('Change Business still routes straight to the existing rule', () => {
  const body = APP_JSX.slice(
    APP_JSX.indexOf('const handleChangeBusiness'),
    APP_JSX.indexOf('const handleChangeDomain')
  );
  assert.match(body, /setScreen\('kyBusinessType'\)/);
  assert.ok(!body.includes('screenAfterBusinessEntry'), 'Change Business must not use the entry rule');
  assert.ok(!body.includes('SCREEN.DISCLAIMER'), 'Change Business must not go to the Disclaimer');
  assert.ok(!body.includes('startOnboardingForBusinessType'), 'Change Business must not start onboarding');
});

/* ── 9. Every routing decision is one of exactly the known screens ────── */

test('routing only ever returns one of the known screens', () => {
  const allowed = new Set(Object.values(SCREEN));
  for (const bt of [null, LEGACY_RESUME_VALUE, SERVICE, PRODUCT, NGO, STARTUP, { key: 'x' }]) {
    for (const meta of [null, META]) {
      assert.ok(allowed.has(nextScreenAfterDisclaimer(bt, meta)));
      assert.ok(allowed.has(screenAfterBusinessTypeSelect(bt, meta)));
      assert.ok(allowed.has(screenAfterBusinessEntry(bt)));
    }
  }
});

/* ── 10. The Non-Profit chain: pie → Business button → Disclaimer ─────────
   Non-Profit is the one root that shows the onboarding snapshot before the
   Disclaimer. The pie IS the Result screen, so the step from it to the
   Disclaimer is the existing "Your Business" button — which, because the
   Business Type is already saved, routes straight to the Disclaimer. These
   tests pin that the two halves meet correctly and that the button passes no
   bogus `origin` that could re-route it. */

const RESULT_SCREEN = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), '../src/screens/ResultScreen.jsx'),
  'utf8'
);

test('the pie is the Result screen, whose root-labelled button carries it to the Disclaimer', () => {
  assert.equal(SCREEN.ONBOARDING_RESULT, 'result');
  // The button the user clicks on the pie is the one wired to the Business entry
  // handler — the same handler that routes to the Disclaimer when a type is set.
  assert.match(RESULT_SCREEN, /onClick=\{onKY\}/);
  // The label is a prop, not a literal: "Your Business" is what Mfg & Services
  // shows, and a Non-Profit user must be offered "Your Foundation" instead.
  assert.match(RESULT_SCREEN, /\{actionLabel\}/);
  assert.doesNotMatch(RESULT_SCREEN, />\s*Your Business\s*</,
    'ResultScreen must not hard-code the button label');
  // Wired as a zero-arg callback, so the button can never hand a click event
  // to `origin` (see the next test).
  assert.match(APP_JSX, /onKY=\{\(\) => handleKYExplore\('result'\)\}/);
  // With a Business Type already saved, that handler lands on the Disclaimer.
  assert.equal(screenAfterBusinessEntry(NGO), SCREEN.DISCLAIMER);
  assert.equal(screenAfterBusinessEntry(SERVICE), SCREEN.DISCLAIMER);
});

test('the Business button passes no origin, so it cannot be mis-routed', () => {
  // `handleKYExplore(origin = 'result')` takes a STRING. Wired straight to
  // onClick it received a SyntheticEvent instead, which only worked because
  // every branch defaulted to 'result'. Wiring it as a zero-arg handler keeps
  // the default explicit, so the pie → Disclaimer hop is well-defined.
  const explore = APP_JSX.slice(
    APP_JSX.indexOf('const handleKYExplore'),
    APP_JSX.indexOf('// Offer to resume an in-progress assessment')
  );
  assert.match(explore, /\(origin = 'result'\)/);
  // …and the ResultScreen call site states 'result' rather than relying on the
  // default, so a SyntheticEvent can never become the Disclaimer's origin.
  assert.doesNotMatch(APP_JSX, /onKY=\{handleKYExplore\}/);
  // The pie leg must not set an origin of its own, because the pie is entered
  // as the onboarding result and the Disclaimer is then reached from the button.
  const answer = APP_JSX.slice(
    APP_JSX.indexOf('const handleAnswer'),
    APP_JSX.indexOf('// Reset onboarding state and return to landing')
  );
  assert.match(answer, /if \(nextStop !== SCREEN\.ONBOARDING_RESULT\) setKyDisclaimerOrigin\('result'\);/);
});

test('Start-Up keeps its own chain: onboarding → Disclaimer → its 18 questions', () => {
  assert.equal(screenAfterFirstTimeOnboarding(STARTUP, META), SCREEN.DISCLAIMER);
  assert.equal(nextScreenAfterDisclaimer(STARTUP, META), SCREEN.QUESTIONS);
  // No pie, and no domain selection, for Start-Up.
  assert.equal(rootShowsOnboardingResult(STARTUP, META), false);
  assert.equal(requiresDomainSelection(STARTUP, META), false);
});

test('Services and Manufacturing are unchanged: onboarding → Disclaimer → domain selection', () => {
  for (const bt of [SERVICE, PRODUCT]) {
    assert.equal(screenAfterFirstTimeOnboarding(bt, META), SCREEN.DISCLAIMER, `${bt.key} pre-Disclaimer`);
    assert.equal(nextScreenAfterDisclaimer(bt, META), SCREEN.DOMAIN_SELECT, `${bt.key} post-Disclaimer`);
    assert.equal(requiresDomainSelection(bt, META), true, `${bt.key} still needs a domain`);
  }
});

test('the assignment request names the root it expects, for cross-checking', () => {
  // After Accept, the request states which bank it is asking for. The backend
  // derives the root from the business type and refuses a disagreement, so this
  // makes the two ends checkable rather than merely self-consistent.
  const restart = APP_JSX.slice(
    APP_JSX.indexOf('const restartKYAssignment'),
    APP_JSX.indexOf('// ───', APP_JSX.indexOf('const restartKYAssignment') + 10)
  );
  assert.match(restart, /api\.startKYAssignment\(\{/);
  assert.match(restart, /businessType: bt\?\.key,/);
  assert.match(restart, /kyRoot: kyRootFor\(bt, kyMeta\) \?\? undefined,/);
});

/* ── 12. The result button and the Disclaimer are per-root ────────────────
   The result screen used to hard-code "Your Business" and the Disclaimer used
   to hard-code one block of Manufacturing & Services copy, for every root. So a
   Non-Profit user was told to press "Your Business" and then read terms about
   "hidden profit leaks" in "your business" before being asked to accept them.

   Both now come from the root that `/know-yourself/meta` already resolved for
   the question bank, so the words a user reads cannot describe a different kind
   of business than the one being assessed. */

const DISCLAIMER_SCREEN = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), '../src/screens/DisclaimerScreen.jsx'),
  'utf8'
);

test('each root shows its own result button label', () => {
  assert.equal(resultActionLabelFor(SERVICE, META), 'Your Business');
  assert.equal(resultActionLabelFor(PRODUCT, META), 'Your Business');
  assert.equal(resultActionLabelFor(STARTUP, META), 'Your Enterprise');
  assert.equal(resultActionLabelFor(NGO, META), 'Your Foundation');
  // The heading reads the same label, so the two can never disagree.
  assert.equal(resultHeadingLabelFor(NGO, META), 'Your Foundation');
  assert.equal(resultHeadingLabelFor(STARTUP, META), 'Your Enterprise');
  // Every root has a distinct label — no two roots share one button.
  const labels = [SERVICE, PRODUCT, STARTUP, NGO].map((bt) => resultActionLabelFor(bt, META));
  assert.equal(new Set(labels).size, 3);
});

test('each root is served its own Disclaimer copy', () => {
  assert.equal(rootContentFor(SERVICE, META).resultActionLabel, 'Your Business');
  assert.equal(rootContentFor(STARTUP, META).resultActionLabel, 'Your Enterprise');
  assert.equal(rootContentFor(NGO, META).resultActionLabel, 'Your Foundation');
  // Three distinct copies: no root can be shown another root's words.
  const bodies = [SERVICE, STARTUP, NGO].map((bt) => rootContentFor(bt, META).about.body);
  assert.equal(new Set(bodies).size, 3);
  // The noun the copy speaks of follows the root too.
  assert.equal(rootContentFor(NGO, META).entity, 'your organization');
  assert.equal(rootContentFor(STARTUP, META).entity, 'your venture');
  assert.equal(rootContentFor(SERVICE, META).entity, 'your business');
});

test('the Non-Profit pie and Disclaimer both speak about the Foundation', () => {
  // The pie button, the pie heading and the Disclaimer are the three places
  // the user reads which kind of business this is.
  assert.equal(screenAfterFirstTimeOnboarding(NGO, META), SCREEN.ONBOARDING_RESULT);
  assert.equal(resultActionLabelFor(NGO, META), 'Your Foundation');
  assert.equal(rootContentFor(NGO, META).resultActionLabel, 'Your Foundation');
});

test('unloaded meta falls back to the Mfg & Services copy, never to a guess', () => {
  // `meta === null` is "not loaded", and the fallback is deliberately only the
  // root whose copy used to be hard-coded. Guessing "Start-Up for an unknown
  // root" would be the same class of bug as defaulting a root to Mfg & Services.
  for (const bt of [null, undefined, { key: 'nope' }, { key: null }, LEGACY_RESUME_VALUE]) {
    assert.equal(resultActionLabelFor(bt, null), 'Your Business', `${JSON.stringify(bt)}`);
    assert.equal(rootContentFor(bt, null).entity, 'your business', `${JSON.stringify(bt)}`);
  }
  // A business type the backend does know still resolves from its own entry,
  // even if `kyRoots` is absent from the payload.
  const noRootList = { businessTypes: META.businessTypes };
  assert.equal(resultActionLabelFor(NGO, noRootList), 'Your Foundation');
  // A root list alone is NOT enough, and must not be made to be. Resolving a
  // business type to a root needs the API's `businessTypes` entry — a key→root
  // table hard-coded here would be exactly the "default to Mfg & Services"
  // bug this whole module exists to remove.
  assert.equal(rootContentFor(STARTUP, { kyRoots: META.kyRoots }).resultActionLabel, 'Your Business');
});

test('a malformed or empty content block falls back instead of rendering blanks', () => {
  // Meta is a network response. A root that arrives with no usable `content`
  // must not produce an empty heading, an empty disclaimer body, or a button
  // with no label.
  const broken = {
    businessTypes: [
      { key: 'ngo', kyRoot: 'non-profit', requiresDomainSelection: false, content: null },
    ],
    kyRoots: [{ id: 'non-profit', content: 'not an object' }],
  };
  assert.equal(resultActionLabelFor(NGO, broken), 'Your Business');
  assert.ok(rootContentFor(NGO, broken).terms.body.length > 60);
  assert.ok(rootContentFor(NGO, broken).about.body.length > 60);
  assert.ok(rootContentFor(NGO, broken).screenTitle.trim());
});

test('root content is keyed off the business type, so it cannot go stale', () => {
  // A business type whose `kyRoot` was re-pointed in the database is served
  // the copy of the root it now points at — the content follows the same value
  // the question bank is built from, with no second notion of "which root".
  const rePointed = {
    businessTypes: [{ key: 'ngo', kyRoot: 'startup', requiresDomainSelection: false, content: META_CONTENT.startup }],
    kyRoots: META.kyRoots,
  };
  assert.equal(resultActionLabelFor(NGO, rePointed), 'Your Enterprise');
  assert.equal(rootContentFor(NGO, rePointed).entity, 'your venture');
  // …while the routing decision moves with it, in lockstep.
  assert.equal(requiresDomainSelection(NGO, rePointed), false);
  assert.equal(screenAfterFirstTimeOnboarding(NGO, rePointed), SCREEN.DISCLAIMER);
});

test('the screens read the copy as props rather than hard-coding it', () => {
  // ResultScreen: the label is a prop, in both the heading and the button.
  assert.match(RESULT_SCREEN, /actionLabel = 'Your Business'/);
  assert.match(RESULT_SCREEN, /\{actionLabel\}\{' '\}/);
  assert.match(RESULT_SCREEN, /^\s*\{actionLabel\}$/m);
  // Comments may name the three labels to explain them; the RENDERED component
  // must not. This is the region after the props destructuring, so the only
  // allowed literal left is the no-prop default.
  const resultBody = RESULT_SCREEN.slice(RESULT_SCREEN.indexOf('const canonicalData'));
  assert.doesNotMatch(resultBody, /Your Enterprise|Your Foundation/,
    'ResultScreen must not know any root label');
  assert.doesNotMatch(resultBody, /Your Business/,
    'ResultScreen must not render a hard-coded button label');

  // DisclaimerScreen: title, terms and about are all read off `content`.
  assert.match(DISCLAIMER_SCREEN, /\{content\.screenTitle\}/);
  assert.match(DISCLAIMER_SCREEN, /\{content\.terms\.title\}/);
  assert.match(DISCLAIMER_SCREEN, /<RichText text=\{content\.terms\.body\}/);
  assert.match(DISCLAIMER_SCREEN, /<RichText text=\{content\.about\.body\}/);
  // The old Mfg text survives only as the no-content default, never as the
  // rendered body of a specific root.
  // The component's own render, i.e. after RichText's. The Mfg copy may exist
  // only as the no-`content` default in the props, never in what is rendered.
  const componentStart = DISCLAIMER_SCREEN.indexOf('export default function DisclaimerScreen');
  const rendered = DISCLAIMER_SCREEN.slice(
    DISCLAIMER_SCREEN.indexOf('return (', componentStart)
  );
  assert.doesNotMatch(rendered, /profit leak/,
    'the rendered disclaimer must not hard-code Mfg & Services copy');
  assert.doesNotMatch(rendered, /Welcome to the Profit Architecture Diagnostic/,
    'the rendered disclaimer must not hard-code a screen title');
  // `**bold**` is turned back into a real <strong>, so the emphasised figures
  // survive the move out of JSX rather than being printed as asterisks.
  assert.match(DISCLAIMER_SCREEN, /part\.slice\(2, -2\)/);
  assert.match(DISCLAIMER_SCREEN, /<strong key=\{i\}/);
});

test('App.jsx feeds both screens from the current business type, not storage', () => {
  // The Disclaimer copy is resolved from `kyBusinessType` — the same in-session
  // value the accept handler routes on — and `kyMeta`. Reading the persisted
  // type here is what let a stale user be shown the wrong disclaimer.
  assert.match(APP_JSX, /content=\{rootContentFor\(kyBusinessType, kyMeta\)\}/);
  assert.match(APP_JSX, /actionLabel=\{resultActionLabelFor\(kyBusinessType, kyMeta\)\}/);
  const disclaimer = APP_JSX.slice(
    APP_JSX.indexOf('<DisclaimerScreen'),
    APP_JSX.indexOf('onAccept={({ email })')
  );
  assert.doesNotMatch(disclaimer, /getSavedBusinessType|localStorage/,
    'the Disclaimer must not choose its copy from persisted state');
});

/* ── 13. A null business type must never throw ───────────────────────────
   Regression: `findMetaType` read `bt.key` before checking that a business
   type exists, so the result screen — which renders with `kyBusinessType`
   still `null` — crashed the whole app the moment meta had loaded. Only the
   loaded-meta + null-type combination throws, which is why testing `null`
   against `meta = null` did not catch it: that path returns before the
   dereference. */

const NULL_TYPES = [
  null,
  undefined,
  {},
  { key: null },
  { key: '' },
  { key: '   ' },
  { key: 42 },
  LEGACY_RESUME_VALUE,
];

test('no exported function throws on a null or malformed business type', () => {
  // Both states the app is actually in: meta not yet loaded, and meta loaded.
  for (const meta of [null, META, { businessTypes: [], kyRoots: [] }, undefined]) {
    for (const bt of NULL_TYPES) {
      const label = `${JSON.stringify(bt)} against ${meta === null ? 'null' : 'loaded'} meta`;
      assert.doesNotThrow(() => rootContentFor(bt, meta), `rootContentFor ${label}`);
      assert.doesNotThrow(() => resultActionLabelFor(bt, meta), `resultActionLabelFor ${label}`);
      assert.doesNotThrow(() => resultHeadingLabelFor(bt, meta), `resultHeadingLabelFor ${label}`);
      // The pre-existing routing helpers, re-checked for the same reason.
      assert.doesNotThrow(() => kyRootFor(bt, meta), `kyRootFor ${label}`);
      assert.doesNotThrow(() => requiresDomainSelection(bt, meta), `requiresDomainSelection ${label}`);
      assert.doesNotThrow(() => isKnownBusinessType(bt, meta), `isKnownBusinessType ${label}`);
      assert.doesNotThrow(() => rootShowsOnboardingResult(bt, meta), `rootShowsOnboardingResult ${label}`);
      assert.doesNotThrow(() => screenAfterFirstTimeOnboarding(bt, meta), `screenAfterFirstTimeOnboarding ${label}`);
      assert.doesNotThrow(() => nextScreenAfterDisclaimer(bt, meta), `nextScreenAfterDisclaimer ${label}`);
      assert.doesNotThrow(() => screenAfterBusinessEntry(bt), `screenAfterBusinessEntry ${label}`);
    }
  }
});

test('a null business type falls back to the Mfg & Services copy even with meta loaded', () => {
  // Meta being loaded must not be mistaken for a reason to guess a root: with
  // no business type there is nothing to look up, so the shared copy is used.
  for (const bt of NULL_TYPES) {
    assert.equal(resultActionLabelFor(bt, META), 'Your Business', `${JSON.stringify(bt)}`);
    assert.equal(rootContentFor(bt, META).entity, 'your business', `${JSON.stringify(bt)}`);
    assert.equal(kyRootFor(bt, META), null, `${JSON.stringify(bt)}`);
  }
});

test('a valid business type still resolves when meta is loaded', () => {
  // The guard must not be over-broad: a real type with loaded meta still gets
  // its own root, its own label and its own copy.
  assert.equal(kyRootFor(NGO, META), 'non-profit');
  assert.equal(resultActionLabelFor(NGO, META), 'Your Foundation');
  assert.equal(resultActionLabelFor(STARTUP, META), 'Your Enterprise');
  assert.equal(resultActionLabelFor(SERVICE, META), 'Your Business');
  assert.equal(rootContentFor(NGO, META).entity, 'your organization');
  // …including a type that is only a string-ish shape the validator accepts.
  assert.equal(resultActionLabelFor({ key: 'ngo' }, META), 'Your Foundation');
  // Case and whitespace are normalised on the way through.
  assert.equal(resultActionLabelFor({ key: ' NGO ' }, META), 'Your Foundation');
});

/* ── 12. The question screen offers no way back into the selectors ────────
   The Business Type is chosen once, on the landing page. For a root with no
   domain step — Start-Up and Non-Profit — the question screen must not offer a
   second Business Type selection or a Domain selection, because both of those
   controls lead back into the screens the participant has already passed.
   Services and Manufacturing keep both controls, unchanged. */

const QUESTION_SCREEN = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), '../src/screens/KnowYourselfScreen.jsx'),
  'utf8'
);

// Comments are stripped before the "no hardcoded root" assertion: prose is
// allowed to explain WHICH roots are affected, but only executable code counts
// against the rule. Otherwise a helpful comment would fail the test and the
// incentive would be to delete the explanation instead of the hardcoding.
const QUESTION_SCREEN_CODE = QUESTION_SCREEN.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');

test('a root with no domain step hides the Business Type "Change" button', () => {
  // The Business Type Change button is what opened the second Business Type
  // Selection screen. Gated on the one flag, not on a root name.
  assert.match(QUESTION_SCREEN, /onChangeBusiness && canChangeSelection && \(/);
  // The Business Type itself is still shown as a label — only the re-selection
  // affordance is removed.
  assert.match(QUESTION_SCREEN, /\{businessTypeLabel \|\| '—'\}/);
});

test('a root with no domain step hides the Domain row entirely', () => {
  // Not merely disabled and not rendered as an empty "—": the whole row goes,
  // so there is no Domain label and no Domain "Change" button at all.
  assert.match(QUESTION_SCREEN, /\{canChangeSelection && \(\s*\n\s*<div[^>]*>\s*\n\s*<span[^>]*>\s*\n\s*Domain:/);
  assert.match(QUESTION_SCREEN, /\{onChangeDomain && \(/);
  // `canChangeSelection` defaults to true, so a caller that does not pass it
  // keeps the previous behaviour rather than silently losing both controls.
  assert.match(QUESTION_SCREEN, /canChangeSelection = true,/);
});

test('the screen never hardcodes which roots have no domain', () => {
  // No root id may appear in executable code, or the next root added to the
  // backend would silently keep showing selectors it has no step for.
  assert.doesNotMatch(QUESTION_SCREEN_CODE, /startup|non-profit|ngo|manufacturing-services/i);
  // And the gating is genuinely the backend flag, read at the call site.
  assert.match(QUESTION_SCREEN_CODE, /canChangeSelection/);
});

test('App derives the question screen flag from the same backend flag the routing uses', () => {
  // One flag, one source: the screen and the routing cannot disagree about
  // whether this root has a domain step.
  assert.match(APP_JSX, /canChangeSelection=\{requiresDomainSelection\(kyBusinessType, kyMeta\)\}/);
  assert.match(APP_JSX, /^\s*requiresDomainSelection,$/m);
  // Both handlers stay wired, so Services and Manufacturing are untouched.
  assert.match(APP_JSX, /onChangeBusiness=\{handleChangeBusiness\}/);
  assert.match(APP_JSX, /onChangeDomain=\{handleChangeDomain\}/);
});

test('the flag resolves per root from meta, so Mfg & Services keep both controls', () => {
  // Start-Up and Non-Profit: no domain step, so both controls are hidden.
  for (const bt of [STARTUP, NGO]) {
    assert.equal(requiresDomainSelection(bt, META), false, `${bt.key} has no domain step`);
  }
  // Services and Manufacturing: unchanged, both controls still offered.
  for (const bt of [SERVICE, PRODUCT]) {
    assert.equal(requiresDomainSelection(bt, META), true, `${bt.key} still has a domain step`);
  }
});
