import 'dotenv/config';
import mongoose from 'mongoose';
import Domain from '../src/models/Domain.js';
import KnowYourselfQuestion from '../src/models/KnowYourselfQuestion.js';
import BusinessType from '../src/models/BusinessType.js';

await mongoose.connect(process.env.MONGO_URI);
console.log('LOCAL DB:', mongoose.connection.host, '/', mongoose.connection.name);

const bts = await BusinessType.find({}).sort({ sortOrder: 1 }).lean();
console.log('\n=== LOCAL BUSINESS TYPES ===');
for (const bt of bts) {
  console.log(`  _id=${bt._id} key=${bt.key} name="${bt.name}" active=${bt.active} kyRoot=${bt.kyRoot ?? '(none)'}`);
}

const domains = await Domain.find({ active: true }).sort({ businessTypeId: 1, name: 1 }).lean();
console.log('\n=== LOCAL DOMAINS (active) ===');
for (const d of domains) {
  const qCount = await KnowYourselfQuestion.countDocuments({ domain: d.slug, active: true, type: 'domain' });
  let btKey = 'unlinked';
  if (d.businessTypeId) {
    const bt = await BusinessType.findById(d.businessTypeId).lean();
    btKey = bt ? bt.key : 'unknown';
  }
  console.log(`  slug=${d.slug} | name="${d.name}" | btId=${d.businessTypeId} | btKey=${btKey} | active=${d.active} | q=${qCount}`);
}

await mongoose.disconnect();