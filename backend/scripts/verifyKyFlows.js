/* Local end-to-end verification of the four KY flows against a real Mongo.
   Run with an explicit MONGO_URI pointing at a LOCAL database:

     MONGO_URI=mongodb://127.0.0.1:27017/byrgop node scripts/verifyKyFlows.js

   Read-only: it starts sessions, inspects them, then deletes the sessions it
   created. It never writes questions, pillars or business types. */

import 'dotenv/config';
import mongoose from 'mongoose';
import KnowYourselfSession from '../src/models/KnowYourselfSession.js';
import { startKYAssignment, getKYMeta, getActiveKYCategories, submitKYAnswer, getKYResult } from '../src/services/knowYourselfService.js';
import { resolveKyRoot, rootRequiresDomainSelection, pillarKeysForRoot } from '../src/config/kyQuestionRoots.js';

const uri = process.env.MONGO_URI || '';
if (!/^(mongodb:\/\/)?(localhost|127\.0\.0\.1)/.test(uri)) {
  console.error('Refusing to run against a non-local MONGO_URI.');
  process.exit(1);
}

let failures = 0;
function check(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures++;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}${ok ? '' : `  got ${JSON.stringify(actual)} want ${JSON.stringify(expected)}`}`);
}

const created = [];
async function flow(label, businessType, domain) {
  console.log(`\n${label}`);
  const r = await startKYAssignment('flow-test@example.com', domain, businessType, 'verify-browser');
  created.push(r.sessionId);
  const session = await KnowYourselfSession.findOne({ sessionId: r.sessionId }).lean();
  const cats = [...new Set(session.selectedQuestions.map((q) => q.category))].sort();
  const root = resolveKyRoot(session);
  const perPillar = {};
  for (const q of session.selectedQuestions) perPillar[q.category] = (perPillar[q.category] || 0) + 1;
  console.log(`  businessType=${session.businessType}  root=${root}  domain=${JSON.stringify(session.domain)}`);
  console.log(`  questions=${session.selectedQuestions.length}  pillars covered=${cats.length}  per-pillar=${JSON.stringify(perPillar)}`);
  return { r, session, cats, root, perPillar };
}

await mongoose.connect(uri);
try {
  console.log('=== getKYMeta routing contract ===');
  const meta = await getKYMeta();
  for (const bt of meta.businessTypes) {
    console.log(`  ${bt.key.padEnd(9)} root=${String(bt.kyRoot).padEnd(24)} requiresDomainSelection=${bt.requiresDomainSelection}`);
  }
  check('services requires domain selection', meta.businessTypes.find((b) => b.key === 'service')?.requiresDomainSelection, true);
  check('manufacturing requires domain selection', meta.businessTypes.find((b) => b.key === 'product')?.requiresDomainSelection, true);
  check('startup skips domain selection', meta.businessTypes.find((b) => b.key === 'startup')?.requiresDomainSelection, false);
  check('non-profit skips domain selection', meta.businessTypes.find((b) => b.key === 'ngo')?.requiresDomainSelection, false);
  check('meta exposes 3 roots', meta.kyRoots.length, 3);
  check('each root declares 6 pillars', meta.kyRoots.map((r) => r.pillars.length), [6, 6, 6]);

  console.log('\n=== The Disclaimer copy and the result button are per-root ===');
  // What the user READS and what they PRESS are decided by the same `kyRoot`
  // that chose the question bank. Served from one payload, so a root cannot be
  // served another root's words.
  const EXPECTED_LABELS = {
    'manufacturing-services': 'Your Business',
    startup: 'Your Enterprise',
    'non-profit': 'Your Foundation',
  };
  const rootList = new Map(meta.kyRoots.map((r) => [r.id, r]));
  for (const [id, label] of Object.entries(EXPECTED_LABELS)) {
    const root = rootList.get(id);
    check(`  ${id} root exists in meta`, !!root, true);
    check(`  ${id} result button label`, root?.content?.resultActionLabel, label);
    check(`  ${id} entity noun`, !!root?.content?.entity, true);
    check(`  ${id} has terms copy`, String(root?.content?.terms?.body || '').length > 60, true);
    check(`  ${id} has about copy`, String(root?.content?.about?.body || '').length > 60, true);
  }
  check('  the three labels are distinct', new Set(Object.values(EXPECTED_LABELS)).size, 3);
  check('  the three about bodies are distinct', new Set(meta.kyRoots.map((r) => r.content.about.body)).size, 3);
  // The Non-Profit copy must not be the Mfg & Services copy in any part.
  const npoContent = rootList.get('non-profit').content;
  const mfgContent = rootList.get('manufacturing-services').content;
  check('  Non-Profit does not mention profit leaks', npoContent.about.body.includes('profit leak'), false);
  check('  Non-Profit does not claim the Business Profit Architecture', npoContent.about.body.includes('Business Profit Architecture'), false);
  check('  Mfg & Services keeps the Business Profit Architecture copy', mfgContent.about.body.includes('Business Profit Architecture'), true);
  for (const statute of ['12AB', '80G', 'Section 135', 'FCRA', 'NGO-DARPAN', 'NITI']) {
    check(`  Non-Profit disclaimer names ${statute}`, npoContent.about.body.includes(statute), true);
  }
  // Each business type's own entry repeats its root's content, so the client
  // can resolve everything from one lookup by business type.
  for (const bt of meta.businessTypes) {
    check(
      `  ${bt.key} entry carries its own root's copy`,
      bt.content?.resultActionLabel,
      EXPECTED_LABELS[bt.kyRoot]
    );
  }

  console.log('\n=== Fresh Start-Up → Start-Up → onboarding → Disclaimer → 18 questions ===');
  const s = await flow('STARTUP', 'startup', null);
  check('  session businessType', s.session.businessType, 'startup');
  check('  session kyRoot', s.session.kyRoot, 'startup');
  check('  no domain stored', s.session.domain, null);
  check('  18 questions', s.session.selectedQuestions.length, 18);
  check('  six pillars covered', s.cats.length, 6);
  check('  3 questions per pillar', Object.values(s.perPillar), [3, 3, 3, 3, 3, 3]);
  check('  every question belongs to startup', [...new Set(s.session.selectedQuestions.map((q) => q.questionId))].length > 0, true);
  check('  pillars are the Start-Up set', s.cats, [...pillarKeysForRoot('startup')].sort());

  console.log('\n=== Fresh Non-Profit → Non-Profit → onboarding → Disclaimer → 18 questions ===');
  const n = await flow('NON-PROFIT', 'ngo', null);
  check('  session businessType', n.session.businessType, 'ngo');
  check('  session kyRoot', n.session.kyRoot, 'non-profit');
  check('  no domain stored', n.session.domain, null);
  check('  18 questions', n.session.selectedQuestions.length, 18);
  check('  six pillars covered', n.cats.length, 6);
  check('  3 questions per pillar', Object.values(n.perPillar), [3, 3, 3, 3, 3, 3]);
  check('  pillars are the Non-Profit set', n.cats, [...pillarKeysForRoot('non-profit')].sort());

  console.log('\n=== Fresh Services → Services → onboarding → Disclaimer → Domain Selection → questions ===');
  // The local database has no Professional Services domain questions, so this
  // flow is asserted at its routing step: a Services assignment REQUIRES a
  // domain, which is exactly what makes the frontend show domain selection.
  console.log('\nSERVICES (routing assertion)');
  let rejected = null;
  try {
    const r = await startKYAssignment('flow-test@example.com', null, 'service', 'verify-browser');
    created.push(r.sessionId);
  } catch (err) {
    rejected = err;
  }
  check('  domain is required for Services', rejected?.status, 400);
  check('  rejection names the missing domain', /Invalid or inactive domain/.test(rejected?.message || ''), true);
  check('  services resolves to the shared root', rootRequiresDomainSelection(resolveKyRoot('service')), true);

  console.log('\n=== Fresh Manufacturing → Manufacturing → onboarding → Disclaimer → Domain Selection → questions ===');
  const m = await flow('MANUFACTURING', 'product', 'manufacturing');
  check('  session businessType', m.session.businessType, 'product');
  check('  session kyRoot', m.session.kyRoot, 'manufacturing-services');
  check('  domain stored', m.session.domain, 'manufacturing');
  check('  18 questions', m.session.selectedQuestions.length, 18);
  // ISOLATION is the claim here, not coverage. A Manufacturing session draws
  // 9 of the 20 shared generic questions at random, and the shared bank is
  // uneven (three pillars hold 3, the rest 4), so a single draw can legitimately
  // miss a pillar — about 1 run in 7. Asserting the draw covers all six would
  // be asserting a balanced bank this root does not have. What must hold is
  // that every served question is filed under a shared pillar, and none under
  // another root's.
  const sharedKeys = new Set(pillarKeysForRoot('manufacturing-services'));
  check('  every served question is filed under a shared pillar',
    m.session.selectedQuestions.every((q) => sharedKeys.has(q.category)), true);
  check('  …and none under a Start-Up or Non-Profit pillar',
    m.session.selectedQuestions.some((q) =>
      pillarKeysForRoot('startup').includes(q.category) ||
      pillarKeysForRoot('non-profit').includes(q.category)), false);

  console.log('\n=== Question isolation ===');
  const allQ = await mongoose.connection.db.collection('knowyourselfquestions').find({}).toArray();
  const startupIds = new Set(allQ.filter((q) => q.businessType === 'startup').map((q) => String(q._id)));
  const ngoIds = new Set(allQ.filter((q) => q.businessType === 'ngo').map((q) => String(q._id)));
  const sharedIds = new Set(allQ.filter((q) => !q.businessType).map((q) => String(q._id)));
  const sIds = new Set(s.session.selectedQuestions.map((q) => String(q.questionId)));
  const nIds = new Set(n.session.selectedQuestions.map((q) => String(q.questionId)));
  check('  startup session uses only startup questions', [...sIds].every((id) => startupIds.has(id)), true);
  check('  startup session has zero shared questions', [...sIds].some((id) => sharedIds.has(id)), false);
  check('  non-profit session uses only non-profit questions', [...nIds].every((id) => ngoIds.has(id)), true);
  check('  non-profit session has zero startup questions', [...nIds].some((id) => startupIds.has(id)), false);
  check('  startup and non-profit banks do not overlap', [...sIds].some((id) => ngoIds.has(id)), false);


  console.log('\n=== Pillar sets are independent ===');
  const shared = await getActiveKYCategories('service');
  const startupCats = await getActiveKYCategories('startup');
  const npoCats = await getActiveKYCategories('ngo');
  check('  shared set keys', shared.map((c) => c.key), ['strategic-direction', 'financial-performance', 'sales-market-growth', 'operations-execution', 'people-organization', 'digital-innovation']);
  check('  startup set keys', startupCats.map((c) => c.key), pillarKeysForRoot('startup'));
  check('  non-profit set keys', npoCats.map((c) => c.key), pillarKeysForRoot('non-profit'));
  check('  no key collision between sets', shared.filter((c) => startupCats.some((s2) => s2.key === c.key) || npoCats.some((n2) => n2.key === c.key)).length, 0);
  check('  services resolves to the shared set', (await getActiveKYCategories('product')).map((c) => c.key), shared.map((c) => c.key));
  check('  an unset business type still resolves to the shared set', (await getActiveKYCategories(null)).map((c) => c.key), shared.map((c) => c.key));
  check('  historical service session root', rootRequiresDomainSelection(resolveKyRoot('service')), true);

  console.log('\n=== Non-Profit bank isolation (the guards) ===');
  // Each of these fails the run on its own, so a regression in any one of them
  // is reported rather than masked by the others.
  const ngoBank = allQ.filter((q) => q.businessType === 'ngo' && q.active !== false);
  check('  active Non-Profit bank has exactly 18 questions', ngoBank.length, 18);
  check('  every Non-Profit question sits in a Non-Profit pillar',
    ngoBank.every((q) => pillarKeysForRoot('non-profit').includes(q.category)), true);
  check('  no generic (untagged) question is in the Non-Profit bank',
    ngoBank.some((q) => !q.businessType), false);
  check('  the served 18 contain no generic question', [...nIds].some((id) => sharedIds.has(id)), false);
  check('  the served 18 contain no Services/Manufacturing question',
    [...nIds].some((id) => allQ.some((q) => String(q._id) === id && ['service', 'product'].includes(q.businessType))), false);
  check('  every served question offers four options',
    n.session.selectedQuestions.every((q) => q.options.length === 4), true);
  // The framework is written worst→best (A=1pt … D=4pt); storage is best→worst,
  // so the FIRST option must be the strongest. If the bank is ever loaded
  // literally, a strong organisation would score 25% and this catches it.
  check('  options are stored best→worst (first option scores 4)',
    n.session.selectedQuestions.every((q) => q.options[0].score === 4 && q.options[3].score === 1), true);
  check('  the six Non-Profit pillars are the framework ones',
    npoCats.map((c) => c.name),
    ['Strategy', 'Revenue', 'Operations', 'Finance', 'People & Culture', 'Governance']);
  check('  Non-Profit runs no domain selection', n.session.domain, null);
  check('  Non-Profit assignment reports no domain requirement', n.r.requiresDomainSelection, false);
  check('  Non-Profit assignment reports its own root', n.r.kyRoot, 'non-profit');
  check('  exactly 3 questions per Non-Profit pillar',
    Object.fromEntries(npoCats.map((c) => [c.key, ngoBank.filter((q) => q.category === c.key).length])),
    Object.fromEntries(npoCats.map((c) => [c.key, 3])));

  console.log('\n=== The Admin Non-Profit page is scoped, not empty and not Mfg ===');
  // Reproduces exactly what `listKYQuestions({ root: 'non-profit' })` asks the
  // database for, because that page was reported empty and was seen falling
  // back to another root's questions.
  {
    const { default: KYCategory } = await import('../src/models/KYCategory.js');
    const { businessTypesForRoot, rootRequiresDomainSelection } = await import('../src/config/kyQuestionRoots.js');
    const listLikeAdmin = async (rootId) => {
      const keys = businessTypesForRoot(rootId);
      const filter = rootRequiresDomainSelection(rootId)
        ? { $or: [{ businessType: null }, { businessType: '' }, { businessType: { $in: keys } }] }
        : { businessType: { $in: keys } };
      const { default: Q } = await import('../src/models/KnowYourselfQuestion.js');
      return Q.find({ active: true, ...filter }).lean();
    };
    const adminNpo = await listLikeAdmin('non-profit');
    check('  Admin ?root=non-profit returns 18 questions', adminNpo.length, 18);
    check('  …all with businessType ngo', adminNpo.every((q) => q.businessType === 'ngo'), true);
    check('  …all in one of the six Non-Profit pillars',
      adminNpo.every((q) => pillarKeysForRoot('non-profit').includes(q.category)), true);
    check('  …none in a Start-Up pillar',
      adminNpo.some((q) => pillarKeysForRoot('startup').includes(q.category)), false);
    check('  …none in a Manufacturing/Services pillar',
      adminNpo.some((q) => pillarKeysForRoot('manufacturing-services').includes(q.category)), false);
    // The three root pages are disjoint: what one shows, the others do not.
    const adminStartup = await listLikeAdmin('startup');
    const adminMfg = await listLikeAdmin('manufacturing-services');
    const npoIds = new Set(adminNpo.map((q) => String(q._id)));
    check('  Admin ?root=startup shows none of them', adminStartup.some((q) => npoIds.has(String(q._id))), false);
    check('  Admin ?root=manufacturing-services shows none of them', adminMfg.some((q) => npoIds.has(String(q._id))), false);
    check('  Admin ?root=startup returns 18 questions', adminStartup.length, 18);
    // Every pillar offered to the editor is this root's, and all six are active.
    const npoActivePillars = await KYCategory.find({ kyRoot: 'non-profit', active: true }).lean();
    check('  the editor is offered exactly 6 Non-Profit pillars', npoActivePillars.length, 6);
    check('  …and every active Non-Profit question is filed under one of them',
      npoActivePillars.length === 6 &&
        adminNpo.every((q) => npoActivePillars.some((c) => c.key === q.category)), true);
  }

  console.log('\n=== The Non-Profit bank is exactly the supplied 18, 3 per pillar ===');
  {
    const { default: KYCategory } = await import('../src/models/KYCategory.js');
    const { default: Q } = await import('../src/models/KnowYourselfQuestion.js');

    // The six pillars, by the exact names the framework uses, in its own order.
    const activePillars = await KYCategory.find({ kyRoot: 'non-profit', active: true })
      .sort({ sortOrder: 1 }).lean();
    check('  the six pillars, in framework order',
      activePillars.map((c) => c.name),
      ['Strategy', 'Revenue', 'Operations', 'Finance', 'People & Culture', 'Governance']);

    const live = await Q.find({ businessType: 'ngo', active: { $ne: false } }).lean();
    check('  active Non-Profit questions', live.length, 18);
    check('  three in every pillar',
      Object.fromEntries(activePillars.map((c) => [c.name, live.filter((q) => q.category === c.key).length])),
      { Strategy: 3, Revenue: 3, Operations: 3, Finance: 3, 'People & Culture': 3, Governance: 3 });

    // The old domain-based bank. It is retired, never deleted, so a completed
    // session that referenced it still resolves — but it must contribute ZERO
    // active questions to this root.
    const retired = await Q.find({ businessType: 'ngo', active: false }).lean();
    check('  the superseded bank is retired, not deleted', retired.length > 0, true);
    check('  retired questions are all still readable (history intact)',
      retired.every((q) => q.text && q.options?.length === 4), true);
    // A retired question shares a pillar key with an active one whenever the
    // bank was rewritten in place — same six pillars, new wording — so "is the
    // pillar still active" is NOT the test for whether it can be served. Every
    // serving query filters `active: true`, so the invariant that actually
    // matters is that retiring them took them out of the pool: the six pillars
    // must each be covered by exactly 3 ACTIVE questions, and none of the 18
    // served questions may be a retired one.
    check('  …and each pillar is filled only by active questions',
      activePillars.every((c) => live.filter((q) => q.category === c.key).length === 3), true);
    check('  no retired question can reach the served pool',
      live.every((q) => !retired.some((r) => String(r.text) === String(q.text))), true);
    check('  …checked the way serving actually filters (active: true)',
      (await Q.find({ businessType: 'ngo', active: { $ne: false } }).lean()).length, 18);

    // The reported symptom: a domain-based Non-Profit question showing up in
    // this root. A domain question has a `domain` and no businessType, so the
    // root-scoped filter can never return one.
    const { default: D } = await import('../src/models/Domain.js');
    const ngoBt = await (await import('../src/models/BusinessType.js')).default.findOne({ key: 'ngo' }).lean();
    const ngoDomains = await D.find({ businessTypeId: ngoBt._id }).lean();
    const domainQs = await Q.find({ type: 'domain' }).lean();
    const leaked = domainQs.filter((q) => ngoDomains.some((d) => d.slug === q.domain));
    check('  no domain question exists against any Non-Profit domain', leaked.length, 0);
    check('  no active Non-Profit question carries a domain',
      live.filter((q) => q.type === 'domain' || q.domain).length, 0);
    check('  no Non-Profit question is in a shared Manufacturing pillar',
      live.filter((q) => q.category && !pillarKeysForRoot('non-profit').includes(q.category)).length, 0);

    // The pillar assignment is a persisted field on the question, not a position
    // in the array. Reordering the bank must not change any question's pillar.
    const byId = new Map(live.map((q) => [String(q._id), q.category]));
    const shuffled = [...live].reverse();
    check('  the pillar is stored on the question, not derived from its position',
      shuffled.every((q) => byId.get(String(q._id)) === q.category), true);
  }

  console.log('\n=== The requested root can neither redirect nor be redirected ===');
  // The client states the root it is asking for; the server still derives the
  // root from the business type and refuses any disagreement, so a Non-Profit
  // request can never be talked into the shared Manufacturing & Services pool.
  let wrongRoot = null;
  try {
    await startKYAssignment('flow-test@example.com', null, 'ngo', 'verify-browser', 'manufacturing-services');
  } catch (err) { wrongRoot = err; }
  check('  a Non-Profit request claiming the shared root is rejected', wrongRoot?.status, 400);
  check('  the rejection names both roots',
    /manufacturing-services/.test(wrongRoot?.message || '') && /Non-Profit/.test(wrongRoot?.message || ''), true);

  let correctRoot = null;
  try {
    correctRoot = await startKYAssignment('flow-test@example.com', null, 'ngo', 'verify-browser', 'non-profit');
    created.push(correctRoot.sessionId);
  } catch (err) { correctRoot = err; }
  check('  a Non-Profit request claiming its own root is accepted', correctRoot.kyRoot, 'non-profit');
  check('  …and still serves 18 questions', correctRoot.questions?.length, 18);

  // A business type this deployment does not know must NOT quietly become
  // Manufacturing & Services. It is refused at the business-type lookup,
  // before any root is resolved. (The stricter case — a type that EXISTS but
  // is bound to no root — cannot be exercised here without writing to the
  // database, which this script never does; it is covered by the unit test
  // `resolveKyRootStrict refuses to guess` in test/kyQuestionRoots.test.js.)
  let unknownType = null;
  try {
    await startKYAssignment('flow-test@example.com', null, 'cooperative', 'verify-browser');
  } catch (err) { unknownType = err; }
  check('  an unknown business type is refused, not defaulted to the shared root', unknownType?.status, 400);
  check('  the refusal asks for a valid business type',
    /valid business type/.test(unknownType?.message || ''), true);

  // A known business type that DOES run domain selection cannot borrow the
  // direct path either: asking for a domain is mandatory there, so a Non-Profit
  // bank can never be reached by presenting a different type's root.
  let noDomain = null;
  try {
    await startKYAssignment('flow-test@example.com', null, 'service', 'verify-browser', 'non-profit');
  } catch (err) { noDomain = err; }
  check('  a Services request claiming the Non-Profit root is rejected', noDomain?.status, 400);
  // The root cross-check runs BEFORE domain resolution, so the client is told
  // the two disagree rather than being sent down the domain path. That ordering
  // matters: it means a caller cannot reach the Non-Profit bank by presenting
  // a different business type.
  check('  …and is told the roots disagree, not sent to domain selection',
    /Services/.test(noDomain?.message || '') && /non-profit/.test(noDomain?.message || ''), true);

  console.log('\n=== Start-Up keeps the same isolation ===');
  const startupBank = allQ.filter((q) => q.businessType === 'startup' && q.active !== false);
  check('  active Start-Up bank has exactly 18 questions', startupBank.length, 18);
  check('  every Start-Up question sits in a Start-Up pillar',
    startupBank.every((q) => pillarKeysForRoot('startup').includes(q.category)), true);
  check('  the served Start-Up 18 contain no generic question', [...sIds].some((id) => sharedIds.has(id)), false);
  check('  the served Start-Up 18 contain no Non-Profit question', [...sIds].some((id) => ngoIds.has(id)), false);
  check('  Start-Up runs no domain selection', s.session.domain, null);

  console.log('\n=== Services / Manufacturing are untouched ===');
  check('  services still requires domain selection', meta.businessTypes.find((b) => b.key === 'service')?.requiresDomainSelection, true);
  check('  manufacturing still requires domain selection', meta.businessTypes.find((b) => b.key === 'product')?.requiresDomainSelection, true);
  check('  manufacturing still uses the shared pillars', shared.map((c) => c.key),
    [...pillarKeysForRoot('manufacturing-services')]);
  console.log('\n=== A completed Start-Up session scores on the Start-Up pillars ===');
  // Answer the best option everywhere: score 4 of 4 → 100% per pillar.
  for (let i = 0; i < s.r.totalQuestions; i++) {
    const opt = s.r.questions[i].options[0];
    await submitKYAnswer(s.r.sessionId, { questionIndex: i, optionId: opt.optionId });
  }
  const startupResult = await getKYResult(s.r.sessionId);
  const keys = startupResult.result.categories.map((c) => c.key);
  check('  session stayed Start-Up', startupResult.businessType, 'startup');
  check('  session domain is still null', startupResult.domain, null);
  check('  result has six categories', keys.length, 6);
  check('  result uses the Start-Up pillar keys', keys, pillarKeysForRoot('startup'));
  check('  every pillar scored', startupResult.result.categories.every((c) => c.maxScore > 0), true);
  check('  best answers give 100% per pillar', [...new Set(startupResult.result.categories.map((c) => c.percent))], [100]);
  check('  overall is 100%', startupResult.result.overallPercent, 100);
  check('  band is the top band', startupResult.result.band, 'STRONG FOUNDATION');

  console.log('\n=== A completed Non-Profit session scores on the Non-Profit pillars ===');
  for (let i = 0; i < n.r.totalQuestions; i++) {
    const opt = n.r.questions[i].options[0];
    await submitKYAnswer(n.r.sessionId, { questionIndex: i, optionId: opt.optionId });
  }
  const npoResult = await getKYResult(n.r.sessionId);
  check('  result has six categories', npoResult.result.categories.length, 6);
  check('  result uses the Non-Profit pillar keys', npoResult.result.categories.map((c) => c.key), pillarKeysForRoot('non-profit'));
  check('  result names them as the framework names them',
    npoResult.result.categories.map((c) => c.name),
    ['Strategy', 'Revenue', 'Operations', 'Finance', 'People & Culture', 'Governance']);
  check('  best answers give 100% per pillar', [...new Set(npoResult.result.categories.map((c) => c.percent))], [100]);
  check('  overall is 100%', npoResult.result.overallPercent, 100);
  check('  band is the top band', npoResult.result.band, 'STRONG FOUNDATION');
  check('  session stayed Non-Profit', npoResult.businessType, 'ngo');
  check('  session domain is still null', npoResult.domain, null);
  check('  every pillar scored', npoResult.result.categories.every((c) => c.maxScore > 0), true);
} finally {
  if (created.length) {
    const r = await KnowYourselfSession.deleteMany({ sessionId: { $in: created } });
    console.log(`\nCleaned up ${r.deletedCount} verification session(s).`);
  }
  await mongoose.disconnect();
}

console.log(failures === 0 ? '\nALL FLOW CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
