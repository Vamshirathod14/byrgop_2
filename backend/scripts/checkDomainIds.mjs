import 'dotenv/config';
import mongoose from 'mongoose';
import Domain from '../src/models/Domain.js';

await mongoose.connect(process.env.MONGO_URI);

const slugs = [
  'financial_services', 'financial-services',
  'franchise_multi_unit', 'franchise-multi-unit',
  'healthcare_wellness', 'healthcare-life-sciences',
  'hospitality_food_beverage', 'hospitality-food-beverage',
  'professional_services', 'professional-services',
  'retail_ecommerce', 'retail-e-commerce',
  'supply_chain_logistics', 'supply-chain-logistics',
  'technology_saas', 'technology-saas',
];

for (const slug of slugs) {
  const d = await Domain.findOne({ slug }).lean();
  if (d) console.log(`${slug.padEnd(30)} _id=${d._id}  name="${d.name}"  btId=${d.businessTypeId}`);
  else console.log(`${slug.padEnd(30)} NOT FOUND`);
}

await mongoose.disconnect();