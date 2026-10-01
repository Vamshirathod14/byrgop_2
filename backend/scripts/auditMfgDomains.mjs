/**
 * Read-only audit of the Manufacturing & Services domain setup.
 *
 * Answers one question only: are the original domains, their identities, their
 * question associations and their active status exactly as they were? Makes no
 * writes of any kind.
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import Domain from '../src/models/Domain.js';
import KnowYourselfQuestion from '../src/models/KnowYourselfQuestion.js';
import BusinessType from '../src/models/BusinessType.js';

const pad = (s, n) => String(s).padEnd(n);
const line = (t) => console.log(`\n── ${t} ${'─'.repeat(Math.max(0, 62 - t.length))}`);

await mongoose.connect(process.env.MONGO_URI);
console.log('connected:', mongoose.connection.host, '/', mongoose.connection.name);

line('BUSINESS TYPES');
for (const bt of await BusinessType.find({}).sort({ sortOrder: 1 }).lean()) {
  console.log(
    `  ${pad(bt.key, 10)} ${pad(bt.name, 22)} active=${bt.active} sort=${bt.sortOrder} kyRoot=${bt.kyRoot ?? '(none)'}`
  );
}

line('DOMAIN RECORDS (all, incl. inactive)');
const domains = await Domain.find({}).sort({ sortOrder: 1, name: 1 }).lean();
console.log(`  total: ${domains.length}`);
for (const d of domains) {
  const ids = (d.businessTypeIds || []).map((x) => String(x));
  const linked = await BusinessType.find({ _id: { $in: ids } }).select('key').lean();
  console.log(
    `  slug=${pad(d.slug, 16)} name=${pad(d.name, 38)} active=${String(d.active).padEnd(5)} ` +
      `sort=${String(d.sortOrder).padEnd(4)} bt=[${linked.map((b) => b.key).join(',')}] _id=${d._id}`
  );
}

line('QUESTIONS BY DOMAIN (active only)');
const byDomain = await KnowYourselfQuestion.aggregate([
  { $match: { active: true, type: 'domain' } },
  { $group: { _id: '$domain', n: { $sum: 1 } } },
  { $sort: { _id: 1 } },
]);
for (const r of byDomain) {
  const d = await Domain.findOne({ slug: r._id }).lean();
  console.log(`  ${pad(r._id, 24)} ${pad(String(r.n), 4)} questions   domainRecord=${d ? `"${d.name}" active=${d.active}` : 'MISSING'}`);
}

line('Mfg/Services GENERIC POOL (businessType null)');
const gen = await KnowYourselfQuestion.countDocuments({ active: true, type: 'generic', businessType: null });
console.log(`  ${gen} active generic questions in the shared pool`);

line('Mfg/Services PILLARS (shared, kyRoot null)');
const KYCategory = (await import('../src/models/KYCategory.js')).default;
const cats = await KYCategory.find({ active: true, kyRoot: null }).sort({ sortOrder: 1 }).lean();
for (const c of cats) console.log(`  ${pad(c.key, 26)} ${pad(c.name, 26)} sort=${c.sortOrder}`);
console.log(`  total active shared pillars: ${cats.length}`);

line('QUESTIONS CARRYING A kyRoot FIELD (Mfg must be 0)');
const stamped = await KnowYourselfQuestion.countDocuments({ kyRoot: { $exists: true }, businessType: { $in: [null, ''] } });
console.log(`  shared-pool questions with a kyRoot field: ${stamped}  (expected 0)`);

await mongoose.disconnect();
console.log('\naudit complete (read-only)');
