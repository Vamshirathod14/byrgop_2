import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import {
  ONBOARDING_BUSINESS_TYPES,
  kyKeyForOnboardingKey,
  onboardingKeyFor,
  onboardingQuestionsFromConfig,
} from '../src/onboarding.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/* The four Know Yourself business types, exactly as `/know-yourself/meta`
   reports them. Two of the four are named differently in the onboarding
   question bank, which is why the translation exists at all. */
const KY_TYPES = ['service', 'product', 'ngo', 'startup'];

/* ── 1. Every Know Yourself type resolves to a real onboarding type ────── */

test('every Know Yourself business type resolves to a configured onboarding type', () => {
  const valid = new Set(ONBOARDING_BUSINESS_TYPES.map((t) => t.key));
  for (const key of KY_TYPES) {
    const resolved = onboardingKeyFor(key);
    assert.ok(resolved, `business type '${key}' resolves to no onboarding type`);
    assert.ok(valid.has(resolved), `'${key}' -> '${resolved}' is not a configured onboarding type`);
  }
});

test('the translation covers all four products, including the two renames', () => {
  // The two that differ between the two vocabularies.
  assert.equal(onboardingKeyFor('product'), 'manufacturing');
  assert.equal(onboardingKeyFor('ngo'), 'nonprofit');
  // The two that happen to share a name.
  assert.equal(onboardingKeyFor('service'), 'service');
  assert.equal(onboardingKeyFor('startup'), 'startup');
});

test('the translation resolves to a distinct onboarding type per KY type', () => {
  // A mapping that collapsed two products onto one type would silently give a
  // user another product's onboarding questions.
  const resolved = KY_TYPES.map(onboardingKeyFor);
  assert.equal(new Set(resolved).size, KY_TYPES.length, `collapsed: ${resolved.join(', ')}`);
});

/* ── 2. It is case- and whitespace-tolerant, and safe on junk ──────────── */

test('the translation normalises case and surrounding whitespace', () => {
  for (const variant of ['Product', 'PRODUCT', ' product ', '\tNGO\n', 'Service']) {
    assert.ok(onboardingKeyFor(variant), `variant ${JSON.stringify(variant)} did not resolve`);
  }
  assert.equal(onboardingKeyFor(' PRODUCT '), 'manufacturing');
  assert.equal(onboardingKeyFor(' NGO '), 'nonprofit');
});

test('an unknown or empty key resolves to null, never to a guess', () => {
  // The onboarding endpoint rejects an unrecognised business type with a 400,
  // so an unknown key must be null — the caller then skips the questions and
  // still routes to the Disclaimer, rather than asking for the wrong ones.
  for (const junk of [null, undefined, '', '   ', 'unknown', 'ngo-nonprofit', 0, false, {}, []]) {
    assert.equal(onboardingKeyFor(junk), null, `input=${JSON.stringify(junk)}`);
  }
});

test('a key already in onboarding vocabulary resolves to itself', () => {
  // So the two vocabularies can converge without this needing to change.
  for (const t of ONBOARDING_BUSINESS_TYPES) {
    assert.equal(onboardingKeyFor(t.key), t.key);
  }
});

/* ── 3. The onboarding questions themselves are untouched ──────────────── */

test('the onboarding config still resolves to at most three questions', () => {
  const mk = (i) => ({
    categoryKey: `c${i}`,
    pillar: `Pillar ${i}`,
    questionText: `Question ${i}?`,
    options: [{ text: 'Yes', score: 4, color: '#4CAF50' }, { text: 'No', score: 1, color: '#E53935' }],
  });
  assert.equal(onboardingQuestionsFromConfig([]).length, 0);
  assert.equal(onboardingQuestionsFromConfig([mk(1), mk(2)]).length, 2);
  assert.equal(onboardingQuestionsFromConfig([mk(1), mk(2), mk(3), mk(4), mk(5)]).length, 3);
  // An absent/garbage config stays empty — the "unavailable" signal is intact.
  assert.equal(onboardingQuestionsFromConfig(null).length, 0);
  assert.equal(onboardingQuestionsFromConfig(undefined).length, 0);
  assert.equal(onboardingQuestionsFromConfig({}).length, 0);
});

