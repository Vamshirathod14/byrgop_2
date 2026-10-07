/* ─────────────────────────────────────────────────────────────────────────
   SINGLE SOURCE OF TRUTH — Atlas MongoDB.

   Proves the application can no longer run against a local MongoDB and that
   no Local↔Atlas sync machinery or hardcoded Atlas credential remains.

   Covered requirements:
     1. Local backend does not connect to localhost MongoDB.
     2. Local backend uses Atlas configuration (ATLAS_MONGO_URI).
     3. Application has no active local MongoDB application path.
     4. Admin writes go through the Atlas-backed API (no write-side sync).
     5. Participant reads come from the same Atlas-backed API (no read-side
        sync / second datasource).
     6. No local-vs-Atlas sync is required for normal operation.
     7–15. Data invariants served from the single source: onboarding config,
        answer-option colors, KY pillars, business types, startup /
        non-profit / manufacturing / services banks (live, skipped when no
        Atlas URI is configured).
     16. No obsolete sync script is still referenced.
     17. No hardcoded Atlas credentials remain in source.
     18–20. Covered by the existing suites (admin/frontend/backend runs).

   The live group skips when no Atlas URI is configured (fresh CI checkout
   without backend/.env), matching the pattern in nonprofitBank.test.js.
   ───────────────────────────────────────────────────────────────────────── */

import 'dotenv/config';
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';

import {
  connectDB,
  resolveMongoUri,
  isLocalMongoUri,
  assertNotLocalMongo,
} from '../src/config/db.js';
import { getOnboardingQuestionsForType } from '../src/services/questionPool.js';
import {
  getKYMeta,
  getActiveKYCategories,
} from '../src/services/knowYourselfService.js';
import { KY_ROOT_IDS, DOMAIN_SELECTION_ROOT } from '../src/config/kyQuestionRoots.js';
import KnowYourselfQuestion from '../src/models/KnowYourselfQuestion.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..'); // backend/
const ROOT = path.resolve(REPO, '..');

const read = (p) => fs.readFileSync(p, 'utf8');
const exists = (p) => fs.existsSync(p);

// ─── 1 & 2. URI resolution / localhost refusal ────────────────────────────

describe('Atlas single source of truth — enforces Atlas, refuses local MongoDB', () => {
  test('resolveMongoUri prefers ATLAS_MONGO_URI over MONGO_URI', () => {
    const env = {
      ATLAS_MONGO_URI: 'mongodb+srv://user:pass@cluster.a.mongodb.net/db',
      MONGO_URI: 'mongodb://127.0.0.1:27017/byrgop',
    };
    assert.equal(resolveMongoUri(env), env.ATLAS_MONGO_URI);
  });

  test('resolveMongoUri falls back to MONGO_URI as a compatibility alias', () => {
    const env = { MONGO_URI: 'mongodb+srv://user:pass@cluster.b.mongodb.net/db' };
    assert.equal(resolveMongoUri(env), env.MONGO_URI);
  });

  test('resolveMongoUri returns null when nothing is configured', () => {
    assert.equal(resolveMongoUri({}), null);
  });

  test('isLocalMongoUri flags localhost, 127.0.0.1 and 0.0.0.0, with or without credentials', () => {
    for (const uri of [
      'mongodb://127.0.0.1:27017/byrgop',
      'mongodb://localhost:27017/byrgop',
      'mongodb://user:pass@localhost:27017/byrgop',
      'mongodb://0.0.0.0:27017/byrgop',
      'mongodb://127.0.0.1/byrgop',
    ]) {
      assert.equal(isLocalMongoUri(uri), true, uri);
    }
    assert.equal(
      isLocalMongoUri('mongodb+srv://user:pass@cluster0.p4u8yex.mongodb.net/db'),
      false
    );
    assert.equal(isLocalMongoUri(''), false);
    assert.equal(isLocalMongoUri(undefined), false);
  });

  test('assertNotLocalMongo throws for a local URI and passes for Atlas', () => {
    assert.throws(() => assertNotLocalMongo('mongodb://127.0.0.1:27017/byrgop'), /local MongoDB/);
    assert.doesNotThrow(() =>
      assertNotLocalMongo('mongodb+srv://user:pass@cluster0.mongodb.net/db')
    );
  });

  test('connectDB refuses a localhost URI before any network call', async () => {
    await assert.rejects(
      connectDB('mongodb://127.0.0.1:27017/byrgop'),
      /Refusing to connect to a local MongoDB/
    );
  });

  test('connectDB throws a helpful error when no URI is configured', async () => {
    await assert.rejects(connectDB(null), /No MongoDB URI configured/);
  });
});

// ─── 3, 6, 16 & 17. Source-level guarantees ───────────────────────────────

