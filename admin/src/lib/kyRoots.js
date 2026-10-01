/* ─────────────────────────────────────────────────────────────
   KNOW YOURSELF — ADMIN QUESTION ROOTS
   ─────────────────────────────────────────────────────────────
   The Admin panel manages the Know Yourself question bank through
   three INDEPENDENT roots. Each root has its own business types, its
   own question bank and its own six-pillar structure, so a Start-Up
   question can never be filed under a Services pillar (or vice
   versa) by accident.

     root id                  admin label            business types
     ───────────────────────  ─────────────────────  ─────────────
     manufacturing-services   Mfg & Services         service, product
     startup                  Start-Up                startup
     non-profit               Non-Profit             ngo

   The three root IDs are the backend's fixed vocabulary and mirror
   `backend/src/config/kyQuestionRoots.js`. Only the labels live here;
   WHICH questions and pillars belong to a root is always read from the
   API (`/admin/know-yourself/categories?grouped=true` and each business
   type's `kyRoot`), so this file can never drift into deciding data
   membership on its own.

   `requiresDomainSelection` is shown in the UI for clarity but is also
   read from the API; the constant is only the pre-load fallback.

   `managesPillarsInline` marks the roots whose workspace shows the pillar
   management section in the page itself, next to the questions, instead of
   behind a tab. It is declared per root rather than derived from
   `requiresDomainSelection` so the shared Manufacturing & Services root can
   never be opted in by accident — its pillar UI is the pre-existing, frozen
   one, and `false` here is what keeps it that way.

   The sidebar has ONE `KY Questions` entry, not one per root — the
   per-root `navLabel` field this table used to carry is gone with it.
   `KY_NAV_ENTRIES` below is what the page offers instead.
   ───────────────────────────────────────────────────────────── */

export const KY_ROOTS = [
  {
    id: 'manufacturing-services',
    label: 'Mfg & Services',
    short: 'Manufacturing & Services',
    businessTypes: ['service', 'product'],
    requiresDomainSelection: true,
    // FALSE, and it stays false. Manufacturing and Services keep the exact
    // pillar UI they have always had — a tab that opens the pre-existing
    // pillar page. This flag is the only thing that could pull them into the
    // inline pillar manager, so it is the guard that keeps them frozen.
    managesPillarsInline: false,
    accent: 'text-sky-600',
    blurb:
      'Shared questions and the shared six-pillar result structure used by Services and Manufacturing. Both types run the domain-selection step.',
  },
  {
    id: 'startup',
    label: 'Start-Up',
    short: 'Start-Up',
    businessTypes: ['startup'],
    requiresDomainSelection: false,
    // Start-Up administers its own pillars: the workspace renders the pillar
    // management section itself, so a pillar can be added, renamed, retired or
    // restored without leaving the page.
    managesPillarsInline: true,
    accent: 'text-emerald-600',
    blurb:
      'Start-Up has its own question bank and its own six pillars. There is no domain-selection step — users go from the disclaimer straight into the 18 questions.',
  },
  {
    id: 'non-profit',
    label: 'Non-Profit',
    short: 'Non-Profit',
    businessTypes: ['ngo'],
    requiresDomainSelection: false,
    // Same as Start-Up, and for the same reason: these two roots own their pillar
    // sets outright, so the six pillars and any pillar added later are Admin's
    // to manage from the Non-Profit page itself.
    managesPillarsInline: true,
    accent: 'text-violet-600',
    blurb:
      'Non-Profit has its own question bank and its own six pillars. There is no domain-selection step — users go from the disclaimer straight into the 18 questions.',
  },
];

export const DEFAULT_KY_ROOT = KY_ROOTS[0].id;

export const KY_ROOT_IDS = KY_ROOTS.map((r) => r.id);