test('the per-question Yes/No colours still travel through untouched', () => {
  const [q] = onboardingQuestionsFromConfig([
    {
      categoryKey: 'c1',
      questionText: 'Q?',
      options: [{ text: 'Yes', score: 4, color: '#ABCDEF' }, { text: 'No', score: 1, color: '#123456' }],
    },
  ]);
  assert.deepEqual(q.options, [
    { optionId: 'yes', text: 'Yes', color: '#ABCDEF' },
    { optionId: 'no', text: 'No', color: '#123456' },
  ]);
});

/* ── 4. The reverse translation: carrying the pick into Stage 2 ─────────── */

/* Stage 1 (landing page) and Stage 2 (the Know Yourself assessment) are one
   journey and the business type is asked once, on the landing page. The pick
   has to survive the seam, or the CTA on the Stage 1 result drops the user
   back on Business Type selection. */

test('every onboarding type resolves back to a real Know Yourself type', () => {
  const valid = new Set(KY_TYPES);
  for (const t of ONBOARDING_BUSINESS_TYPES) {
    const resolved = kyKeyForOnboardingKey(t.key);
    assert.ok(resolved, `onboarding type '${t.key}' resolves to no KY type`);
    assert.ok(valid.has(resolved), `'${t.key}' -> '${resolved}' is not a Know Yourself type`);
  }
});

test('the reverse translation inverts the forward one for all four products', () => {
  for (const kyKey of KY_TYPES) {
    assert.equal(kyKeyForOnboardingKey(onboardingKeyFor(kyKey)), kyKey, `round-trip failed for '${kyKey}'`);
  }
  // The two that actually differ between the vocabularies.
  assert.equal(kyKeyForOnboardingKey('nonprofit'), 'ngo');
  assert.equal(kyKeyForOnboardingKey('manufacturing'), 'product');
  // The two that share a name.
  assert.equal(kyKeyForOnboardingKey('service'), 'service');
  assert.equal(kyKeyForOnboardingKey('startup'), 'startup');
});

test('"manufacturing" is translated, not passed through', () => {
  // The one that is NOT the same string in both vocabularies. An identity
  // mapping here would hand the Manufacturing user a "manufacturing" business
  // type the backend does not know, which routes them as unconfigured.
  assert.notEqual(kyKeyForOnboardingKey('manufacturing'), 'manufacturing');
  assert.equal(kyKeyForOnboardingKey('manufacturing'), 'product');
});

test('the reverse translation normalises case and rejects junk', () => {
  assert.equal(kyKeyForOnboardingKey(' NONPROFIT '), 'ngo');
  assert.equal(kyKeyForOnboardingKey('Manufacturing'), 'product');
  for (const junk of [null, undefined, '', '   ', 'unknown', 'humanitarian_aid', 0, false, {}, []]) {
    assert.equal(kyKeyForOnboardingKey(junk), null, `input=${JSON.stringify(junk)}`);
  }
});

test('the reverse translation is idempotent on a key that is already a KY type', () => {
  // Mirrors `onboardingKeyFor`, so a caller holding either vocabulary's key can
  // pass it in without first having to know which one it has. Without this a
  // second call would return null and the selection would be dropped.
  for (const kyKey of KY_TYPES) {
    assert.equal(kyKeyForOnboardingKey(kyKey), kyKey, `not idempotent for '${kyKey}'`);
  }
});

test('the reverse translation is injective: two products never collapse', () => {
  const resolved = ONBOARDING_BUSINESS_TYPES.map((t) => kyKeyForOnboardingKey(t.key));
  assert.equal(new Set(resolved).size, resolved.length, `collapsed: ${resolved.join(', ')}`);
});

