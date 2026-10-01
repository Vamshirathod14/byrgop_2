/* ─────────────────────────────────────────────────────────────
   KNOW YOURSELF — QUESTION ROOTS AND SIX-PILLAR STRUCTURES
   ─────────────────────────────────────────────────────────────
   The Know Yourself assessment is administered through three
   INDEPENDENT question-management roots in Admin. Each root owns
   its own six-pillar structure and its own question bank, so a
   Start-Up question can never be answered by a Non-Profit user and
   neither of them borrows the Manufacturing/Services pillars.

     root                     business types        domain selection
     ───────────────────────  ────────────────────  ─────────────────
     manufacturing-services   service, product      REQUIRED
     startup                  startup               not used
     non-profit               ngo                   not used

   Why "non-domain" roots exist
   ----------------------------
   Start-Up and Non-Profit are deliberately different business
   models: they may legitimately have no active Domain records.
   A missing domain must therefore NOT mean "Coming Soon" and
   must NOT stop the assessment. Those roots go straight from the
   Disclaimer into their own 18-question bank.

   Everything in this module is pure data plus pure functions so
   the routing and pillar maths can be unit-tested without a
   database. The database remains the source of truth; this file
   only supplies the seed defaults and the fallback used for
   business-type documents written before `kyRoot` existed.
   ───────────────────────────────────────────────────────────── */

export const KY_ROOT_IDS = ['manufacturing-services', 'startup', 'non-profit'];

export const DEFAULT_KY_ROOT = 'manufacturing-services';

/** The single root that runs the domain-selection step. */
export const DOMAIN_SELECTION_ROOT = 'manufacturing-services';

/**
 * Freeze an object and everything inside it.
 *
 * These tables are read on every assessment, and the pillar definitions are
 * also used as seed defaults. A stray write to one of them would change the
 * routing and the seeded structure for every root at once, so they are made
 * immutable at module load rather than trusted.
 */
function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

/* ─── Root-specific presentation content ─────────────────────────
   The Disclaimer and the result screen used to hard-code ONE block of
   copy, which is how a Non-Profit user was shown "hidden profit leaks in
   your business" and a "Your Business" button on their Foundation pie.

   The copy is now keyed by the same `kyRoot` value that decides the
   question bank, and is served in `/know-yourself/meta`. So the words a
   user reads, the button they press and the 18 questions they answer are
   all decided by ONE value — there is no second, independent notion of
   "which kind of business is this".

   `**bold**` is the only markup: the screen renders it as <strong>, so
   the emphasised figures survive the move out of JSX. */

const PROPRIETARY_TERMS =
  'This diagnostic is a proprietary strategic tool intended solely for informational guidance. It does not ' +
  'constitute formal legal, financial, tax, or investment advice, and financial results are not guaranteed. ' +
  'All underlying frameworks and intellectual property remain our exclusive property and may not be reproduced ' +
  'without written consent.';

const MINUTES_LINE =
  'Complete 18 targeted questions in **8–10** minutes to receive an immediate, complimentary report.';

/**
 * The two domain-specific disclaimers, stated verbatim.
 *
 * Start-Up and Non-Profit each read a paragraph that describes what their
 * diagnostic actually measures and what it is aligned with, rather than the
 * shared proprietary-tool terms. The wording here is fixed product copy: it is
 * reproduced exactly as agreed, so it is a single named constant per root and
 * never reworded, abbreviated or assembled from shared fragments. That is what
 * keeps the Disclaimer screen, the participant's consent record and the product
 * documentation describing the same thing.
 *
 * `PROPRIETARY_TERMS` remains the Manufacturing & Services disclaimer, which is
 * deliberately left as it was.
 */
const STARTUP_DISCLAIMER =
  'This diagnostic evaluates your startup’s business maturity, scalability, and investment readiness across ' +
  'six core pillars. It is aligned with DPIIT guidelines, Companies Act compliance, unit economics, and ' +
  'venture capital due diligence best practices.';

const NONPROFIT_DISCLAIMER =
  'This diagnostic evaluates your non-profit’s governance, operations, compliance, and organizational ' +
  'maturity across six core pillars. It is based on key Indian regulations, including 12AB, 80G, FCRA, CSR, ' +
  'and NGO-DARPAN requirements.';

