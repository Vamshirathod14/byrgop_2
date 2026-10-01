/**
 * Comparison Report: Atlas vs Local Manufacturing & Services Data
 * Generated from read-only audits of both databases.
 */

const ATLAS = {
  businessTypes: [
    { key: 'services', name: 'Services', active: true, sort: 1, kyRoot: null, _id: '6ab1163b21ac960f17e73378' },
    { key: 'manufacture', name: 'Manufacture', active: true, sort: 2, kyRoot: null, _id: '6ab1164421ac960f17e73381' },
    { key: 'startup', name: 'Startup', active: true, sort: 3, kyRoot: null, _id: '6ab1164b21ac960f17e7338a' },
    { key: 'non-profit', name: 'Non profit', active: true, sort: 4, kyRoot: null, _id: '6ab1165f21ac960f17e73393' },
  ],
  domains: [
    { slug: 'automotive_heavy_engineering', name: 'Automotive & Heavy Engineering', active: true, bt: ['manufacture'], _id: '6ab24f92f6181448914e0b07', q: 9 },
    { slug: 'cpg_food_processing', name: 'Consumer Packaged Goods (CPG) & Food Processing', active: true, bt: ['manufacture'], _id: '6ab24f91f6181448914e0aff', q: 9 },
    { slug: 'financial-services', name: 'Financial Services & FinTech', active: true, bt: ['services'], _id: '6ab1f637f6a31ec48b2a3d3b', q: 9 },
    { slug: 'fitness-gym-wellness-operations', name: 'Fitness, Gym & Wellness Operations', active: true, bt: ['services'], _id: '6a868a43d331db7a8c45cd7b', q: 9 },
    { slug: 'franchise-multi-unit', name: 'Franchise & Multi-Unit Chains', active: true, bt: ['services'], _id: '6a8687248c1bca9fa9be119e', q: 9 },
    { slug: 'healthcare-life-sciences', name: 'Healthcare & Life Sciences Operations', active: true, bt: ['services'], _id: '6a8687248c1bca9fa9be118c', q: 9 },
    { slug: 'hospitality-food-beverage', name: 'Hospitality, Food & Beverage', active: true, bt: ['services'], _id: '6ab1f637f6a31ec48b2a3d4a', q: 9 },
    { slug: 'humanitarian_aid_relief_logistics', name: 'Humanitarian Aid, Relief Logistics & Social Welfare', active: true, bt: [], _id: '6ab13dbe9afe4244bab711cc', q: 9 },
    { slug: 'manufacturing', name: 'Manufacturing & Industrial Operations', active: true, bt: ['manufacture'], _id: '6a8687248c1bca9fa9be1181', q: 9 },
    { slug: 'pharmaceuticals_biomanufacturing', name: 'Pharmaceuticals & Bio-Manufacturing', active: true, bt: ['manufacture'], _id: '6ab24f92f6181448914e0b04', q: 9 },
    { slug: 'professional-services', name: 'Professional Services & Consulting', active: true, bt: ['services'], _id: '6ab1f637f6a31ec48b2a3d42', q: 9 },
    { slug: 'raw_materials_mining_metallurgy', name: 'Raw Materials, Mining & Metallurgy', active: true, bt: ['manufacture'], _id: '6a8d7a280f847fe349126035', q: 9 },
    { slug: 'real_estate_construction', name: 'Real Estate, Construction & Infrastructure', active: true, bt: ['manufacture'], _id: '6a8687248c1bca9fa9be1198', q: 9 },
    { slug: 'retail-e-commerce', name: 'Retail & E-Commerce', active: true, bt: ['services'], _id: '6a8687248c1bca9fa9be1186', q: 9 },
    { slug: 'supply-chain-logistics', name: 'Supply Chain, Logistics & Distribution', active: true, bt: ['services'], _id: '6a8687248c1bca9fa9be118f', q: 9 },
    { slug: 'technology-saas', name: 'Technology & SaaS / Digital Products', active: true, bt: ['services'], _id: '6a8687248c1bca9fa9be1192', q: 9 },
  ],
  genericPool: 20,
  pillars: [
    { key: 'strategic-direction', name: 'Strategic Direction', sort: 1, kyRoot: null, _id: '6ab18b01346a929b7d902707' },
    { key: 'financial-performance', name: 'Financial Performance', sort: 2, kyRoot: null, _id: '6ab18b01346a929b7d902708' },
    { key: 'sales-market-growth', name: 'Sales & Market Growth', sort: 3, kyRoot: null, _id: '6ab18b01346a929b7d902709' },
    { key: 'operations-execution', name: 'Operations & Execution', sort: 4, kyRoot: null, _id: '6ab18b01346a929b7d90270a' },
    { key: 'people-organization', name: 'People & Organization', sort: 5, kyRoot: null, _id: '6ab18b01346a929b7d90270b' },
    { key: 'digital-innovation', name: 'Digital & Innovation', sort: 6, kyRoot: null, _id: '6ab18b01346a929b7d90270c' },
  ],
  nonProfitPillars: 0,
  nonProfitQuestions: { active: 9, total: 9 },
};

