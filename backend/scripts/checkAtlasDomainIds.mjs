import 'dotenv/config';
import mongoose from 'mongoose';
import Domain from '../src/models/Domain.js';

// Use Atlas URI
const ATLAS_URI = "mongodb+srv://ramavathvamshicse_db_user:vamshi123@cluster0.p4u8yex.mongodb.net/?appName=Cluster0";

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