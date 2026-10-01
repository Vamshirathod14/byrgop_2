import 'dotenv/config';
import mongoose from 'mongoose';
import BusinessType from '../src/models/BusinessType.js';

// Atlas URI must be provided via environment variable.
// Never hard-code credentials. Do not log the URI.
const ATLAS_URI = process.env.ATLAS_MONGO_URI;

if (!ATLAS_URI) {
  console.error('Error: ATLAS_MONGO_URI environment variable is required but not set.');
  console.error('Set it to your Atlas connection string (mongodb+srv://...)');
  process.exit(1);
}

await mongoose.connect(ATLAS_URI);
const bts = await BusinessType.find({}).sort({ sortOrder: 1 }).lean();
console.log('ATLAS BusinessTypes:');
for (const bt of bts) {
  console.log(`  _id=${bt._id} key=${bt.key} name="${bt.name}" active=${bt.active}`);
}
await mongoose.disconnect();