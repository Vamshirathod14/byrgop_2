// Fixed six-hour session lifetime for the frontend app.
//
// This is a FIXED deadline, not an idle timeout. It is stamped once at a
// successful login and persisted with the session, so refreshing the page or
// navigating can never move it — only a fresh login starts a new six hours.
// Once the deadline passes the stored session is treated as expired and the
// user must sign in again.
//
// The Admin console enforces the same six hours server-side (the JWT it issues
// carries a 6h `exp`). Regular frontend users have no backend session, so their
// fixed deadline is enforced here, on the client.

// Exactly six hours, in milliseconds.
export const SESSION_TTL_MS = 6 * 60 * 60 * 1000;

/**
 * Build the session record persisted at login. `issuedAt`/`expiresAt` are
 * absolute epoch-ms values, so the deadline survives a reload unchanged and
 * activity never extends it.
 */
export function createSession({ user, isAdmin = false, adminToken = null }, issuedAt = Date.now()) {
  const session = {
    user,
    isAdmin,
    issuedAt,
    expiresAt: issuedAt + SESSION_TTL_MS,
  };
  if (adminToken) session.adminToken = adminToken;
  return session;
}

/**
 * A session is expired when it is missing, malformed, or at/past its fixed
 * deadline. A record with no deadline (created before this rule existed) is
 * treated as expired so the user re-authenticates once.
 */
export function isSessionExpired(session, now = Date.now()) {
  if (!session || typeof session !== 'object') return true;
  if (!Number.isFinite(session.expiresAt)) return true;
  return session.expiresAt <= now;
}

/** Milliseconds left before the fixed deadline (0 once expired). */
export function sessionRemainingMs(session, now = Date.now()) {
  if (!session || !Number.isFinite(session.expiresAt)) return 0;
  return Math.max(0, session.expiresAt - now);
}
