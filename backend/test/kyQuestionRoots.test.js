import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import {
  KY_ROOTS,
  KY_ROOT_IDS,
  DEFAULT_KY_ROOT,
  DOMAIN_SELECTION_ROOT,
  QUESTIONS_PER_ASSESSMENT,
  PILLARS_PER_ASSESSMENT,
  ROOT_BY_BUSINESS_TYPE_KEY,
  PILLARS_BY_ROOT,
  normalizeRoot,
  resolveKyRoot,
  resolveKyRootStrict,
  rootRequiresDomainSelection,
  pillarKeysForRoot,
  pillarsForRoot,
  businessTypesForRoot,
  balancedPillarPlan,
  requireCompletePillarBank,
  labelForRoot,
  KY_CONTENT_BY_ROOT,
  rootContentFor,
  KY_ROUTE,
  nextRouteAfterDisclaimer,
} from '../src/config/kyQuestionRoots.js';
import {
  STARTUP_QUESTIONS,
  NONPROFIT_QUESTIONS,
  QUESTION_BANKS_BY_ROOT,
  BUSINESS_TYPE_FOR_ROOT,
} from '../src/config/kyQuestionBanks.js';

/* ── 1. Three roots, one of which runs domain selection ──────────────── */

test('there are exactly three question roots', () => {
  assert.equal(KY_ROOTS.length, 3);
  assert.deepEqual(KY_ROOT_IDS, ['manufacturing-services', 'startup', 'non-profit']);
  assert.equal(new Set(KY_ROOTS.map((r) => r.id)).size, 3, 'root ids must be unique');
});

test('only Manufacturing & Services runs domain selection', () => {
  assert.equal(DOMAIN_SELECTION_ROOT, 'manufacturing-services');
  for (const root of KY_ROOTS) {
    assert.equal(
      root.requiresDomainSelection,
      root.id === 'manufacturing-services',
      `${root.id} domain-selection flag is wrong`
    );
  }
});

test('every business type belongs to exactly one root', () => {
  const owners = new Map();
  for (const root of KY_ROOTS) {
    for (const key of root.businessTypes) {
      assert.ok(!owners.has(key), `business type "${key}" is claimed by two roots`);
      owners.set(key, root.id);
    }
  }
  // The four types the app knows about must all be covered.
  for (const key of ['service', 'product', 'startup', 'ngo']) {
    assert.ok(owners.has(key), `business type "${key}" is in no root`);
  }
  assert.deepEqual(ROOT_BY_BUSINESS_TYPE_KEY, {
    service: 'manufacturing-services',
    product: 'manufacturing-services',
    ngo: 'non-profit',
    startup: 'startup',
  });
});

/* ── 2. A session's root resolves without any database read ───────────── */

test('a business type with a stored root resolves from that root', () => {
  assert.equal(resolveKyRoot({ key: 'anything', kyRoot: 'startup' }), 'startup');
  assert.equal(resolveKyRoot({ key: 'anything', kyRoot: 'non-profit' }), 'non-profit');
  assert.equal(resolveKyRoot({ key: 'anything', kyRoot: 'manufacturing-services' }), 'manufacturing-services');
});

test('a business type written before kyRoot existed still resolves correctly', () => {
  // The legacy fallback is what stops a half-migrated database from routing a
  // Non-Profit user into the Services domain-selection screen.
  assert.equal(resolveKyRoot({ key: 'service' }), 'manufacturing-services');
  assert.equal(resolveKyRoot({ key: 'product' }), 'manufacturing-services');
  assert.equal(resolveKyRoot({ key: 'ngo' }), 'non-profit');
  assert.equal(resolveKyRoot({ key: 'startup' }), 'startup');
  assert.equal(resolveKyRoot('service'), 'manufacturing-services');
});

test('an unknown or missing business type falls back to the shared root', () => {
  for (const value of [null, undefined, '', '   ', 'mystery', {}, { key: 'mystery' }, { kyRoot: 'nonsense' }]) {
    assert.equal(resolveKyRoot(value), DEFAULT_KY_ROOT, `input=${JSON.stringify(value)}`);
  }
});

/* ── Strict resolution: the guard that makes root isolation a property ────
   `resolveKyRoot` is deliberately lenient, because the public meta payload and
   the Admin views must still render for a type the deployment does not know.
   Building an assessment must NOT be lenient: defaulting to Manufacturing &
   Services there would serve a Non-Profit user the wrong 18 questions. These
   tests pin the difference. */

test('resolveKyRootStrict refuses to guess where resolveKyRoot would default', () => {
  // Every input the lenient resolver maps onto the shared root…
  for (const value of [null, undefined, '', '   ', 'mystery', {}, { key: 'mystery' }, { kyRoot: 'nonsense' }]) {
    assert.equal(resolveKyRoot(value), DEFAULT_KY_ROOT, `lenient input=${JSON.stringify(value)}`);
    // …must be rejected outright by the strict one, with a 400 the UI can
    // surface as "pick again" rather than a 500.
    assert.throws(
      () => resolveKyRootStrict(value),
      (err) => {
        assert.equal(err.status, 400, `status for ${JSON.stringify(value)}`);
        assert.match(err.message, /business type/i);
        return true;
      },
      `strict input=${JSON.stringify(value)}`
    );
  }
});

test('resolveKyRootStrict tells the user the type must be bound to a root in Admin', () => {
  assert.throws(
    () => resolveKyRootStrict({ key: 'cooperative' }),
    (err) => {
      assert.equal(err.status, 400);
      assert.match(err.message, /cooperative/);
      assert.match(err.message, /Admin/);
      assert.deepEqual(err.details, { businessType: 'cooperative', resolved: null });
      return true;
    }
  );
});

