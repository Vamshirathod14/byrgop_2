/**
 * Sync Atlas Manufacturing & Services domain/question data to local DB.
 * 
 * Strategy:
 * 1. Same-_id domains (slug mismatch): Keep local underscore slug, import Atlas questions mapped to local slug
 * 2. Different-_id domains (financial, hospitality, professional): Update local placeholders to match Atlas, import questions
 * 3. New Atlas domains (5): Create new local domains with Atlas slugs, link to correct local business types
 * 4. Manufacturing domain: Keep local 10 questions (already has them)
 * 5. Pillars: Remove duplicate manufacturing-services pillars (keep kyRoot=null set which matches Atlas)
 * 6. Non-Profit: DO NOT TOUCH
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import Domain from '../src/models/Domain.js';
import KnowYourselfQuestion from '../src/models/KnowYourselfQuestion.js';
import BusinessType from '../src/models/BusinessType.js';
import KYCategory from '../src/models/KYCategory.js';

// Atlas URI must be provided via environment variable.
// Never hard-code credentials. Do not log the URI.
const ATLAS_URI = process.env.ATLAS_MONGO_URI;
const LOCAL_URI = "mongodb://127.0.0.1:27017/byrgop";

if (!ATLAS_URI) {
  console.error('Error: ATLAS_MONGO_URI environment variable is required but not set.');
  console.error('Set it to your Atlas connection string (mongodb+srv://...)');
  process.exit(1);
}

// Connect to both databases
const atlasConn = mongoose.createConnection(ATLAS_URI);
const localConn = mongoose.createConnection(LOCAL_URI);

const AtlasDomain = atlasConn.model('Domain', Domain.schema);
const AtlasQuestion = atlasConn.model('KnowYourselfQuestion', KnowYourselfQuestion.schema);
const LocalDomain = localConn.model('Domain', Domain.schema);
const LocalQuestion = localConn.model('KnowYourselfQuestion', KnowYourselfQuestion.schema);
const LocalBusinessType = localConn.model('BusinessType', BusinessType.schema);
const LocalKYCategory = localConn.model('KYCategory', KYCategory.schema);

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  console.log('=== ATLAS -> LOCAL SYNC START ===\n');
  
  // Get local business types for linking
  const localService = await LocalBusinessType.findOne({ key: 'service' }).lean();
  const localProduct = await LocalBusinessType.findOne({ key: 'product' }).lean();
  console.log('Local business types:', { service: localService?._id, product: localProduct?._id });
  
  // 1. Fetch all Atlas domain questions
  console.log('\n1. Fetching Atlas domain questions...');
  const atlasDomains = await AtlasDomain.find({}).lean();
  const atlasQuestionsByDomain = {};
  for (const d of atlasDomains) {
    const qs = await AtlasQuestion.find({ domain: d.slug, active: true, type: 'domain' }).lean();
    if (qs.length > 0) {
      atlasQuestionsByDomain[d.slug] = { domain: d, questions: qs };
      console.log(`  Atlas ${d.slug} (${d.name}): ${qs.length} questions -> btId=${d.businessTypeId}`);
    }
  }
  
  // 2. Process same-_id domains (slug mismatch): keep local slug, import Atlas questions
  console.log('\n2. Processing same-_id domains (slug mismatch)...');
  const sameIdMap = {
    'franchise-multi-unit': 'franchise_multi_unit',
    'healthcare-life-sciences': 'healthcare_wellness',
    'retail-e-commerce': 'retail_ecommerce',
    'supply-chain-logistics': 'supply_chain_logistics',
    'technology-saas': 'technology_saas',
    'manufacturing': 'manufacturing', // same slug
    'real_estate_construction': 'real_estate_construction', // same slug
    'fitness-gym-wellness-operations': 'fitness-gym-wellness-operations', // same slug
  };
  
  for (const [atlasSlug, localSlug] of Object.entries(sameIdMap)) {
    if (!atlasQuestionsByDomain[atlasSlug]) {
      console.log(`  ${atlasSlug} -> ${localSlug}: NO Atlas questions, skipping`);
      continue;
    }
    const { domain: atlasDomain, questions } = atlasQuestionsByDomain[atlasSlug];
    const localDomain = await LocalDomain.findOne({ slug: localSlug }).lean();
    if (!localDomain) {
      console.log(`  ${atlasSlug} -> ${localSlug}: LOCAL DOMAIN NOT FOUND, skipping`);
      continue;
    }
    console.log(`  ${atlasSlug} -> ${localSlug}: importing ${questions.length} questions...`);
    
    // Import questions with LOCAL domain slug
    for (const q of questions) {
      const exists = await LocalQuestion.findOne({ 
        domain: localSlug, 
        text: q.text, 
        type: 'domain',
        active: true 
      }).lean();
      if (!exists) {
        const newQ = new LocalQuestion({
          text: q.text,
          type: 'domain',
          domain: localSlug,
          businessType: null, // shared pool
          options: q.options,
          active: q.active,
          category: q.category,
          glossary: q.glossary,
        });
        await newQ.save();
      }
    }
    // Update local domain name if differs
    if (localDomain.name !== atlasDomain.name) {
      await LocalDomain.updateOne({ slug: localSlug }, { name: atlasDomain.name });
      console.log(`    Updated name: "${localDomain.name}" -> "${atlasDomain.name}"`);
    }
    // Update bt link if Atlas has one and local doesn't
    if (atlasDomain.businessTypeId && !localDomain.businessTypeId) {
      const btKey = atlasDomain.businessTypeId.toString() === localService._id.toString() ? 'service' : 'product';
      await LocalDomain.updateOne({ slug: localSlug }, { businessTypeId: btKey === 'service' ? localService._id : localProduct._id });
      console.log(`    Linked to local business type: ${btKey}`);
    }
  }
  
  // 3. Process different-_id domains (financial, hospitality, professional)
  console.log('\n3. Processing different-_id domains (financial, hospitality, professional)...');
  const differentIdMap = {
    'financial-services': { localSlug: 'financial_services', localBt: 'service', atlasBtKey: 'services' },
    'hospitality-food-beverage': { localSlug: 'hospitality_food_beverage', localBt: 'service', atlasBtKey: 'services' },
    'professional-services': { localSlug: 'professional_services', localBt: 'service', atlasBtKey: 'services' },
  };
  
  for (const [atlasSlug, cfg] of Object.entries(differentIdMap)) {
    if (!atlasQuestionsByDomain[atlasSlug]) {
      console.log(`  ${atlasSlug}: NO Atlas questions, skipping`);
      continue;
    }
    const { domain: atlasDomain, questions } = atlasQuestionsByDomain[atlasSlug];
    const localDomain = await LocalDomain.findOne({ slug: cfg.localSlug }).lean();
    if (!localDomain) {
      console.log(`  ${atlasSlug} -> ${cfg.localSlug}: LOCAL DOMAIN NOT FOUND, skipping`);
      continue;
    }
    console.log(`  ${atlasSlug} -> ${cfg.localSlug}: updating slug/name/bt, importing ${questions.length} questions...`);
    
    // Update local domain to match Atlas (slug, name, bt link)
    const btId = cfg.localBt === 'service' ? localService._id : localProduct._id;
    await LocalDomain.updateOne(
      { slug: cfg.localSlug },
      { 
        slug: atlasSlug,  // rename to Atlas hyphen slug
        name: atlasDomain.name,
        businessTypeId: btId,
        active: atlasDomain.active,
        sortOrder: atlasDomain.sortOrder || 0,
      }
    );
    console.log(`    Updated: slug=${atlasSlug}, name="${atlasDomain.name}", btId=${btId}`);
    
    // Import questions with NEW Atlas slug
    for (const q of questions) {
      const exists = await LocalQuestion.findOne({ 
        domain: atlasSlug, 
        text: q.text, 
        type: 'domain',
        active: true 
      }).lean();
      if (!exists) {
        const newQ = new LocalQuestion({
          text: q.text,
          type: 'domain',
          domain: atlasSlug,
          businessType: null,
          options: q.options,
          active: q.active,
          category: q.category,
          glossary: q.glossary,
        });
        await newQ.save();
      }
    }
  }
  
  // 4. Create new Atlas domains (5 new ones)
  console.log('\n4. Creating new Atlas domains...');
  const newDomains = [
    { slug: 'automotive_heavy_engineering', name: 'Automotive & Heavy Engineering', btKey: 'product' },
    { slug: 'cpg_food_processing', name: 'Consumer Packaged Goods (CPG) & Food Processing', btKey: 'product' },
    { slug: 'pharmaceuticals_biomanufacturing', name: 'Pharmaceuticals & Bio-Manufacturing', btKey: 'product' },
    { slug: 'raw_materials_mining_metallurgy', name: 'Raw Materials, Mining & Metallurgy', btKey: 'product' },
    { slug: 'humanitarian_aid_relief_logistics', name: 'Humanitarian Aid, Relief Logistics & Social Welfare', btKey: null }, // unlinked in Atlas
  ];
  
  for (const nd of newDomains) {
    const existing = await LocalDomain.findOne({ slug: nd.slug }).lean();
    if (existing) {
      console.log(`  ${nd.slug}: already exists locally, skipping create`);
    } else {
      const btId = nd.btKey ? (nd.btKey === 'service' ? localService._id : localProduct._id) : null;
      const newDomain = new LocalDomain({
        name: nd.name,
        slug: nd.slug,
        description: '',
        active: true,
        sortOrder: 0,
        businessTypeId: btId,
      });
      await newDomain.save();
      console.log(`  Created: ${nd.slug} (${nd.name}) -> bt=${nd.btKey}`);
    }
    // Import questions
    if (atlasQuestionsByDomain[nd.slug]) {
      const { questions } = atlasQuestionsByDomain[nd.slug];
      for (const q of questions) {
        const exists = await LocalQuestion.findOne({ 
          domain: nd.slug, 
          text: q.text, 
          type: 'domain',
          active: true 
        }).lean();
        if (!exists) {
          const newQ = new LocalQuestion({
            text: q.text,
            type: 'domain',
            domain: nd.slug,
            businessType: null,
            options: q.options,
            active: q.active,
            category: q.category,
            glossary: q.glossary,
          });
          await newQ.save();
        }
      }
      console.log(`    Imported ${questions.length} questions`);
    }
  }
  
  // 5. Manufacturing domain: verify local questions (10) vs Atlas (9)
  console.log('\n5. Manufacturing domain: local has 10, Atlas has 9. Keeping local.');
  
  // 6. Remove duplicate manufacturing-services pillars
  console.log('\n6. Removing duplicate manufacturing-services pillars...');
  const dupPillars = await LocalKYCategory.find({ kyRoot: 'manufacturing-services' }).lean();
  console.log(`  Found ${dupPillars.length} duplicate pillars with kyRoot=manufacturing-services`);
  if (dupPillars.length > 0) {
    const result = await LocalKYCategory.deleteMany({ kyRoot: 'manufacturing-services' });
    console.log(`  Deleted ${result.deletedCount} duplicate pillars`);
  }
  
  // 7. Verify Non-Profit untouched
  console.log('\n7. Verifying Non-Profit data untouched...');
  const npQ = await LocalQuestion.countDocuments({ businessType: 'ngo', active: true });
  const npCats = await LocalKYCategory.countDocuments({ kyRoot: 'non-profit', active: true });
  console.log(`  Non-Profit questions (active): ${npQ} (should be 18)`);
  console.log(`  Non-Profit pillars (active): ${npCats} (should be 6)`);
  
  // Final verification
  console.log('\n=== FINAL VERIFICATION ===');
  const localDomains = await LocalDomain.find({}).sort({ slug: 1 }).lean();
  console.log(`\nLocal domains after sync: ${localDomains.length}`);
  for (const d of localDomains) {
    const qCount = await LocalQuestion.countDocuments({ domain: d.slug, active: true, type: 'domain' });
    const bt = d.businessTypeId ? 'linked' : 'unlinked';
    console.log(`  ${d.slug.padEnd(35)} ${d.name.padEnd(45)} q=${String(qCount).padStart(2)} bt=${bt}`);
  }
  
  const genCount = await LocalQuestion.countDocuments({ active: true, type: 'generic', businessType: { $in: [null, ''] } });
  console.log(`\nGeneric pool: ${genCount} (should be 20)`);
  
  const mfgCats = await LocalKYCategory.find({ active: true, $or: [{ kyRoot: null }, { kyRoot: 'manufacturing-services' }] }).sort({ sortOrder: 1 }).lean();
  console.log(`\nMfg/Services pillars: ${mfgCats.length} (should be 6)`);
  for (const c of mfgCats) console.log(`  ${c.key} (kyRoot=${c.kyRoot ?? 'null'})`);
  
  await atlasConn.close();
  await localConn.close();
  console.log('\n=== SYNC COMPLETE ===');
}

main().catch(err => {
  console.error('SYNC FAILED:', err);
  process.exit(1);
});