const MANUFACTURING_CONTENT = deepFreeze({
  // The noun used in the copy.
  entity: 'your business',
  // The result/pie screen button, and the word in its "… Snapshot" heading.
  resultActionLabel: 'Your Business',
  resultHeadingLabel: 'Your Business',
  screenTitle: 'Welcome to the Profit Architecture Diagnostic (PAD)',
  terms: {
    title: 'Disclaimer & Terms of Use',
    body: PROPRIETARY_TERMS,
  },
  about: {
    title: 'Welcome to the Profit Architecture Diagnostic (PAD)',
    body:
      "Built on BYRGOP's Business Profit Architecture (BPA) framework, this diagnostic assesses six core " +
      'operational pillars to uncover hidden profit leaks and growth opportunities. ' +
      MINUTES_LINE +
      ' detailing prioritized optimization strategies for your business.',
  },
});

const STARTUP_CONTENT = deepFreeze({
  entity: 'your venture',
  resultActionLabel: 'Your Enterprise',
  resultHeadingLabel: 'Your Enterprise',
  screenTitle: 'Welcome to the Profit Architecture Diagnostic (PAD)',
  terms: {
    title: 'Disclaimer & Terms of Use',
    body: STARTUP_DISCLAIMER,
  },
  about: {
    title: 'Welcome to the Profit Architecture Diagnostic (PAD)',
    body:
      "Built on BYRGOP's Start-Up Profit Architecture, this diagnostic assesses six venture pillars — Market " +
      'Validation, Product & Technology, Unit Economics & Funding, Growth Engine, Operations & Velocity, and Team, ' +
      'Culture & Governance — to surface the constraints that hold an early-stage venture back before they ' +
      'compound. ' +
      MINUTES_LINE +
      ' detailing prioritized optimization strategies for your venture.',
  },
});

/**
 * The Non-Profit framework paragraph, verbatim from the supplied framework.
 * It is stated once here and used twice — as the Non-Profit root description
 * and as the body of the Non-Profit Disclaimer — so the two can never drift.
 */
const NONPROFIT_FRAMEWORK =
  'This diagnostic framework evaluates organizational maturity, operational rigor, and statutory compliance ' +
  'across six foundational pillars, benchmarked against Indian statutory frameworks—including the Income Tax ' +
  'Act (Sections 12AB/80G/Form 10BD), Companies Act 2013 (Section 135 Corporate Social Responsibility [CSR] ' +
  'Rules), Foreign Contribution Regulation Act, 2010 (FCRA) (2020 Amendments), and the National Institution for ' +
  'Transforming India (NITI) Aayog NGO-DARPAN platform.';

const NONPROFIT_CONTENT = deepFreeze({
  entity: 'your organization',
  resultActionLabel: 'Your Foundation',
  resultHeadingLabel: 'Your Foundation',
  screenTitle: 'Welcome to the Profit Architecture Diagnostic (PAD)',
  terms: {
    title: 'Disclaimer & Terms of Use',
    body: NONPROFIT_DISCLAIMER,
  },
  about: {
    title: 'Welcome to the Profit Architecture Diagnostic (PAD)',
    body:
      NONPROFIT_FRAMEWORK +
      ' ' +
      MINUTES_LINE +
      ' detailing prioritized strengthening strategies for your organization.',
  },
});

/** Root → presentation content. Read through `rootContentFor`. */
export const KY_CONTENT_BY_ROOT = deepFreeze({
  'manufacturing-services': MANUFACTURING_CONTENT,
  startup: STARTUP_CONTENT,
  'non-profit': NONPROFIT_CONTENT,
});

/**
 * The copy a root shows. Falls back to the Manufacturing & Services content
 * for an id this build does not know, which is the copy that used to be
 * hard-coded everywhere.
 */
export function rootContentFor(rootId) {
  return KY_CONTENT_BY_ROOT[normalizeRoot(rootId) || DEFAULT_KY_ROOT];
}

