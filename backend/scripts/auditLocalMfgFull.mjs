/**
 * Comprehensive audit of local Manufacturing & Services data.
 * Read-only. No writes.
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import BusinessType from '../src/models/BusinessType.js';
import Domain from '../src/models/Domain.js';
import KnowYourselfQuestion from '../src/models/KnowYourselfQuestion.js';
import KYCategory from '../src/models/KYCategory.js';

const pad = (s, n) => String(s ?? '').padEnd(n);
const line = (t) => console.log(`\n── ${t} ${'─'.repeat(Math.max(0, 70 - t.length))}`);

await mongoose.connect(process.env.MONGO_URI);
console.log('LOCAL DB:', mongoose.connection.host, '/', mongoose.connection.name);

line('BUSINESS TYPES (all)');
const bts = await BusinessType.find({}).sort({ sortOrder: 1 }).lean();
for (const bt of bts) {
  console.log(`  ${pad(bt.key, 12)} ${pad(bt.name, 28)} active=${String(bt.active).padEnd(5)} sort=${bt.sortOrder} kyRoot=${bt.kyRoot ?? '(none)'} _id=${bt._id}`);
}

line('DOMAIN RECORDS (all, incl. inactive)');
const domains = await Domain.find({}).sort({ sortOrder: 1, name: 1 }).lean();
console.log(`  total: ${domains.length}`);
for (const d of domains) {
  const btIds = (d.businessTypeId ? [d.businessTypeId] : []);
  const linked = btIds.length ? await BusinessType.find({ _id: { $in: btIds } }).select('key name').lean() : [];
  console.log(`  slug=${pad(d.slug, 22)} name=${pad(d.name, 42)} active=${String(d.active).padEnd(5)} sort=${String(d.sortOrder).padEnd(4)} bt=[${linked.map((b) => b.key).join(', ')}] _id=${d._id}`);
}

line('QUESTIONS BY DOMAIN (active only, type=domain)');
const byDomain = await KnowYourselfQuestion.aggregate([
  { $match: { active: true, type: 'domain' } },
  { $group: { _id: '$domain', n: { $sum: 1 }, cats: { $addToSet: '$category' }, bt: { $addToSet: '$businessType' } } },
  { $sort: { _id: 1 } },
]);
for (const r of byDomain) {
  const d = await Domain.findOne({ slug: r._id }).lean();
  console.log(`  ${pad(r._id, 24)} ${pad(String(r.n), 4)} questions   domainRecord=${d ? `"${d.name}" active=${d.active}` : 'MISSING'}   pillars=[${(r.cats||[]).join(', ')}]   businessTypes=[${(r.bt||[]).join(', ')}]`);
}

line('QUESTIONS BY DOMAIN (inactive included, type=domain)');
const byDomainAll = await KnowYourselfQuestion.aggregate([
  { $match: { type: 'domain' } },
  { $group: { _id: { domain: '$domain', active: '$active' }, n: { $sum: 1 }, cats: { $addToSet: '$category' }, bt: { $addToSet: '$businessType' } } },
  { $sort: { '_id.domain': 1, '_id.active': -1 } },
]);
for (const r of byDomainAll) {
  console.log(`  ${pad(r._id.domain || '(null)', 24)} active=${String(r._id.active).padEnd(5)} ${pad(String(r.n), 4)} questions   pillars=[${(r.cats||[]).join(', ')}]   businessTypes=[${(r.bt||[]).join(', ')}]`);
}

line('GENERIC POOL (businessType: null, type: generic, active)');
const gen = await KnowYourselfQuestion.countDocuments({ active: true, type: 'generic', businessType: { $in: [null, ''] } });
console.log(`  ${gen} active generic questions (shared pool)`);

line('MFG/SERVICES PILLARS (shared, kyRoot: null or missing)');
const cats = await KYCategory.find({ active: true, $or: [{ kyRoot: null }, { kyRoot: 'manufacturing-services' }] }).sort({ sortOrder: 1 }).lean();
for (const c of cats) console.log(`  ${pad(c.key, 28)} ${pad(c.name, 28)} sort=${c.sortOrder} kyRoot=${c.kyRoot ?? '(none)'} _id=${c._id}`);
console.log(`  total active Mfg/Services pillars: ${cats.length}`);

line('NON-PROFIT PILLARS (kyRoot: non-profit) — VERIFY UNTOUCHED');
const npCats = await KYCategory.find({ active: true, kyRoot: 'non-profit' }).sort({ sortOrder: 1 }).lean();
for (const c of npCats) console.log(`  ${pad(c.key, 28)} ${pad(c.name, 28)} sort=${c.sortOrder} kyRoot=${c.kyRoot} _id=${c._id}`);
console.log(`  total Non-Profit pillars: ${npCats.length} (should be 6)`);

line('NON-PROFIT QUESTIONS (businessType: ngo) — VERIFY UNTOUCHED');
const npQ = await KnowYourselfQuestion.countDocuments({ active: true, businessType: 'ngo' });
const npQAll = await KnowYourselfQuestion.countDocuments({ businessType: 'ngo' });
console.log(`  active: ${npQ}   total (incl. inactive): ${npQAll} (should be 18 active)`);

line('QUESTIONS WITH kyRoot FIELD (Mfg must be 0)');
const stamped = await KnowYourselfQuestion.countDocuments({ kyRoot: { $exists: true }, businessType: { $in: [null, ''] } });
console.log(`  shared-pool questions with kyRoot field: ${stamped}  (expected 0)`);

await mongoose.disconnect();
console.log('\n=== LOCAL AUDIT COMPLETE ===');