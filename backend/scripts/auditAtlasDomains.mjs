import 'dotenv/config';
import mongoose from 'mongoose';
import Domain from '../src/models/Domain.js';
import KnowYourselfQuestion from '../src/models/KnowYourselfQuestion.js';

const ATLAS_URI = "mongodb+srv://ramavathvamshicse_db_user:vamshi123@cluster0.p4u8yex.mongodb.net/?appName=Cluster0";

await mongoose.connect(ATLAS_URI);
console.log('ATLAS DB:', mongoose.connection.host, '/', mongoose.connection.name);

const domains = await Domain.find({ active: true }).sort({ businessTypeId: 1, name: 1 }).lean();
console.log('\n=== ATLAS DOMAINS (active) ===');
for (const d of domains) {
  const qCount = await KnowYourselfQuestion.countDocuments({ domain: d.slug, active: true, type: 'domain' });
  console.log(`  slug=${d.slug} | name="${d.name}" | btId=${d.businessTypeId} | active=${d.active} | q=${qCount}`);
}

await mongoose.disconnect();