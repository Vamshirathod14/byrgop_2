import mongoose from 'mongoose';
import fs from 'fs';

const LOCAL_URI = 'mongodb://127.0.0.1:27017/byrgop';
const ATLAS_URI = 'mongodb+srv://ramavathvamshicse_db_user:vamshi123@cluster0.p4u8yex.mongodb.net/?appName=Cluster0';

const isApply = process.argv.includes('--apply');
const isDryRun = process.argv.includes('--dry-run') || !isApply;
const isOnboardingOnly = process.argv.includes('--onboarding-only') || process.argv.includes('--onboarding');

async function sync() {
  console.log('====================================================');
  console.log(`STARTING LOCAL -> ATLAS PARITY SYNCHRONIZATION (${isDryRun ? 'DRY-RUN' : 'APPLY'})`);
  console.log('====================================================');

  const localConn = await mongoose.createConnection(LOCAL_URI).asPromise();
  const atlasConn = await mongoose.createConnection(ATLAS_URI).asPromise();
  const localDb = localConn.db;
  const atlasDb = atlasConn.db;

  if (isOnboardingOnly) {
    console.log('[MODE] Running onboarding questions synchronization only.');
    await syncOnboardingQuestionsOnly(localDb, atlasDb, isDryRun);
    await localConn.close();
    await atlasConn.close();
    return;
  }

  // ----------------------------------------------------
  // STEP 1: kycategories index fix & synchronization
  // ----------------------------------------------------
  console.log('\n--- 1. Synchronizing kycategories ---');
  // Drop legacy unique index on key_1 if present in Atlas
  const atlasCatIndexes = await atlasDb.collection('kycategories').indexes();
  if (atlasCatIndexes.some(i => i.name === 'key_1' && i.unique)) {
    console.log('Dropping legacy unique index kycategories.key_1 on Atlas...');
    await atlasDb.collection('kycategories').dropIndex('key_1');
  }
  // Ensure compound index { kyRoot: 1, key: 1 } unique
  await atlasDb.collection('kycategories').createIndex({ kyRoot: 1, key: 1 }, { unique: true, name: 'kyRoot_1_key_1' });

  // Delete old Atlas non-profit categories that had wrong keys (mission-impact, revenue, etc. with kyRoot='non-profit')
  const delWrongNpCats = await atlasDb.collection('kycategories').deleteMany({
    kyRoot: 'non-profit',
    key: { $in: ['mission-impact', 'revenue', 'operations', 'finance', 'people-culture', 'governance'] }
  });
  console.log(`Removed ${delWrongNpCats.deletedCount} superseded Atlas non-profit category records with non-standard keys.`);

  // Upsert all local kycategories (30 records) by natural key (kyRoot + key)
  const localCats = await localDb.collection('kycategories').find({}).toArray();
  let syncedCats = 0;
  for (const cat of localCats) {
    const filter = {
      kyRoot: cat.kyRoot || null,
      key: cat.key
    };
    const update = {
      $set: {
        name: cat.name,
        description: cat.description || '',
        color: cat.color || '#0A78CF',
        kyRoot: cat.kyRoot || null,
        sortOrder: cat.sortOrder,
        active: cat.active,
        updatedAt: cat.updatedAt || new Date()
      },
      $setOnInsert: {
        _id: cat._id,
        createdAt: cat.createdAt || new Date(),
        __v: cat.__v || 0
      }
    };
    await atlasDb.collection('kycategories').updateOne(filter, update, { upsert: true });
    syncedCats++;
  }
  console.log(`Synced ${syncedCats} kycategories to Atlas.`);

  // ----------------------------------------------------
  // STEP 2: businesstypes synchronization
  // ----------------------------------------------------
  console.log('\n--- 2. Synchronizing businesstypes ---');
  // We want the 4 canonical local business types: service, product, ngo, startup
  const localBts = await localDb.collection('businesstypes').find({}).toArray();

  // If Atlas has legacy keys ('services', 'manufacture', 'non-profit'), we can update or migrate them
  // Atlas has:
  // services -> update key to service, name to Services, kyRoot to manufacturing-services
  // manufacture -> update key to product, name to Manufacturing, kyRoot to manufacturing-services
  // non-profit -> update key to ngo, name to Non-Profit, kyRoot to non-profit
  // startup -> update key to startup, name to Start-Up, kyRoot to startup

  // Check existing Atlas businesstypes
  const atlasBts = await atlasDb.collection('businesstypes').find({}).toArray();
  const atlasBtMap = new Map();
  for (const ab of atlasBts) {
    atlasBtMap.set(ab.key, ab);
  }

  // Update legacy Atlas records if present so that existing references preserve their _id!
  if (atlasBtMap.has('services')) {
    const lService = localBts.find(b => b.key === 'service');
    await atlasDb.collection('businesstypes').updateOne(
      { key: 'services' },
      { $set: { key: 'service', name: lService.name, description: lService.description, kyRoot: lService.kyRoot, sortOrder: 1, active: true } }
    );
    console.log('Updated Atlas business type "services" -> "service" (kyRoot: manufacturing-services)');
  }
  if (atlasBtMap.has('manufacture')) {
    const lProduct = localBts.find(b => b.key === 'product');
    await atlasDb.collection('businesstypes').updateOne(
      { key: 'manufacture' },
      { $set: { key: 'product', name: lProduct.name, description: lProduct.description, kyRoot: lProduct.kyRoot, sortOrder: 2, active: true } }
    );
    console.log('Updated Atlas business type "manufacture" -> "product" (kyRoot: manufacturing-services)');
  }
  if (atlasBtMap.has('non-profit')) {
    const lNgo = localBts.find(b => b.key === 'ngo');
    await atlasDb.collection('businesstypes').updateOne(
      { key: 'non-profit' },
      { $set: { key: 'ngo', name: lNgo.name, description: lNgo.description, kyRoot: lNgo.kyRoot, sortOrder: 3, active: true } }
    );
    console.log('Updated Atlas business type "non-profit" -> "ngo" (kyRoot: non-profit)');
  }
  if (atlasBtMap.has('startup')) {
    const lStartup = localBts.find(b => b.key === 'startup');
    await atlasDb.collection('businesstypes').updateOne(
      { key: 'startup' },
      { $set: { name: lStartup.name, description: lStartup.description, kyRoot: lStartup.kyRoot, sortOrder: 4, active: true } }
    );
    console.log('Updated Atlas business type "startup" (kyRoot: startup)');
  }

  // Also ensure all 4 local business types exist (in case any wasn't in Atlas)
  for (const bt of localBts) {
    await atlasDb.collection('businesstypes').updateOne(
      { key: bt.key },
      {
        $set: {
          name: bt.name,
          description: bt.description,
          kyRoot: bt.kyRoot,
          sortOrder: bt.sortOrder,
          active: bt.active,
          updatedAt: new Date()
        },
        $setOnInsert: {
          _id: bt._id,
          createdAt: bt.createdAt || new Date()
        }
      },
      { upsert: true }
    );
  }

  // Refresh current Atlas BusinessType documents to know their _ids
  const currentAtlasBts = await atlasDb.collection('businesstypes').find({}).toArray();
  const serviceBt = currentAtlasBts.find(b => b.key === 'service');
  const productBt = currentAtlasBts.find(b => b.key === 'product');
  const ngoBt = currentAtlasBts.find(b => b.key === 'ngo');
  const startupBt = currentAtlasBts.find(b => b.key === 'startup');
  console.log('Current Atlas Business Types:', currentAtlasBts.map(b => ({ id: b._id, key: b.key, kyRoot: b.kyRoot })));

  // ----------------------------------------------------
  // STEP 3: domains synchronization
  // ----------------------------------------------------
  console.log('\n--- 3. Synchronizing domains ---');
  // Local domains: 17 domains
  // We need all domains linked to their respective businessType:
  // Service domains (9) -> serviceBt._id
  // Manufacturing domains (6) -> productBt._id
  // nonprofit_org (1) -> ngoBt._id
  // humanitarian (1) -> null / unlinked

  // Ensure nonprofit_org domain exists in Atlas with ngoBt._id
  const localNonprofitDomain = await localDb.collection('domains').findOne({ slug: 'nonprofit_org' });
  if (localNonprofitDomain) {
    await atlasDb.collection('domains').updateOne(
      { slug: 'nonprofit_org' },
      {
        $set: {
          name: localNonprofitDomain.name,
          description: localNonprofitDomain.description || '',
          active: true,
          businessTypeId: ngoBt ? ngoBt._id : null,
          updatedAt: new Date()
        },
        $setOnInsert: {
          _id: localNonprofitDomain._id,
          createdAt: localNonprofitDomain.createdAt || new Date(),
          __v: 0
        }
      },
      { upsert: true }
    );
    console.log('Upserted nonprofit_org domain in Atlas.');
  }

  // Update existing Atlas domains' businessTypeId to point to current Atlas business types
  const serviceDomainSlugs = [
    'retail-e-commerce', 'healthcare-life-sciences', 'supply-chain-logistics',
    'technology-saas', 'franchise-multi-unit', 'fitness-gym-wellness-operations',
    'financial-services', 'professional-services', 'hospitality-food-beverage'
  ];
  const mfgDomainSlugs = [
    'manufacturing', 'real_estate_construction', 'raw_materials_mining_metallurgy',
    'cpg_food_processing', 'pharmaceuticals_biomanufacturing', 'automotive_heavy_engineering'
  ];

  if (serviceBt) {
    await atlasDb.collection('domains').updateMany(
      { slug: { $in: serviceDomainSlugs } },
      { $set: { businessTypeId: serviceBt._id } }
    );
    console.log(`Linked ${serviceDomainSlugs.length} service domains to service businessType (_id: ${serviceBt._id})`);
  }
  if (productBt) {
    await atlasDb.collection('domains').updateMany(
      { slug: { $in: mfgDomainSlugs } },
      { $set: { businessTypeId: productBt._id } }
    );
    console.log(`Linked ${mfgDomainSlugs.length} manufacturing domains to product businessType (_id: ${productBt._id})`);
  }
  // humanitarian remains unlinked
  await atlasDb.collection('domains').updateOne(
    { slug: 'humanitarian_aid_relief_logistics' },
    { $set: { businessTypeId: null } }
  );

  // Also support the local underscore slugs in Atlas so that requests using either hyphen or underscore slug succeed!
  // Same for retail_ecommerce, healthcare_wellness, supply_chain_logistics, technology_saas, franchise_multi_unit
  const underscorePairs = [
    { localSlug: 'retail_ecommerce', atlasSlug: 'retail-e-commerce', name: 'Retail & E-Commerce', btId: serviceBt?._id },
    { localSlug: 'healthcare_wellness', atlasSlug: 'healthcare-life-sciences', name: 'Healthcare & Life Sciences Operations', btId: serviceBt?._id },
    { localSlug: 'supply_chain_logistics', atlasSlug: 'supply-chain-logistics', name: 'Supply Chain, Logistics & Distribution', btId: serviceBt?._id },
    { localSlug: 'technology_saas', atlasSlug: 'technology-saas', name: 'Technology & SaaS / Digital Products', btId: serviceBt?._id },
    { localSlug: 'franchise_multi_unit', atlasSlug: 'franchise-multi-unit', name: 'Franchise & Multi-Unit Chains', btId: serviceBt?._id },
  ];

  for (const pair of underscorePairs) {
    const localDom = await localDb.collection('domains').findOne({ slug: pair.localSlug });
    if (localDom) {
      // Check if already in Atlas by slug
      const existingInAtlas = await atlasDb.collection('domains').findOne({ slug: pair.localSlug });
      if (!existingInAtlas) {
        await atlasDb.collection('domains').insertOne({
          _id: new mongoose.Types.ObjectId(),
          slug: pair.localSlug,
          name: pair.name,
          description: '',
          active: true,
          businessTypeId: pair.btId,
          createdAt: new Date(),
          updatedAt: new Date(),
          __v: 0
        });
        console.log(`Added alias domain "${pair.localSlug}" to Atlas.`);
      }
    }
  }

  // ----------------------------------------------------
  // STEP 4: knowyourselfquestions synchronization
  // ----------------------------------------------------
  console.log('\n--- 4. Synchronizing knowyourselfquestions ---');

  // A. Clean up humanitarian leakage: in Atlas, 9 humanitarian questions had businessType='ngo'
  // In verified local state, humanitarian questions have businessType=null, type='domain', domain='humanitarian_aid_relief_logistics'
  const fixHumanitarian = await atlasDb.collection('knowyourselfquestions').updateMany(
    { domain: 'humanitarian_aid_relief_logistics' },
    { $set: { businessType: null, kyRoot: null } }
  );
  console.log(`Cleaned up humanitarian questions: ${fixHumanitarian.modifiedCount} questions untagged from ngo businessType.`);

  // B. Sync Non-Profit questions (all 55: 18 active + 37 retired)
  // Natural key: text
  const localNpQuestions = await localDb.collection('knowyourselfquestions').find({ businessType: 'ngo' }).toArray();
  console.log(`Found ${localNpQuestions.length} Non-Profit questions in local database (${localNpQuestions.filter(q=>q.active).length} active).`);

  let npInserted = 0, npUpdated = 0;
  for (const q of localNpQuestions) {
    const filter = { text: q.text, businessType: 'ngo' };
    const update = {
      $set: {
        text: q.text,
        type: q.type || 'generic',
        domain: q.domain || null,
        options: q.options,
        active: q.active,
        category: q.category,
        businessType: 'ngo',
        kyRoot: 'non-profit',
        glossary: q.glossary || [],
        updatedAt: q.updatedAt || new Date()
      },
      $setOnInsert: {
        _id: q._id,
        createdAt: q.createdAt || new Date(),
        __v: q.__v || 0
      }
    };
    const res = await atlasDb.collection('knowyourselfquestions').updateOne(filter, update, { upsert: true });
    if (res.upsertedCount > 0) npInserted++;
    else if (res.modifiedCount > 0) npUpdated++;
  }
  console.log(`Non-Profit questions synced to Atlas: ${npInserted} inserted, ${npUpdated} updated.`);

  // Verify retired conflicts question in Atlas
  await atlasDb.collection('knowyourselfquestions').updateMany(
    { businessType: 'ngo', text: /conflict/i },
    { $set: { active: false } }
  );
  console.log('Ensured all conflicts-of-interest Non-Profit questions remain retired in Atlas.');

  // C. Sync Startup questions (all 18 active)
  const localStartupQuestions = await localDb.collection('knowyourselfquestions').find({ businessType: 'startup' }).toArray();
  console.log(`Found ${localStartupQuestions.length} Startup questions in local database.`);

  let suInserted = 0, suUpdated = 0;
  for (const q of localStartupQuestions) {
    const filter = { text: q.text, businessType: 'startup' };
    const update = {
      $set: {
        text: q.text,
        type: q.type || 'generic',
        domain: q.domain || null,
        options: q.options,
        active: q.active,
        category: q.category,
        businessType: 'startup',
        kyRoot: 'startup',
        glossary: q.glossary || [],
        updatedAt: q.updatedAt || new Date()
      },
      $setOnInsert: {
        _id: q._id,
        createdAt: q.createdAt || new Date(),
        __v: q.__v || 0
      }
    };
    const res = await atlasDb.collection('knowyourselfquestions').updateOne(filter, update, { upsert: true });
    if (res.upsertedCount > 0) suInserted++;
    else if (res.modifiedCount > 0) suUpdated++;
  }
  console.log(`Startup questions synced to Atlas: ${suInserted} inserted, ${suUpdated} updated.`);

  // D. Sync Manufacturing 10 local questions (local has 19 total, Atlas has 9 of them, 10 are unique to local)
  const localMfgQuestions = await localDb.collection('knowyourselfquestions').find({ domain: 'manufacturing' }).toArray();
  let mfgInserted = 0, mfgUpdated = 0;
  for (const q of localMfgQuestions) {
    const filter = { text: q.text, domain: 'manufacturing' };
    const update = {
      $set: {
        text: q.text,
        type: 'domain',
        domain: 'manufacturing',
        options: q.options,
        active: q.active,
        category: q.category,
        businessType: null,
        kyRoot: null,
        glossary: q.glossary || [],
        updatedAt: q.updatedAt || new Date()
      },
      $setOnInsert: {
        _id: q._id,
        createdAt: q.createdAt || new Date(),
        __v: q.__v || 0
      }
    };
    const res = await atlasDb.collection('knowyourselfquestions').updateOne(filter, update, { upsert: true });
    if (res.upsertedCount > 0) mfgInserted++;
    else if (res.modifiedCount > 0) mfgUpdated++;
  }
  console.log(`Manufacturing questions synced to Atlas: ${mfgInserted} inserted, ${mfgUpdated} updated.`);

  // E. Also ensure underscore domain questions exist in Atlas so if someone requests e.g. technology_saas or retail_ecommerce, it finds them
  for (const pair of underscorePairs) {
    const localDomainQuestions = await localDb.collection('knowyourselfquestions').find({ domain: pair.localSlug }).toArray();
    for (const q of localDomainQuestions) {
      await atlasDb.collection('knowyourselfquestions').updateOne(
        { text: q.text, domain: pair.localSlug },
        {
          $set: {
            text: q.text,
            type: 'domain',
            domain: pair.localSlug,
            options: q.options,
            active: q.active,
            category: q.category,
            businessType: null,
            kyRoot: null,
            glossary: q.glossary || [],
            updatedAt: new Date()
          },
          $setOnInsert: {
            _id: q._id,
            createdAt: q.createdAt || new Date(),
            __v: 0
          }
        },
        { upsert: true }
      );
    }
  }

  // ----------------------------------------------------
  // STEP 5: Onboarding stages, categories, resultcontents, questions
  // ----------------------------------------------------
  console.log('\n--- 5. Synchronizing Onboarding Configuration ---');

  // A. Categories (3 categories: strategic, operational, revenue)
  const localOnbCats = await localDb.collection('categories').find({}).toArray();
  for (const cat of localOnbCats) {
    await atlasDb.collection('categories').updateOne(
      { key: cat.key },
      {
        $set: {
          key: cat.key,
          name: cat.name,
          description: cat.description,
          color: cat.color,
          sortOrder: cat.sortOrder,
          active: cat.active,
          updatedAt: cat.updatedAt || new Date()
        },
        $setOnInsert: {
          _id: cat._id,
          createdAt: cat.createdAt || new Date(),
          __v: cat.__v || 0
        }
      },
      { upsert: true }
    );
  }
  console.log(`Ensured onboarding categories synced in Atlas.`);

  // Get map of Atlas category key -> _id
  const currentAtlasOnbCats = await atlasDb.collection('categories').find({}).toArray();
  const onbCatMap = new Map(currentAtlasOnbCats.map(c => [c.key, c._id]));

  // B. Stages (6 stages: initiation, due-diligence, analysis, recommendations, implementation, monitoring)
  const localStages = await localDb.collection('stages').find({}).toArray();
  for (const st of localStages) {
    await atlasDb.collection('stages').updateOne(
      { key: st.key },
      {
        $set: {
          key: st.key,
          name: st.name,
          color: st.color,
          sortOrder: st.sortOrder,
          active: st.active,
          updatedAt: st.updatedAt || new Date()
        },
        $setOnInsert: {
          _id: st._id,
          createdAt: st.createdAt || new Date(),
          __v: st.__v || 0
        }
      },
      { upsert: true }
    );
  }
  console.log(`Synced ${localStages.length} stages to Atlas.`);

  // C. ResultContents (9 records)
  const localRc = await localDb.collection('resultcontents').find({}).toArray();
  for (const rc of localRc) {
    // Find category key from local category
    const localCat = localOnbCats.find(c => c._id.toString() === rc.category.toString());
    const catKey = localCat ? localCat.key : 'strategic';
    const atlasCatId = onbCatMap.get(catKey) || rc.category;

    await atlasDb.collection('resultcontents').updateOne(
      { category: atlasCatId, title: rc.title, minScore: rc.minScore },
      {
        $set: {
          category: atlasCatId,
          minScore: rc.minScore,
          maxScore: rc.maxScore,
          title: rc.title,
          interpretation: rc.interpretation,
          recommendations: rc.recommendations,
          active: rc.active,
          mark: rc.mark || 'BYRGOP-DEMO',
          updatedAt: rc.updatedAt || new Date()
        },
        $setOnInsert: {
          _id: rc._id,
          createdAt: rc.createdAt || new Date(),
          __v: rc.__v || 0
        }
      },
      { upsert: true }
    );
  }
  console.log(`Synced ${localRc.length} resultcontents to Atlas.`);

  // D. Onboarding Questions
  console.log('\n--- 5.D. Synchronizing onboarding questions ---');
  await syncOnboardingQuestionsOnly(localDb, atlasDb, isDryRun);

  await localConn.close();
  await atlasConn.close();

  console.log('\n====================================================');
  console.log('SYNCHRONIZATION COMPLETED SUCCESSFULLY');
  console.log('====================================================');
}

