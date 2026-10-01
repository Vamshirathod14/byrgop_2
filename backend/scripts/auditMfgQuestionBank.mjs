/**
 * Read-only: the exact question inventory behind every domain, in both slug
 * spellings, active and inactive. Confirms no Mfg/Services question was
 * removed, renamed or orphaned.
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import KnowYourselfQuestion from '../src/models/KnowYourselfQuestion.js';

await mongoose.connect(process.env.MONGO_URI);
const Q = KnowYourselfQuestion;

console.log('\n── ALL domain-typed questions (active + inactive) ──');
const rows = await Q.find({ type: 'domain' })
  .select('text domain active businessType kyRoot category')
  .sort({ domain: 1, createdAt: 1 })
  .lean();
const grouped = new Map();
for (const r of rows) {
  const k = `${r.domain ?? '(null)'}  active=${r.active}  bt=${r.businessType ?? 'null'}  pillar=${r.category ?? 'null'}`;
  grouped.set(k, (grouped.get(k) || 0) + 1);
}
for (const [k, n] of [...grouped.entries()].sort()) console.log(`  ${String(n).padStart(3)}  ${k}`);

console.log('\n── domain question counts per slug (active) ──');
const active = await Q.aggregate([
  { $match: { active: true, type: 'domain' } },
  { $group: { _id: '$domain', n: { $sum: 1 }, cats: { $addToSet: '$category' } } },
  { $sort: { _id: 1 } },
]);
if (!active.length) console.log('  (none)');
for (const r of active) console.log(`  ${String(r._id).padEnd(26)} ${r.n}   pillars=[${r.cats.join(', ')}]`);

console.log('\n── ALL questions, by (businessType, type, active) ──');
const inv = await Q.aggregate([
  { $group: { _id: { bt: { $ifNull: ['$businessType', '(null)'] }, t: '$type', a: '$active' }, n: { $sum: 1 } } },
  { $sort: { '_id.bt': 1, '_id.t': 1 } },
]);
for (const r of inv) console.log(`  ${String(r.n).padStart(3)}  bt=${String(r._id.bt).padEnd(10)} type=${String(r._id.t).padEnd(8)} active=${r._id.a}`);

console.log('\n── any question whose domain is set but text is empty/renamed? ──');
const bad = await Q.countDocuments({ type: 'domain', $or: [{ text: /^\\s*$/ }, { domain: null }, { domain: '' }] });
console.log(`  malformed domain questions: ${bad}`);

await mongoose.disconnect();
console.log('\ninventory complete (read-only)');