/* ─────────────────────────────────────────────────────────────
   THE UNIFIED "KY Questions" AREA

   Admin has ONE KY Questions entry. Inside it the four things an
   editor can work on are selectable:

     Manufacturing   manufacturing-services root · businessType 'product'
     Services        manufacturing-services root · businessType 'service'
     Start-Up         startup root
     Non-Profit      non-profit root

   Manufacturing and Services are NOT two roots. They are two business
   types inside the single `manufacturing-services` root, and they share
   that root's question bank, its six pillars and its whole domain
   system. So they are expressed here as the same root with different
   `businessType` values, and the page they render is the existing,
   unmodified Mfg & Services page.

   Start-Up and Non-Profit each own their root outright, so they carry
   `businessType: null` and render the same page scoped to their root.

   `businessType` is a VIEW filter, not a data filter: the questions
   shown are the ones the existing per-business-type tab already shows
   (same predicate, `inBusinessType`). Nothing about how a question is
   stored, validated or saved changes when one of these is selected.
   ───────────────────────────────────────────────────────────── */
export const KY_NAV_ENTRIES = [
  { key: 'manufacturing', label: 'Manufacturing', root: 'manufacturing-services', businessType: 'product' },
  { key: 'services', label: 'Services', root: 'manufacturing-services', businessType: 'service' },
  { key: 'startup', label: 'Start-Up', root: 'startup', businessType: null },
  { key: 'non-profit', label: 'Non-Profit', root: 'non-profit', businessType: null },
];

export const DEFAULT_KY_NAV_KEY = 'manufacturing';

export const KY_NAV_KEYS = KY_NAV_ENTRIES.map((e) => e.key);

export function isKyNavKey(value) {
  return KY_NAV_KEYS.includes(String(value || '').toLowerCase().trim());
}

/** The nav entry for a key. Falls back to Manufacturing so no page is unnamed. */
export function getKyNavEntry(key) {
  return KY_NAV_ENTRIES.find((e) => e.key === key) || KY_NAV_ENTRIES[0];
}

/**
 * The label for a nav entry, preferring the live `name` of the business type
 * from the API so renaming "Manufacturing" in the database renames it here.
 * Start-Up and Non-Profit have no `businessType` of their own in this table, so
 * they fall back to the constant and to their root's own short name.
 */
export function navLabelFor(entry, businessTypes) {
  if (!entry) return '';
  if (!entry.businessType) return getKyRoot(entry.root).short;
  const live = Array.isArray(businessTypes)
    ? businessTypes.find((bt) => bt?.key === entry.businessType)?.name
    : null;
  return live || entry.label;
}

export function getKyRoot(id) {
  return KY_ROOTS.find((r) => r.id === id) || KY_ROOTS[0];
}

/**
 * Whether this root's workspace renders the inline pillar manager.
 *
 * Deliberately NOT derived from `requiresDomainSelection`: the shared
 * Manufacturing & Services root has domains and is frozen, so tying the two
 * together would mean any future domain-less root silently inherited a new
 * pillar UI, and one future flag flip would have moved Manufacturing & Services
 * onto it. It is an explicit per-root property instead, and it is false for the
 * root that must not change.
 */
export function managesPillarsInline(rootId) {
  return getKyRoot(rootId).managesPillarsInline === true;
}

export function isKyRootId(value) {
  return KY_ROOT_IDS.includes(String(value || '').toLowerCase().trim());
}

/**
 * Business types belonging to a root.
 *
 * Prefers the live `businessTypes` array from the API (each row carries its
 * own `kyRoot`); the constants in this file are only the fallback used before
 * that request resolves or if it fails.
 */
export function businessTypesForRoot(rootId, businessTypes) {
  const root = getKyRoot(rootId);
  if (Array.isArray(businessTypes) && businessTypes.length > 0) {
    const keys = businessTypes
      .filter((bt) => String(bt?.kyRoot || '') === root.id)
      .map((bt) => bt.key)
      .filter(Boolean);
    if (keys.length) return keys;
  }
  return root.businessTypes;
}

/** Every business type key in every root — used by "All KY questions". */
export function allBusinessTypeKeys(businessTypes) {
  return KY_ROOTS.flatMap((r) => businessTypesForRoot(r.id, businessTypes));
}
