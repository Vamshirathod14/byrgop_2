/* ─────────────────────────────────────────────────────────────
   KNOW YOURSELF — FLOW ROUTING
   ─────────────────────────────────────────────────────────────
   One place that answers "where does the user go next?" so the
   Business tab, the Disclaimer and Change Business can never disagree.

   There is no notion of a fresh user or a returning user. Login is
   temporary and every user follows the same session flow. The only
   thing that matters is whether a Business Type has already been
   selected in the current session:

     no Business Type yet
       Business → Business Type Selection → 3 onboarding questions
                 → Disclaimer → next route

     Business Type already selected
       Business → Disclaimer → continue with the already-selected
                 Business Type

     Change Business
       Change Business → Business Type Selection, then continue with
                        the newly selected type

   The routing decision is NOT hardcoded per business type in React. It
   comes from the backend's `/know-yourself/meta` payload, which derives
   `requiresDomainSelection` from the business type's configured question
   root:

       Services      → root manufacturing-services → domain selection
       Manufacturing → root manufacturing-services → domain selection
       Start-Up       → root startup                → straight to questions
       Non-Profit    → root non-profit             → straight to questions

   A business type is only ever re-asked when nothing valid is saved, or
   when the user explicitly asked to change it. "Nothing valid" means no
   saved key at all, or a key the backend no longer recognises — never
   merely "a session was resumed".
   ───────────────────────────────────────────────────────────── */

/**
 * Shown when meta has not loaded, or for a business type no root claims.
 *
 * This is the Manufacturing & Services copy — the text that used to be
 * hard-coded in `DisclaimerScreen` and `ResultScreen` for every root, kept
 * verbatim as the fallback. It is deliberately the ONLY root's copy here: a
 * second, guessed entry per root would reintroduce exactly the bug this
 * function exists to remove.
 */
const FALLBACK_ROOT_CONTENT = Object.freeze({
  id: 'manufacturing-services',
  entity: 'your business',
  resultActionLabel: 'Your Business',
  resultHeadingLabel: 'Your Business',
  screenTitle: 'Welcome to the Profit Architecture Diagnostic (PAD)',
  terms: {
    title: 'Disclaimer & Terms of Use',
    body:
      'This diagnostic is a proprietary strategic tool intended solely for informational guidance. It does not ' +
      'constitute formal legal, financial, tax, or investment advice, and financial results are not guaranteed. ' +
      'All underlying frameworks and intellectual property remain our exclusive property and may not be reproduced ' +
      'without written consent.',
  },
  about: {
    title: 'Welcome to the Profit Architecture Diagnostic (PAD)',
    body:
      "Built on BYRGOP's Business Profit Architecture (BPA) framework, this diagnostic assesses six core " +
      'operational pillars to uncover hidden profit leaks and growth opportunities. Complete 18 targeted questions ' +
      'in 8–10 minutes to receive an immediate, complimentary report detailing prioritized optimization strategies ' +
      'for your business.',
  },
});

export const SCREEN = Object.freeze({
  BUSINESS_TYPE: 'kyBusinessType',
  DISCLAIMER: 'kyDisclaimer',
  DOMAIN_SELECT: 'kyDomainSelect',
  QUESTIONS: 'kyQuestion',
  /** The onboarding snapshot / pie result, reached after the onboarding questions. */
  ONBOARDING_RESULT: 'result',
});

/** A business type is usable only if it has a non-empty string key. */
export function isValidBusinessType(bt) {
  return !!bt && typeof bt === 'object' && typeof bt.key === 'string' && bt.key.trim() !== '';
}

/** Keys are compared the way the backend normalises them. */
function sameKey(a, b) {
  return String(a ?? '').toLowerCase().trim() === String(b ?? '').toLowerCase().trim();
}

/**
 * The meta entry for a business type, or `null`.
 *
 * `bt` is dereferenced only after `isValidBusinessType`, because `bt` is
 * routinely `null` here: the result screen renders with no business type
 * selected yet, and `kyBusinessType` starts as `null`. A caller that reaches
 * here with meta LOADED and a null type would otherwise throw on `bt.key` and
 * take the whole app down with it.
 */
function findMetaType(bt, meta) {
  const list = Array.isArray(meta?.businessTypes) ? meta.businessTypes : null;
  if (!list || !isValidBusinessType(bt)) return null;
  return list.find((t) => t?.key && sameKey(t.key, bt.key)) || null;
}

