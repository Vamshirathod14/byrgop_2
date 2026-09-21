// Intro-screen onboarding business types.
//
// The 3-question onboarding flow starts by asking which kind of business the
// user runs. Each type resolves its own three Yes/No questions from the
// assessment question bank (Question model, scoped by `businessType`). The
// four types are fixed product choices; the questions themselves are
// Admin-managed per type.
export const ONBOARDING_BUSINESS_TYPES = [
  { key: 'service', label: 'Services' },
  { key: 'manufacturing', label: 'Manufacturing' },
  { key: 'nonprofit', label: 'Non-Profit' },
  { key: 'startup', label: 'Startup' },
];

export const ONBOARDING_BUSINESS_TYPE_KEYS = ONBOARDING_BUSINESS_TYPES.map(
  (t) => t.key
);

export const ONBOARDING_BUSINESS_TYPE_SET = new Set(ONBOARDING_BUSINESS_TYPE_KEYS);

export function isValidOnboardingBusinessType(key) {
  if (key == null || key === '') return false;
  return ONBOARDING_BUSINESS_TYPE_SET.has(String(key).trim().toLowerCase());
}

export function onboardingBusinessTypeLabel(key) {
  if (key == null) return null;
  const t = ONBOARDING_BUSINESS_TYPES.find(
    (t) => t.key === String(key).trim().toLowerCase()
  );
  return t ? t.label : null;
}