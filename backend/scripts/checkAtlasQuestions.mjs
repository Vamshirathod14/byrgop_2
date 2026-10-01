import 'dotenv/config';
import mongoose from 'mongoose';
import KnowYourselfQuestion from '../src/models/KnowYourselfQuestion.js';

const ATLAS_URI = "mongodb+srv://ramavathvamshicse_db_user:vamshi123@cluster0.p4u8yex.mongodb.net/?appName=Cluster0";

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