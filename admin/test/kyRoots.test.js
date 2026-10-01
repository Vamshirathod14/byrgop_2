import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import {
  KY_ROOTS,
  KY_ROOT_IDS,
  DEFAULT_KY_ROOT,
  getKyRoot,
  isKyRootId,
  managesPillarsInline,
  businessTypesForRoot,
  allBusinessTypeKeys,
  KY_NAV_ENTRIES,
  KY_NAV_KEYS,
  DEFAULT_KY_NAV_KEY,
  isKyNavKey,
  getKyNavEntry,
  navLabelFor,
} from '../src/lib/kyRoots.js';

const src = (rel) => readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), rel), 'utf8');

/* The real `/admin/business-types` payload after the `kyRoot` field was added. */
const API_TYPES = [
  { key: 'service', name: 'Services', kyRoot: 'manufacturing-services', requiresDomainSelection: true },
  { key: 'product', name: 'Manufacturing', kyRoot: 'manufacturing-services', requiresDomainSelection: true },
  { key: 'startup', name: 'Start-Up', kyRoot: 'startup', requiresDomainSelection: false },
  { key: 'ngo', name: 'Non-Profit', kyRoot: 'non-profit', requiresDomainSelection: false },
];

/* ── 1. Three roots, mirroring the backend vocabulary ────────────────── */

test('the admin declares the same three roots as the backend', () => {
  assert.deepEqual(KY_ROOT_IDS, ['manufacturing-services', 'startup', 'non-profit']);
  assert.equal(DEFAULT_KY_ROOT, 'manufacturing-services');
  // The root ids are the wire values sent to /admin/know-yourself?root= and
  // to BusinessType.kyRoot, so they must match the backend enum exactly.
  for (const id of KY_ROOT_IDS) assert.ok(isKyRootId(id), id);
});

test('every root has a distinct label and its own short name', () => {
  assert.equal(new Set(KY_ROOTS.map((r) => r.label)).size, 3);
  assert.equal(new Set(KY_ROOTS.map((r) => r.short)).size, 3);
  for (const r of KY_ROOTS) {
    assert.ok(r.blurb && r.blurb.length > 40, `${r.id} has no explanatory blurb`);
  }
});

test('only Manufacturing & Services is marked as running domain selection', () => {
  const withDomains = KY_ROOTS.filter((r) => r.requiresDomainSelection).map((r) => r.id);
  assert.deepEqual(withDomains, ['manufacturing-services']);
});

/* ── 2. Root → business type scoping comes from the API ──────────────── */

test('business types are read from the API, not from the constants', () => {
  assert.deepEqual(businessTypesForRoot('manufacturing-services', API_TYPES), ['service', 'product']);
  assert.deepEqual(businessTypesForRoot('startup', API_TYPES), ['startup']);
  assert.deepEqual(businessTypesForRoot('non-profit', API_TYPES), ['ngo']);
});

test('a new business type added to a root in the database shows up with no code change', () => {
  // A fifth type configured against the Start-Up root must join the Start-Up
  // scope immediately — this is what makes routing configuration-driven.
  const extended = [...API_TYPES, { key: 'venture_backed', name: 'Venture-Backed', kyRoot: 'startup' }];
  assert.deepEqual(businessTypesForRoot('startup', extended), ['startup', 'venture_backed']);
  // …and must not leak into any other root.
  assert.deepEqual(businessTypesForRoot('non-profit', extended), ['ngo']);
  assert.deepEqual(businessTypesForRoot('manufacturing-services', extended), ['service', 'product']);
});

test('the constants are only a fallback for an empty or failed response', () => {
  for (const empty of [[], null, undefined, 'not-an-array']) {
    assert.deepEqual(businessTypesForRoot('startup', empty), ['startup']);
    assert.deepEqual(businessTypesForRoot('non-profit', empty), ['ngo']);
  }
});

test('an API list with no matching root falls back rather than scoping to nothing', () => {
  // A partially-migrated database (rows without `kyRoot`) must not make a
  // root's editor look empty.
  assert.deepEqual(businessTypesForRoot('startup', [{ key: 'service' }, { key: 'product' }]), ['startup']);
});

test('allBusinessTypeKeys covers every business type exactly once', () => {
  const keys = allBusinessTypeKeys(API_TYPES);
  assert.deepEqual([...keys].sort(), ['ngo', 'product', 'service', 'startup']);
  assert.equal(new Set(keys).size, keys.length, 'a business type is listed in two roots');
});

/* ── 3. Root ids are validated the same way the backend normalises them ── */

test('root ids are case- and whitespace-insensitive', () => {
  for (const raw of ['startup', 'STARTUP', '  startup  ']) assert.equal(isKyRootId(raw), true, raw);
  // Casing and padding are normalised away, the way the backend does it.
  assert.equal(isKyRootId('Non-Profit'), true);
  assert.equal(isKyRootId('manufacturing-services'), true);
  // A genuinely different spelling is still a mismatch.
  assert.equal(isKyRootId('nonprofit'), false);
  assert.equal(isKyRootId('non profit'), false);
  assert.equal(isKyRootId('nonsense'), false);
  assert.equal(isKyRootId(null), false);
  assert.equal(isKyRootId(''), false);
});

test('getKyRoot never returns undefined, so no page can render an unnamed root', () => {
  for (const id of [...KY_ROOT_IDS, 'nonsense', null, undefined, '', 42]) {
    const root = getKyRoot(id);
    assert.ok(root && typeof root.id === 'string', `getKyRoot(${JSON.stringify(id)})`);
    assert.ok(root.label && root.short);
  }
  // An unknown id falls back to the shared root rather than to a blank page.
  assert.equal(getKyRoot('nonsense').id, DEFAULT_KY_ROOT);
});

