import { test } from 'node:test';
import assert from 'node:assert/strict';

/* ─────────────────────────────────────────────────────────────
   ADMIN SESSION EXPIRY — the Admin login session lasts EXACTLY 6 hours.

   Server-side enforcement is mandatory, so these tests drive the real
   signing/verifying code path (adminAuth.signToken / requireAdminAuth and
   the login controller). The Admin model and audit service are mocked at
   the module level (node --experimental-test-module-mocks), exactly like
   the other backend unit suites, so the suite is hermetic — no Mongo, no
   real accounts, no stored data.

   Covered:
     · fresh login → authenticated
     · session before 6 hours → authenticated
     · session at / after 6 hours → expired (server-side, via exp)
     · expired token → login required (401, before any DB lookup)
   ───────────────────────────────────────────────────────────── */

const SECRET = 'admin-auth-expiry-test-secret';
if (!process.env.ADMIN_JWT_SECRET) process.env.ADMIN_JWT_SECRET = SECRET;

const SIX_HOURS_SEC = 6 * 60 * 60;

const fakeAdmin = {
  _id: '64abc0000000000000000001',
  name: 'Auth Tester',
  email: 'auth@byrgop.local',
  role: 'SUPER_ADMIN',
  active: true,
  tokenVersion: 2,
  permissions: [],
};

/* Query string forces a fresh module instance so each test sees its own mock
   (the pattern used by analytics.test.js / reportRequest.test.js). */
async function loadAdminAuth(t, adminImpl) {
  await t.mock.module('../src/models/Admin.js', {
    defaultExport: adminImpl,
    namedExports: { ALL_PERMISSIONS: [] },
  });
  return import(`../src/middleware/adminAuth.js?t=${Date.now()}-${Math.random()}`);
}

function makeRes() {
  const res = { statusCode: 200, body: null };
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (body) => {
    res.body = body;
    return res;
  };
  return res;
}

test('fresh login token is immediately authenticated', async (t) => {
  const auth = await loadAdminAuth(t, {
    findById: async (id) => (id === fakeAdmin._id ? fakeAdmin : null),
  });
  const token = auth.signToken(fakeAdmin);

  const req = { headers: { authorization: `Bearer ${token}` }, admin: null };
  const res = makeRes();
  let nexted = false;
  await auth.requireAdminAuth(req, res, () => {
    nexted = true;
  });

  assert.equal(nexted, true, 'a freshly issued token must pass authentication');
  assert.equal(res.statusCode, 200, 'authenticated request must not be rejected');
  assert.equal(req.admin.email, fakeAdmin.email, 'the authenticated admin must be attached to the request');
});

test('token lifetime is exactly 6 hours (before 6h auth OK, at/after 6h expired)', async (t) => {
  const jwt = (await import('jsonwebtoken')).default;
  const auth = await loadAdminAuth(t, { findById: async () => null });
  const token = auth.signToken(fakeAdmin);

  const payload = jwt.decode(token);
  assert.ok(payload && payload.iat && payload.exp, 'token must carry iat/exp');
  assert.equal(
    payload.exp - payload.iat,
    SIX_HOURS_SEC,
    `session must expire after exactly 6h, got ${payload.exp - payload.iat}s`
  );

  // Session before 6 hours → still authenticated.
  assert.doesNotThrow(
    () => jwt.verify(token, SECRET, { clockTimestamp: payload.iat + SIX_HOURS_SEC - 60 }),
    'one minute before the 6h mark the session must still verify'
  );

  // Session at exactly 6 hours → expired.
  assert.throws(
    () => jwt.verify(token, SECRET, { clockTimestamp: payload.iat + SIX_HOURS_SEC }),
    jwt.TokenExpiredError,
    'at the 6h mark the session must be expired'
  );

  // Session after 6 hours → expired.
  assert.throws(
    () => jwt.verify(token, SECRET, { clockTimestamp: payload.iat + SIX_HOURS_SEC + 3600 }),
    jwt.TokenExpiredError,
    'after 6h the session must be expired'
  );
});