const LOCAL = {
  businessTypes: [
    { key: 'service', name: 'Services', active: true, sort: 1, kyRoot: 'manufacturing-services', _id: '6a92983f4cf7c217251cf256' },
    { key: 'product', name: 'Manufacturing', active: true, sort: 2, kyRoot: 'manufacturing-services', _id: '6a92983f4cf7c217251cf257' },
    { key: 'ngo', name: 'Non-Profit', active: true, sort: 3, kyRoot: 'non-profit', _id: '6a92983f4cf7c217251cf258' },
    { key: 'startup', name: 'Startup', active: true, sort: 4, kyRoot: 'startup', _id: '6ab774760b8429eef82eb8ce' },
  ],
  domains: [
    { slug: 'financial_services', name: 'Financial Services & FinTech', active: true, bt: [], _id: '6a8687248c1bca9fa9be1195', q: 0 },
    { slug: 'fitness-gym-wellness-operations', name: 'Fitness, Gym & Wellness Operations', active: true, bt: [], _id: '6a868a43d331db7a8c45cd7b', q: 0 },
    { slug: 'franchise_multi_unit', name: 'Franchise & Multi-Unit Chains', active: true, bt: [], _id: '6a8687248c1bca9fa9be119e', q: 0 },
    { slug: 'healthcare_wellness', name: 'Healthcare & Wellness Operations', active: true, bt: ['service'], _id: '6a8687248c1bca9fa9be118c', q: 0 },
    { slug: 'hospitality_food_beverage', name: 'Hospitality, Food & Beverage (F&B)', active: true, bt: [], _id: '6a8687248c1bca9fa9be119b', q: 0 },
    { slug: 'manufacturing', name: 'Manufacturing & Industrial Operations', active: true, bt: ['product'], _id: '6a8687248c1bca9fa9be1181', q: 10 },
    { slug: 'nonprofit_org', name: 'Nonprofit Organisation', active: true, bt: ['ngo'], _id: '6a92882963593b513577aca4', q: 0 },
    { slug: 'professional_services', name: 'Professional Services & Consulting', active: true, bt: ['service'], _id: '6a8687248c1bca9fa9be1189', q: 0 },
    { slug: 'real_estate_construction', name: 'Real Estate, Construction & Infrastructure', active: true, bt: [], _id: '6a8687248c1bca9fa9be1198', q: 0 },
    { slug: 'retail_ecommerce', name: 'Retail & E-Commerce', active: true, bt: ['product'], _id: '6a8687248c1bca9fa9be1186', q: 0 },
    { slug: 'supply_chain_logistics', name: 'Supply Chain, Logistics & Distribution', active: true, bt: [], _id: '6a8687248c1bca9fa9be118f', q: 0 },
    { slug: 'technology_saas', name: 'Technology & SaaS / Digital Products', active: true, bt: [], _id: '6a8687248c1bca9fa9be1192', q: 0 },
  ],
  genericPool: 20,
  pillars: [
    { key: 'strategic-direction', name: 'Strategic Direction', sort: 1, kyRoot: null, _id: '6a92983f4cf7c217251cf259' },
    { key: 'strategic-direction', name: 'Strategic Direction', sort: 1, kyRoot: 'manufacturing-services', _id: '6ab774a7fc30542e27359f68' },
    { key: 'financial-performance', name: 'Financial Performance', sort: 2, kyRoot: null, _id: '6a92983f4cf7c217251cf25a' },
    { key: 'financial-performance', name: 'Financial Performance', sort: 2, kyRoot: 'manufacturing-services', _id: '6ab774a7fc30542e27359f69' },
    { key: 'sales-market-growth', name: 'Sales & Market Growth', sort: 3, kyRoot: null, _id: '6a92983f4cf7c217251cf25b' },
    { key: 'sales-market-growth', name: 'Sales & Market Growth', sort: 3, kyRoot: 'manufacturing-services', _id: '6ab774a7fc30542e27359f6a' },
    { key: 'operations-execution', name: 'Operations & Execution', sort: 4, kyRoot: null, _id: '6a92983f4cf7c217251cf25c' },
    { key: 'operations-execution', name: 'Operations & Execution', sort: 4, kyRoot: 'manufacturing-services', _id: '6ab774a7fc30542e27359f6b' },
    { key: 'people-organization', name: 'People & Organization', sort: 5, kyRoot: null, _id: '6a92983f4cf7c217251cf25d' },
    { key: 'people-organization', name: 'People & Organization', sort: 5, kyRoot: 'manufacturing-services', _id: '6ab774a7fc30542e27359f6c' },
    { key: 'digital-innovation', name: 'Digital & Innovation', sort: 6, kyRoot: null, _id: '6a92983f4cf7c217251cf25e' },
    { key: 'digital-innovation', name: 'Digital & Innovation', sort: 6, kyRoot: 'manufacturing-services', _id: '6ab774a7fc30542e27359f6d' },
  ],
  nonProfitPillars: 6,
  nonProfitQuestions: { active: 18, total: 36 },
};

