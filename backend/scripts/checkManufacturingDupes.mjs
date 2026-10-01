import 'dotenv/config';
import mongoose from 'mongoose';
import KnowYourselfQuestion from '../src/models/KnowYourselfQuestion.js';

await mongoose.connect(process.env.MONGO_URI);

console.log('=== MANUFACTURING DOMAIN QUESTIONS (active, type=domain) ===');
const qs = await KnowYourselfQuestion.find({ domain: 'manufacturing', active: true, type: 'domain' })
  .select('text category options businessType createdAt')
  .sort({ category: 1, text: 1 })
  .lean();

console.log(`Total: ${qs.length}`);
const seen = new Map();
for (const q of qs) {
  const key = q.text.substring(0, 80);
  seen.set(key, (seen.get(key) || 0) + 1);
}

for (const [text, count] of seen.entries()) {
  if (count > 1) console.log(`  DUPLICATE (${count}x): ${text}`);
}

console.log('\n=== ALL QUESTIONS BY CATEGORY ===');
const byCat = {};
for (const q of qs) {
  if (!byCat[q.category]) byCat[q.category] = [];
  byCat[q.category].push(q.text.substring(0, 60));
}
for (const [cat, texts] of Object.entries(byCat)) {
  console.log(`  ${cat}: ${texts.length} questions`);
  for (const t of texts) console.log(`    - ${t}`);
}

await mongoose.disconnect();