test('expired token/session → 401 login required (checked before any DB lookup)', async (t) => {
  const jwt = (await import('jsonwebtoken')).default;
  // If the middleware ever consulted the model for an expired token, this
  // mock throws — proving expiry is enforced purely on the token, server-side.
  const auth = await loadAdminAuth(t, {
    findById: async () => {
      throw new Error('DB must not be consulted for an expired token');
    },
  });

  const expired = jwt.sign(
    { sub: fakeAdmin._id, role: fakeAdmin.role, tv: fakeAdmin.tokenVersion },
    SECRET,
    { expiresIn: -3600 } // expired in the past
  );

  const res = makeRes();
  let nexted = false;
  await auth.requireAdminAuth({ headers: { authorization: `Bearer ${expired}` } }, res, () => {
    nexted = true;
  });

  assert.equal(res.statusCode, 401, 'expired session must be rejected with 401');
  assert.equal(res.body.error, 'Invalid or expired session');
  assert.equal(nexted, false, 'the protected handler must not run for an expired session');
});

test('login: an unexpired 6h token is issued on fresh credentials', async (t) => {
  const bcrypt = (await import('bcryptjs')).default;
  const hash = await bcrypt.hash('correct-horse-6h', 4);
  const doc = {
    ...fakeAdmin,
    passwordHash: hash,
    save: async function () {
      this.lastLoginAt = new Date();
    },
    toSafeJSON: () => ({ id: fakeAdmin._id, email: fakeAdmin.email, role: fakeAdmin.role }),
  };

  const audit = { calls: 0 };
  await t.mock.module('../src/models/Admin.js', {
    defaultExport: { findOne: async ({ email }) => (email === fakeAdmin.email ? doc : null) },
    namedExports: { ALL_PERMISSIONS: [] },
  });
  await t.mock.module('../src/services/auditService.js', {
    namedExports: {
      logAudit: async () => {
        audit.calls += 1;
      },
      getClientIp: (req) => req?.ip || '127.0.0.1',
    },
  });
  const ctl = await import(`../src/controllers/adminAuthController.js?t=${Date.now()}-${Math.random()}`);

  const req = { body: { email: fakeAdmin.email, password: 'correct-horse-6h' }, ip: '10.0.0.1' };
  const res = makeRes();
  await ctl.login(req, res);

  assert.equal(res.statusCode, 200, 'valid credentials must log in');
  assert.ok(res.body && res.body.token, 'login must return a session token');
  const jwt = (await import('jsonwebtoken')).default;
  const payload = jwt.decode(res.body.token);
  assert.equal(payload.exp - payload.iat, SIX_HOURS_SEC, 'fresh login session must be exactly 6h');
  assert.ok(audit.calls >= 1, 'a successful login must be audited');
});

test('invalid credentials still fail with a uniform 401', async (t) => {
  const bcrypt = (await import('bcryptjs')).default;
  const hash = await bcrypt.hash('correct-horse-6h', 4);
  const doc = {
    ...fakeAdmin,
    passwordHash: hash,
    save: async function () {},
    toSafeJSON: () => ({}),
  };
  await t.mock.module('../src/models/Admin.js', {
    defaultExport: { findOne: async ({ email }) => (email === fakeAdmin.email ? doc : null) },
    namedExports: { ALL_PERMISSIONS: [] },
  });
  await t.mock.module('../src/services/auditService.js', {
    namedExports: {
      logAudit: async () => {},
      getClientIp: (req) => req?.ip || '127.0.0.1',
    },
  });
  const ctl = await import(`../src/controllers/adminAuthController.js?t=${Date.now()}-${Math.random()}`);

  const req = { body: { email: fakeAdmin.email, password: 'wrong-password' }, ip: '10.0.0.1' };
  const res = makeRes();
  await ctl.login(req, res);

  assert.equal(res.statusCode, 401);
  assert.equal(res.body.error, 'Invalid email or password');
});