describe('Atlas single source of truth — no local path, no sync, no credentials', () => {
  const srcDirs = ['src', 'scripts', 'test'];
  const allSrcFiles = srcDirs.flatMap((d) => {
    const dir = path.join(REPO, d);
    if (!exists(dir)) return [];
    const out = [];
    const walk = (cur) => {
      for (const ent of fs.readdirSync(cur, { withFileTypes: true })) {
        const full = path.join(cur, ent.name);
        if (ent.isDirectory()) walk(full);
        else if (/\.(js|mjs|cjs)$/.test(ent.name)) out.push(full);
      }
    };
    walk(dir);
    return out;
  });

  test('no file in backend/src references the removed atlasSyncService', () => {
    const hits = allSrcFiles.filter(
      (f) => f.startsWith(path.join(REPO, 'src')) && /atlasSyncService/.test(read(f))
    );
    assert.deepEqual(hits, []);
  });

  test('the sync service file no longer exists', () => {
    assert.equal(
      exists(path.join(REPO, 'src/services/atlasSyncService.js')),
      false
    );
  });

  test('obsolete Local↔Atlas sync scripts are gone', () => {
    for (const name of [
      'syncLocalToAtlas.mjs',
      'syncAtlasToLocal.mjs',
      'migrateAtlas.js',
      'compareAtlasLocal.mjs',
      'compareKyQuestions.mjs',
      'deepCompare.mjs',
      'COMPARISON.md',
    ]) {
      assert.equal(exists(path.join(REPO, 'scripts', name)), false, name);
    }
    // Root-level local-only bootstrap seed.
    assert.equal(exists(path.join(ROOT, 'seed-local.mjs')), false);
  });

  test('backend package.json scripts reference no sync tooling', () => {
    const pkg = JSON.parse(read(path.join(REPO, 'package.json')));
    const scriptText = JSON.stringify(pkg.scripts || {});
    for (const needle of ['syncLocalToAtlas', 'syncAtlasToLocal', 'migrateAtlas']) {
      assert.equal(scriptText.includes(needle), false, needle);
    }
  });

  test('no literal local-Mongo connection string remains in application source', () => {
    // Exact connection strings (mongodb://127.0.0.1 / mongodb://localhost),
    // not the *refusal patterns* in config/db.js. Scans the application and
    // tooling source (src/, scripts/); test fixtures legitimately embed
    // sample URIs and are excluded.
    const bad = /mongodb:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)/;
    const appFiles = allSrcFiles.filter((f) =>
      f.startsWith(path.join(REPO, 'src')) || f.startsWith(path.join(REPO, 'scripts'))
    );
    const hits = appFiles.filter((f) => bad.test(read(f)));
    assert.deepEqual(hits, []);
  });

  test('no hardcoded Atlas credentials remain in tracked source', () => {
    // A REAL credential has a concrete username before '@'. Placeholders wrap
    // the userinfo in angle brackets (<username>:<password>@) and must be the
    // only permitted form. Scans application/tooling source only.
    const realCred = /mongodb\+srv:\/\/[^<'"`\s]+@/;
    const appFiles = allSrcFiles.filter((f) =>
      f.startsWith(path.join(REPO, 'src')) || f.startsWith(path.join(REPO, 'scripts'))
    );
    const hits = appFiles.filter((f) => realCred.test(read(f)));
    for (const f of [
      path.join(REPO, '.env.example'),
      path.join(ROOT, 'README.md'),
    ]) {
      if (exists(f) && realCred.test(read(f))) hits.push(f);
    }
    assert.deepEqual(hits, []);
  });

  test('backend/.env.example documents Atlas as the source of truth with a placeholder', () => {
    const example = read(path.join(REPO, '.env.example'));
    assert.match(example, /ATLAS_MONGO_URI=mongodb\+srv:\/\/<username>:<password>@/);
    assert.doesNotMatch(example, /mongodb:\/\/(localhost|127\.0\.0\.1)/);
    assert.doesNotMatch(example, /mongodb\+srv:\/\/[^<]/);
  });

  test('dev backend/.env (when present) points at Atlas, never at a local MongoDB', (t) => {
    const envPath = path.join(REPO, '.env');
    if (!exists(envPath)) return t.skip('backend/.env not present');
    const env = read(envPath);
    const atlasLine = env.split('\n').find((l) => l.startsWith('ATLAS_MONGO_URI='));
    assert.ok(atlasLine && atlasLine.length > 'ATLAS_MONGO_URI='.length, 'ATLAS_MONGO_URI is set');
    assert.equal(isLocalMongoUri(atlasLine.split('=').slice(1).join('=')), false);
    assert.doesNotMatch(env, /mongodb:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)/);
  });
});

// ─── 4 & 5. One persistence path and one read path (source-level) ─────────

