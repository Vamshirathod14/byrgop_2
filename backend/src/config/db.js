import mongoose from 'mongoose';

// ─── Single source of truth ─────────────────────────────────────────────
// The application connects to EXACTLY ONE database: Atlas (the single source
// of truth used by Admin, the participant frontend, and the deployed API).
//
//   Admin change → API → Atlas        (one persistence path)
//   Participant → API → Atlas         (one read path)
//
// ATLAS_MONGO_URI is the preferred variable. MONGO_URI is honoured as a
// compatibility fallback name for tooling that predates the consolidation.
// A resolved URI that points at a local MongoDB instance (localhost /
// 127.0.0.1 / 0.0.0.0) is REFUSED: running the app against a locally seeded
// database is exactly how Local-vs-Atlas divergence used to happen, so the
// app must never silently accept one.
// ─────────────────────────────────────────────────────────────────────────

const LOCAL_URI_PATTERN =
  /^mongodb:\/\/[^@]*@?(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(:\d+)?\/?/i;

export function isLocalMongoUri(uri) {
  if (typeof uri !== 'string' || !uri) return false;
  return LOCAL_URI_PATTERN.test(uri);
}

export function resolveMongoUri(env = process.env) {
  return env.ATLAS_MONGO_URI || env.MONGO_URI || null;
}

export function assertNotLocalMongo(uri) {
  if (isLocalMongoUri(uri)) {
    throw new Error(
      `Refusing to connect to a local MongoDB (${String(uri).split('@').pop()}). ` +
        'Atlas is the single source of truth — set ATLAS_MONGO_URI to the Atlas ' +
        'connection string instead of using a localhost database.'
    );
  }
}

export async function connectDB(uri = resolveMongoUri()) {
  if (!uri) {
    throw new Error(
      'No MongoDB URI configured. Set ATLAS_MONGO_URI (or MONGO_URI) to the Atlas ' +
        'connection string in backend/.env.'
    );
  }
  if (process.env.ALLOW_LOCAL_MONGO !== 'true') {
    assertNotLocalMongo(uri);
  }
  try {
    const conn = await mongoose.connect(uri);
    console.log(`[db] connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    console.error(
      `[db] MongoDB connection failed (${err.name || 'Error'}: ${err.message})${
        err.cause?.message ? ` — cause: ${err.cause.message}` : ''
      }`
    );
    console.error('      Check that ATLAS_MONGO_URI is set and the cluster is reachable.');
    process.exit(1);
  }
}