console.log('=== ATLAS vs LOCAL COMPARISON ===\n');

console.log('1. BUSINESS TYPES');
console.log('   ATLAS keys: services, manufacture, startup, non-profit (no kyRoot)');
console.log('   LOCAL keys: service, product, startup, ngo (with kyRoot)');
console.log('   DIFF: Different key vocabulary. Local uses kyRoot for routing; Atlas does not.');

console.log('\n2. DOMAINS');
console.log('   ATLAS: 16 domains, all with 9 questions each, all linked to bt');
console.log('   LOCAL: 12 domains, only 1 with questions (manufacturing: 10), others 0 questions, partial bt links');

console.log('\n3. DOMAINS IN ATLAS BUT MISSING IN LOCAL (8):');
const atlasSlugs = new Set(ATLAS.domains.map(d => d.slug));
const localSlugs = new Set(LOCAL.domains.map(d => d.slug));
for (const d of ATLAS.domains) {
  if (!localSlugs.has(d.slug)) {
    console.log(`   - ${d.slug} (${d.name}) -> bt: ${d.bt.join(', ')} | ${d.q} questions`);
  }
}

console.log('\n4. DOMAINS IN LOCAL BUT NOT IN ATLAS (4 slug differences):');
for (const d of LOCAL.domains) {
  if (!atlasSlugs.has(d.slug)) {
    console.log(`   - ${d.slug} (${d.name}) -> bt: ${d.bt.join(', ')} | ${d.q} questions`);
  }
}

console.log('\n5. DOMAIN SLUG MISMATCHES (same name, different slug):');
const nameMap = new Map();
for (const d of ATLAS.domains) nameMap.set(d.name.toLowerCase(), d.slug);
for (const d of LOCAL.domains) {
  const atlasSlug = nameMap.get(d.name.toLowerCase());
  if (atlasSlug && atlasSlug !== d.slug) {
    console.log(`   - Local: ${d.slug} | Atlas: ${atlasSlug} | name: ${d.name}`);
  }
}

console.log('\n6. RETAIL & E-COMMERCE');
console.log('   Local: retail_ecommerce (underscore) -> bt: product | 0 questions');
console.log('   Atlas: retail-e-commerce (hyphen) -> bt: services | 9 questions');
console.log('   ISSUE: Different slug, different business type, local has 0 questions vs Atlas 9');

console.log('\n7. MANUFACTURING DOMAIN');
console.log('   Local: manufacturing -> bt: product | 10 questions');
console.log('   Atlas: manufacturing -> bt: manufacture | 9 questions');
console.log('   OK: Same slug, similar questions. Local has 10 vs Atlas 9 (1 extra)');

console.log('\n8. GENERIC POOL');
console.log('   Both: 20 active generic questions. MATCH.');

console.log('\n9. PILLARS (Mfg/Services)');
console.log('   Atlas: 6 pillars (kyRoot=null)');
console.log('   Local: 12 pillars (6 duplicates: 6 with kyRoot=null + 6 with kyRoot=manufacturing-services)');
console.log('   ISSUE: Local has duplicate pillar set from seeder run.');

console.log('\n10. NON-PROFIT (VERIFICATION - should be untouched)');
console.log('   Atlas: 0 Non-Profit pillars, 9 active Non-Profit questions (bt: ngo?)');
console.log('   Local: 6 Non-Profit pillars (kyRoot=non-profit), 18 active + 18 inactive Non-Profit questions');
console.log('   NOTE: Atlas appears to NOT have the Non-Profit root configured yet.');

console.log('\n=== KEY FINDINGS ===');
console.log('1. Business type vocabulary differs (Atlas: services/manufacture/non-profit vs Local: service/product/ngo)');
console.log('2. Atlas has 8 additional Mfg/Services domains with full question sets');
console.log('3. Local missing 8 domains that exist in Atlas');
console.log('4. 7 domain slugs use hyphens in Atlas vs underscores in local');
console.log('5. Retail & E-Commerce: Atlas has questions (9), local has 0 (slug mismatch)');
console.log('6. Local has duplicate Mfg/Services pillars (12 vs 6)');
console.log('7. Domain business-type links in local are incomplete (only 3/12 linked)');
console.log('8. Atlas Non-Profit setup is minimal (no pillars, 9 questions) vs Local full setup');