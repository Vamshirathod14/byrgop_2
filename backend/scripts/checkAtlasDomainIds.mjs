import 'dotenv/config';
import mongoose from 'mongoose';
import Domain from '../src/models/Domain.js';

// Atlas URI must be provided via environment variable.
// Never hard-code credentials. Do not log the URI.
const ATLAS_URI = process.env.ATLAS_MONGO_URI;

if (!ATLAS_URI) {
  console.error('Error: ATLAS_MONGO_URI environment variable is required but not set.');
  console.error('Set it to your Atlas connection string (mongodb+srv://...)');
  process.exit(1);
}

await mongoose.connect(ATLAS_URI);

const slugs = [
  'financial-services',
  'franchise-multi-unit',
  'healthcare-life-sciences',
  'hospitality-food-beverage',
  'professional-services',
  'retail-e-commerce',
  'supply-chain-logistics',
  'technology-saas',
  'manufacturing',
  'automotive_heavy_engineering',
  'cpg_food_processing',
  'pharmaceuticals_biomanufacturing',
  'raw_materials_mining_metallurgy',
  'real_estate_construction',
  'humanitarian_aid_relief_logistics',
  'fitness-gym-wellness-operations',
];

for (const slug of slugs) {
  const d = await Domain.findOne({ slug }).lean();
  if (d) console.log(`${slug.padEnd(35)} _id=${d._id}  name="${d.name}"  btId=${d.businessTypeId}`);
  else console.log(`${slug.padEnd(35)} NOT FOUND`);
}

await mongoose.disconnect();