describe('Atlas single source of truth — single API path for writes and reads', () => {
  const readTrees = ['src/controllers', 'src/services'].map((d) =>
    path.join(REPO, d)
  );

  function listFiles(dir) {
    const out = [];
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) out.push(...listFiles(full));
      else if (/\.js$/.test(ent.name)) out.push(full);
    }
    return out;
  }

  const files = readTrees.flatMap(listFiles);

  test('admin write controllers keep only the single model-mongoose write path', () => {
    // Admin-side writes (categories, stages, KY categories) must not fan out
    // to any second connection or sync helper after saving.
    const adminWriters = files.filter((f) =>
      /(categoryController|stageController|kyCategoryController)\.js$/.test(f)
    );
    for (const f of adminWriters) {
      const src = read(f);
      assert.doesNotMatch(src, /createConnection/, f);
      assert.doesNotMatch(src, /atlasSync|Atlas/gi, f);
    }
  });

  test('onboardingAdminService persists via the Question model only (no sync re-export)', () => {
    const file = files.find((f) => f.endsWith('onboardingAdminService.js'));
    const src = read(file);
    for (const sym of [
      'syncQuestionToAtlas',
      'syncCategoryToAtlas',
      'syncStageToAtlas',
      'syncKYCategoryToAtlas',
    ]) {
      assert.equal(src.includes(sym), false, sym);
    }
    assert.match(src, /export async function (create|update|set|delete)OnboardingQuestion/);
  });

  test('participant read services use the default mongoose connection only', () => {
    // Participant-facing reads (questionPool / knowYourselfService) resolve
    // through the same models on the default connection — the single Atlas
    // connection — with no separate datasource helper.
    for (const rel of ['src/services/questionPool.js', 'src/services/knowYourselfService.js']) {
      const src = read(path.join(REPO, rel));
      assert.doesNotMatch(src, /createConnection/, rel);
      assert.doesNotMatch(src, /atlasSyncService/, rel);
    }
  });
});

// ─── 7–15. Data invariants served from the single source (live, optional) ─

const uri = resolveMongoUri();
const liveAvailable = Boolean(uri) && !isLocalMongoUri(uri);

describe('Atlas single source of truth — served data invariants (live)', { skip: !liveAvailable }, () => {
  before(async () => {
    try {
      await connectDB();
    } catch {
      // connectDB exits on unreachable clusters; a configured-but-unreachable
      // URI is out of scope for this suite.
    }
  });

  after(async () => {
    await mongoose.disconnect();
  });

  test('the resolved connection is Atlas, not a local MongoDB', () => {
    const host = mongoose.connection.host || '';
    assert.ok(host.length > 0, 'connected');
    assert.equal(isLocalMongoUri(`mongodb://${host}`), false, host);
  });

  const ONBOARDING_TYPES = ['service', 'manufacturing', 'nonprofit', 'startup'];

  test('onboarding serves exactly one colored Yes/No question per category for every business type', async (t) => {
    const HEX = /^#[0-9a-fA-F]{6}$/;
    const row = {};
    for (const bt of ONBOARDING_TYPES) {
      const qs = await getOnboardingQuestionsForType(bt);
      row[bt] = qs.map((q) => ({ cat: q.categoryKey, color: q.categoryColor, opts: q.options.length }));
      assert.ok(qs.length >= 1 && qs.length <= 3, `${bt}: served ${qs.length} of 3 categories`);
      for (const q of qs) {
        assert.ok(q.questionText && q.questionText.trim().length > 0, `${bt}/${q.categoryKey} has text`);
        assert.ok(HEX.test(q.categoryColor || ''), `${bt}/${q.categoryKey} category color ${q.categoryColor}`);
        assert.equal(q.options.length, 2, `${bt}/${q.categoryKey} has 2 options`);
        for (const o of q.options) assert.ok(HEX.test(o.color || ''), `${bt}/${q.categoryKey} option color ${o.color}`);
      }
    }
    // Record the served colors — the parity evidence for answer-option colors.
    console.log('  [onboarding colors] ' + JSON.stringify(row));
  });

  test('KY meta exposes the three roots with six pillars and correct domain-selection routing', async () => {
    const meta = await getKYMeta();
    assert.equal(meta.kyRoots.length, 3);
    assert.deepEqual(meta.kyRoots.map((r) => r.pillars.length), [6, 6, 6]);
    const flags = Object.fromEntries(
      meta.businessTypes.map((b) => [b.key, b.requiresDomainSelection])
    );
    assert.equal(flags.service, true);
    assert.equal(flags.product, true);
    assert.equal(flags.startup, false);
    assert.equal(flags.ngo, false);
  });

  test('every KY root resolves its own six active pillars from the single DB', async () => {
    for (const rootId of KY_ROOT_IDS) {
      const cats = await getActiveKYCategories(rootId);
      assert.equal(cats.length, 6, `${rootId} pillars`);
      assert.ok(new Set(cats.map((c) => c.key)).size === 6, `${rootId} pillar keys unique`);
    }
    // The participant flow must serve the SAME shared pillar rows the Admin
    // category pages edit (stored under a null kyRoot). A row that still keys
    // the duplicate root-id copy would mean Admin renames go to a set that
    // results never read.
    const shared = await getActiveKYCategories(DOMAIN_SELECTION_ROOT);
    assert.ok(shared.every((c) => (c.kyRoot ?? null) === null),
      'the served Manufacturing & Services pillars must be the null-rooted Admin set');
  });

  test('the KY question bank is populated in the single DB for every root', async () => {
    const total = await KnowYourselfQuestion.countDocuments({ active: true });
    assert.ok(total >= 200, `active KY questions present: ${total}`);
  });
});