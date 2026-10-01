import 'dotenv/config';
import mongoose from 'mongoose';
import KYCategory from '../src/models/KYCategory.js';

await mongoose.connect(process.env.MONGO_URI);
const result = await KYCategory.deleteMany({ kyRoot: 'manufacturing-services' });
console.log(`Deleted ${result.deletedCount} duplicate manufacturing-services pillars`);
const cats = await KYCategory.find({ active: true, $or: [{ kyRoot: null }, { kyRoot: 'manufacturing-services' }] }).sort({ sortOrder: 1 }).lean();
console.log(`Remaining Mfg/Services pillars: ${cats.length}`);
for (const c of cats) console.log(`  ${c.key} (kyRoot=${c.kyRoot ?? 'null'})`);
await mongoose.disconnect();