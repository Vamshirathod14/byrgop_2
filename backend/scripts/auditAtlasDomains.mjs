import 'dotenv/config';
import mongoose from 'mongoose';
import Domain from '../src/models/Domain.js';
import KnowYourselfQuestion from '../src/models/KnowYourselfQuestion.js';

// Atlas URI must be provided via environment variable.
// Never hard-code credentials. Do not log the URI.
const ATLAS_URI = process.env.ATLAS_MONGO_URI;

if (!ATLAS_URI) {
  console.error('Error: ATLAS_MONGO_URI environment variable is required but not set.');
  console.error('Set it to your Atlas connection string (mongodb+srv://...)');
  process.exit(1);
}

await mongoose.connect(ATLAS_URI);
console.log('ATLAS DB:', mongoose.connection.host, '/', mongoose.connection.name);

const domains = await Domain.find({ active: true }).sort({ businessTypeId: 1, name: 1 }).lean();
console.log('\n=== ATLAS DOMAINS (active) ===');
for (const d of domains) {
  const qCount = await KnowYourselfQuestion.countDocuments({ domain: d.slug, active: true, type: 'domain' });
  console.log(`  slug=${d.slug} | name="${d.name}" | btId=${d.businessTypeId} | active=${d.active} | q=${qCount}`);
}

await mongoose.disconnect();