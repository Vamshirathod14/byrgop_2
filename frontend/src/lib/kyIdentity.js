// Anonymous persistence used only to give a returning user a stable handle so
// the backend can find their unfinished Know Yourself assessment. Never used
// for tracking or anything beyond resume-of-session identification.
const ID_KEY = 'byrgop_ky_browser_id';
const EMAIL_KEY = 'byrgop_ky_email';
const REJECTED_RESUME_KEY = 'byrgop_ky_rejected_resume_session';

// Sentinel value stored in in-memory KY answers to represent a "Not Applicable"
// response (which has no optionId). Matches the backend resume sentinel so
// resumed answers restore correctly.
export const NOT_APPLICABLE_VALUE = '__NOT_APPLICABLE__';

function randomId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

// A stable per-browser identifier, created once and persisted.
export function getBrowserId() {
  try {
    const existing = localStorage.getItem(ID_KEY);
    if (existing) return existing;
  } catch (_) {}
  const id = randomId();
  try {
    localStorage.setItem(ID_KEY, id);
  } catch (_) {}
  return id;
}

// The most recently provided consent email, so an email-using user can resume
// after a refresh/full page load (their in-session state is lost on reload).
export function getSavedEmail() {
  try {
    return localStorage.getItem(EMAIL_KEY) || '';
  } catch (_) {
    return '';
  }
}

export function saveEmail(email) {
  try {
    if (email) localStorage.setItem(EMAIL_KEY, email);
    else localStorage.removeItem(EMAIL_KEY);
  } catch (_) {}
}

// The sessionId the caller explicitly chose NOT to continue ("Start New").
// Persisted so that — even after a full page reload during the same fresh
// attempt — the rejected old in-progress session is not offered again. It is
// cleared as soon as the caller makes real progress in the new assessment.
export function getRejectedResumeSession() {
  try {
    return localStorage.getItem(REJECTED_RESUME_KEY) || '';
  } catch (_) {
    return '';
  }
}

export function setRejectedResumeSession(sessionId) {
  try {
    if (sessionId) localStorage.setItem(REJECTED_RESUME_KEY, sessionId);
    else localStorage.removeItem(REJECTED_RESUME_KEY);
  } catch (_) {}
}