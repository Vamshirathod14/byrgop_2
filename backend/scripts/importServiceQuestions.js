import mongoose from 'mongoose';
import 'dotenv/config';
import KnowYourselfQuestion from '../src/models/KnowYourselfQuestion.js';
import { DATA, PILLAR_TO_CATEGORY } from './serviceQuestionData.js';

const SERVICE_DOMAINS = [
  'technology-saas',
  'financial_services',
  'supply-chain-logistics',
  'professional_services',
  'retail-e-commerce',
  'franchise-multi-unit',
  'hospitality_food_beverage',
  'fitness_gym_wellness_operations',
  'healthcare_life_sciences',
];

async function main() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/byrgop');

  // ---- 1. Identify old Service-Based questions ----
  const oldQs = await KnowYourselfQuestion.find({ type: 'domain', domain: { $in: SERVICE_DOMAINS } });
  const oldActive = oldQs.filter((q) => q.active);
  console.log('Old Service questions found (all):', oldQs.length, '| active:', oldActive.length);

  // Sanity: expect exactly 9 per service domain, all active.
  const byDomOld = {};
  oldQs.forEach((q) => { byDomOld[q.domain] = (byDomOld[q.domain] || 0) + 1; });
  console.log('Old per-domain:', byDomOld);

  // ---- 2. Deactivate old Service questions (does not touch other types) ----
  const deactRes = await KnowYourselfQuestion.updateMany(
    { type: 'domain', domain: { $in: SERVICE_DOMAINS }, active: true },
    { $set: { active: false } }
  );
  console.log('Deactivated old Service questions:', deactRes.modifiedCount);

  // ---- 3. Validate source rows before insert ----
  const validPillars = Object.keys(PILLAR_TO_CATEGORY);
  const problems = [];
  for (const [i, q] of DATA.entries()) {
    if (!q.text) problems.push(`row ${i + 1}: missing text`);
    if (!SERVICE_DOMAINS.includes(q.domain)) problems.push(`row ${i + 1}: unknown domain ${q.domain}`);
    if (!q.pillar || !validPillars.includes(q.pillar)) problems.push(`row ${i + 1}: invalid pillar ${q.pillar}`);
    if (!Array.isArray(q.options) || q.options.length !== 4) problems.push(`row ${i + 1}: must have 4 options`);
    else {
      q.options.forEach((o, j) => {
        if (!o.text) problems.push(`row ${i + 1} option ${j}: missing text`);
        if (![1, 2, 3, 4].includes(Number(o.score))) problems.push(`row ${i + 1} option ${j}: invalid score ${o.score}`);
      });
    }
  }
  if (problems.length) {
    console.error('VALIDATION FAILED. Aborting import. Problems:');
    problems.forEach((p) => console.error('  -', p));
    await mongoose.disconnect();
    process.exit(1);
  }

  // ---- 4. Insert new questions ----
  const toInsert = DATA.map((q) =>
    KnowYourselfQuestion({
      text: q.text,
      type: 'domain',
      domain: q.domain,
      category: PILLAR_TO_CATEGORY[q.pillar],
      options: q.options.map((o) => ({ text: o.text, score: o.score, active: true })),
      glossary: q.glossary,
      active: true,
    })
  );
  const inserted = await KnowYourselfQuestion.insertMany(toInsert, { ordered: false });
  console.log('Inserted new Service questions:', inserted.length);

  await mongoose.disconnect();
  console.log('Import complete.');
}

main().catch((e) => { console.error(e); process.exit(1); });
