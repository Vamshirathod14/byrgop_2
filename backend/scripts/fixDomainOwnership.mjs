/**
 * Fix local domain ownership to match Atlas.
 * 
 * Changes needed:
 * 1. 5 domains currently assigned to Manufacturing (product) but Atlas says Services:
 *    - fitness-gym-wellness-operations
 *    - franchise_multi_unit
 *    - retail_ecommerce
 *    - supply_chain_logistics
 *    - technology_saas
 * 
 * 2. These 5 need btId changed from product _id to service _id
 * 
 * 3. All other domains remain unchanged.
 * 
 * 4. Slug mismatches (same _id) - keep local underscore slugs
 * 5. Different-_id records from sync - keep as-is (correct btId already)
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import Domain from '../src/models/Domain.js';
import BusinessType from '../src/models/BusinessType.js';

await mongoose.connect(process.env.MONGO_URI);
console.log('LOCAL DB:', mongoose.connection.host, '/', mongoose.connection.name);

const localService = await BusinessType.findOne({ key: 'service' }).lean();
const localProduct = await BusinessType.findOne({ key: 'product' }).lean();
console.log(`Local service _id: ${localService._id}`);
console.log(`Local product _id: ${localProduct._id}`);

const fixes = [
  { slug: 'fitness-gym-wellness-operations', from: 'product', to: 'service', reason: 'Atlas: Services' },
  { slug: 'franchise_multi_unit', from: 'product', to: 'service', reason: 'Atlas: Services (franchise-multi-unit)' },
  { slug: 'retail_ecommerce', from: 'product', to: 'service', reason: 'Atlas: Services (retail-e-commerce)' },
  { slug: 'supply_chain_logistics', from: 'product', to: 'service', reason: 'Atlas: Services (supply-chain-logistics)' },
  { slug: 'technology_saas', from: 'product', to: 'service', reason: 'Atlas: Services (technology-saas)' },
];

let changed = 0;
for (const fix of fixes) {
  const domain = await Domain.findOne({ slug: fix.slug }).lean();
  if (!domain) {
    console.log(`⚠️  NOT FOUND: ${fix.slug}`);
    continue;
  }
  
  const expectedFromId = fix.from === 'product' ? localProduct._id.toString() : localService._id.toString();
  const actualBtId = domain.businessTypeId ? domain.businessTypeId.toString() : 'null';
  
  if (actualBtId !== expectedFromId) {
    console.log(`⚠️  ${fix.slug}: current btId=${actualBtId}, expected from=${expectedFromId} (${fix.from}) - already changed or different state`);
  }
  
  const targetBtId = fix.to === 'service' ? localService._id : localProduct._id;
  if (actualBtId === targetBtId.toString()) {
    console.log(`✅ ${fix.slug}: already correct (${fix.to})`);
    continue;
  }
  
  console.log(`🔧 FIXING: ${fix.slug} | ${fix.reason}`);
  console.log(`   btId: ${actualBtId} -> ${targetBtId}`);
  
  await Domain.updateOne(
    { slug: fix.slug },
    { $set: { businessTypeId: targetBtId } }
  );
  changed++;
}

console.log(`\n=== CHANGES APPLIED: ${changed} domains ===`);

// Verify
console.log('\n=== VERIFICATION AFTER FIX ===');
const domains = await Domain.find({ active: true }).sort({ businessTypeId: 1, name: 1 }).lean();
for (const d of domains) {
  let btKey = 'unlinked';
  if (d.businessTypeId) {
    const bt = await BusinessType.findById(d.businessTypeId).lean();
    btKey = bt ? bt.key : 'unknown';
  }
  console.log(`  ${d.slug} | btKey=${btKey} | btId=${d.businessTypeId}`);
}

await mongoose.disconnect();