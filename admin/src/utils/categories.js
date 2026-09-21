// Centralized display-label mapping for the onboarding assessment categories.
//
// Internal category keys (e.g. `revenue`) are stored in the database and used
// in scoring/session data — they never change. What admins see must match the
// user-facing presentation, so display labels are resolved through this single
// source of truth (mirrors backend/src/config/categoryLabels.js). Keys without
// an override fall back to the name configured in the database.
export const CATEGORY_DISPLAY_LABELS = Object.freeze({
  strategic: 'Strategy',
  operational: 'Operations',
  revenue: 'Finances',
});

export function categoryDisplayName(key, fallback = null) {
  if (key == null) return fallback;
  return CATEGORY_DISPLAY_LABELS[String(key).toLowerCase().trim()] ?? fallback;
}