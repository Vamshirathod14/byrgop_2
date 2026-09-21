// Centralized display-label mapping for the onboarding assessment categories.
//
// The internal category keys (e.g. `revenue`, used in the DB, scoring and
// session answers) are stable and must never be renamed. What users and admins
// see goes through this single source of truth so every surface agrees on one
// label per key. The labels match the established presentation ("Strategy",
// "Operations", "Finances") and the Know Yourself six-pillar naming scheme.
// Keys without an override (e.g. custom admin-created categories) fall back to
// their own name so nothing else is renamed.
export const CATEGORY_DISPLAY_LABELS = Object.freeze({
  strategic: 'Strategy',
  operational: 'Operations',
  revenue: 'Finances',
});

// Resolve the user-facing label for a category key. `fallback` (usually the
// database `name` field) is returned when no display override exists.
export function categoryDisplayName(key, fallback = null) {
  if (key == null) return fallback;
  return CATEGORY_DISPLAY_LABELS[String(key).toLowerCase().trim()] ?? fallback;
}