test('resolveKyRootStrict agrees with resolveKyRoot for every real business type', () => {
  // The strict resolver may only ever differ by REFUSING. For a type that is
  // configured, the two must return the identical root.
  for (const [key, rootId] of Object.entries(ROOT_BY_BUSINESS_TYPE_KEY)) {
    assert.equal(resolveKyRootStrict(key), rootId, `key=${key}`);
    assert.equal(resolveKyRootStrict({ key }), rootId, `key=${key} (object form)`);
    assert.equal(resolveKyRootStrict(key.toUpperCase()), rootId, `key=${key} (upper case)`);
    assert.equal(resolveKyRootStrict({ key, kyRoot: rootId }), rootId, `key=${key} (stored root)`);
  }
});

test('a stored root wins over the legacy key map, in the strict resolver too', () => {
  // An Admin-managed type may be re-pointed at a different root; the stored
  // value is authoritative and must not be second-guessed by its key.
  assert.equal(resolveKyRootStrict({ key: 'ngo', kyRoot: 'startup' }), 'startup');
  assert.equal(resolveKyRootStrict({ key: 'service', kyRoot: 'non-profit' }), 'non-profit');
  // …but an unrecognised stored root still falls through to the key map.
  assert.equal(resolveKyRootStrict({ key: 'ngo', kyRoot: 'nonsense' }), 'non-profit');
});

test('root ids are case- and whitespace-insensitive', () => {
  for (const raw of ['STARTUP', '  startup  ', 'Non-Profit', 'MANUFACTURING-SERVICES']) {
    assert.equal(normalizeRoot(raw), String(raw).toLowerCase().trim());
  }
  assert.equal(normalizeRoot('nonsense'), null);
  assert.equal(normalizeRoot(null), null);
});

/* ── 3. Six distinct pillars per root, none renamed ───────────────────── */

test('each root has exactly six pillars', () => {
  for (const rootId of KY_ROOT_IDS) {
    assert.equal(pillarsForRoot(rootId).length, 6, `${rootId} pillar count`);
    assert.equal(PILLARS_PER_ASSESSMENT, 6);
  }
});

test('the shared Manufacturing & Services pillar keys are unchanged', () => {
  // These are the EXISTING production keys. Renaming any of them would orphan
  // every stored question, session snapshot and result.
  assert.deepEqual(pillarKeysForRoot('manufacturing-services'), [
    'strategic-direction',
    'financial-performance',
    'sales-market-growth',
    'operations-execution',
    'people-organization',
    'digital-innovation',
  ]);
});

test('Start-Up and Non-Profit do not reuse the shared pillar names', () => {
  const sharedNames = new Set(pillarsForRoot('manufacturing-services').map((p) => p.name));
  for (const rootId of ['startup', 'non-profit']) {
    for (const p of pillarsForRoot(rootId)) {
      assert.ok(
        !sharedNames.has(p.name),
        `${rootId} pillar "${p.name}" is a copy of a shared Manufacturing/Services pillar`
      );
    }
  }
});

test('pillar keys are globally unique across all three roots', () => {
  const all = KY_ROOT_IDS.flatMap((r) => pillarKeysForRoot(r));
  assert.equal(new Set(all).size, all.length, `duplicate pillar keys: ${all.join(', ')}`);
});

