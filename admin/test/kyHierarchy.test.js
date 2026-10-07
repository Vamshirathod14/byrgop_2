/* ─────────────────────────────────────────────────────────────────────────
   KY QUESTIONS HIERARCHY — Manufacturing + Services (Admin)
   ─────────────────────────────────────────────────────────────────────────
   The Mfg & Services root navigates exactly:

       [ Generic ] [ Services ] [ Manufacturing ]

   with each domain reached FROM underneath its business type — never as a
   top-level "Domains" tab and never as an "All Questions" tab. Selecting a
   domain shows only that domain's ACTIVE questions, grouped by their stored
   pillar, with counts measured from the data.

   Start-Up and Non-Profit keep their single "All <root> Questions" view,
   untouched. This is a navigation/filter change only: the page still reads
   every list from the API and writes every edit to the same endpoints.
   ───────────────────────────────────────────────────────────────────────── */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { getKyRoot, businessTypesForRoot } from '../src/lib/kyRoots.js';

const src = (rel) => readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), rel), 'utf8');
const PAGE = src('../src/pages/KnowYourselfQuestions.jsx');

/* The real `/admin/business-types` rows for the two business types of the
   shared Mfg & Services root. */
const API_TYPES = [
  { key: 'service', name: 'Services', kyRoot: 'manufacturing-services', requiresDomainSelection: true },
  { key: 'product', name: 'Manufacturing', kyRoot: 'manufacturing-services', requiresDomainSelection: true },
];

/* ── 1. Top-level navigation ───────────────────────────────────────── */

test('top level is Generic + the business types: exactly three buttons for Mfg & Services', () => {
  // The tabs are declared once, built from Generic followed by this root's
  // business types in the order the database declares them — never a
  // hard-coded name list, never an extra tab.
  assert.match(PAGE, /const topTabs = rootHasDomains\s*\?\s*\[/);
  assert.match(PAGE, /\{ key: 'generic', label: 'Generic' \}/);
  assert.match(PAGE, /\.\.\.rootBtKeys\.map\(\(key\) => \(\{ key, label: btOf\(key\)\?\.name \|\| key \}\)/);
  // The single-tab roots (Start-Up / Non-Profit) keep their one label.
  assert.match(PAGE, /\{ key: 'all', label: `All \$\{kyRoot\.short\} Questions` \}\]/);

  // On today's data that is exactly the required three top-level buttons.
  assert.deepEqual(businessTypesForRoot('manufacturing-services', API_TYPES), ['service', 'product']);
  assert.deepEqual(['generic', ...businessTypesForRoot('manufacturing-services', API_TYPES)],
    ['generic', 'service', 'product']);

  // And there is no "Domains" tab and no "All Questions" tab anywhere.
  assert.doesNotMatch(PAGE, /\{ key: 'domain', label: 'Domain-specific' \}/,
    'a Domain-specific top-level tab must not exist');
  assert.doesNotMatch(PAGE, /label: 'All Questions'/,
    'an All-Questions top-level tab must not exist');
  assert.doesNotMatch(PAGE, /topTab === 'domain'/);
});

test('a root with no domain step keeps the single All-Questions view', () => {
  // Start-Up / Non-Profit route through sectionTab === 'all' and nothing is
  // grouped by domain there.
  assert.match(PAGE, /if \(sectionTab === 'all'\) return true;/);
  assert.match(PAGE, /\{ key: 'all', label: `All \$\{kyRoot\.short\} Questions` \}\]/);
  assert.equal(getKyRoot('startup').requiresDomainSelection, false);
  assert.equal(getKyRoot('non-profit').requiresDomainSelection, false);
});

/* ── 2. Generic tab ────────────────────────────────────────────────── */

test('Generic shows only domain-free generic questions', () => {
  assert.match(PAGE, /if \(sectionTab === 'generic'\) return isGeneric\(q\) && !q\.domain;/);
});

/* ── 3. Services / Manufacturing sections ──────────────────────────── */

