import 'dotenv/config';
import { connectDB } from '../src/config/db.js';
import BusinessType from '../src/models/BusinessType.js';
import Domain from '../src/models/Domain.js';
import KnowYourselfQuestion from '../src/models/KnowYourselfQuestion.js';
import { SERVICE_DOMAINS } from './data/serviceKyQuestions.js';

// Replaces the Service-Based Sector KY question bank with the new content.
// Scope is strictly limited to the 9 Service sub-sector domains:
//   1. Upserts the 9 `domains` records (creates the 3 missing ones and wires
//      them, and any untyped existing one, to the `services` BusinessType).
//   2. Deletes the OLD `type:'domain'` questions for these 9 slugs.
//   3. Inserts the 81 new questions (9 per domain, 4 options scored 1–4, with
//      category + glossary). `businessType` is left null (applies to all) to
//      match the existing service-domain question pattern.
// Idempotent: re-running replaces the 9 slugs' questions again with the same
// result. Nothing outside these slugs is touched.

const SERVICE_SLUGS = SERVICE_DOMAINS.map((d) => d.slug);

async function run() {
  await connectDB();

  const servicesBt = await BusinessType.findOne({ key: 'services' });
  if (!servicesBt) throw new Error("BusinessType 'services' not found in the database");
  console.log(`[svc-ky] business type: services (${servicesBt._id})`);

  // ---- Summary before ----
  const before = [];
  for (const slug of SERVICE_SLUGS) {
    before.push({
      questions: await KnowYourselfQuestion.countDocuments({ type: 'domain', domain: slug }),
    });
  }
  console.log('[svc-ky] BEFORE per-service-domain questions:', before.map((b) => b.questions).join(' '));

  // ---- 1. Domains ----
  let createdDomains = 0;
  let renamedDomains = 0;
  for (const d of SERVICE_DOMAINS) {
    const existing = await Domain.findOne({ slug: d.slug });
    if (existing) {
      const changes = { businessTypeId: servicesBt._id };
      if (existing.name !== d.name) {
        changes.name = d.name;
        renamedDomains += 1;
      }
      await Domain.updateOne({ _id: existing._id }, { $set: changes });
    } else {
      await Domain.create({ name: d.name, slug: d.slug, description: '', active: true, businessTypeId: servicesBt._id });
      createdDomains += 1;
      console.log(`[svc-ky] created domain "${d.name}" (${d.slug})`);
    }
  }
  console.log(`[svc-ky] domains upserted: ${SERVICE_DOMAINS.length - createdDomains} existing (${renamedDomains} renamed), ${createdDomains} created`);

  // ---- 2. Delete old questions ----
  const deleted = await KnowYourselfQuestion.deleteMany({ type: 'domain', domain: { $in: SERVICE_SLUGS } });
  console.log(`[svc-ky] deleted ${deleted.deletedCount} old service-domain question(s)`);

  // ---- 3. Insert new questions ----
  const docs = [];
  for (const d of SERVICE_DOMAINS) {
    for (const q of d.questions) {
      if (q.options.length !== 4) throw new Error(`${d.slug}: question needs exactly 4 options`);
      docs.push({
        text: q.text,
        type: 'domain',
        domain: d.slug,
        active: true,
        category: q.category,
        businessType: null,
        glossary: q.glossary || [],
        options: q.options.map((o) => ({ text: o.text, score: o.score, active: true })),
      });
    }
  }
  const inserted = await KnowYourselfQuestion.insertMany(docs, { ordered: false });
  console.log(`[svc-ky] inserted ${inserted.length} new question(s)`);

  // ---- Verify ----
  for (const slug of SERVICE_SLUGS) {
    const total = await KnowYourselfQuestion.countDocuments({ type: 'domain', domain: slug });
    const active = await KnowYourselfQuestion.countDocuments({ type: 'domain', domain: slug, active: true });
    const categorized = await KnowYourselfQuestion.countDocuments({
      type: 'domain', domain: slug, active: true, category: { $ne: null },
    });
    console.log(`[svc-ky]   ${slug.padEnd(32)} total=${total} active=${active} categorized=${categorized}`);
  }

  const generic = await KnowYourselfQuestion.countDocuments({ type: 'generic', active: true, category: { $ne: null } });
  console.log(`[svc-ky] generic pool still available: ${generic}`);
}

run()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('[svc-ky] failed', e);
    process.exit(1);
  });