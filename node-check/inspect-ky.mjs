import { MongoClient } from '/Users/vamshirathod/Desktop/byrgop_testing/backend/node_modules/mongodb/lib/index.js';

const uri = process.env.MONGO_URI || 'mongodb+srv://ramavathvamshicse_db_user:jVmZTtjiS9EhowPN@cluster0.p4u8yex.mongodb.net/?appName=Cluster0';
const c = new MongoClient(uri);
await c.connect();
const db = c.db();

console.log('DB:', db.databaseName);

const bts = await db.collection('businesstypes').find({}).toArray();
console.log('\n=== BusinessTypes ===');
for (const b of bts) console.log(` ${b.key} | ${b.name} | active=${b.active}`);

const doms = await db.collection('domains').find({}).toArray();
console.log('\n=== Domains (' + doms.length + ') ===');
for (const d of doms) {
  const bt = d.businessTypeId ? bts.find((b) => String(b._id) === String(d.businessTypeId)) : null;
  console.log(` ${d.slug} | ${d.name} | bt=${bt ? bt.key : 'none'} | active=${d.active}`);
}

const cats = await db.collection('kycategories').find({}).toArray();
console.log('\n=== KYCategories (' + cats.length + ') ===');
for (const cc of cats) console.log(` ${cc.key} | ${cc.name} | active=${cc.active}`);

const totalQ = await db.collection('knowyourselfquestions').countDocuments({});
console.log('\n=== Questions total:', totalQ);

const byDomain = await db.collection('knowyourselfquestions').aggregate([
  { $group: { _id: { domain: '$domain', type: '$type', businessType: '$businessType' }, n: { $sum: 1 } } },
  { $sort: { '_id.type': 1, '_id.domain': 1 } },
]).toArray();
console.log('\n=== Questions by domain/type/businessType ===');
for (const r of byDomain) console.log(` type=${r._id.type} domain=${r._id.domain || '(gen)'} bt=${r._id.businessType || '(all)'} n=${r.n}`);

const byCat = await db.collection('knowyourselfquestions').aggregate([
  { $group: { _id: { domain: '$domain', category: '$category' }, n: { $sum: 1 } } },
  { $sort: { '_id.domain': 1 } },
]).toArray();
console.log('\n=== Questions by domain/category ===');
for (const r of byCat) console.log(` domain=${r._id.domain || '(gen)'} cat=${r._id.category || '(none)'} n=${r.n}`);

await c.close();