export const KY_ROOTS = deepFreeze([
  {
    id: 'manufacturing-services',
    label: 'Manufacturing & Services',
    description:
      'Manufacturing, product and service businesses. Domain selection is part of the flow.',
    requiresDomainSelection: true,
    businessTypes: ['service', 'product'],
    // The copy below is the text this flow has always shown, unchanged. It
    // only became explicit once the copy stopped being a single hard-coded
    // string and became one entry in a per-root table.
    content: MANUFACTURING_CONTENT,
  },
  {
    id: 'startup',
    label: 'Start-Up',
    description:
      'Early-stage ventures. No domain selection — Start-Up goes straight into the Start-Up 18-question assessment.',
    requiresDomainSelection: false,
    businessTypes: ['startup'],
    content: STARTUP_CONTENT,
  },
  {
    id: 'non-profit',
    label: 'Non-Profit',
    // The framework paragraph is stated once (see NONPROFIT_FRAMEWORK) and
    // reused here and in the Disclaimer, so the two can never disagree.
    description:
      NONPROFIT_FRAMEWORK +
      ' No domain selection — Non-Profit goes straight into the Non-Profit 18-question assessment.',
    requiresDomainSelection: false,
    businessTypes: ['ngo'],
    content: NONPROFIT_CONTENT,
  },
]);

/**
 * Fallback for BusinessType documents created before `kyRoot` existed.
 * Keeps legacy rows resolving to the right root without a data migration,
 * so a half-migrated database can never route a Non-Profit user into the
 * Services domain-selection screen.
 */
export const ROOT_BY_BUSINESS_TYPE_KEY = Object.freeze(
  KY_ROOTS.reduce((acc, root) => {
    for (const key of root.businessTypes) acc[key] = root.id;
    return acc;
  }, {})
);

/* ─── Six-pillar structures ──────────────────────────────────
   Each root has its own six pillars. The Manufacturing & Services
   keys are the EXISTING production keys, unchanged, so no existing
   question, session snapshot or result needs to be rewritten.
   Start-Up and Non-Profit use new, namespaced keys so they can
   never collide with the shared set. */

const SHARED_PILLARS = [
  { key: 'strategic-direction', name: 'Strategic Direction', color: '#0A78CF', sortOrder: 1 },
  { key: 'financial-performance', name: 'Financial Performance', color: '#FCA700', sortOrder: 2 },
  { key: 'sales-market-growth', name: 'Sales & Market Growth', color: '#E52032', sortOrder: 3 },
  { key: 'operations-execution', name: 'Operations & Execution', color: '#0D8845', sortOrder: 4 },
  { key: 'people-organization', name: 'People & Organization', color: '#F5630D', sortOrder: 5 },
  { key: 'digital-innovation', name: 'Digital & Innovation', color: '#7038A5', sortOrder: 6 },
];

const STARTUP_PILLARS = [
  {
    key: 'startup-market-validation',
    name: 'Market Validation',
    color: '#0A78CF',
    sortOrder: 1,
  },
  {
    key: 'startup-product-technology',
    name: 'Product & Technology',
    color: '#FCA700',
    sortOrder: 2,
  },
  {
    key: 'startup-unit-economics',
    name: 'Unit Economics & Funding',
    color: '#E52032',
    sortOrder: 3,
  },
  {
    key: 'startup-growth-engine',
    name: 'Growth Engine',
    color: '#0D8845',
    sortOrder: 4,
  },
  {
    key: 'startup-operations-velocity',
    name: 'Operations & Velocity',
    color: '#F5630D',
    sortOrder: 5,
  },
  {
    key: 'startup-team-governance',
    name: 'Team, Culture & Governance',
    color: '#7038A5',
    sortOrder: 6,
  },
];

/**
 * The Non-Profit six pillars, named exactly as the framework names them.
 *
 * `sortOrder` is the framework's own pillar order (Strategy, Revenue,
 * Operations, Finance, People & Culture, Governance) and is what the Admin
 * pillar summary, the Pillar dropdown and the result radar all read, so the
 * number beside each pillar is the same everywhere.
 *
 * Renamed from a longer "Mission & Impact / Fundraising & Donor Relations"
 * set to the framework's own pillar names. `PILLAR_RENAMES` in
 * scripts/seedKyRoots.js carries the old keys forward in place — the pillar
 * documents keep their ids and every question that pointed at them is
 * repointed, so nothing is deleted and no assessment snapshot breaks.
 */
const NONPROFIT_PILLARS = [
  {
    key: 'nonprofit-strategy',
    name: 'Strategy',
    color: '#0A78CF',
    sortOrder: 1,
  },
  {
    key: 'nonprofit-revenue',
    name: 'Revenue',
    color: '#FCA700',
    sortOrder: 2,
  },
  {
    key: 'nonprofit-operations',
    name: 'Operations',
    color: '#E52032',
    sortOrder: 3,
  },
  {
    key: 'nonprofit-finance',
    name: 'Finance',
    color: '#0D8845',
    sortOrder: 4,
  },
  {
    key: 'nonprofit-people-culture',
    name: 'People & Culture',
    color: '#F5630D',
    sortOrder: 5,
  },
  {
    key: 'nonprofit-governance',
    name: 'Governance',
    color: '#7038A5',
    sortOrder: 6,
  },
];