/**
 * Read `requiresDomainSelection` for a business type out of a meta payload.
 *
 * The flag lives on the meta entry, not on the saved object, so the saved
 * value stays a small { key, label } pair. When meta has not loaded yet
 * (or failed) the safe default is `true`: showing the domain-selection
 * screen for a type that does not need it is a recoverable dead end the
 * user can back out of, whereas skipping domain selection for a type that
 * does need it is a hard stop.
 */
export function requiresDomainSelection(bt, meta) {
  if (!isValidBusinessType(bt)) return true;
  const entry = findMetaType(bt, meta);
  if (!entry || typeof entry.requiresDomainSelection !== 'boolean') return true;
  return entry.requiresDomainSelection;
}

/**
 * Is this saved business type still recognised by the backend?
 * `null` meta means "not known yet" and must not invalidate a good value.
 */
export function isKnownBusinessType(bt, meta) {
  if (!isValidBusinessType(bt)) return false;
  if (!meta || !Array.isArray(meta.businessTypes) || meta.businessTypes.length === 0) return true;
  return meta.businessTypes.some((t) => t?.key && sameKey(t.key, bt.key));
}

/**
 * The single routing decision, used by the Disclaimer and by Change
 * Business. `meta` is the `/know-yourself/meta` payload.
 */
export function nextScreenAfterDisclaimer(bt, meta) {
  if (!isValidBusinessType(bt)) return SCREEN.BUSINESS_TYPE;
  if (!isKnownBusinessType(bt, meta)) return SCREEN.BUSINESS_TYPE;
  return requiresDomainSelection(bt, meta) ? SCREEN.DOMAIN_SELECT : SCREEN.QUESTIONS;
}

/** The screen that follows a Business Type selection in Change Business mode. */
export function screenAfterBusinessTypeSelect(bt, meta) {
  return nextScreenAfterDisclaimer(bt, meta);
}

/**
 * The two ways a Business Type selection screen can be opened.
 */
export const SELECTION_MODE = Object.freeze({
  /** The Business tab, first time in this session: no type selected yet. */
  SELECT: 'select',
  /** The user explicitly asked to change it. */
  CHANGE: 'change',
});

/**
 * Is this a first-time Business Type pick, or an explicit Change Business?
 *
 * This is the one distinction that survives into `handleBusinessTypeSelect`,
 * and the two modes route differently:
 *
 *   first time  Business Type → 3 onboarding questions → (see
 *               `screenAfterFirstTimeOnboarding`) → Disclaimer → next route.
 *
 *   change      Unchanged. Change Business reuses the existing rule so the
 *               user can confirm or update their domain under the new type
 *               before the assessment restarts. It is not the first time, so
 *               the onboarding waypoints do not apply.
 *
 * Anything that is not explicitly `change` is a first-time pick. `undefined`
 * and `null` therefore mean "first time", which is the safe direction: it
 * routes through the onboarding + Disclaimer waypoints rather than skipping
 * the consent gate.
 */
export function isFirstTimeSelection(mode) {
  return String(mode ?? '').trim().toLowerCase() !== SELECTION_MODE.CHANGE;
}

/**
 * The question root a business type is assessed against, as reported by
 * `/know-yourself/meta`. `null` when meta has not loaded, or when the backend
 * does not know the type.
 *
 * The root is what decides the question bank, so it is the single value the
 * rest of the flow keys off: it determines whether domain selection runs, and
 * which roots show the onboarding result before the Disclaimer.
 */
export function kyRootFor(bt, meta) {
  if (!isValidBusinessType(bt)) return null;
  const entry = findMetaType(bt, meta);
  const root = entry?.kyRoot;
  return typeof root === 'string' && root.trim() ? root.trim() : null;
}

/**
 * Roots whose first-time users see the onboarding snapshot (the pie result)
 * between the onboarding questions and the Disclaimer.
 *
 * Non-Profit is the only one. It is listed by ROOT rather than by business-type
 * key, so a future root gets the same behaviour by adding one entry here
 * instead of another branch in the component.
 */
const ROOTS_SHOWING_ONBOARDING_RESULT = Object.freeze(new Set(['non-profit']));

/** Does this business type's root show the onboarding pie before the Disclaimer? */
export function rootShowsOnboardingResult(bt, meta) {
  const root = kyRootFor(bt, meta);
  return root !== null && ROOTS_SHOWING_ONBOARDING_RESULT.has(root);
}

