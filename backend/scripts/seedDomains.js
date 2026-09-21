import 'dotenv/config';
import { connectDB } from '../src/config/db.js';
import Domain from '../src/models/Domain.js';
import { DOMAIN_KEYS, DOMAIN_LABELS } from '../src/models/KnowYourselfQuestion.js';

// One-time backfill: promote the legacy hardcoded KY domains into the Domains
// collection so they become admin-managed. Idempotent (upserts by slug).
async function seedDomains() {
  await connectDB();
  console.log('[domains] backfilling legacy domains...');

  let created = 0;
  for (const slug of DOMAIN_KEYS) {
    const name = DOMAIN_LABELS[slug];
    const exists = await Domain.findOne({ slug });
    if (exists) {
      if (exists.name !== name || exists.active !== true) {
        exists.name = name;
        exists.active = true;
        await exists.save();
        console.log(`[domains] updated "${name}" (${slug})`);
      }
      continue;
    }
    await Domain.create({ name, slug, description: '', active: true });
    created += 1;
    console.log(`[domains] created "${name}" (${slug})`);
  }

  console.log(`[domains] done. ${created} new, ${DOMAIN_KEYS.length - created} already present.`);
}

seedDomains()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('[domains] failed', e);
    process.exit(1);
  });