test('a business-type section shows only that type’s domain questions', () => {
  // A domain question is "of" a business type through the DOMAIN's own
  // businessTypeId (the question itself stores businessType: null — canonical
  // in this project), so Manufacturing and Services can never leak into each
  // other: a Manufacturing domain's questions fail the Services ownership check.
  assert.match(PAGE, /return q\.type === 'domain' && inBusinessType\(q, sectionTab\);/);
  assert.match(PAGE, /const d = domainOf\(q\.domain\);/);
  assert.match(PAGE, /String\(d\.businessTypeId\) === String\(bt\._id\)/,
    'business-type isolation must resolve through the Domain model’s businessTypeId');
});

test('the domain sub-navigation is the active domains of the selected business type', () => {
  assert.match(PAGE, /const sectionDomains = selectedBtKey\s*\?/);
  assert.match(PAGE, /d\.active !== false && bt && String\(d\.businessTypeId\) === String\(bt\._id\)/,
    'chips must be the ACTIVE domains owned by the selected type only');
});

test('a picked domain opens exactly one domain and nothing else', () => {
  assert.match(PAGE, /const selectedDomain = selectedBtKey && domainFilter !== 'all' \? domainOf\(domainFilter\) : null;/);
  assert.match(PAGE, /if \(domainFilter !== 'all' && q\.domain !== domainFilter\) return false;/);
});

/* ── 4. Grouping by pillar + dynamic counts ────────────────────────── */

test('a selected domain’s questions are grouped by their stored pillar', () => {
  assert.match(PAGE, /if \(pillar === 'all' && \(sectionTab === 'generic' \|\| selectedDomain\)\) \{/);
  assert.match(PAGE, /items: visible\.filter\(\(q\) => q\.category === c\.key\)/);
  // A question whose pillar is not in the live list lands in Uncategorized,
  // never silently dropped.
  assert.match(PAGE, /title: 'Uncategorized'/);
});

test('every count is measured from the loaded questions, never hard-coded', () => {
  assert.match(PAGE, /const activeCountFor = \(slug\) =>/);
  assert.match(
    PAGE,
    /liveQuestions\.filter\(\(q\) => q\.active !== false && q\.type === 'domain' && q\.domain === slug\)\.length/
  );
  assert.match(PAGE, /\{activeCountFor\(selectedDomain\.slug\)\} active question/,
    'the N-Questions header must be measured, not written in');
  assert.match(PAGE, /\{activeCountFor\(d\.slug\)\} question/,
    'the chips must show a measured count too');
  assert.doesNotMatch(PAGE, /9 question|19 question|18 question/,
    'a literal per-domain count must not appear anywhere');
});

/* ── 5. UX markers ─────────────────────────────────────────────────── */

test('the empty business-type section prompts the admin to pick a domain', () => {
  assert.match(PAGE, /Select a domain above to view its questions\./);
});

test('a question card renders once under its own _id key', () => {
  assert.match(PAGE, /const renderCard = \(q\) => \(/);
  assert.match(PAGE, /<div key=\{q\._id\} className="card">/,
    'each question must render under its own id, so nothing can duplicate');
});

/* ── 6. No data coupling ───────────────────────────────────────────── */

test('no domain name or count is hard-coded in the question page', () => {
  for (const name of [
    'Retail & E-Commerce',
    'Technology & SaaS / Digital Products',
    'Manufacturing & Industrial Operations',
    'Automotive & Heavy Engineering',
  ]) {
    assert.ok(!PAGE.includes(`'${name}'`), `'${name}' must come from the API, not the page`);
  }
});

test('the hierarchy is API-driven only — no second domain map exists', () => {
  // There is exactly one source of domains (api.domains() → setDomains) and one
  // source of business types (api.businessTypes()), and both lists feed the
  // chips/dropdowns below. A second hard-coded mapping would satisfy neither.
  assert.match(PAGE, /api\.domains\(\)/);
  assert.match(PAGE, /api\.businessTypes\(\)/);
  assert.equal((PAGE.match(/setDomains\(/g) || []).length, 1, 'domains are loaded exactly once');
});