export const PILLARS_BY_ROOT = deepFreeze({
  'manufacturing-services': SHARED_PILLARS,
  startup: STARTUP_PILLARS,
  'non-profit': NONPROFIT_PILLARS,
});

/** Every pillar across every root (used for seeding only). */
export const ALL_KY_PILLARS = Object.freeze(
  KY_ROOT_IDS.flatMap((root) => PILLARS_BY_ROOT[root].map((p) => ({ ...p, kyRoot: root })))
);

/** `null`/`''`/missing `kyRoot` means the shared Manufacturing & Services set. */
export function normalizeRoot(value) {
  if (value === null || value === undefined || value === '') return null;
  const key = String(value).toLowerCase().trim();
  return KY_ROOT_IDS.includes(key) ? key : null;
}

/**
 * Resolve the question root for a business type.
 * `bt` may be a BusinessType document, a lean object, or a bare key string.
 * The stored `kyRoot` always wins; the legacy key map is the fallback.
 *
 * NOTE the trailing default: an unrecognised business type resolves to
 * `manufacturing-services`. That is the right behaviour for DISPLAY (the
 * public meta payload, Admin views), where an unknown type should still render
 * as the shared structure rather than crash. It is the WRONG behaviour for
 * building an assessment, because it would let a Non-Profit user be served the
 * Manufacturing & Services pool. Assessment building uses
 * `resolveKyRootStrict`, which refuses instead of defaulting.
 */
export function resolveKyRoot(bt) {
  const stored = normalizeRoot(typeof bt === 'object' && bt !== null ? bt.kyRoot : null);
  if (stored) return stored;
  const key = String(typeof bt === 'object' && bt !== null ? bt.key : bt || '')
    .toLowerCase()
    .trim();
  return ROOT_BY_BUSINESS_TYPE_KEY[key] || DEFAULT_KY_ROOT;
}

/**
 * Resolve the question root for building an assessment, refusing to guess.
 *
 * This is the guard that makes "a Non-Profit user is never served the
 * Manufacturing & Services pool" a property of the code rather than a
 * consequence of the generic pool happening to be empty for that key. An
 * unresolvable business type is a configuration fault, so it throws instead of
 * silently serving another root's questions.
 *
 * Throws 400 (a user-fixable "pick again" error) rather than 500: the only way
 * to reach it is a business type the deployment does not recognise.
 */
export function resolveKyRootStrict(bt) {
  const stored = normalizeRoot(typeof bt === 'object' && bt !== null ? bt.kyRoot : null);
  if (stored) return stored;
  const key = String(typeof bt === 'object' && bt !== null ? bt.key : bt || '')
    .toLowerCase()
    .trim();
  const resolved = ROOT_BY_BUSINESS_TYPE_KEY[key];
  if (resolved) return resolved;
  throw Object.assign(
    new Error(
      key
        ? `Business type "${key}" is not configured for any Know Yourself question root. ` +
            'It must be bound to a root in Admin before an assessment can be started.'
        : 'A business type is required to start an assessment.'
    ),
    { status: 400, details: { businessType: key || null, resolved: null } }
  );
}

/** True when the root must run the domain-selection step. */
export function rootRequiresDomainSelection(rootId) {
  const root = KY_ROOTS.find((r) => r.id === normalizeRoot(rootId) || r.id === rootId);
  return root ? root.requiresDomainSelection : true;
}

/** The six pillar keys for a root, in configured order. */
export function pillarKeysForRoot(rootId) {
  return (PILLARS_BY_ROOT[normalizeRoot(rootId) || DEFAULT_KY_ROOT] || []).map((p) => p.key);
}

/** The six pillar definitions for a root, in configured order. */
export function pillarsForRoot(rootId) {
  return PILLARS_BY_ROOT[normalizeRoot(rootId) || DEFAULT_KY_ROOT] || [];
}

/** Business-type keys that belong to a root (used to scope Admin roots). */
export function businessTypesForRoot(rootId) {
  const root = KY_ROOTS.find((r) => r.id === rootId);
  return root ? [...root.businessTypes] : [];
}

