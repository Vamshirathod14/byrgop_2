import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import {
  SESSION_TTL_MS,
  createSession,
  isSessionExpired,
  sessionRemainingMs,
} from '../src/lib/sessionExpiry.js';

/* ─────────────────────────────────────────────────────────────
   FRONTEND SESSION EXPIRY — a regular user's session lasts EXACTLY
   six hours from login, regardless of activity.

   The Admin console enforces the same window server-side (JWT `exp`);
   these tests cover the frontend equivalent for users who have no
   backend session. The session record is stamped at login and its
   absolute `expiresAt` is what is enforced, so a refresh/navigation
   (which merely re-reads the record) can never extend it.
   ───────────────────────────────────────────────────────────── */

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(ROOT, rel), 'utf8');

test('session TTL is exactly six hours', () => {
  assert.equal(SESSION_TTL_MS, SIX_HOURS_MS);
});

test('createSession stamps a fixed deadline six hours after login', () => {
  const issuedAt = 1_700_000_000_000;
  const s = createSession({ user: 'vamshi' }, issuedAt);

  assert.equal(s.user, 'vamshi');
  assert.equal(s.isAdmin, false);
  assert.equal(s.issuedAt, issuedAt);
  assert.equal(s.expiresAt, issuedAt + SIX_HOURS_MS, 'deadline must be login + 6h');
  assert.ok(!('adminToken' in s), 'a regular user session carries no admin token');
});

test('createSession carries the admin token on the admin sign-in path', () => {
  const issuedAt = 42;
  const s = createSession({ user: 'admin@byrgop.local', isAdmin: true, adminToken: 'tok-1' }, issuedAt);

  assert.equal(s.isAdmin, true);
  assert.equal(s.adminToken, 'tok-1');
  assert.equal(s.expiresAt, issuedAt + SIX_HOURS_MS);
});

test('a session is live until the six-hour mark, then expired', () => {
  const issuedAt = 5_000;
  const s = createSession({ user: 'vamshi' }, issuedAt);

  assert.equal(isSessionExpired(s, issuedAt), false, 'fresh login is live');
  assert.equal(isSessionExpired(s, issuedAt + SIX_HOURS_MS - 1), false, 'one ms before 6h is still live');
  assert.equal(isSessionExpired(s, issuedAt + SIX_HOURS_MS), true, 'exactly 6h is expired');
  assert.equal(isSessionExpired(s, issuedAt + SIX_HOURS_MS + 1), true, 'after 6h is expired');
});

test('refresh/navigation cannot extend the deadline (absolute, not activity-based)', () => {
  const issuedAt = 10_000;
  const s = createSession({ user: 'vamshi' }, issuedAt);
  // Re-reading the persisted record (what a refresh does) keeps the SAME
  // deadline — there is no sliding window.
  const afterRefresh = JSON.parse(JSON.stringify(s));
  assert.equal(afterRefresh.expiresAt, s.expiresAt);

  const atFiveToSix = issuedAt + SIX_HOURS_MS - (5 * 60 * 1000);
  assert.equal(isSessionExpired(afterRefresh, atFiveToSix), false);
  // Five minutes later the session is expired with no activity in between.
  assert.equal(isSessionExpired(afterRefresh, issuedAt + SIX_HOURS_MS), true);
});

test('sessionRemainingMs counts down to the deadline and floors at 0', () => {
  const issuedAt = 1_000;
  const s = createSession({ user: 'vamshi' }, issuedAt);

  assert.equal(sessionRemainingMs(s, issuedAt), SIX_HOURS_MS);
  assert.equal(sessionRemainingMs(s, issuedAt + SIX_HOURS_MS - 60_000), 60_000);
  assert.equal(sessionRemainingMs(s, issuedAt + SIX_HOURS_MS), 0, 'expired → 0, never negative');
  assert.equal(sessionRemainingMs(s, issuedAt + SIX_HOURS_MS + 10_000), 0);
});

test('a session with no fixed deadline (legacy/pre-existing) is treated as expired', () => {
  assert.equal(isSessionExpired(null), true);
  assert.equal(isSessionExpired(undefined), true);
  assert.equal(isSessionExpired({ user: 'vamshi' }), true, 'no deadline → must re-authenticate');
  assert.equal(isSessionExpired({ user: 'vamshi', expiresAt: 'later' }), true, 'non-numeric deadline → expired');
  assert.equal(sessionRemainingMs({ user: 'vamshi' }), 0);
});

test('App wires the fixed deadline into login, restore, runtime and logout', () => {
  const app = read('src/App.jsx');
  assert.match(app, /createSession\(/, 'login builds a session with a fixed deadline');
  assert.match(app, /isSessionExpired\(/, 'boot rejects an expired stored session');
  assert.match(app, /setSessionExpiresAt/, 'the deadline is tracked in state');
  assert.match(app, /setTimeout\(\(\) => handleLogout\(\)/, 'a timer enforces the deadline while open');
  assert.match(app, /clearSession\(\);\s*\n\s*setSessionExpiresAt\(null\)/, 'logout clears the deadline');
});