test('App.jsx carries the landing-page pick into the Know Yourself flow', () => {
  // The bug this guards: the Stage 1 CTA used to resolve no carried business
  // type and sent the user back to Business Type selection, asking twice.
  const appJsx = readFileSync(resolve(ROOT, 'src/App.jsx'), 'utf8');
  assert.match(appJsx, /kyKeyForOnboardingKey\(key\)/, 'the landing-page pick is not translated');
  // Both the in-memory state and the persisted copy, because the CTA reads the
  // persisted one when the in-memory one has been cleared by a reload.
  assert.match(appJsx, /setKyBusinessType\(carried\)/);
  assert.match(appJsx, /saveBusinessType\(carried\)/);
  // The ref is a live mirror read by handlers; leaving it stale would make the
  // very next routing decision read the old value.
  assert.match(appJsx, /kyBusinessTypeRef\.current = carried/);
});

/* ── 5. Source-level guards ────────────────────────────────────────────── */

test('the backend vocabulary is the one the translation assumes', () => {
  // If the backend renames a Know Yourself business type or an onboarding
  // business type, this table has to be revisited — otherwise the onboarding
  // step silently resolves no questions for that type.
  const backendConfig = readFileSync(resolve(ROOT, '../backend/src/config/onboarding.js'), 'utf8');
  const backendKeys = [...backendConfig.matchAll(/\{ key: '([a-z-]+)', label:/g)].map((m) => m[1]);
  assert.deepEqual(
    [...new Set(backendKeys)].sort(),
    ONBOARDING_BUSINESS_TYPES.map((t) => t.key).sort(),
    'frontend onboarding vocabulary has drifted from the backend config'
  );
  for (const key of backendKeys) {
    assert.ok(onboardingKeyFor(key), `backend onboarding type '${key}' has no KY counterpart`);
  }
});

test('only the onboarding module owns the translation table', () => {
  // One table, in one place. A second hardcoded map anywhere else could drift.
  const appJsx = readFileSync(resolve(ROOT, 'src/App.jsx'), 'utf8');
  assert.ok(!/ngo\s*:\s*['"]nonprofit['"]/.test(appJsx), 'the key map is duplicated in App.jsx');
  assert.ok(!/product\s*:\s*['"]manufacturing['"]/.test(appJsx), 'the key map is duplicated in App.jsx');
  assert.match(appJsx, /onboardingKeyFor\(bt\.key\)/);
});

test('the Stage 1 result screen resolves its label from the carried type', () => {
  // The onboarding pie must not call a Foundation a business. `actionLabel` is
  // read once, from the same value that routes the CTA, so the heading and the
  // button can never disagree with each other or with the question bank.
  const appJsx = readFileSync(resolve(ROOT, 'src/App.jsx'), 'utf8');
  const resultBlock = appJsx.slice(appJsx.indexOf('<ResultScreen'));
  assert.match(resultBlock, /actionLabel=\{resultActionLabelFor\(kyBusinessType, kyMeta\)\}/);
});

test('the Know Yourself result heading is the root label, not a hard-coded "Business"', () => {
  // A Non-Profit result must not be titled "Business Health Score". The noun is
  // the root's own label with the leading "Your" removed, and it is passed in
  // from the same meta content that decided the question bank.
  const kyResult = readFileSync(resolve(ROOT, 'src/screens/KnowYourselfResult.jsx'), 'utf8');
  const appJsx = readFileSync(resolve(ROOT, 'src/App.jsx'), 'utf8');
  assert.match(appJsx, /resultHeadingLabel=\{resultHeadingLabelFor\(kyBusinessType, kyMeta\)\}/);
  // The label is derived, not hard-coded, and falls back to the Mfg wording.
  assert.match(kyResult, /replace\(\/\^\\s\*your\\s\+\/i, ''\)/);
  assert.match(kyResult, /return stripped \|\| 'Business';/);
  // No remaining hard-coded "Business <em>Health</em> Score" / "… Assessment".
  assert.ok(
    !/>Business <span[^>]*>Health<\/span>/.test(kyResult),
    'the result heading is still hard-coded to "Business Health Score"'
  );
  assert.ok(
    !/>Business <span[^>]*>Assessment<\/span>/.test(kyResult),
    'the legacy result heading is still hard-coded to "Business Assessment"'
  );
  assert.match(kyResult, /\{entityLabel\} <span[^>]*>Health<\/span>/);
});