export async function syncOnboardingQuestionsOnly(localDb, atlasDb, isDryRun) {
  const localOnbCats = await localDb.collection('categories').find({}).toArray();
  const atlasOnbCats = await atlasDb.collection('categories').find({}).toArray();
  const onbCatMap = new Map();
  for (const ac of atlasOnbCats) {
    onbCatMap.set(ac.key, ac._id);
  }

  const localOnbQs = await localDb.collection('questions').find({}).toArray();
  const atlasExistingQs = await atlasDb.collection('questions').find({}).toArray();

  const localOnbMap = new Map(localOnbQs.map(q => [q._id.toString(), q]));
  const atlasOnbMap = new Map(atlasExistingQs.map(q => [q._id.toString(), q]));

  const localOnlyQs = [];
  const atlasOnlyQs = [];
  const bothIdenticalQs = [];
  const bothDifferentQs = [];

  for (const [id, lq] of localOnbMap) {
    if (!atlasOnbMap.has(id)) {
      localOnlyQs.push(lq);
    } else {
      const aq = atlasOnbMap.get(id);
      const isDiff =
        lq.text !== aq.text ||
        lq.active !== aq.active ||
        lq.businessType !== aq.businessType ||
        lq.weight !== aq.weight ||
        lq.displayOrder !== aq.displayOrder;
      if (!isDiff) {
        bothIdenticalQs.push({ id, text: lq.text });
      } else {
        bothDifferentQs.push({
          id,
          localText: lq.text,
          atlasText: aq.text,
          localActive: lq.active,
          atlasActive: aq.active,
          localBt: lq.businessType,
          atlasBt: aq.businessType
        });
      }
    }
  }

  for (const [id, aq] of atlasOnbMap) {
    if (!localOnbMap.has(id)) {
      atlasOnlyQs.push(aq);
    }
  }

  console.log(`\n====================================================`);
  console.log(`ONBOARDING QUESTIONS COMPARISON (BY _id):`);
  console.log(`====================================================`);
  console.log(`TOTAL LOCAL QUESTIONS: ${localOnbQs.length}`);
  console.log(`TOTAL ATLAS QUESTIONS: ${atlasExistingQs.length}`);
  console.log(`LOCAL ONLY: ${localOnlyQs.length}`);
  for (const q of localOnlyQs) {
    console.log(`  - [${q._id}] bt: ${q.businessType || 'generic'} | active: ${q.active} | text: "${q.text?.slice(0, 60)}..."`);
  }
  console.log(`ATLAS ONLY: ${atlasOnlyQs.length}`);
  for (const q of atlasOnlyQs) {
    console.log(`  - [${q._id}] bt: ${q.businessType || 'generic'} | active: ${q.active} | text: "${q.text?.slice(0, 60)}..."`);
  }
  console.log(`BOTH IDENTICAL: ${bothIdenticalQs.length}`);
  for (const q of bothIdenticalQs) {
    console.log(`  - [${q.id}] text: "${q.text?.slice(0, 60)}..."`);
  }
  console.log(`BOTH DIFFERENT: ${bothDifferentQs.length}`);
  for (const d of bothDifferentQs) {
    console.log(`  - [${d.id}]`);
    console.log(`      local: "${d.localText}" (active: ${d.localActive}, bt: ${d.localBt})`);
    console.log(`      atlas: "${d.atlasText}" (active: ${d.atlasActive}, bt: ${d.atlasBt})`);
  }

  if (isDryRun) {
    console.log('\n[DRY-RUN] No writes were made to Atlas. To apply, pass --apply flag.');
    return;
  }

  // Take backup of Atlas questions before write
  const backupDir = './backups';
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
  const backupFile = `${backupDir}/atlas_questions_pre_sync_${Date.now()}.json`;
  fs.writeFileSync(backupFile, JSON.stringify(atlasExistingQs, null, 2));
  console.log(`\n[BACKUP] Backed up ${atlasExistingQs.length} Atlas question records to ${backupFile}`);

  // Apply sync by _id
  let onbQCount = 0;
  for (const q of localOnbQs) {
    const localCat = localOnbCats.find(c => c._id.toString() === q.category?.toString());
    const catKey = localCat ? localCat.key : 'strategic';
    const atlasCatId = onbCatMap.get(catKey) || q.category;

    await atlasDb.collection('questions').updateOne(
      { _id: q._id },
      {
        $set: {
          text: q.text,
          category: atlasCatId,
          businessType: q.businessType || null,
          weight: q.weight,
          stageKey: q.stageKey || null,
          options: q.options,
          active: q.active,
          displayOrder: q.displayOrder,
          updatedAt: q.updatedAt || new Date()
        },
        $setOnInsert: {
          _id: q._id,
          createdAt: q.createdAt || new Date(),
          __v: q.__v || 0
        }
      },
      { upsert: true }
    );
    onbQCount++;
  }
  console.log(`Synced ${onbQCount} onboarding questions to Atlas by _id.`);

  // Preserve Atlas-only records but retire older superseded scoped questions so they do not shadow active ones
  const scopedTypes = ['service', 'manufacturing', 'nonprofit', 'startup'];
  const localIdStrings = localOnbQs.map(q => q._id.toString());
  const localObjectIds = localOnbQs.map(q => q._id);
  const retiredResult = await atlasDb.collection('questions').updateMany(
    {
      _id: { $nin: [...localObjectIds, ...localIdStrings] },
      businessType: { $in: scopedTypes },
      active: true
    },
    {
      $set: {
        active: false,
        superseded: true,
        updatedAt: new Date()
      }
    }
  );
  console.log(`Safely retired ${retiredResult.modifiedCount} superseded Atlas-only questions (marked active: false).`);

  // Post-sync verification
  const atlasPostQs = await atlasDb.collection('questions').find({}).toArray();
  const atlasActiveScoped = atlasPostQs.filter(q => q.active && scopedTypes.includes(q.businessType));
  console.log(`\n--- POST-SYNC VERIFICATION ---`);
  console.log(`Atlas total questions: ${atlasPostQs.length}`);
  console.log(`Atlas active scoped questions: ${atlasActiveScoped.length} (expected 12: 3 per type)`);

  for (const bt of scopedTypes) {
    const activeForType = atlasActiveScoped.filter(q => q.businessType === bt);
    console.log(`  - ${bt}: ${activeForType.length} active questions`);
  }
}

sync().catch(err => {
  console.error('SYNCHRONIZATION FAILED:', err);
  process.exit(1);
});


