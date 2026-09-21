import 'dotenv/config';
import { MongoClient } from 'mongodb';

// Only these collections hold static Admin-managed configuration/content.
// Anything else is treated as user/personal data and is NEVER migrated.
const STATIC_COLLECTIONS = [
  'domains',              // Know Yourself business domains
  'categories',           // onboarding dimensions
  'stages',               // onboarding stages
  'questions',            // onboarding questions
  'resultcontents',       // onboarding result content
  'knowyourselfquestions', // Know Yourself questions (generic + domain)
];

// Collections that must remain out of the target. A full restore is prohibited.
const RESERVED_PERSONAL = [
  'assessmentsessions',   // onboarding session + answers (user data)
  'knowyourselfsessions', // KY sessions, pro bono requests, contact requests
  'contacts',            // general website contact submissions
  'auditlogs',           // operational audit trail
  'admins',              // admin credentials (recreated by bootstrap, not migrated)
];

const USAGE = `Usage:
  MIGRATE_SOURCE_URI=mongodb://localhost:27017/byrgop \\
  MIGRATE_TARGET_URI=mongodb+srv://<atlas-uri>/byrgop \\
  node scripts/migrateAtlas.js [--force]

Migrates ONLY the static config collections listed (preserving _id).
Refuses to run if target already contains user/reserved data unless --force is passed.
`;

function abort(msg) {
  console.error(`[migrate] ABORT: ${msg}`);
  process.exit(1);
}

async function copyCollection(client, sourceDb, targetDb, name) {
  const srcCol = sourceDb.collection(name);
  const tgtCol = targetDb.collection(name);
  const docs = await srcCol.find({}).toArray();
  if (docs.length === 0) {
    console.log(`[migrate] ${name}: 0 docs (nothing to copy)`);
    return 0;
  }
  const ops = docs.map((d) => ({
    updateOne: {
      filter: { _id: d._id },
      update: { $set: d },
      upsert: true,
    },
  }));
  await tgtCol.bulkWrite(ops, { ordered: false });
  console.log(`[migrate] ${name}: copied ${docs.length} docs (Ids preserved)`);
  return docs.length;
}

async function main() {
  const force = process.argv.includes('--force');
  const sourceUri = process.env.MIGRATE_SOURCE_URI;
  const targetUri = process.env.MIGRATE_TARGET_URI;
  if (!sourceUri || !targetUri) abort(USAGE);
  if (sourceUri === targetUri) abort('Source and target URIs must differ.');

  const source = new MongoClient(sourceUri);
  const target = new MongoClient(targetUri);

  try {
    await source.connect();
    await target.connect();
    const sourceDb = source.db();
    const targetDb = target.db();
    console.log(`[migrate] source: ${source.options.srvHost || source.options.hosts}:${source.options.port}`);
    console.log(`[migrate] target: ${target.options.srvHost || 'local'}`);

    if (!force) {
      const offenders = [];
      for (const name of RESERVED_PERSONAL) {
        const n = await targetDb.collection(name).countDocuments({}, { limit: 1 });
        if (n > 0) offenders.push(`${name}(${n})`);
      }
      const critical = offenders.filter((o) => !o.startsWith('admins(') && !o.startsWith('auditlogs('));
      if (critical.length > 0) {
        abort(
          `Target database already contains user data in [${critical.join(', ')}]. ` +
            'Refusing to mix historical user data with the config migration. ' +
            'Fix the target or re-run with --force after confirming it is intentional.'
        );
      }
      if (offenders.length > 0) {
        console.warn(`[migrate] NOTE: non-config residues present on target: [${offenders.join(', ')}] (ignored, not migrated)`);
      }
    }

    console.log('[migrate] migrating static/config collections only…');
    for (const name of STATIC_COLLECTIONS) {
      await copyCollection(source, sourceDb, targetDb, name);
    }
    console.log(`[migrate] reserved personal collections NOT migrated: ${RESERVED_PERSONAL.join(', ')}`);
    console.log('[migrate] done.');
  } finally {
    await source.close();
    await target.close();
  }
}

main().catch((err) => {
  console.error('[migrate] failed:', err.message);
  process.exit(1);
});