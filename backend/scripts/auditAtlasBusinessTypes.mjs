import 'dotenv/config';
import mongoose from 'mongoose';
import BusinessType from '../src/models/BusinessType.js';

const ATLAS_URI = "mongodb+srv://ramavathvamshicse_db_user:vamshi123@cluster0.p4u8yex.mongodb.net/?appName=Cluster0";

await mongoose.connect(ATLAS_URI);
const bts = await BusinessType.find({}).sort({ sortOrder: 1 }).lean();
console.log('ATLAS BusinessTypes:');
for (const bt of bts) {
  console.log(`  _id=${bt._id} key=${bt.key} name="${bt.name}" active=${bt.active}`);
}
await mongoose.disconnect();