/**
 * Where a completed onboarding run goes, for a FIRST-TIME Business Type pick.
 *
 *   Non-Profit → the onboarding snapshot (pie result). From there the user
 *                takes the Business button, which — because the Business Type
 *                is already saved — lands on the Disclaimer directly. That
 *                reuses the one already-verified Business entry rule rather
 *                than adding a second way into the Disclaimer.
 *
 *   everything else → the Disclaimer directly. Services, Manufacturing and
 *                Start-Up keep the flow they already have, which is
 *                onboarding → Disclaimer → Domain Selection / questions.
 *
 * An unknown or unresolvable root falls to the Disclaimer: it is the consent
 * gate, so skipping it is the worse failure of the two.
 */
export function screenAfterFirstTimeOnboarding(bt, meta) {
  return rootShowsOnboardingResult(bt, meta) ? SCREEN.ONBOARDING_RESULT : SCREEN.DISCLAIMER;
}

/**
 * The screen the Business entry handler opens.
 *
 * This is the whole "is a Business Type already selected?" rule, and it is
 * deliberately only about that one fact:
 *
 *   Business Type exists in the current session → Disclaimer
 *   Business Type does not exist              → Business Type Selection
 *
 * There is no fresh-user/returning-user branch. `bt` must be the business
 * type carried forward for this session (`resolveCarriedBusinessType` of the
 * in-memory value and the persisted one), never a raw read of one source, so
 * that a stale or empty read cannot send the user back to selection.
 *
 * Change Business is unaffected: it navigates to Business Type Selection
 * explicitly, and never goes through here.
 */
export function screenAfterBusinessEntry(bt) {
  return isValidBusinessType(bt) ? SCREEN.DISCLAIMER : SCREEN.BUSINESS_TYPE;
}

/**
 * The copy a root shows on its Disclaimer and its result screen.
 *
 * `/know-yourself/meta` carries the content under `kyRoots[].content` (and
 * repeats it on each business type's own entry, so a single lookup by
 * business type is enough). Reading it from the API — the same payload that
 * decides domain selection and the question bank — is what makes it impossible
 * for the Disclaimer to describe a different kind of business than the one
 * being assessed: there is no second place where a root's wording is chosen.
 *
 * `meta === null` means "not loaded (yet)". In that case the copy falls back to
 * the Manufacturing & Services text, which is the copy this flow showed before
 * it was root-aware. The fallback is deliberately only that root's content:
 * guessing "Start-Up content for an unknown root" would be the same class of
 * bug as defaulting an unresolved root to `manufacturing-services`.
 *
 * An unresolvable root also returns the Manufacturing & Services content, so
 * an unknown business type reads the generic proprietary-strategic-tool terms
 * rather than being told it is a Foundation or an Enterprise.
 */
export function rootContentFor(bt, meta) {
  const fromRootList = (rootId) => {
    const roots = Array.isArray(meta?.kyRoots) ? meta.kyRoots : null;
    return (roots || []).find((r) => r?.id === rootId) || null;
  };

  // A business type's own entry wins: it is already root-resolved by the
  // backend, so this is one lookup rather than two.
  const fromType = findMetaType(bt, meta)?.content;
  if (fromType && typeof fromType === 'object') return fromType;

  const rootId = kyRootFor(bt, meta);
  if (rootId) {
    const fromRoot = fromRootList(rootId)?.content;
    if (fromRoot && typeof fromRoot === 'object') return fromRoot;
  }
  return FALLBACK_ROOT_CONTENT;
}

/**
 * The single label the result screen's navigation button shows for a root.
 *
 *   manufacturing-services → Your Business
 *   startup                 → Your Enterprise
 *   non-profit              → Your Foundation
 *
 * Never hard-coded in `ResultScreen`: the button used to read "Your Business"
 * for every root, so a Non-Profit user was told to press "Your Business" to
 * reach their Foundation assessment.
 */
export function resultActionLabelFor(bt, meta) {
  return rootContentFor(bt, meta)?.resultActionLabel || 'Your Business';
}

/** The same label as used in the result screen's "… Snapshot" heading. */
export function resultHeadingLabelFor(bt, meta) {
  return rootContentFor(bt, meta)?.resultHeadingLabel || 'Your Business';
}

/**
 * Resolve the business type to carry forward.
 *
 * This is the fix for the intermittent re-prompt: a resume or a Business tab
 * re-entry must never DOWNGRADE a valid selection. The saved/in-memory value
 * wins; a newly supplied value is only adopted when it is actually valid.
 * `null` is only returned when there is genuinely nothing usable.
 */
export function resolveCarriedBusinessType({ current = null, incoming = null, meta = null } = {}) {
  if (isValidBusinessType(current) && isKnownBusinessType(current, meta)) return current;
  if (isValidBusinessType(incoming) && isKnownBusinessType(incoming, meta)) return incoming;
  return null;
}
