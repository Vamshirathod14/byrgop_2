import mongoose from 'mongoose';

const LOCAL_URI = 'mongodb://127.0.0.1:27017/byrgop';
const ATLAS_URI = 'mongodb+srv://ramavathvamshicse_db_user:vamshi123@cluster0.p4u8yex.mongodb.net/?appName=Cluster0';

async function run() {
  const localConn = await mongoose.createConnection(LOCAL_URI).asPromise();
  const atlasConn = await mongoose.createConnection(ATLAS_URI).asPromise();

  console.log('=== 1. ALL COLLECTION COUNTS ===');
  const localCols = await localConn.db.listCollections().toArray();
  const atlasCols = await atlasConn.db.listCollections().toArray();
  const allColNames = Array.from(new Set([...localCols.map(c => c.name), ...atlasCols.map(c => c.name)])).sort();

  for (const name of allColNames) {
    const lCount = localCols.some(c => c.name === name) ? await localConn.db.collection(name).countDocuments() : 'N/A';
    const aCount = atlasCols.some(c => c.name === name) ? await atlasConn.db.collection(name).countDocuments() : 'N/A';
    console.log(`${name.padEnd(25)} | Local: ${String(lCount).padEnd(6)} | Atlas: ${String(aCount).padEnd(6)}`);
  }

  console.log('\n=== 2. BUSINESS TYPES ===');
  const localBts = await localConn.collection('businesstypes').find({}).sort({ sortOrder: 1 }).toArray();
  const atlasBts = await atlasConn.collection('businesstypes').find({}).sort({ sortOrder: 1 }).toArray();
  console.log('--- LOCAL ---');
  for (const b of localBts) console.log(`  id=${b._id} key=${b.key} name="${b.name}" kyRoot=${b.kyRoot} active=${b.active}`);
  console.log('--- ATLAS ---');
  for (const b of atlasBts) console.log(`  id=${b._id} key=${b.key} name="${b.name}" kyRoot=${b.kyRoot} active=${b.active}`);

  console.log('\n=== 3. KY CATEGORIES (PILLARS) ===');
  const localCats = await localConn.collection('kycategories').find({}).sort({ kyRoot: 1, sortOrder: 1 }).toArray();
  const atlasCats = await atlasConn.collection('kycategories').find({}).sort({ kyRoot: 1, sortOrder: 1 }).toArray();
  console.log(`Local total: ${localCats.length}, Atlas total: ${atlasCats.length}`);
  const catGroup = (cats) => {
    const map = {};
    for (const c of cats) {
      const root = c.kyRoot === null || c.kyRoot === undefined ? '(null/shared)' : c.kyRoot;
      if (!map[root]) map[root] = [];
      map[root].push({ id: c._id.toString(), key: c.key, name: c.name, active: c.active, sortOrder: c.sortOrder });
    }
    return map;
  };
  console.log('Local categories:', JSON.stringify(catGroup(localCats), null, 2));
  console.log('Atlas categories:', JSON.stringify(catGroup(atlasCats), null, 2));

  console.log('\n=== 4. DOMAINS ===');
  const localDomains = await localConn.collection('domains').find({}).sort({ slug: 1 }).toArray();
  const atlasDomains = await atlasConn.collection('domains').find({}).sort({ slug: 1 }).toArray();
  console.log(`Local count: ${localDomains.length}, Atlas count: ${atlasDomains.length}`);
  const lDomMap = new Map(localDomains.map(d => [d.slug, d]));
  const aDomMap = new Map(atlasDomains.map(d => [d.slug, d]));
  const allSlugs = Array.from(new Set([...lDomMap.keys(), ...aDomMap.keys()])).sort();
  for (const s of allSlugs) {
    const ld = lDomMap.get(s);
    const ad = aDomMap.get(s);
    const lInfo = ld ? `id=${ld._id} btId=${ld.businessTypeId} act=${ld.active}` : 'MISSING';
    const aInfo = ad ? `id=${ad._id} btId=${ad.businessTypeId} act=${ad.active}` : 'MISSING';
    const match = ld && ad && ld._id.toString() === ad._id.toString() ? 'ID_MATCH' : (ld && ad ? 'ID_DIFF' : 'ONLY_ONE');
    console.log(`  ${s.padEnd(35)} | ${match} | Local: ${lInfo} | Atlas: ${aInfo}`);
  }

  console.log('\n=== 5. KNOW YOURSELF QUESTIONS SUMMARY ===');
  const localKyQ = await localConn.collection('knowyourselfquestions').find({}).toArray();
  const atlasKyQ = await atlasConn.collection('knowyourselfquestions').find({}).toArray();
  console.log(`Local KY questions: ${localKyQ.length} (active: ${localKyQ.filter(q => q.active).length})`);
  console.log(`Atlas KY questions: ${atlasKyQ.length} (active: ${atlasKyQ.filter(q => q.active).length})`);

  // Question groups
  const summarizeQ = (questions) => {
    const byRootAndBt = {};
    for (const q of questions) {
      const tag = `bt=${q.businessType || 'null'} | kyRoot=${q.kyRoot || 'null'} | type=${q.type} | active=${q.active}`;
      byRootAndBt[tag] = (byRootAndBt[tag] || 0) + 1;
    }
    return byRootAndBt;
  };
  console.log('Local Q summary:', summarizeQ(localKyQ));
  console.log('Atlas Q summary:', summarizeQ(atlasKyQ));

  // Non-profit specifically
  console.log('\n=== NON-PROFIT QUESTIONS DETAIL ===');
  const localNp = localKyQ.filter(q => q.businessType === 'ngo' || q.kyRoot === 'non-profit');
  const atlasNp = atlasKyQ.filter(q => q.businessType === 'ngo' || q.kyRoot === 'non-profit' || q.businessType === 'non-profit');
  console.log(`Local Non-Profit questions: ${localNp.length}`);
  for (const q of localNp) {
    console.log(`  Local NP: active=${q.active} cat=${q.category} dom=${q.domain} type=${q.type} text="${q.text.slice(0, 40)}..."`);
  }
  console.log(`Atlas Non-Profit questions: ${atlasNp.length}`);
  for (const q of atlasNp) {
    console.log(`  Atlas NP: id=${q._id} bt=${q.businessType} kyRoot=${q.kyRoot} active=${q.active} cat=${q.category} dom=${q.domain} type=${q.type} text="${q.text.slice(0, 40)}..."`);
  }

  // Startup specifically
  console.log('\n=== STARTUP QUESTIONS DETAIL ===');
  const localSu = localKyQ.filter(q => q.businessType === 'startup' || q.kyRoot === 'startup');
  const atlasSu = atlasKyQ.filter(q => q.businessType === 'startup' || q.kyRoot === 'startup');
  console.log(`Local Startup questions: ${localSu.length} (active: ${localSu.filter(q => q.active).length})`);
  console.log(`Atlas Startup questions: ${atlasSu.length} (active: ${atlasSu.filter(q => q.active).length})`);

  // Onboarding Questions & Categories & Stages
  console.log('\n=== ONBOARDING CONFIGURATION ===');
  const lStages = await localConn.collection('stages').find({}).toArray();
  const aStages = await atlasConn.collection('stages').find({}).toArray();
  console.log(`Stages: Local ${lStages.length}, Atlas ${aStages.length}`);

  const lCats = await localConn.collection('categories').find({}).toArray();
  const aCats = await atlasConn.collection('categories').find({}).toArray();
  console.log(`Categories: Local ${lCats.length}, Atlas ${aCats.length}`);

  const lQs = await localConn.collection('questions').find({}).toArray();
  const aQs = await atlasConn.collection('questions').find({}).toArray();
  console.log(`Questions (Onboarding): Local ${lQs.length}, Atlas ${aQs.length}`);

  const lRc = await localConn.collection('resultcontents').find({}).toArray();
  const aRc = await atlasConn.collection('resultcontents').find({}).toArray();
  console.log(`ResultContents: Local ${lRc.length}, Atlas ${aRc.length}`);

  await localConn.close();
  await atlasConn.close();
}

run().catch(console.error);
