// Centralized display-label mapping for the onboarding assessment categories.
//
// The internal category key (e.g. `revenue`, used by the backend for scoring
// and session answers) is stable and never renamed. What users see is resolved
// here so the Result donut, onboarding questions and brand config all agree on
// one label per key.
//
// Only the `revenue` key currently overrides its internal key: it is presented
// as "Finances". Keys without an override fall back to their own name.
export const CATEGORY_LABELS = Object.freeze({
  strategic: 'Strategy',
  operational: 'Operations',
  revenue: 'Finances',
});

export function categoryLabel(key, fallback = null) {
  if (key == null) return fallback;
  return CATEGORY_LABELS[String(key).toLowerCase().trim()] ?? fallback;
}