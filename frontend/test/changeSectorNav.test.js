/* ─────────────────────────────────────────────────────────────────────────
   "CHANGE SECTOR TYPE" FROM THE DOMAIN STEP — REGRESSION
   ─────────────────────────────────────────────────────────────────────────
   The Domain step shows the chosen sector as a pill — "{sector} · change" —
   with the tooltip "Change sector type". Clicking it must reopen the sector
   picker in CHANGE mode: the "Change Your Sector Type" screen.

   It used to be wired to the Domain screen's generic `onBack` handler, so it
   could never reach that screen correctly:

     · first pass (selection mode "select") → opened the picker as
       "Select Your Sector Type", and picking there re-ran onboarding;
     · mid-assessment (selection mode "change") → bounced straight back to the
       questions and never opened the picker at all.

   These assertions pin the fix: a dedicated `onChangeSector` action that
   always opens the sector picker in change mode, independent of `onBack`.
   ───────────────────────────────────────────────────────────────────────── */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { SCREEN, SELECTION_MODE, screenAfterBusinessTypeSelect } from '../src/lib/kyFlow.js';

const SRC = resolve(dirname(fileURLToPath(import.meta.url)), '../src');
const read = (p) => readFileSync(resolve(SRC, p), 'utf8');

const DOMAIN_SCREEN = read('screens/DomainSelectionScreen.jsx');
const APP_JSX = read('App.jsx');

test('the sector-label "change" pill is its own action, not the back handler', () => {
  // It renders the dedicated handler (with a back-compat fallback for any
  // caller that has not been migrated), never `onBack` on its own.
  assert.match(
    DOMAIN_SCREEN,
    /onClick=\{onChangeSector \|\| onBack\}/,
    'the "{sector} · change" pill must render onChangeSector'
  );
  // `onBack` is still the genuine back action for the "Coming Soon" screen's
  // Back button — exactly one bare `onClick={onBack}` must remain.
  const bareBackUses = [...DOMAIN_SCREEN.matchAll(/onClick=\{onBack\}/g)];
  assert.equal(bareBackUses.length, 1, 'onBack must only remain on the Coming Soon back button');
  // The pill still advertises itself as the sector-type change affordance.
  assert.match(DOMAIN_SCREEN, /title="Change sector type"/);
});

test('App#handleChangeSector always opens the sector picker in change mode', () => {
  const body = APP_JSX.slice(
    APP_JSX.indexOf('const handleChangeSector'),
    APP_JSX.indexOf('// Fetch the KY result')
  );
  assert.match(body, /setKySelectionMode\('change'\)/, 'must enter change mode');
  assert.match(body, /setScreen\('kyBusinessType'\)/, 'must open the sector picker');
  // It is not a back-jump to the questions.
  assert.ok(!body.includes("setScreen('kyQuestion')"), 'the change action must not bounce to the questions');
});

test('the Domain screen is wired to handleChangeSector', () => {
  assert.match(APP_JSX, /onChangeSector=\{handleChangeSector\}/);
});

test('"Change Your Sector Type" is what selection mode "change" renders', () => {
  // The picker heading keys off the mode: change → "Change Your Sector Type".
  const BUSINESS_TYPE_SCREEN = read('screens/BusinessTypeScreen.jsx');
  assert.match(BUSINESS_TYPE_SCREEN, /const isChange = mode === 'change'/);
  assert.match(BUSINESS_TYPE_SCREEN, /isChange \? 'Change Your ' : 'Select Your '/);
  assert.equal(SELECTION_MODE.CHANGE, 'change');
});

test('changing sector mid-assessment still restarts through the right route', () => {
  // Services / Manufacturing reopen the Domain step; the domainless roots skip
  // straight to the questions. Either way the picker is reachable.
  const META = {
    businessTypes: [
      { key: 'service', kyRoot: 'manufacturing-services', requiresDomainSelection: true },
      { key: 'product', kyRoot: 'manufacturing-services', requiresDomainSelection: true },
      { key: 'ngo', kyRoot: 'non-profit', requiresDomainSelection: false },
      { key: 'startup', kyRoot: 'startup', requiresDomainSelection: false },
    ],
  };
  assert.equal(screenAfterBusinessTypeSelect({ key: 'service', label: 'Services' }, META), SCREEN.DOMAIN_SELECT);
  assert.equal(screenAfterBusinessTypeSelect({ key: 'product', label: 'Manufacturing' }, META), SCREEN.DOMAIN_SELECT);
  assert.equal(screenAfterBusinessTypeSelect({ key: 'ngo', label: 'Non-Profit' }, META), SCREEN.QUESTIONS);
});

test('backing out of the picker cannot dead-end on an empty questions screen', () => {
  // From the first-time Domain step there is no live assignment, so the
  // picker's "← Back to questions" falls back to the Domain step instead of
  // rendering a questions screen with no question.
  assert.match(
    APP_JSX,
    /onBack=\{\(\) => setScreen\(kyQuestion \? 'kyQuestion' : 'kyDomainSelect'\)\}/
  );
});