/* ── 4. ONE unified KY Questions area holding all four roots/types ───── */

test('the sidebar has exactly ONE KY Questions entry, not one per root', () => {
  const layout = src('../src/components/Layout.jsx');

  // One entry, and it is in mainNav (not a stray list of its own).
  assert.match(layout, /const kyQuestionsNav = \{/, 'the unified nav entry is missing');
  assert.match(layout, /label: 'KY Questions'/);
  assert.match(layout, /\n\s*kyQuestionsNav,\n/, 'kyQuestionsNav is not in mainNav');

  // The per-root sidebar entries are GONE. This is the actual requirement.
  assert.ok(
    !/KY Questions · /.test(layout),
    'a per-root "KY Questions · …" sidebar entry is still present'
  );
  assert.ok(
    !layout.includes('kyRootNav'),
    'the per-root nav list is still built in Layout.jsx'
  );
  assert.ok(
    !/KY_ROOTS/.test(layout),
    'Layout.jsx still derives sidebar entries per root'
  );
  // The old flat result-categories entry stays gone too.
  assert.ok(
    !/label: 'KY Result Categories'/.test(layout),
    'the flat "KY Result Categories" nav entry is still present'
  );
});

test('the unified area offers exactly Manufacturing, Services, Start-Up, Non-Profit', () => {
  // The four are declared once, in one ordered table, and every one of them
  // names the root it belongs to.
  assert.deepEqual(KY_NAV_KEYS, ['manufacturing', 'services', 'startup', 'non-profit']);
  for (const key of KY_NAV_KEYS) assert.ok(isKyNavKey(key), key);
  for (const e of KY_NAV_ENTRIES) {
    assert.ok(isKyRootId(e.root), `${e.key} points at an unknown root "${e.root}"`);
  }
  // Manufacturing and Services are the SAME root — they are business types
  // inside it, not roots of their own. That is what keeps their behaviour
  // identical and unchanged.
  const mfg = getKyNavEntry('manufacturing');
  const svc = getKyNavEntry('services');
  assert.equal(mfg.root, 'manufacturing-services');
  assert.equal(svc.root, 'manufacturing-services');
  assert.equal(mfg.businessType, 'product');
  assert.equal(svc.businessType, 'service');
  // Start-Up and Non-Profit each own their root outright.
  assert.equal(getKyNavEntry('startup').root, 'startup');
  assert.equal(getKyNavEntry('startup').businessType, null);
  assert.equal(getKyNavEntry('non-profit').root, 'non-profit');
  assert.equal(getKyNavEntry('non-profit').businessType, null);

  // An unknown key falls back to Manufacturing rather than an unnamed page.
  assert.equal(getKyNavEntry('nonsense').key, DEFAULT_KY_NAV_KEY);
  for (const raw of ['startup', 'STARTUP', '  Non-Profit  ']) {
    assert.equal(isKyNavKey(raw.toLowerCase().trim()), true, raw);
  }
  assert.equal(isKyNavKey('nonprofit'), false);
  assert.equal(isKyNavKey(''), false);
});

test('chooser labels come from the API, with a constant fallback', () => {
  const renamed = API_TYPES.map((bt) =>
    bt.key === 'product' ? { ...bt, name: 'Industrial Goods' } : bt
  );
  assert.equal(navLabelFor(getKyNavEntry('manufacturing'), renamed), 'Industrial Goods');
  assert.equal(navLabelFor(getKyNavEntry('services'), renamed), 'Services');
  // No API, or a failure: the constant label, never a blank button.
  assert.equal(navLabelFor(getKyNavEntry('manufacturing'), null), 'Manufacturing');
  // Start-Up / Non-Profit have no businessType of their own here, so they use
  // their root's own short name.
  assert.equal(navLabelFor(getKyNavEntry('startup'), API_TYPES), 'Start-Up');
  assert.equal(navLabelFor(getKyNavEntry('non-profit'), API_TYPES), 'Non-Profit');
});

test('the unified area renders the existing workspace, not a fork of it', () => {
  const app = src('../src/App.jsx');
  const area = src('../src/pages/KYQuestionsArea.jsx');
  const workspace = src('../src/pages/KyRootWorkspace.jsx');

  // The sidebar key opens the unified area…
  assert.match(app, /section\('kyQuestions', <KYQuestionsArea \/>/);
  // …which is a chooser over the workspace that already existed.
  assert.match(area, /import KyRootWorkspace from '\.\/KyRootWorkspace\.jsx'/);
  assert.match(area, /<KyRootWorkspace/);
  assert.match(area, /root=\{entry\.root\}/);
  assert.match(area, /businessType=\{entry\.businessType\}/);
  // Keyed by BOTH, so Manufacturing and Services cannot share component state.
  assert.match(area, /key=\{`\$\{entry\.root\}::\$\{entry\.businessType \|\| ''\}`\}/);
  // The old per-root keys still resolve to the same workspace.
  assert.match(app, /KY_ROOTS\.map\(/);
  assert.match(app, /section\(`kyRoot_\$\{r\.id\}`/);
  assert.match(app, /<KyRootWorkspace key=\{r\.id\} root=\{r\.id\}/);
  // And the workspace passes the scope through unchanged.
  assert.match(workspace, /<KnowYourselfQuestions[\s\S]{0,200}?businessType=\{businessType\}/);
});

test('each root page states which six-pillar structure it edits', () => {
  const questions = src('../src/pages/KnowYourselfQuestions.jsx');
  const pillars = src('../src/pages/KYCategories.jsx');
  const workspace = src('../src/pages/KyRootWorkspace.jsx');

  // The questions page must name the root and render this root's pillars.
  assert.match(questions, /Root: \{kyRoot\.short\}/);
  assert.match(questions, /Pillar result structure for \{kyRoot\.short\}/);
  // The pillars page must name the root too.
  assert.match(pillars, /Root: \{kyRoot\.short\}/);
  // Both lists are requested from the server scoped to this root. A root with
  // no domain step additionally asks for the LIVE rows only, so its superseded
  // bank is never returned to the page.
  assert.match(questions, /api\.kyQuestions\(\{ root, includeInactive: rootHasDomains \}\)/);
  assert.match(questions, /api\.kyCategories\(root, rootHasDomains\)/);
  assert.match(pillars, /api\.kyCategories\(kyRoot\.id, kyRoot\.requiresDomainSelection\)/);
  // And the root's Questions/Pillars views sit behind one workspace.
  assert.match(workspace, /<KnowYourselfQuestions[\s\S]{0,200}?root=\{kyRoot\.id\}/);
  assert.match(workspace, /<KYCategories key=\{`p-\$\{kyRoot\.id\}`\} root=\{kyRoot\.id\}/);
});

/* ── 4b. Start-Up and Non-Profit: no domain system, anywhere ─────────────
   Both roots declare `requiresDomainSelection: false`, and that one flag is
   what removes every domain control from the page. These assert the flag is
   what is actually branched on, so neither root can grow a Domain selector. */

test('Start-Up and Non-Profit are both declared as having no domain step', () => {
  const domainless = KY_ROOTS.filter((r) => !r.requiresDomainSelection).map((r) => r.id);
  assert.deepEqual(domainless.sort(), ['non-profit', 'startup']);
});

test('the domain editor controls hang off that one flag, not off a root name', () => {
  // If this branched on a hard-coded root id instead, adding a fourth
  // domain-less root would silently inherit a Domain selector.
  assert.match(QUESTIONS_PAGE, /showDomainSchema = true,/, 'the editor has no domain-schema flag');
  assert.match(QUESTIONS_PAGE, /showDomainSchema=\{rootHasDomains\}/,
    'the create/edit forms must be gated on rootHasDomains');
  assert.equal((QUESTIONS_PAGE.match(/showDomainSchema=\{rootHasDomains\}/g) || []).length, 2,
    'both the create and the edit form must be gated');
  // The three domain controls are all inside that ONE guarded block, which runs
  // from the guard to the Pillar section that follows it.
  const block = QUESTIONS_PAGE.slice(
    QUESTIONS_PAGE.indexOf('{showDomainSchema && (\n        <div className="grid grid-cols-2 gap-4">'),
    QUESTIONS_PAGE.indexOf("{showDomainSchema ? 'grid grid-cols-2 gap-4' : ''}")
  );
  assert.ok(block.length > 800, 'the guarded Question Type / Business Type / Domain block was not found');
  assert.match(block, /\n\s*Question Type\n/);
  assert.match(block, /\n\s*Business Type\n/);
  assert.match(block, /\n\s*Domain\n/);
  // …and the NEXT block after it is the Pillar control, not another domain one.
  const next = QUESTIONS_PAGE.slice(
    QUESTIONS_PAGE.indexOf("{showDomainSchema ? 'grid grid-cols-2 gap-4' : ''}"),
    QUESTIONS_PAGE.indexOf('{/* "Any business type"')
  );
  assert.match(next, /\n\s*Pillar\n/);
  // "Any business type" is behind the flag too. The other two mentions are the
  // comments explaining why, so the OPTION itself is what is counted.
  const anyBusinessType = '<option value="">Any business type</option>';
  assert.equal((QUESTIONS_PAGE.match(new RegExp(anyBusinessType.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length, 1,
    'the "Any business type" option must exist exactly once, for the Mfg & Services root');
  assert.ok(
    QUESTIONS_PAGE.lastIndexOf('{showDomainSchema && (') < QUESTIONS_PAGE.indexOf(anyBusinessType),
    'the "Any business type" option must sit inside a showDomainSchema guard'
  );
  // And the payload is pinned by the same flag, so a hidden field can never be
  // trusted to still hold a value.
  assert.match(QUESTIONS_PAGE, /type: showDomainSchema \? form\.type : 'generic'/);
  assert.match(QUESTIONS_PAGE, /businessType: showDomainSchema \? form\.businessType \|\| null : rootBusinessType \|\| null/);
});

test('Add Question is stamped with the selected root, never the shared pool', () => {
  // A Start-Up / Non-Profit question created from its own page must carry that
  // root's business type. `businessType: null` would put it in the shared
  // Manufacturing & Services pool, where it is scored against the wrong
  // pillars and never reappears on the page it was created from.
  assert.match(QUESTIONS_PAGE, /rootBusinessType = '',/);
  assert.match(QUESTIONS_PAGE, /rootBusinessType=\{rootBtKeys\.length === 1 \? rootBtKeys\[0\] : ''\}/);
  assert.equal((QUESTIONS_PAGE.match(/rootBusinessType=\{rootBtKeys\.length === 1 \? rootBtKeys\[0\] : ''\}/g) || []).length, 2,
    'both the create and the edit form must be told the root\'s business type');
  // A new question is seeded with it, so the field is never even blank.
  assert.match(QUESTIONS_PAGE, /\{ \.\.\.empty, businessType: defaultBusinessType \}/);
  assert.match(QUESTIONS_PAGE, /defaultBusinessType=\{rootBtKeys\.length === 1 \? rootBtKeys\[0\] : ''\}/);
});

test('no root-less pillar list can reach a Start-Up or Non-Profit editor', () => {
  // The pillar options come from the root-scoped `?root=` fetch. Start-Up and
  // Non-Profit ask for the LIVE rows of their own root, so a retired pillar or
  // another root's pillar is never in the list to be picked.
  assert.match(QUESTIONS_PAGE, /api\.kyCategories\(root, rootHasDomains\)/);
  assert.match(QUESTIONS_PAGE, /api\.kyQuestions\(\{ root, includeInactive: rootHasDomains \}\)/);
  // The six pillar NAMES are never written into the editor.
  for (const name of ['Market Validation', 'People & Culture', 'Governance', 'Strategy']) {
    assert.ok(!QUESTIONS_PAGE.includes(`'${name}'`), `'${name}' is hard-coded in the editor`);
  }
});

test('the old flat nav keys still resolve instead of rendering a blank page', () => {
  const app = src('../src/App.jsx');
  assert.match(app, /section\('kyResultCategories', <KYCategories root="manufacturing-services"/);
});

/* ── 4d. Start-Up and Non-Profit pillars are ADMIN-manageable ──────────────
   Adding, renaming, retiring, restoring and counting pillars for the two
   roots that own their pillar sets outright. Everything here is a write to
   the existing root-scoped pillar API — no new endpoint, no second pillar
   store — and the frozen Manufacturing & Services root must be unable to
   reach any of it. */

const MANAGER = src('../src/pages/KYPillarManager.jsx');
const WORKSPACE = src('../src/pages/KyRootWorkspace.jsx');

/** The manager with its comments stripped, so an assertion about what the code
 *  does is never satisfied — or broken — by the prose describing it. */
const MANAGER_CODE = MANAGER.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

test('only Start-Up and Non-Profit get the new pillar management section', () => {
  assert.deepEqual(
    KY_ROOTS.filter((r) => r.managesPillarsInline).map((r) => r.id).sort(),
    ['non-profit', 'startup'],
    'exactly Start-Up and Non-Profit must manage their pillars inline'
  );
  assert.equal(managesPillarsInline('startup'), true);
  assert.equal(managesPillarsInline('non-profit'), true);
  // The frozen root. This single value is what keeps Manufacturing and
  // Services on the pillar page they have always had.
  assert.equal(managesPillarsInline('manufacturing-services'), false);
  // An unknown id must not accidentally opt in either.
  assert.equal(managesPillarsInline('nonsense'), false);
  // It is a declared property, not a side effect of the domain flag.
  for (const root of KY_ROOTS) {
    assert.equal(typeof root.managesPillarsInline, 'boolean', `${root.id} must declare it`);
  }
});

test('Manufacturing and Services still open the untouched pillar page', () => {
  // The old page is still imported, still rendered, and still keyed by root.
  assert.match(WORKSPACE, /import KYCategories from '\.\/KYCategories\.jsx'/);
  assert.match(WORKSPACE, /<KYCategories key=\{`p-\$\{kyRoot\.id\}`\} root=\{kyRoot\.id\}/);
  // …and the tab that reaches it is only rendered when the root is NOT the
  // inline one, so the shared root cannot be moved onto the new manager by a
  // change to the other roots.
  assert.match(WORKSPACE, /const showPillarTab = !inlinePillars && canSeePillars;/);
  assert.match(WORKSPACE, /const inlinePillars = managesPillarsInline\(kyRoot\.id\);/);
  // The old page is left exactly as it was — the manager does not extend it.
  const oldPage = src('../src/pages/KYCategories.jsx');
  assert.ok(!oldPage.includes('KYPillarManager'), 'the frozen page must not import the new manager');
});

test('pillar management writes through the existing root-scoped pillar API', () => {
  // Read: scoped to this root, and with retired rows included so a retired
  // pillar stays visible and restorable.
  assert.match(MANAGER, /api\.kyCategories\(kyRoot\.id, true\)/);
  // Create / rename / retire / restore / delete are the same four endpoints the
  // Manufacturing & Services page has always used. No new API, no new store.
  assert.match(MANAGER, /api\.createKYCategory\('\/admin\/know-yourself\/categories', payload\)/);
  assert.match(MANAGER, /api\.updateKYCategory\(`\/admin\/know-yourself\/categories\/\$\{[\w.]+\._id\}`/);
  assert.match(MANAGER, /api\.deleteKYCategory\(`\/admin\/know-yourself\/categories\/\$\{[\w.]+\._id\}`\)/);
  // Creating a question count source, scoped to this root too.
  assert.match(MANAGER, /api\.kyQuestions\(\{ root: kyRoot\.id, includeInactive: true \}\)/);
});

test('a new pillar is stamped with its root, and a pillar can never move between roots', () => {
  // Create sends the root; edit deliberately does not, because re-pointing a
  // pillar would silently re-file every question that references its key.
  assert.match(MANAGER, /if \(!isEdit\) payload\.kyRoot = root;/);
  const form = MANAGER.slice(MANAGER.indexOf('function PillarForm'));
  assert.equal((form.match(/kyRoot = root/g) || []).length, 1, 'kyRoot must be set on create only');
  assert.ok(
    !/kyRoot: root/.test(form),
    'kyRoot must never be part of the persisted payload unconditionally'
  );
  // The two roots are the ones the chooser can offer this page for.
  for (const rootId of ['startup', 'non-profit']) {
    assert.equal(getKyRoot(rootId).managesPillarsInline, true, rootId);
  }
});

test('pillar counts are measured from the questions, never assumed', () => {
  // The count is produced by grouping this root's questions by their persisted
  // category…
  assert.match(
    MANAGER,
    /const map = new Map\(\);\s*\n\s*for \(const c of categories\) map\.set\(c\.key, \{ live: 0, retired: 0 \}\);/
  );
  assert.match(MANAGER, /const row = q\.category \? map\.get\(q\.category\) : null;/);
  assert.match(MANAGER, /if \(q\.active === false\) row\.retired \+= 1;\s*\n\s*else row\.live \+= 1;/);
  // …and it is rendered as a measured number, pluralised, with a zero state
  // called out rather than hidden.
  assert.match(MANAGER, /\{live\} question\{live === 1 \? '' : 's'\}/);
  assert.match(MANAGER, /live === 0 \? 'font-semibold text-amber-700'/);
  // Nothing anywhere claims a fixed number of questions per pillar: there is
  // no quota identifier, no arithmetic against a literal, and no count
  // rendered from a number rather than from a measured value.
  assert.doesNotMatch(MANAGER_CODE, /perPillar|questionsPerPillar|PILLARS_PER|QUESTIONS_PER/,
    'the manager must not assume how many questions a pillar has');
  // A count is never combined with a fixed number anywhere — not divided by
  // three, not scaled by a quota. Checked on the lines that do the counting, so
  // a CSS class like `bg-green-400/15` cannot masquerade as arithmetic.
  const countLines = MANAGER_CODE.split('\n').filter((l) => /\b(live|retired|counts|attached|totalLive)\b/.test(l));
  assert.ok(countLines.length > 5, 'the counting code was not found');
  for (const line of countLines) {
    assert.doesNotMatch(line, /[*\/]\s*\d+/, `a count is used in arithmetic: ${line.trim()}`);
  }
  // Every number rendered is a measured value. With the two that are not counts
  // at all — the colour input's validation pattern and the textarea's rows —
  // removed, no bare numeric JSX expression is left.
  const markupOnly = MANAGER_CODE.replace(/pattern="[^"]*"/g, '').replace(/rows=\{\d+\}/g, '');
  const numericLiterals = [...markupOnly.matchAll(/\{\s*(\d+)\s*\}/g)].map((m) => m[0]);
  assert.deepEqual(numericLiterals, [], `a count is rendered from a literal: ${numericLiterals}`);
  // A pillar is never derived from a question's position or number either.
  assert.doesNotMatch(MANAGER_CODE, /index|% \s*PILLARS|count \?/);
});

test('a pillar with questions can never be hard-deleted, and says why', () => {
  // The button is disabled and explains the reason, rather than being clicked
  // and rejected.
  assert.match(MANAGER, /const attached = live \+ retired;/);
  assert.match(MANAGER, /disabled=\{busy \|\| attached > 0\}/);
  assert.match(MANAGER, /Reassign them to another pillar before deleting this one\./);
  // And if the server refuses anyway, its explanation is shown verbatim.
  assert.match(MANAGER, /Reassigned|reassign/i);
  const remove = MANAGER.slice(MANAGER.indexOf('const remove = async (pillar)'));
  assert.match(remove, /setErr\(e\.message\)/);
  assert.match(remove, /No question is filed under it, so nothing is orphaned/);
});

test('deactivating is reversible and never destructive', () => {
  // Retire / restore is a single partial update of `active` — the record, its
  // key and its questions are all left alone.
  assert.match(MANAGER, /await api\.updateKYCategory\(`\/admin\/know-yourself\/categories\/\$\{pillar\._id\}`, \{\s*\n\s*active: reactivating,/);
  assert.match(MANAGER, /const reactivating = pillar\.active === false;/);
  // Retired pillars stay listed, clearly separated, and are restorable from
  // there rather than vanishing from the page.
  assert.match(MANAGER, /const retired = useMemo\(\(\) => categories\.filter\(\(c\) => c\.active === false\)/);
  assert.match(MANAGER, /Retired pillars/);
  assert.match(MANAGER, /\{isActive \? 'Deactivate' : 'Activate'\}/);
  // A retired pillar is never offered to a new question: the question page
  // still asks the server for the live rows only.
  assert.match(QUESTIONS_PAGE, /api\.kyCategories\(root, rootHasDomains\)/);
  assert.match(QUESTIONS_PAGE, /categories\.filter\(\(c\) => c\.active\)\.map/);
});

test('a new pillar is usable in the question editor without a page reload', () => {
  // The manager tells the workspace it changed, the workspace tells the
  // questions page, and the questions page re-reads its pillar list.
  assert.match(MANAGER, /onChanged\?\.\(\);/);
  assert.match(WORKSPACE, /onChanged=\{bumpPillars\}/);
  assert.match(WORKSPACE, /pillarRevision=\{revision\.pillars\}/);
  assert.match(WORKSPACE, /<KnowYourselfQuestions[\s\S]{0,200}?businessType=\{businessType\}/);
  // …and the questions page reports back, so the manager's counts update when
  // a question is assigned.
  assert.match(WORKSPACE, /onDataChanged=\{bumpQuestions\}/);
  assert.match(WORKSPACE, /questionsRevision=\{revision\.questions\}/);
  assert.match(QUESTIONS_PAGE, /onDataChanged\?\.\(\);/);
  assert.match(QUESTIONS_PAGE, /\}, \[root, rootHasDomains, pillarRevision, onDataChanged\]\);/);
  // Both setters are useState-based, so their identities never change and the
  // two sides cannot talk each other into a re-fetch loop.
  assert.match(WORKSPACE, /const bumpQuestions = useCallback\(/);
  assert.match(WORKSPACE, /const bumpPillars = useCallback\(/);
  assert.doesNotMatch(WORKSPACE, /onDataChanged=\{\(\) =>/,
    'an inline callback would change identity every render and re-fetch forever');
});

test('a renamed pillar is re-read, not left showing its old name', () => {
  // A rename writes to the server but the row on screen is only refreshed by an
  // explicit reload. If the edit path just closes the form, the admin sees the
  // OLD name and the Pillar dropdown above keeps offering it — the write looks
  // like it failed. So an edit goes through the same refresh as a create.
  assert.match(MANAGER, /onSaved=\{onSavedEdit\}/);
  assert.doesNotMatch(MANAGER, /onSaved=\{onCancelEdit\}/,
    'closing the form is not a refresh: a renamed pillar would keep its old name on screen');
  assert.match(MANAGER, /onSaved\(payload\.name\)/);
  assert.match(MANAGER, /onSavedEdit=\{async \(name\) => \{\s*\n\s*setEditingId\(null\);\s*\n\s*await afterWrite\(`"\$\{name\}" was updated\.`\);/);
  // Which means the questions page is told too, so the dropdown shows the new
  // name in the same tick.
  assert.match(MANAGER, /const afterWrite = async \(message\) => \{\s*\n\s*setNote\(message\);\s*\n\s*setErr\(null\);\s*\n\s*await load\(\);\s*\n[\s\S]{0,220}?onChanged\?\.\(\);/);
});

test('managing a pillar adds no domain control to either root', () => {
  // The whole manager is domain-free: it never fetches domains and never sends
  // one, so adding a pillar cannot introduce a Domain field.
  assert.doesNotMatch(MANAGER, /api\.domains\(|domainSlug|\bdomain\b\s*[:=]/i);
  assert.ok(!/Domain selector|<select[^>]*>Domain/.test(MANAGER));
  for (const rootId of ['startup', 'non-profit']) {
    assert.equal(getKyRoot(rootId).requiresDomainSelection, false, rootId);
  }
});

test('the six existing pillars and their questions are left alone by this', () => {
  // This change adds a management surface. It must not carry a second copy of
  // the pillar list, seed a seventh pillar, or touch any question data — every
  // name and count on screen comes from the API.
  for (const name of ['Strategy', 'Revenue', 'Operations', 'Finance', 'People & Culture', 'Governance',
                      'Market Validation', 'Growth Engine']) {
    assert.ok(!MANAGER.includes(`'${name}'`), `'${name}' must not be hard-coded in the manager`);
  }
  // Nothing is created, seeded or migrated by the component itself.
  assert.doesNotMatch(MANAGER, /insertMany|seed|POST \/admin\/know-yourself\/questions/);
});

/* ── 5. Business Type admin can configure the routing ─────────────────── */

test('a business type can be pointed at a different root from the admin UI', () => {
  const businessTypes = src('../src/pages/BusinessTypes.jsx');
  // The form sends kyRoot, and the list shows the root and the domain flag, so
  // "does this type skip domain selection?" is answerable without reading code.
  assert.match(businessTypes, /kyRoot: form\.kyRoot/);
  assert.match(businessTypes, /Know Yourself question root/);
  assert.match(businessTypes, /KY root: /);
});

/* ── 6. The API client passes the root to the server ──────────────────── */

test('the api client scopes requests by root instead of filtering in the browser', () => {
  const client = src('../src/api/client.js');
  assert.match(client, /kyQuestions: \(params = ''\)/);
  assert.match(client, /root=\$\{encodeURIComponent\(obj\.root\)\}/);
  assert.match(client, /kyCategories: \(root, includeInactive = true\) =>/);
  assert.match(client, /root=\$\{encodeURIComponent\(root\)\}/);
  // `includeInactive` is a per-request choice, not a new browser-side filter:
  // the root is still scoped by the server, and omitting it keeps today's
  // behaviour (retired rows included) for every existing caller.
  assert.match(client, /includeInactive=\$\{includeInactive \? 'true' : 'false'\}/);
  assert.match(client, /includeInactive=\$\{inactive\}/);
});

/* ── 7. The Pillar dropdown in the question editor ───────────────────────
   `category` IS the pillar a question is scored under, and the assessment
   builder groups by that persisted value. So it has to be a visible, labelled
   dropdown offering exactly this root's six pillars — and what is chosen has to
   be what is sent and stored. */

const QUESTIONS_PAGE = src('../src/pages/KnowYourselfQuestions.jsx');

test('every question in the editor has a Pillar dropdown', () => {
  // One form serves both create and edit, and both render it.
  assert.match(QUESTIONS_PAGE, /<label[^>]*>\s*Pillar\s*<\/label>/);
  assert.match(QUESTIONS_PAGE, /aria-label="Pillar"/);
  assert.match(QUESTIONS_PAGE, /<option value="" disabled>Select pillar<\/option>/);
  // Offered options are this root's active pillars — the same `categories` the
  // page fetched with `?root=<this root>`, never a full unscoped list.
  assert.match(QUESTIONS_PAGE, /categories\.filter\(\(c\) => c\.active\)\.map/);
  // …and it is required, so a question cannot be saved with no pillar.
  assert.match(QUESTIONS_PAGE, /value=\{form\.category\}[\s\S]{0,220}?required/);
});

test('the chosen pillar is what gets persisted and returned', () => {
  // The dropdown writes `form.category`, the payload sends `category`, and the
  // server resolves it against the question's own root (see the backend test
  // "a question can only be filed under a pillar of its own root"). Nothing
  // hard-codes the pillar in the browser.
  assert.match(QUESTIONS_PAGE, /onChange=\{\(e\) => set\(\{ category: e\.target\.value \}\)\}/);
  assert.match(QUESTIONS_PAGE, /category: form\.category \|\| null/);
  assert.match(QUESTIONS_PAGE, /if \(!payload\.category\)/);
  assert.doesNotMatch(QUESTIONS_PAGE, /category:\s*'(nonprofit|startup|strategic)-/,
    'the editor must not hard-code a pillar assignment');
});

test('an existing question opens with its current pillar selected', () => {
  // The edit path seeds the form from the loaded document, so the dropdown
  // shows the question's stored pillar rather than resetting to blank.
  assert.match(QUESTIONS_PAGE, /category: initial\.category \|\| ''/);
  assert.match(QUESTIONS_PAGE, /value=\{form\.category\}/);
  // The form destructures `categories` as a prop (it does not fetch its own),
  // and BOTH call sites — edit and create — pass the root-scoped list.
  assert.match(QUESTIONS_PAGE, /function KYQuestionForm\(\{[\s\S]{0,400}?categories = \[\]/);
  assert.equal((QUESTIONS_PAGE.match(/categories=\{categories\}/g) || []).length, 2,
    'both the create and the edit form must receive the root-scoped pillars');
  assert.equal((QUESTIONS_PAGE.match(/rootShort=\{kyRoot\.short\}/g) || []).length, 2,
    'both the create and the edit form state which root the pillars belong to');
});

test('the editor names the root its six pillars belong to', () => {
  // A pillar list without the root it belongs to is how a Start-Up question
  // ends up filed under a Services pillar by mistake.
  assert.match(QUESTIONS_PAGE, /The pillar this question is scored under, in the \{rootShort\} result\./);
});

test('the dropdown is a <select>, not a free-text or hard-coded list', () => {
  // A free-text field would let a question be filed under a pillar that does
  // not exist, which the backend then refuses — after the edit looks saved.
  const form = QUESTIONS_PAGE.slice(
    QUESTIONS_PAGE.indexOf('aria-label="Pillar"') - 400,
    QUESTIONS_PAGE.indexOf('aria-label="Pillar"') + 400
  );
  assert.match(form, /<select/);
  assert.doesNotMatch(form, /type="text"/);
  // The six pillar names are never written into the editor itself — they are
  // read from the API, so renaming a pillar in the database renames it here.
  assert.doesNotMatch(QUESTIONS_PAGE, /Mission & Impact/,
    'pillar names must come from the API, not be listed in the editor');
  assert.doesNotMatch(QUESTIONS_PAGE, /'People & Culture'/,
    'pillar names must come from the API, not be listed in the editor');
});

/* ── The per-question Pillar dropdown in the LIST ────────────────────────
   The reported failure was that the dropdown only existed inside the edit
   form, so the question list had 18 Edit buttons and no pillar control at all.
   These assert the list itself renders a working, persisted control. */

test('every question in the list has its own Pillar dropdown', () => {
  // One <select aria-label="Pillar"> in renderCard (the list), separate from the
  // one in KYQuestionForm (the editor). Two in the file, and the list one is
  // the one that lives inside renderCard.
  const card = QUESTIONS_PAGE.slice(QUESTIONS_PAGE.indexOf('const renderCard'));
  assert.match(card, /<select[\s\S]{0,200}aria-label="Pillar"/,
    'the question card must render a Pillar <select>, not only the edit form');
  assert.match(card, /onChange=\{\(e\) => savePillar\(q, e\.target\.value\)\}/);
  assert.match(card, /<label[\s\S]{0,300}>\s*Pillar\s*<\/label>/,
    'the control must be visibly labelled Pillar');
});

test('the list Pillar dropdown offers only this root’s active pillars', () => {
  const card = QUESTIONS_PAGE.slice(QUESTIONS_PAGE.indexOf('const renderCard'));
  // Options come from `selectablePillars`, which is `liveCategories` filtered to
  // active — never a name list, and never another root's pillars.
  assert.match(card, /\{selectablePillars\.map\(\(c\) => \(/);
  assert.doesNotMatch(card, /strategic-direction|sales-market-growth|startup-/,
    'no other root’s or the shared pillar keys may appear in the list control');
  assert.match(QUESTIONS_PAGE, /\.filter\(\(c\) => c\.active !== false\)/);
});

test('moving a question’s pillar writes it to the server and re-reads it', () => {
  // Optimistic local move, then the real PUT, then the server's own answer.
  // A control that only touched React state would pass a click-through and
  // lose the assignment on the next load.
  assert.match(QUESTIONS_PAGE, /const savePillar = async \(q, nextPillar\)/);
  assert.match(QUESTIONS_PAGE, /api\.updateKYQuestion\(`\/admin\/know-yourself\/\$\{q\._id\}`, \{\s*category: nextPillar,/);
  assert.match(QUESTIONS_PAGE, /category: saved\.category/,
    'the row must end up showing the value the server stored');
});

test('retired questions and pillars are hidden unless explicitly asked for', () => {
  // A root that replaced its framework keeps the superseded bank for history.
  // Showing both at once is how a root looks like it has twice its questions.
  assert.match(QUESTIONS_PAGE, /const \[showRetired, setShowRetired\] = useState\(false\)/,
    'retired rows must be hidden by default');
  assert.match(QUESTIONS_PAGE, /showRetired \? questions : questions\.filter\(\(q\) => q\.active !== false\)/);
  assert.match(QUESTIONS_PAGE, /const visible = liveQuestions\.filter/,
    'the list must be built from the live set, not the raw response');
  assert.match(QUESTIONS_PAGE, /Show retired/,
    'hiding retired rows must be an explicit, visible choice');
});

test('a question whose pillar was retired is never silently reassigned', () => {
  // Otherwise the row would show a different pillar than the one stored, which
  // is worse than showing a retired name.
  assert.match(QUESTIONS_PAGE, /\{q\.category && !selectablePillars\.some\(\(c\) => c\.key === q\.category\) && \(/);
  assert.match(QUESTIONS_PAGE, /\(retired\)/);
});

test('the structure summary is counted from the data, never hard-coded', () => {
  assert.match(QUESTIONS_PAGE, /questions: liveQuestions\.filter\(\(q\) => q\.active !== false\)\.length/);
  assert.match(QUESTIONS_PAGE, /pillars: pillarRows\.length/);
  assert.doesNotMatch(QUESTIONS_PAGE, /questions=\{?18\}?|>\s*18\s*questions/,
    'the question count must be counted, not written in');
});

test('a root with no domain step renders no domain control at all', () => {
  // The domain sub-tabs and the domain form field are both behind the same
  // flag, so neither Non-Profit nor Start-Up can show a Domain selector.
  assert.match(QUESTIONS_PAGE, /rootHasDomains \? \[\{ key: 'domain', label: 'Domain-specific' \}\] : \[\]/);
  assert.match(QUESTIONS_PAGE, /\(topTab === 'domain' \|\| rootBtKeys\.includes\(topTab\)\) && \(/);
  assert.match(QUESTIONS_PAGE, /rootHasDomains\s*\? ` · \$\{genericCount\} generic/,
    'the count line must not promise domains on a root that has none');
});

/* ── 4c. Manufacturing and Services are FROZEN ─────────────────────────
   They are the same root and have always had a full Generic/Domain
   editor, a domain picker, and the six Mfg/Services pillars. Nothing in
   this change may remove or alter any of that: the only thing selecting
   one of them does is open the page on a tab that already existed. */

test('selecting Manufacturing or Services is a VIEW scope, not a code path', () => {
  // The prop only seeds the existing tab state. It is not consulted anywhere
  // else, so it cannot alter the bank, the pillars, the domain system, the
  // editor or the save path.
  assert.match(QUESTIONS_PAGE, /useState\(businessType \|\| 'all'\)/,
    'the scope must only choose the initial tab');
  assert.equal((QUESTIONS_PAGE.match(/\bbusinessType\b(?!\s*[,:)])/g) || []).length > 0, true);

  // The full editor is still on by default and still switched ON for this root.
  assert.match(QUESTIONS_PAGE, /showDomainSchema = true,/, 'the default must remain the full editor');
  assert.match(QUESTIONS_PAGE, /rootHasDomains = kyRoot\.requiresDomainSelection/);
  // …and the root flag is true for manufacturing-services, so every Mfg/Services
  // control renders exactly as it did.
  assert.equal(getKyRoot('manufacturing-services').requiresDomainSelection, true);

  // The domain tab, the domain sub-tab strip and the domain count line are all
  // still reachable on this root.
  assert.match(QUESTIONS_PAGE, /\{ key: 'domain', label: 'Domain-specific' \}/);
  assert.match(QUESTIONS_PAGE, /Domain:/);
  assert.match(QUESTIONS_PAGE, /\{rootHasDomains && \(/,
    'the Question Type / Business Type / Domain block is still reachable');
});

test('Manufacturing and Services are not split into separate roots', () => {
  // Both must keep resolving to the ONE root, or their shared bank, shared
  // pillars and shared domain system would come apart.
  assert.equal(KY_ROOTS.length, 3, 'a fourth root must not be invented for this nav change');
  assert.ok(!KY_ROOT_IDS.includes('manufacturing'));
  assert.ok(!KY_ROOT_IDS.includes('services'));
  assert.deepEqual(
    businessTypesForRoot('manufacturing-services', API_TYPES),
    ['service', 'product'],
    'both business types must still belong to the single Mfg & Services root'
  );
  // …and that root's pillars are the existing six, untouched.
  const mfgNav = getKyNavEntry('manufacturing');
  const svcNav = getKyNavEntry('services');
  assert.equal(mfgNav.root, svcNav.root);
  assert.deepEqual([mfgNav.businessType, svcNav.businessType], ['product', 'service']);
});

test('neither participant flow is touched by the admin nav change', () => {
  // This work is Admin-only. The visitor app must not import, reference or
  // otherwise couple itself to the Admin root tables.
  const app = src('../src/App.jsx');
  assert.ok(!app.includes('frontend'), 'App.jsx must not reach into the visitor app');
  const area = src('../src/pages/KYQuestionsArea.jsx');
  assert.ok(!area.includes('5175'), 'the admin area must not target the visitor dev port');
  // The admin change is confined to the admin package.
  const frontendFiles = [
    '../../frontend/src/App.jsx',
    '../../frontend/src/lib/kyFlow.js',
    '../../frontend/src/onboarding.js',
  ];
  for (const f of frontendFiles) {
    assert.ok(!readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), f), 'utf8').includes('KY_NAV_ENTRIES'),
      'the visitor app must not know about the admin nav entries');
  }
});
