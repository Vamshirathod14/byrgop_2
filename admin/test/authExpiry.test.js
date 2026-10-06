import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join, resolve } from 'node:path';

/* ─────────────────────────────────────────────────────────────
   ADMIN AUTH UI — 6-hour session + expired-session redirect.

   · The visible Logout control is REMOVED from the Admin UI (Layout),
     while the underlying session-invalidation capability (AuthContext
     logout, /admin/auth/logout) is kept for internal use.
   · The client handles an expired session (server 401) by clearing the
     stored token through the unauthorized handler; a browser refresh
     after expiry then boots without a token and lands on the Login
     screen — the backend enforces the actual 6h expiry (see
     backend/test/adminAuthExpiry.test.js).
   ───────────────────────────────────────────────────────────── */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(ROOT, rel), 'utf8');
const TOKEN_KEY = 'byrgop_admin_token';

function memoryStorage(seed = {}) {
  const store = new Map(Object.entries(seed));
  return {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  };
}

function jsonResponse(status, body) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

/* Bundle the client so `import.meta.env.VITE_API_URL` resolves (define →
   {}) — the same technique the frontend radar tests use. Its only browser
   dependencies are fetch and localStorage, which we stub per test. */
async function loadClient(t, fetchImpl, seedStorage = {}) {
  const esbuild = await import('esbuild');
  const build = esbuild.build || esbuild.default.build;
  const out = await build({
    entryPoints: [join(ROOT, 'src/api/client.js')],
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'browser',
    define: { 'import.meta.env': '{}' },
    logLevel: 'silent',
  });
  const tmp = join(ROOT, 'test', `.client-${Date.now()}-${Math.random().toString(36).slice(2)}.mjs`);
  writeFileSync(tmp, out.outputFiles[0].text);
  globalThis.localStorage = memoryStorage(seedStorage);
  globalThis.fetch = fetchImpl;
  t.after(() => rmSync(tmp, { force: true }));
  return import(pathToFileURL(tmp).href);
}

test('fresh login → authenticated (token stored, /me works)', async (t) => {
  const client = await loadClient(t, async (url) => {
    if (url.endsWith('/admin/auth/login')) {
      return jsonResponse(200, { token: 'tok-123', admin: { id: 'a1', email: 'admin@byrgop.local' } });
    }
    if (url.endsWith('/admin/auth/me')) {
      return jsonResponse(200, { admin: { id: 'a1', email: 'admin@byrgop.local' } });
    }
    throw new Error(`unexpected request: ${url}`);
  });
  const api = client.default;

  const resp = await api.login('admin@byrgop.local', 'pw');
  assert.equal(resp.admin.email, 'admin@byrgop.local', 'login must return the authenticated admin');
  assert.equal(resp.token, 'tok-123', 'login must return the session token');
  // AuthContext.login persists exactly this token (auth.setToken(data.token)).
  client.auth.setToken(resp.token);
  assert.equal(client.auth.getToken(), 'tok-123', 'the session token must be stored');

  const me = await api.me();
  assert.equal(me.admin.email, 'admin@byrgop.local', 'a stored unexpired token is authenticated');
});

test('session before 6 hours → still authenticated (no forced logout)', async (t) => {
  let unauthorizedCalls = 0;
  const client = await loadClient(
    t,
    async (url) => {
      if (url.endsWith('/admin/auth/me')) {
        return jsonResponse(200, { admin: { id: 'a1', email: 'admin@byrgop.local' } });
      }
      throw new Error(`unexpected request: ${url}`);
    },
    { [TOKEN_KEY]: 'still-valid-token' }
  );
  const api = client.default;
  client.setUnauthorizedHandler(() => {
    unauthorizedCalls += 1;
  });

  const me = await api.me();
  assert.equal(me.admin.email, 'admin@byrgop.local');
  assert.equal(unauthorizedCalls, 0, 'an unexpired session must not trigger logout');
  assert.equal(client.auth.getToken(), 'still-valid-token', 'the unexpired token stays stored');
});

test('expired session (server 401) → token cleared, login required', async (t) => {
  let unauthorizedCalls = 0;
  const client = await loadClient(
    t,
    async (url) => {
      if (url.endsWith('/admin/auth/me')) {
        return jsonResponse(401, { error: 'Invalid or expired session' });
      }
      throw new Error(`unexpected request: ${url}`);
    },
    { [TOKEN_KEY]: 'expired-token' }
  );
  const api = client.default;
  client.setUnauthorizedHandler(() => {
    unauthorizedCalls += 1;
    client.auth.clearToken(); // the real AuthContext handler does exactly this
  });

  await assert.rejects(() => api.me(), (err) => err.status === 401);
  assert.equal(unauthorizedCalls, 1, 'the expired session must trigger the unauthorized handler once');
  assert.equal(client.auth.getToken(), null, 'the expired token must be cleared');
});

test('refresh after expiry → remains logged out (boot finds no token → Login)', () => {
  // AuthContext boot: no token stored → admin stays null (Login renders).
  const ctx = read('src/context/AuthContext.jsx');
  assert.match(ctx, /const token = auth\.getToken\(\);/);
  assert.match(ctx, /if \(!token\) \{[\s\S]*?setLoading\(false\)/);
  assert.match(ctx, /auth\.clearToken\(\)/, 'the expired/unauthorized path still clears the session');
  assert.match(ctx, /setAdmin\(null\)/);

  // Shell: with no admin the login screen is the only thing rendered.
  const app = read('src/App.jsx');
  assert.match(app, /if \(!admin\) return <Login \/>/);
});

test('Admin UI: visible Logout button removed, underlying capability kept', () => {
  const layout = read('src/components/Layout.jsx');
  assert.ok(!/>Logout</.test(layout), 'Layout still renders a Logout button');
  assert.ok(!/aria-label="Log ?out"/i.test(layout), 'Layout still renders a log-out control');
  assert.ok(!/logout\(\)/.test(layout), 'Layout still calls logout() from the UI');

  // The session-invalidation capability itself is retained for internal use.
  const ctx = read('src/context/AuthContext.jsx');
  assert.match(ctx, /logout/);
  const client = read('src/api/client.js');
  assert.match(client, /logout/, 'the /admin/auth/logout capability must remain available');
});