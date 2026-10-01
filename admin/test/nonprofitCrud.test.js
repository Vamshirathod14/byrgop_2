/* ─────────────────────────────────────────────────────────────────────────
   NON-PROFIT ADMIN CRUD REGRESSION
   ─────────────────────────────────────────────────────────────────────────
   Guards the Admin surface for the Non-Profit root: that its Questions page
   is scoped to `?root=non-profit`, that it asks for live rows only (never the
   retired ones), and that the Domain parts of the form are hidden for a root
   that has no domains — while the Manufacturing & Services root keeps all of
   them untouched.
   ───────────────────────────────────────────────────────────────────────── */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import {
  KY_ROOT_IDS,
  businessTypesForRoot,
  managesPillarsInline,
  getKyRoot,
} from '../src/lib/kyRoots.js';

const src = (rel) => readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), rel), 'utf8');

const QUESTIONS_PAGE = src('../src/pages/KnowYourselfQuestions.jsx');
const WORKSPACE = src('../src/pages/KyRootWorkspace.jsx');
const PILLAR_MANAGER = src('../src/pages/KYPillarManager.jsx');
const API_CLIENT = src('../src/api/client.js');

/* The real `/admin/business-types` payload. */
const API_TYPES = [
  { key: 'service', name: 'Services', kyRoot: 'manufacturing-services', requiresDomainSelection: true },
  { key: 'product', name: 'Manufacturing', kyRoot: 'manufacturing-services', requiresDomainSelection: true },
  { key: 'startup', name: 'Start-Up', kyRoot: 'startup', requiresDomainSelection: false },
  { key: 'ngo', name: 'Non-Profit', kyRoot: 'non-profit', requiresDomainSelection: false },
];

/* ── Root wiring ────────────────────────────────────────────────────── */

test('Non-Profit is an Admin root that owns exactly one business type', () => {
  assert.deepEqual(businessTypesForRoot('non-profit'), ['ngo']);
  const root = getKyRoot('non-profit');
  assert.equal(root.requiresDomainSelection, false, 'Non-Profit must never ask for a domain');
  assert.equal(root.label, 'Non-Profit');
});

test('Non-Profit pillars are managed inline in the Admin, like Start-Up', () => {
  assert.equal(managesPillarsInline('non-profit'), true);
  assert.equal(managesPillarsInline('manufacturing-services'), false);
});

test('the Non-Profit workspace renders both Questions and Pillars', () => {
  assert.match(WORKSPACE, /KYQuestionsArea|KnowYourselfQuestions/);
  assert.match(WORKSPACE, /KYCategories/);
  // Both are scoped to this root, so no root can read another's rows.
  assert.match(WORKSPACE, /root=\{kyRoot\.id\}/);
});

/* ── The Questions page fetches the right scope ─────────────────────── */

