import mongoose from 'mongoose';

const LOCAL_URI = 'mongodb://127.0.0.1:27017/byrgop';
const ATLAS_URI = 'mongodb+srv://ramavathvamshicse_db_user:vamshi123@cluster0.p4u8yex.mongodb.net/?appName=Cluster0';

async function run() {
  const localConn = await mongoose.createConnection(LOCAL_URI).asPromise();
  const atlasConn = await mongoose.createConnection(ATLAS_URI).asPromise();

  console.log('=== COMPARISON OF KNOWYOURSELFQUESTIONS ===');
  
  // 1. Generic questions (Manufacturing & Services pool)
  const lGen = await localConn.collection('knowyourselfquestions').find({ type: 'generic', businessType: { $in: [null, ''] } }).toArray();
  const aGen = await atlasConn.collection('knowyourselfquestions').find({ type: 'generic', businessType: { $in: [null, ''] } }).toArray();
  console.log('Generic shared pool: Local = ' + lGen.length + ' (active: ' + lGen.filter(q=>q.active).length + '), Atlas = ' + aGen.length + ' (active: ' + aGen.filter(q=>q.active).length + ')');

  // Check matching texts / ids between lGen and aGen
  const aGenTextMap = new Map(aGen.map(q => [q.text.trim(), q]));
  let matchedGen = 0;
  for (const lq of lGen) {
    if (aGenTextMap.has(lq.text.trim())) matchedGen++;
    else console.log('  Local generic not in Atlas:', lq.text.slice(0, 50));
  }
  console.log('Generic text matched: ' + matchedGen + '/' + lGen.length);

  // 2. Domain questions
  const lDomQ = await localConn.collection('knowyourselfquestions').find({ type: 'domain' }).toArray();
  const aDomQ = await atlasConn.collection('knowyourselfquestions').find({ type: 'domain' }).toArray();
  console.log('\nDomain questions: Local = ' + lDomQ.length + ' (active: ' + lDomQ.filter(q=>q.active).length + '), Atlas = ' + aDomQ.length + ' (active: ' + aDomQ.filter(q=>q.active).length + ')');
  
  const lDomCounts = {};
  for (const q of lDomQ) {
    lDomCounts[q.domain] = (lDomCounts[q.domain] || 0) + 1;
  }
  const aDomCounts = {};
  for (const q of aDomQ) {
    aDomCounts[q.domain] = (aDomCounts[q.domain] || 0) + 1;
  }
  const allDomains = Array.from(new Set([...Object.keys(lDomCounts), ...Object.keys(aDomCounts)])).sort();
  console.log('Domain question breakdown (Local vs Atlas):');
  for (const d of allDomains) {
    console.log('  ' + d.padEnd(40) + ' Local: ' + String(lDomCounts[d] || 0).padEnd(4) + ' Atlas: ' + String(aDomCounts[d] || 0));
  }

  // 3. Non-profit questions
  const lNp = await localConn.collection('knowyourselfquestions').find({ $or: [{ businessType: 'ngo' }, { kyRoot: 'non-profit' }] }).toArray();
  const aNp = await atlasConn.collection('knowyourselfquestions').find({ $or: [{ businessType: 'ngo' }, { kyRoot: 'non-profit' }, { businessType: 'non-profit' }] }).toArray();
  console.log('\nNon-Profit questions: Local = ' + lNp.length + ' (active: ' + lNp.filter(q=>q.active).length + '), Atlas = ' + aNp.length + ' (active: ' + aNp.filter(q=>q.active).length + ')');

  // 4. Startup questions
  const lSu = await localConn.collection('knowyourselfquestions').find({ $or: [{ businessType: 'startup' }, { kyRoot: 'startup' }] }).toArray();
  const aSu = await atlasConn.collection('knowyourselfquestions').find({ $or: [{ businessType: 'startup' }, { kyRoot: 'startup' }] }).toArray();
  console.log('\nStartup questions: Local = ' + lSu.length + ' (active: ' + lSu.filter(q=>q.active).length + '), Atlas = ' + aSu.length + ' (active: ' + aSu.filter(q=>q.active).length + ')');

  await localConn.close();
  await atlasConn.close();
}

run().catch(console.error);