/** Label for a root id — used in error messages and the public meta payload. */
export function labelForRoot(rootId) {
  const root = KY_ROOTS.find((r) => r.id === rootId);
  return root ? root.label : rootId;
}

/* ─── Balanced 18-question plan ─────────────────────────────
   18 questions over 6 pillars = exactly 3 per pillar. Building the
   plan from the configured pillar list (rather than from whatever
   questions happen to exist) guarantees every root always reports
   six pillars, even before any question has been created. */

export const PILLARS_PER_ASSESSMENT = 6;
export const QUESTIONS_PER_ASSESSMENT = 18;

/** How many questions each pillar must contribute. Pure. */
export function balancedPillarPlan(rootId, total = QUESTIONS_PER_ASSESSMENT) {
  const keys = pillarKeysForRoot(rootId);
  if (keys.length === 0) {
    throw Object.assign(new Error(`No pillars are configured for root "${rootId}"`), {
      status: 500,
    });
  }
  // A zero or fractional total would otherwise slip through the modulo check
  // and produce a plan that serves an assessment with no questions at all.
  if (!Number.isInteger(total) || total <= 0) {
    throw Object.assign(
      new Error(
        `Question total for root "${rootId}" must be a positive whole number, received ${total}`
      ),
      { status: 500 }
    );
  }
  if (total % keys.length !== 0) {
    throw Object.assign(
      new Error(
        `Cannot split ${total} questions evenly across ${keys.length} pillars for root "${rootId}"`
      ),
      { status: 500 }
    );
  }
  const per = total / keys.length;
  return keys.map((key) => ({ key, count: per }));
}

/**
 * Validate that every pillar of a root has enough active questions and
 * return the per-pillar quota. Throws a 400 with an actionable message
 * naming the exact shortfalls, so Admin can see precisely what to add.
 *
 * `availableByPillar` : { [pillarKey]: activeQuestionCount }
 */
export function requireCompletePillarBank({ rootId, availableByPillar, total = QUESTIONS_PER_ASSESSMENT }) {
  const plan = balancedPillarPlan(rootId, total);
  const shortfalls = plan
    .filter((p) => Number(availableByPillar?.[p.key] || 0) < p.count)
    .map((p) => `${p.key} (needs ${p.count}, has ${Number(availableByPillar?.[p.key] || 0)})`);

  if (shortfalls.length > 0) {
    throw Object.assign(
      new Error(
        `The ${labelForRoot(rootId)} question bank is incomplete. ` +
          `Each of the ${plan.length} pillars needs at least ${plan[0].count} active questions ` +
          `to serve ${total} questions. Short: ${shortfalls.join(', ')}. ` +
          'Add or activate questions in Admin → Know Yourself Questions → ' +
          `${labelForRoot(rootId)}.`
      ),
      { status: 400, details: { root: rootId, plan, shortfalls } }
    );
  }
  return plan;
}

/**
 * The routing decision taken when the Disclaimer is accepted.
 * Pure so both the visitor app and the tests agree on it.
 *
 *   no business type  → business type screen (nothing saved yet)
 *   root needs domain→ domain selection
 *   otherwise         → straight into the questions
 */
export const KY_ROUTE = Object.freeze({
  BUSINESS_TYPE: 'kyBusinessType',
  DOMAIN: 'kyDomainSelect',
  QUESTIONS: 'kyQuestions',
});

export function nextRouteAfterDisclaimer(bt, knownBusinessTypeKeys) {
  if (!bt || !bt.key) return KY_ROUTE.BUSINESS_TYPE;
  // An empty or absent list means "not loaded", not "nothing is valid". The
  // visitor app (frontend/src/lib/kyFlow.js) must not re-ask a returning user
  // just because its meta request has not resolved, so the spec has to agree
  // with it exactly. Only a NON-empty list can retire a business type.
  const known = Array.isArray(knownBusinessTypeKeys) ? knownBusinessTypeKeys : [];
  if (known.length > 0 && !known.includes(String(bt.key).toLowerCase())) {
    return KY_ROUTE.BUSINESS_TYPE;
  }
  if (rootRequiresDomainSelection(resolveKyRoot(bt))) return KY_ROUTE.DOMAIN;
  return KY_ROUTE.QUESTIONS;
}
