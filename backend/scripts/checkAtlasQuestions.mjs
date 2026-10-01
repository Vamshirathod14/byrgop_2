import 'dotenv/config';
import mongoose from 'mongoose';
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

const domainSlugs = [
  'manufacturing',
  'retail-e-commerce',
  'financial-services',
  'franchise-multi-unit',
  'healthcare-life-sciences',
  'hospitality-food-beverage',
  'professional-services',
  'supply-chain-logistics',
  'technology-saas',
  'automotive_heavy_engineering',
  'cpg_food_processing',
  'pharmaceuticals_biomanufacturing',
  'raw_materials_mining_metallurgy',
  'real_estate_construction',
  'humanitarian_aid_relief_logistics',
  'fitness-gym-wellness-operations',
];

for (const slug of domainSlugs) {
  const count = await KnowYourselfQuestion.countDocuments({ domain: slug, active: true, type: 'domain' });
  const total = await KnowYourselfQuestion.countDocuments({ domain: slug });
  const cats = await KnowYourselfQuestion.distinct('category', { domain: slug, active: true });
  console.log(`${slug.padEnd(35)} active=${String(count).padStart(2)} total=${String(total).padStart(2)}  pillars=[${cats.join(', ')}]`);
}

await mongoose.disconnect();