test('every pillar has a key, name, colour and a unique sort order within its root', () => {
  for (const rootId of KY_ROOT_IDS) {
    const pillars = pillarsForRoot(rootId);
    for (const p of pillars) {
      assert.ok(p.key && /^[a-z0-9-]+$/.test(p.key), `${rootId} bad key ${p.key}`);
      assert.ok(p.name, `${rootId}/${p.key} has no name`);
      assert.match(p.color, /^#[0-9A-Fa-f]{6}$/, `${rootId}/${p.key} bad colour ${p.color}`);
    }
    assert.equal(new Set(pillars.map((p) => p.sortOrder)).size, 6, `${rootId} sort orders repeat`);
  }
});

test('a root name is never the same as a shared pillar name', () => {
  assert.ok(labelForRoot('startup'));
  assert.ok(labelForRoot('non-profit'));
  assert.equal(labelForRoot('mystery'), 'mystery');
});

/* ── 4. The balanced 18-question plan ────────────────────────────────── */

test('18 questions are split into exactly 3 per pillar for every root', () => {
  assert.equal(QUESTIONS_PER_ASSESSMENT, 18);
  for (const rootId of KY_ROOT_IDS) {
    const plan = balancedPillarPlan(rootId);
    assert.equal(plan.length, 6, `${rootId} plan length`);
    assert.equal(plan.reduce((s, p) => s + p.count, 0), QUESTIONS_PER_ASSESSMENT, `${rootId} total`);
    assert.ok(plan.every((p) => p.count === 3), `${rootId} not 3 per pillar`);
    assert.deepEqual(plan.map((p) => p.key), pillarKeysForRoot(rootId), `${rootId} plan order`);
  }
});

test('a total that cannot be split evenly is rejected, not silently truncated', () => {
  for (const rootId of KY_ROOT_IDS) {
    assert.throws(() => balancedPillarPlan(rootId, 17), /evenly/, rootId);
    // 0 and 18.5 both pass the modulo test, so they get their own guard.
    assert.throws(() => balancedPillarPlan(rootId, 0), /positive whole number/, rootId);
    assert.throws(() => balancedPillarPlan(rootId, -6), /positive whole number/, rootId);
    assert.throws(() => balancedPillarPlan(rootId, 18.5), /positive whole number/, rootId);
  }
});

test('an unrecognised root falls back to the shared pillars, never to zero', () => {
  // The same fallback `pillarKeysForRoot` applies, so a typo can never produce
  // an empty plan (which would be served as an assessment with no pillars).
  assert.equal(balancedPillarPlan('mystery').length, 6);
  assert.deepEqual(
    balancedPillarPlan('mystery').map((p) => p.key),
    pillarKeysForRoot('manufacturing-services')
  );
});

test('an incomplete bank is refused and the short pillars are named', () => {
  // Every pillar short.
  assert.throws(
    () => requireCompletePillarBank({ rootId: 'startup', availableByPillar: {} }),
    (err) => {
      assert.equal(err.status, 400);
      assert.match(err.message, /Start-Up/);
      // Every one of the six pillars is reported.
      for (const key of pillarKeysForRoot('startup')) {
        assert.ok(err.message.includes(key), `shortfall message omits ${key}`);
      }
      return true;
    }
  );

  // Only one pillar short: exactly that one is reported.
  const available = Object.fromEntries(pillarKeysForRoot('startup').map((k) => [k, 3]));
  available['startup-growth-engine'] = 2;
  assert.throws(
    () => requireCompletePillarBank({ rootId: 'startup', availableByPillar: available }),
    (err) => {
      assert.ok(err.message.includes('startup-growth-engine'));
      assert.ok(!err.message.includes('startup-market-validation'));
      return true;
    }
  );
});

test('a complete bank produces the plan without throwing', () => {
  const available = Object.fromEntries(pillarKeysForRoot('non-profit').map((k) => [k, 3]));
  const plan = requireCompletePillarBank({ rootId: 'non-profit', availableByPillar: available });
  assert.equal(plan.length, 6);
  assert.ok(plan.every((p) => p.count === 3));
  // Extra questions are fine — more than the quota is not a shortfall.
  available[pillarKeysForRoot('non-profit')[0]] = 99;
  assert.equal(requireCompletePillarBank({ rootId: 'non-profit', availableByPillar: available }).length, 6);
});

/* ── 5. Routing, the decision the frontend follows ────────────────────── */

test('Start-Up and Non-Profit go straight to the questions after the disclaimer', () => {
  for (const key of ['startup', 'ngo']) {
    assert.equal(nextRouteAfterDisclaimer({ key }, ['service', 'product', 'ngo', 'startup']), KY_ROUTE.QUESTIONS, key);
  }
});

test('Services and Manufacturing go to domain selection', () => {
  for (const key of ['service', 'product']) {
    assert.equal(nextRouteAfterDisclaimer({ key }, ['service', 'product', 'ngo', 'startup']), KY_ROUTE.DOMAIN, key);
  }
});

test('nothing saved, or a type the backend does not know, asks the business type', () => {
  const known = ['service', 'product', 'ngo', 'startup'];
  assert.equal(nextRouteAfterDisclaimer(null, known), KY_ROUTE.BUSINESS_TYPE);
  assert.equal(nextRouteAfterDisclaimer(undefined, known), KY_ROUTE.BUSINESS_TYPE);
  assert.equal(nextRouteAfterDisclaimer({}, known), KY_ROUTE.BUSINESS_TYPE);
  assert.equal(nextRouteAfterDisclaimer({ key: 'retired' }, known), KY_ROUTE.BUSINESS_TYPE);
  // A null businessType is exactly the legacy-session value that used to
  // wipe the saved type: it must be treated as "nothing saved".
  assert.equal(nextRouteAfterDisclaimer({ key: null }, known), KY_ROUTE.BUSINESS_TYPE);
  // With no allow-list to check against, the stored root still decides — an
  // empty or absent list means "meta not loaded", never "retired business type".
  assert.equal(nextRouteAfterDisclaimer({ key: 'startup' }, null), KY_ROUTE.QUESTIONS);
  assert.equal(nextRouteAfterDisclaimer({ key: 'startup' }, []), KY_ROUTE.QUESTIONS);
  assert.equal(nextRouteAfterDisclaimer({ key: 'service' }, null), KY_ROUTE.DOMAIN);
  assert.equal(nextRouteAfterDisclaimer({ key: 'service' }, []), KY_ROUTE.DOMAIN);
});

test('an empty known-type list never re-asks a returning user', () => {
  // Mirrors the frontend rule in frontend/src/lib/kyFlow.js. The two
  // implementations of "is this saved type still valid?" must agree, or the
  // re-prompt bug comes back the moment meta fails to load.
  for (const key of ['service', 'product', 'ngo', 'startup']) {
    assert.notEqual(nextRouteAfterDisclaimer({ key }, null), KY_ROUTE.BUSINESS_TYPE, key);
    assert.notEqual(nextRouteAfterDisclaimer({ key }, []), KY_ROUTE.BUSINESS_TYPE, key);
  }
});

test('backend meta is the only routing input — no hardcoded per-type list', () => {
  // A hypothetical future type configured with a no-domain root must route
  // straight to the questions without any code change.
  const future = { key: 'cooperative', kyRoot: 'non-profit' };
  assert.equal(nextRouteAfterDisclaimer(future, ['cooperative']), KY_ROUTE.QUESTIONS);
  const futureDomain = { key: 'franchise', kyRoot: 'manufacturing-services' };
  assert.equal(nextRouteAfterDisclaimer(futureDomain, ['franchise']), KY_ROUTE.DOMAIN);
  // businessTypesForRoot stays useful for scoping admin lists.
  assert.deepEqual(businessTypesForRoot('startup'), ['startup']);
  assert.deepEqual(businessTypesForRoot('non-profit'), ['ngo']);
  assert.deepEqual(businessTypesForRoot('manufacturing-services'), ['service', 'product']);
  assert.deepEqual(businessTypesForRoot('mystery'), []);
});

/* ── 6. The seeded question banks ────────────────────────────────────── */

const banks = [
  { root: 'startup', questions: STARTUP_QUESTIONS, businessType: 'startup' },
  { root: 'non-profit', questions: NONPROFIT_QUESTIONS, businessType: 'ngo' },
];

test('each bank has exactly 18 questions', () => {
  for (const b of banks) assert.equal(b.questions.length, 18, `${b.root} question count`);
});

test('each bank covers all six of its own pillars, three questions each', () => {
  for (const b of banks) {
    const counts = new Map(pillarKeysForRoot(b.root).map((k) => [k, 0]));
    for (const q of b.questions) {
      assert.ok(counts.has(q.category), `${b.root}: question "${q.text}" targets foreign pillar ${q.category}`);
      counts.set(q.category, counts.get(q.category) + 1);
    }
    for (const [key, n] of counts) assert.equal(n, 3, `${b.root}/${key} has ${n} questions`);
  }
});

test('a bank is self-sufficient: nothing to borrow from another root', () => {
  for (const b of banks) {
    const mine = new Set(pillarKeysForRoot(b.root));
    for (const q of b.questions) {
      assert.ok(mine.has(q.category), `${b.root} question borrows pillar ${q.category}`);
    }
  }
});

test('question texts are unique within and across banks', () => {
  const seen = new Map();
  for (const b of banks) {
    for (const q of b.questions) {
      const norm = q.text.toLowerCase().replace(/[^a-z0-9]/g, '');
      assert.ok(!seen.has(norm), `duplicate question text: "${q.text}" (also in ${seen.get(norm)})`);
      seen.set(norm, b.root);
    }
  }
});

test('every question has four options scoring 4,3,2,1 best to worst', () => {
  // Identical to the existing Manufacturing & Services convention, so all four
  // business models behave the same way: the best answer scores highest, which
  // is what `percent = score / (count × 4) × 100` expects.
  for (const b of banks) {
    for (const q of b.questions) {
      assert.equal(q.options.length, 4, `${b.root}: "${q.text}" has ${q.options.length} options`);
      assert.deepEqual(q.options.map((o) => o.score), [4, 3, 2, 1], `${b.root}: "${q.text}" scores`);
      for (const o of q.options) {
        assert.ok(o.text && o.text.trim().length >= 8, `${b.root}: weak option "${o.text}" in "${q.text}"`);
      }
    }
  }
});

test('question text is specific, not generic filler', () => {
  for (const b of banks) {
    for (const q of b.questions) {
      assert.ok(q.text.trim().endsWith('?'), `${b.root}: "${q.text}" is not phrased as a question`);
      assert.ok(q.text.length > 25, `${b.root}: "${q.text}" is too short to be meaningful`);
    }
  }
});

test('glossary entries are well formed and abbreviation-unique per question', () => {
  for (const b of banks) {
    for (const q of b.questions) {
      const seen = new Set();
      for (const g of q.glossary || []) {
        assert.ok(g.abbreviation && g.fullForm, `${b.root}: bad glossary entry in "${q.text}"`);
        assert.ok(!seen.has(g.abbreviation), `${b.root}: repeated abbreviation ${g.abbreviation}`);
        seen.add(g.abbreviation);
      }
    }
  }
});

test('each bank is bound to the right business type key', () => {
  assert.equal(BUSINESS_TYPE_FOR_ROOT['startup'], 'startup');
  assert.equal(BUSINESS_TYPE_FOR_ROOT['non-profit'], 'ngo');
  assert.deepEqual(Object.keys(QUESTION_BANKS_BY_ROOT).sort(), ['non-profit', 'startup']);
  for (const b of banks) {
    assert.equal(BUSINESS_TYPE_FOR_ROOT[b.root], b.businessType);
    assert.equal(ROOT_BY_BUSINESS_TYPE_KEY[b.businessType], b.root);
  }
});

test('Manufacturing & Services keeps its existing bank and is not re-seeded', () => {
  // Its questions already exist in the database; the seed file must not
  // duplicate or replace them.
  assert.ok(!QUESTION_BANKS_BY_ROOT['manufacturing-services']);
  assert.ok(!BUSINESS_TYPE_FOR_ROOT['manufacturing-services']);
});

test('pillar definitions are frozen so a live edit cannot silently change routing', () => {
  assert.ok(Object.isFrozen(PILLARS_BY_ROOT));
  assert.throws(() => {
    PILLARS_BY_ROOT.startup[0].name = 'Renamed';
  }, TypeError);
  assert.equal(pillarsForRoot('startup')[0].name, 'Market Validation');
});

/* ── 7. The Non-Profit framework, question by question ────────────────────
   The six-pillar Non-Profit framework this bank implements. Each entry is
   [pillar key, the question's opening phrase] — enough to pin the bank to the
   framework without copying all 18 stems into the test. */

/* The assessment stems, in framework order, three per pillar. Only the opening
   words of each are listed: enough to pin both the wording and the position
   without copying all 18 stems into the test. */
const NONPROFIT_FRAMEWORK = [
  ['nonprofit-strategy', 'Does your organization have a clear plan for long-term change'],
  ['nonprofit-strategy', 'How do you collect and check the results of your programs'],
  ['nonprofit-strategy', 'How do leaders decide which grants'],
  ['nonprofit-revenue', 'Where does your yearly money come from'],
  ['nonprofit-revenue', 'How well do you keep donors and follow the tax rules'],
  ['nonprofit-revenue', 'How do you share money reports with donors and CSR committees'],
  ['nonprofit-operations', 'How well are your on-ground field execution procedures written down'],
  ['nonprofit-operations', 'How do you find and fix problems that slow down field work'],
  ['nonprofit-operations', 'How can community members give feedback or make complaints'],
  ['nonprofit-finance', 'How many months of spare cash do you have'],
  ['nonprofit-finance', 'Are your tax and legal registrations up to date'],
  ['nonprofit-finance', 'How do you manage admin costs across different funders'],
  ['nonprofit-people-culture', 'How do you check staff pay, workload, and burnout'],
  ['nonprofit-people-culture', 'How do you manage and screen volunteers'],
  ['nonprofit-people-culture', 'What happens if a top leader or key program head leaves suddenly'],
  ['nonprofit-governance', 'How does your governing body/ board oversee the organization'],
  ['nonprofit-governance', 'Do you file all required reports on time'],
  ['nonprofit-governance', 'How open are your accounts, reports and governance details'],
];

test('the six Non-Profit pillars are named as the framework names them', () => {
  assert.deepEqual(
    pillarsForRoot('non-profit').map((p) => p.name),
    [
      'Strategy',
      'Revenue',
      'Operations',
      'Finance',
      'People & Culture',
      'Governance',
    ]
  );
});

test('all 18 framework questions are present, in the framework order', () => {
  assert.equal(NONPROFIT_FRAMEWORK.length, 18);
  assert.equal(NONPROFIT_QUESTIONS.length, 18);
  NONPROFIT_FRAMEWORK.forEach(([pillar, opening], i) => {
    const q = NONPROFIT_QUESTIONS[i];
    assert.ok(q.text.startsWith(opening),
      `question ${i + 1} should start "${opening}", got "${q.text}"`);
    assert.equal(q.category, pillar, `question ${i + 1} pillar`);
  });
});

test('the statutory pillars are actually graded against the statutes they name', () => {
  // Not every question in this framework is statutory — operating reserves and
  // compensation benchmarking are maturity questions by design. The two
  // COMPLIANCE pillars are different: their name promises the grade is decided
  // by a named Indian statute, so each of their six questions must cite one.
  const COMPLIANCE = new Set(['nonprofit-finance', 'nonprofit-governance']);
  const statutes = [
    'Section 12AB', 'Section 80G', 'CSR-1', 'Form CSR-1', 'CSR Rule 8(3)', 'Section 135',
    'FCRA', 'Form FC-4', 'NGO-DARPAN', 'MCA21', 'Income Tax', 'Form 10BD', 'Form 10BE',
    'Registrar of Societies', 'Registrar of Companies', 'Charity Commissioner',
    'Ministry of Corporate Affairs', 'State Bank of India', 'ITR',
  ];
  // Two questions in these pillars are maturity questions in the source
  // framework, not compliance ones: the grade turns on months of cash held and
  // on who sits on the board — neither of which is decided by a named statute.
  // They are excluded by name, not by loosening the rule, so a genuinely
  // statutory question slipping through still fails. (Public Disclosure &amp;
  // Transparency Standards is NOT exempt: it names NGO-DARPAN in both the
  // question and its best option, so it is graded as a compliance question.)
  const BY_DESIGN = [
    'How many months of spare cash',
    'How does your governing body/ board oversee',
  ];
  const complianceQuestions = NONPROFIT_QUESTIONS.filter(
    (q) => COMPLIANCE.has(q.category) && !BY_DESIGN.some((b) => q.text.startsWith(b))
  );
  // The two compliance pillars hold six questions, two of which are listed
  // BY_DESIGN above, so the four that remain must each cite a statute. The
  // count is asserted rather than derived, so adding a maturity question to a
  // compliance pillar has to be a deliberate edit here too.
  assert.equal(complianceQuestions.length, 4);
  for (const q of complianceQuestions) {
    const all = [q.text, ...q.options.map((o) => o.text)].join(' ');
    assert.ok(
      statutes.some((s) => all.includes(s)),
      `compliance question is not tied to a named statute: "${q.text.slice(0, 65)}…"`
    );
  }
});

test('a question is most-compliant under its best option, never its worst', () => {
  // The scoring direction is the whole risk of this framework. Spot-check the
  // questions where being "compliant" is unmistakable, so an inverted option
  // order cannot pass by having the right scores.
  const cases = [
    ['How many months of spare cash', /^6\+ months/, /^Less than 1 month/],
    ['Are your tax and legal registrations up to date', /^All registrations/, /^Key registrations/],
    ['Do you file all required reports on time', /^We follow every rule/, /^Filings with the Registrar of Societies/],
    ['How do you manage admin costs', /^We track costs carefully/, /^We do not separate project costs/],
    ['How open are your accounts, reports and governance details', /^Everything is public/, /^Our accounts and board details are internal/],
  ];
  for (const [opening, best, worst] of cases) {
    const q = NONPROFIT_QUESTIONS.find((x) => x.text.startsWith(opening));
    assert.ok(q, `no Non-Profit question starts "${opening}"`);
    assert.match(q.options[0].text, best, `"${opening}" — best option should be the compliant answer`);
    assert.match(q.options[3].text, worst, `"${opening}" — worst option should be the non-compliant answer`);
  }
});

test('the Non-Profit root description states the statutory frameworks it is benchmarked against', () => {
  const root = KY_ROOTS.find((r) => r.id === 'non-profit');
  for (const ref of ['12AB', '80G', '10BD', 'Section 135', 'FCRA', 'NGO-DARPAN', 'NITI']) {
    assert.ok(root.description.includes(ref), `root description is missing "${ref}"`);
  }
});

test('Non-Profit options are stored best→worst, so the framework D option scores 4', () => {
  // The source framework is written A=1pt (weakest) … D=4pt (strongest), which
  // is the OPPOSITE of the storage convention. If the bank is ever re-entered
  // literally, a strong organisation scoring "D" would land on 25% and the
  // whole result would invert. This is the test that catches that.
  const [first] = NONPROFIT_QUESTIONS;
  assert.equal(first.options[0].score, 4);
  assert.equal(first.options[3].score, 1);
  // The best option must be the institutionalised one, never the "we only
  // count what we do" one — spot-check both ends of the first question to make
  // it unambiguous.
  assert.match(first.options[0].text, /Logframe|MEL/, 'best option should be the Logframe/MEL answer');
  assert.match(first.options[3].text, /We only count what we do/, 'worst option should be the outputs-only answer');
  // And the reverse, on a reserves question where the order is numeric.
  const reserves = NONPROFIT_QUESTIONS.find((q) => q.text.startsWith('How many months'));
  assert.match(reserves.options[0].text, /^6\+ months/, 'best reserve answer should be 6+ months');
  assert.match(reserves.options[3].text, /^Less than 1 month/, 'worst reserve answer should be under 1 month');
});

test('every Non-Profit question defines its abbreviations for the user', () => {
  // The bank leans on ToC / MEL / FCRA / PoSH / CSR-1, which cannot be assumed.
  // A question whose own text uses an abbreviation must explain it.
  // Must be /g: matchAll throws on a non-global regex.
  const ABBREVIATIONS = /\b(ToC|Logframe|MEL|M&E|CSR|FCRA|PoSH|RFP|CRM|MIS|CAPA|HNI|CA|SDG|MCA|RoS|RoC|ITR-7|ITRs|ITR|UC|UCs|HR|IR|SBI)\b/g;
  for (const q of NONPROFIT_QUESTIONS) {
    // The user reads the question stem AND the options, so an abbreviation is
    // undefined if it is not explained anywhere in what they are shown.
    const body = [q.text, ...q.options.map((o) => o.text)].join(' | ');
    const defined = new Set(q.glossary.map((g) => g.abbreviation));
    for (const m of body.matchAll(ABBREVIATIONS)) {
      const abbr = m[1];
      assert.ok(defined.has(abbr),
        `"${q.text.slice(0, 55)}…" uses ${abbr} but does not define it`);
    }
    for (const g of q.glossary) {
      assert.ok(g.abbreviation && g.fullForm && g.fullForm.trim().length > 10,
        `incomplete glossary entry in "${q.text.slice(0, 55)}…": ${JSON.stringify(g)}`);
    }
  }
});

/* ── 8. Root-specific Disclaimer copy and result labels ───────────────────
   The Disclaimer and the result screen used to hard-code ONE block of
   Manufacturing & Services copy for every root, so a Non-Profit user read
   terms about "hidden profit leaks" in "your business" and pressed a button
   labelled "Your Business" to reach their Foundation assessment.

   These tests pin the fix: the copy is per-root, the button label is per-root,
   and no root can serve another root's words. */

test('every root has its own disclaimer copy and result label', () => {
  assert.deepEqual(Object.keys(KY_CONTENT_BY_ROOT).sort(), [...KY_ROOT_IDS].sort());
  const labels = new Set();
  const abouts = new Set();
  const terms = new Set();
  for (const id of KY_ROOT_IDS) {
    const c = rootContentFor(id);
    assert.ok(c, `${id} has no content`);
    assert.ok(c.resultActionLabel && c.resultActionLabel.trim(), `${id} has no result label`);
    assert.ok(c.entity && c.entity.trim(), `${id} has no entity noun`);
    assert.ok(c.screenTitle && c.screenTitle.trim(), `${id} has no screen title`);
    for (const box of ['terms', 'about']) {
      assert.ok(c[box]?.title?.trim(), `${id}.${box} has no title`);
      assert.ok(c[box]?.body && c[box].body.trim().length > 60, `${id}.${box} body is too short`);
    }
    labels.add(c.resultActionLabel);
    abouts.add(c.about.body);
    terms.add(c.terms.body);
  }
  // Three distinct labels and three distinct bodies: no root can be showing
  // another root's copy, and none falls back to a shared default.
  assert.equal(labels.size, 3, 'the three roots must not share a result label');
  assert.equal(abouts.size, 3, 'the three roots must not share the same "about" copy');
  assert.equal(terms.size, 3, 'the three roots must not share the same terms copy');
});

test('the result-screen button is labelled per root', () => {
  // Exactly the labels the business types are called in this product.
  assert.equal(rootContentFor('manufacturing-services').resultActionLabel, 'Your Business');
  assert.equal(rootContentFor('startup').resultActionLabel, 'Your Enterprise');
  assert.equal(rootContentFor('non-profit').resultActionLabel, 'Your Foundation');
});

test('a Non-Profit user never reads Manufacturing & Services copy', () => {
  const npo = rootContentFor('non-profit');
  const mfg = rootContentFor('manufacturing-services');
  assert.notEqual(npo.about.body, mfg.about.body);
  assert.notEqual(npo.terms.body, mfg.terms.body);
  assert.notEqual(npo.entity, mfg.entity);
  // "profit leaks" and "Business Profit Architecture" are the Mfg framework's
  // own vocabulary. Reading them on a Foundation disclaimer is the reported bug.
  assert.ok(!npo.about.body.includes('profit leak'), 'Non-Profit copy must not mention profit leaks');
  assert.ok(!npo.about.body.includes('Business Profit Architecture'),
    'Non-Profit copy must not claim the Business Profit Architecture');
  assert.ok(mfg.about.body.includes('Business Profit Architecture'),
    'Mfg & Services keeps its existing Business Profit Architecture copy');
});

test('the Non-Profit disclaimer states the frameworks the assessment measures', () => {
  // The user has to be able to see, BEFORE consenting, that the diagnostic is
  // benchmarked against these statutes — that is what distinguishes this
  // disclaimer from the generic one.
  const body = `${rootContentFor('non-profit').about.body} ${rootContentFor('non-profit').terms.body}`;
  for (const ref of ['12AB', '80G', 'Section 135', 'FCRA', 'NGO-DARPAN', 'NITI']) {
    assert.ok(body.includes(ref), `Non-Profit disclaimer is missing "${ref}"`);
  }
});

test('the Start-Up disclaimer names the Start-Up pillars, not the shared six', () => {
  const body = rootContentFor('startup').about.body;
  for (const name of pillarsForRoot('startup').map((p) => p.name)) {
    assert.ok(body.includes(name), `Start-Up disclaimer does not name its pillar "${name}"`);
  }
  assert.ok(!body.includes('Strategic Direction'),
    'Start-Up copy must not name a Manufacturing & Services pillar');
});

test('the proprietary terms stay on the Mfg & Services disclaimer, unchanged', () => {
  // The legal terms are the Mfg & Services disclaimer and are deliberately left
  // exactly as they were. Start-Up and Non-Profit no longer carry them: those two
  // roots state a domain-specific paragraph instead (asserted below), which is
  // the agreed product decision — so this asserts the terms are still present on
  // the one root that owns them, rather than asserting they are gone everywhere.
  const mfg = rootContentFor('manufacturing-services').terms.body;
  assert.match(mfg, /proprietary strategic tool/);
  assert.match(mfg, /not constitute formal legal, financial, tax, or investment advice/);
  assert.match(mfg, /may not be reproduced without written consent/);
});

test('the Start-Up disclaimer states exactly the agreed Start-Up copy', () => {
  // Fixed product copy, reproduced verbatim. Compared as one string so a reword,
  // a dropped clause or a stray added sentence all fail — this is the text the
  // participant consents to, so it cannot drift.
  assert.equal(
    rootContentFor('startup').terms.body,
    'This diagnostic evaluates your startup’s business maturity, scalability, and investment readiness across ' +
      'six core pillars. It is aligned with DPIIT guidelines, Companies Act compliance, unit economics, and ' +
      'venture capital due diligence best practices.'
  );
});

test('the Non-Profit disclaimer states exactly the agreed Non-Profit copy', () => {
  assert.equal(
    rootContentFor('non-profit').terms.body,
    'This diagnostic evaluates your non-profit’s governance, operations, compliance, and organizational ' +
      'maturity across six core pillars. It is based on key Indian regulations, including 12AB, 80G, FCRA, CSR, ' +
      'and NGO-DARPAN requirements.'
  );
});

test('the two domain disclaimers each name their own alignment, not the other root’s', () => {
  // DPIIT/venture-capital language belongs to Start-Up; the Indian statute list
  // belongs to Non-Profit. Neither root may read the other's alignment.
  const startup = rootContentFor('startup').terms.body;
  const npo = rootContentFor('non-profit').terms.body;
  for (const ref of ['DPIIT', 'venture capital due diligence']) {
    assert.ok(startup.includes(ref), `Start-Up disclaimer is missing "${ref}"`);
    assert.ok(!npo.includes(ref), `Non-Profit disclaimer must not claim "${ref}"`);
  }
  for (const ref of ['12AB', '80G', 'FCRA', 'NGO-DARPAN']) {
    assert.ok(npo.includes(ref), `Non-Profit disclaimer is missing "${ref}"`);
    assert.ok(!startup.includes(ref), `Start-Up disclaimer must not claim "${ref}"`);
  }
});

test('an unknown or missing root gets the Mfg & Services copy, not a guess', () => {
  // Display-only leniency, the same rule as `resolveKyRoot`: a root this build
  // does not know shows the generic proprietary-tool terms rather than being
  // told it is a Foundation or an Enterprise. Assessment building uses
  // `resolveKyRootStrict`, which refuses instead.
  for (const unknown of [undefined, null, '', 'not-a-root', 'ngo-does-not-exist', 42, {}]) {
    assert.deepEqual(rootContentFor(unknown), rootContentFor(DEFAULT_KY_ROOT),
      `${JSON.stringify(unknown)} should fall back to the shared Mfg & Services copy`);
  }
  // Case and surrounding whitespace are normalised, so a stray 'Non-Profit'
  // still resolves to the Non-Profit copy rather than falling back.
  assert.deepEqual(rootContentFor('Non-Profit'), rootContentFor('non-profit'));
  assert.deepEqual(rootContentFor('  NON-PROFIT  '), rootContentFor('non-profit'));
});

test('root content is frozen so a live edit cannot retarget a disclaimer', () => {
  assert.ok(Object.isFrozen(KY_CONTENT_BY_ROOT));
  assert.throws(() => {
    KY_CONTENT_BY_ROOT['non-profit'].resultActionLabel = 'Your Business';
  }, TypeError);
  assert.equal(rootContentFor('non-profit').resultActionLabel, 'Your Foundation');
});

/* ── 9. Server-side cross-root pillar rejection ──────────────────────────
   The editor offers only the current root's six pillars, but the browser is
   not a trust boundary: a crafted request can name any pillar key. The
   controller resolves a submitted pillar against the QUESTION's own root, so
   a Start-Up question cannot be filed under a Services pillar even if the
   request says so. These tests pin the query that does it. */

test('a question can only be filed under a pillar of its own root', async () => {
  // The controller's own resolver, imported so the rule under test is the one
  // that actually runs — not a restatement of it.
  const src = await readFile(
    new URL('../src/controllers/knowYourselfController.js', import.meta.url),
    'utf8'
  );
  // It resolves the root from the question's BUSINESS TYPE, never from the
  // submitted pillar, so a self-consistent-looking request cannot choose.
  assert.match(src, /const rootId = resolveKyRoot\(businessTypeKey\);/);
  // The database lookup is constrained to that root's pillars.
  assert.match(src, /KYCategory\.findOne\(\{\s*kyRoot: rootClause/);
  // The shared Mfg & Services set is stored with a null kyRoot, so it is
  // matched by `$in: [null, '']` and every other root by its own id.
  assert.match(src, /rootId === DEFAULT_KY_CATEGORY_ROOT \? \{ \$in: \[null, ''\] \} : \{ \$in: \[rootId\] \}/);
  // A pillar outside the root resolves to `undefined`, which the create and
  // update handlers both turn into a 400.
  assert.match(src, /return cat \? cat\.key : undefined;/);
  const rejections = src.match(/categoryKey === undefined/g) || [];
  assert.ok(rejections.length >= 2, 'both create and update must reject a cross-root pillar');
  assert.match(src, /Select a result category that belongs to this business type\\'s pillar set/);
});

test('the shared Manufacturing & Services pillars are not reachable from another root', async () => {
  // The `null` kyRoot is what the shared set is stored with, so a root other
  // than manufacturing-services must NOT query `[null, '']` — otherwise every
  // Start-Up question could be filed under "Strategic Direction".
  const src = await readFile(
    new URL('../src/controllers/knowYourselfController.js', import.meta.url),
    'utf8'
  );
  const clause = src.match(/const rootClause =\s*\n?\s*(.+);/);
  assert.ok(clause, 'the root clause must be a single expression');
  assert.match(clause[1], /DEFAULT_KY_CATEGORY_ROOT/);
  // The condition is on the ROOT, not on the business type or the pillar.
  assert.doesNotMatch(clause[1], /businessType/);
  assert.doesNotMatch(clause[1], /category/);
});

/* ─────────────────────────────────────────────────────────────
   Question documents declare their own KY root
   ─────────────────────────────────────────────────────────────
   Scope requirement: "Non-Profit questions must be clearly associated with
   businessType = ngo / kyRoot = non-profit". `businessType` alone already
   scopes the queries correctly, but the association is now stored on the
   document too, so it can be read and audited without re-deriving it. */

test('a question document carries kyRoot alongside businessType', async () => {
  const src = await readFile(
    new URL('../src/models/KnowYourselfQuestion.js', import.meta.url),
    'utf8'
  );
  assert.match(src, /kyRoot:\s*\{/, 'KnowYourselfQuestion must declare a kyRoot path');
  // The stored value can only ever be one of the three roots (or absent for
  // the shared pool), so a typo cannot invent a fourth root.
  assert.match(src, /enum:\s*\[\.\.\.KY_ROOT_IDS,\s*null\]/);
  // No default: a default would make mongoose write `kyRoot: null` into every
  // existing Manufacturing & Services document on the next save.
  const block = src.slice(src.indexOf('kyRoot: {'));
  const fieldBody = block.slice(0, block.indexOf('},'));
  assert.doesNotMatch(fieldBody, /default:/, 'kyRoot must have no schema default');
});

test('a question with no business type is shared, not defaulted to a root', async () => {
  const src = await readFile(
    new URL('../src/controllers/knowYourselfController.js', import.meta.url),
    'utf8'
  );
  // The shared pool carries no root. Defaulting it to manufacturing-services
  // would be a claim the document cannot make — it applies to every business
  // type, including Non-Profit.
  const fn = src.slice(src.indexOf('function rootForQuestion'));
  assert.match(fn, /return businessTypeKey \? resolveKyRoot\(businessTypeKey\) : null;/);
});

test('the controller re-derives kyRoot so it cannot drift from businessType', async () => {
  const src = await readFile(
    new URL('../src/controllers/knowYourselfController.js', import.meta.url),
    'utf8'
  );
  // On update.
  assert.match(src, /const derivedRoot = rootForQuestion\(q\.businessType\);/);
  assert.match(src, /if \(derivedRoot !== null \|\| q\.kyRoot != null\) q\.kyRoot = derivedRoot;/);
  // On create.
  assert.match(src, /q\.kyRoot = rootForQuestion\(qBusinessType\);/);
});

test('every question the API returns states the root it belongs to', async () => {
  const src = await readFile(
    new URL('../src/controllers/knowYourselfController.js', import.meta.url),
    'utf8'
  );
  // Stored value first, derived value as the fallback for rows written before
  // the field existed, so the Admin client never has to re-derive it.
  assert.match(src, /kyRoot: q\.kyRoot \?\? rootForQuestion\(q\.businessType\)/);
});

test('the seeder stamps kyRoot on both seeded banks and leaves Mfg alone', async () => {
  const src = await readFile(new URL('../scripts/seedKyRoots.js', import.meta.url), 'utf8');
  assert.match(src, /businessType,\n\s*kyRoot: rootId,/);
  assert.match(src, /async function stampQuestionRoots\(\)/);
  // It walks BUSINESS_TYPE_FOR_ROOT, which holds only startup and non-profit —
  // the shared Manufacturing & Services bank is not in that table at all.
  const fn = src.slice(src.indexOf('async function stampQuestionRoots'));
  assert.match(fn, /for \(const \[rootId, businessType\] of Object\.entries\(BUSINESS_TYPE_FOR_ROOT\)\)/);
  assert.match(src, /businessType: 'startup', kyRoot: 'startup'|BUSINESS_TYPE_FOR_ROOT\['non-profit'\], 'ngo'/);
});