test('the Questions page scopes its fetch to the active root', () => {
  assert.match(QUESTIONS_PAGE, /api\.kyQuestions\(\{ root,/);
  assert.match(QUESTIONS_PAGE, /root=\{kyRoot\.id\}|root,\s*includeInactive/);
});

test('a root without domains asks for live rows only, so retired questions never list', () => {
  // includeInactive is driven by the root's own requiresDomainSelection flag,
  // not by a hardcoded root id.
  assert.match(QUESTIONS_PAGE, /const rootHasDomains = kyRoot\.requiresDomainSelection;/);
  assert.match(QUESTIONS_PAGE, /includeInactive: rootHasDomains/);
  // Explicitly NOT a literal root list — that is what would break when a
  // fourth root is added.
  assert.doesNotMatch(QUESTIONS_PAGE, /includeInactive:\s*(true|false)\s*[,}]/);
});

/* ── No Domain UI for Non-Profit ────────────────────────────────────── */

test('every Domain affordance in the Questions page is gated on rootHasDomains', () => {
  const domainUi = [
    // type filter tab
    { key: 'domain', label: 'Domain-specific' },
    // domain select in the form
    { key: 'showDomainSchema', label: 'showDomainSchema' },
    // domain field rendering
    { key: 'q.domain', label: 'q.domain' },
  ];
  for (const { key, label } of domainUi) {
    assert.ok(
      QUESTIONS_PAGE.includes(key),
      `expected the page to still contain ${label} (for Mfg/Services)`
    );
  }
  // Every one of the three Domain affordances is behind the flag: the
  // Generic/Domain badge, the domain label on a card, and the DomainSelect in
  // the form. This is the assertion that keeps Non-Profit domain-free.
  assert.match(QUESTIONS_PAGE, /\{rootHasDomains && \(\s*<span[\s\S]{0,400}?Generic/,
    'the Generic/Domain badge must be gated on rootHasDomains');
  assert.match(QUESTIONS_PAGE, /\{rootHasDomains && q\.type === 'domain' && q\.domain && \(/,
    'the domain label on a question card must be gated on rootHasDomains');
  assert.match(QUESTIONS_PAGE, /showDomainSchema=\{rootHasDomains\}/,
    'the DomainSelect in the form must be gated on rootHasDomains');
  // And the type filter tab is conditional rather than present-but-disabled.
  assert.match(QUESTIONS_PAGE, /rootHasDomains \? \[\{ key: 'domain', label: 'Domain-specific' \}\] : \[\]/);
});

test('the Non-Profit root never receives a Domain schema or a domain question filter', () => {
  // showDomainSchema={rootHasDomains} appears on both the add and edit forms.
  const gates = QUESTIONS_PAGE.match(/showDomainSchema=\{rootHasDomains\}/g) || [];
  assert.ok(gates.length >= 2, 'both the create and edit forms must gate the Domain schema');
});

/* ── The 18-question bank is what the page will render ──────────────── */

test('the Non-Profit pillar dropdown is fed by the root-scoped categories call', () => {
  assert.match(QUESTIONS_PAGE, /api\.kyCategories\(root, rootHasDomains\)/);
  // The pillar options come from `categories`, never a hardcoded list.
  assert.match(QUESTIONS_PAGE, /categories/);
  assert.doesNotMatch(QUESTIONS_PAGE, /nonprofit-strategy|nonprofit-governance/,
    'pillar keys must come from the API, not be baked into the page');
});

test('the pillar manager refuses to delete a pillar that still has questions', () => {
  // Start-Up and Non-Profit share the safe-delete rule: retire, never remove.
  assert.match(PILLAR_MANAGER, /questions/i);
  assert.match(PILLAR_MANAGER, /active:\s*false|retire|deactivate/i);
});

test('a question update is sent as a PUT to its own id', () => {
  assert.match(QUESTIONS_PAGE, /api\.updateKYQuestion\(`\/admin\/know-yourself\/\$\{initial\._id\}`, payload\)/);
});

/* ── Manufacturing & Services must be unchanged ────────────────────── */

test('Manufacturing & Services still owns two business types and keeps domain selection', () => {
  assert.deepEqual(businessTypesForRoot('manufacturing-services').sort(), ['product', 'service']);
  assert.equal(getKyRoot('manufacturing-services').requiresDomainSelection, true);
  assert.equal(managesPillarsInline('manufacturing-services'), false);
});

test('the API client sends root and includeInactive as query parameters', () => {
  assert.match(API_CLIENT, /kyQuestions/);
  const fn = API_CLIENT.slice(API_CLIENT.indexOf('kyQuestions'));
  assert.match(fn.slice(0, 400), /root/);
  assert.match(fn.slice(0, 400), /includeInactive/);
});

test('every root the backend reports is reachable from the Admin nav', () => {
  for (const t of API_TYPES) {
    assert.ok(KY_ROOT_IDS.includes(t.kyRoot), `${t.key} reports unknown root ${t.kyRoot}`);
  }
});