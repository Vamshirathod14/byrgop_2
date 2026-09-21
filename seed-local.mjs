import { MongoClient, ObjectId } from 'mongodb';

const c = new MongoClient('mongodb://127.0.0.1:27017');
await c.connect();
const db = c.db('byrgop');

// business types
await db.collection('businesstypes').deleteMany({});
const btIds = {};
for (const [key, name, desc, so] of [
  ['service', 'Services', 'Consulting, agencies, professional & financial services.', 1],
  ['product', 'Manufacturing', 'Manufacturing, retail, distribution and product brands.', 2],
  ['ngo', 'Non-Profit', 'Non-profit organisations, foundations and social impact.', 3],
]) {
  const _id = new ObjectId();
  btIds[key] = _id;
  await db.collection('businesstypes').insertOne({ _id, key, name, description: desc, sortOrder: so, active: true, createdAt: new Date(), updatedAt: new Date() });
}

// categories
await db.collection('kycategories').deleteMany({});
const cats = [
  ['strategic-direction', 'Strategic Direction', '#0A78CF', 1],
  ['financial-performance', 'Financial Performance', '#FCA700', 2],
  ['sales-market-growth', 'Sales & Market Growth', '#E52032', 3],
  ['operations-execution', 'Operations & Execution', '#0D8845', 4],
  ['people-organization', 'People & Organization', '#F5630D', 5],
  ['digital-innovation', 'Digital & Innovation', '#7038A5', 6],
];
for (const [key, name, color, so] of cats) {
  await db.collection('kycategories').insertOne({ key, name, color, sortOrder: so, active: true });
}

// categorize generic questions (rotate across categories)
const gens = await db.collection('knowyourselfquestions').find({ type: 'generic', active: true }).toArray();
for (let i = 0; i < gens.length; i++) {
  await db.collection('knowyourselfquestions').updateOne({ _id: gens[i]._id }, { $set: { category: cats[i % 6][0], businessType: null } });
}
console.log('generics categorized:', gens.length);

// categorize domain questions + set domain slug for manufacturing
const dqs = await db.collection('knowyourselfquestions').find({ type: 'domain' }).toArray();
for (let i = 0; i < dqs.length; i++) {
  await db.collection('knowyourselfquestions').updateOne({ _id: dqs[i]._id }, { $set: { category: cats[i % 6][0], domain: 'manufacturing' } });
}
console.log('domain questions:', dqs.length);

// wire domains to business types
const doms = await db.collection('domains').find({}).toArray();
const wiring = [
  ['manufacturing', 'product'],
  ['retail_ecommerce', 'product'],
  ['professional_services', 'service'],
  ['healthcare_wellness', 'service'],
  ['nonprofit_org', 'ngo'],
];
for (const [slug, btkey] of wiring) {
  const d = doms.find((x) => x.slug === slug);
  if (d) await db.collection('domains').updateOne({ _id: d._id }, { $set: { businessTypeId: btIds[btkey], active: true } });
}
console.log('domains wired; total domains:', doms.length);
// ensure at least the wired domains exist, else create
for (const [slug, name, btkey] of [
  ['professional_services', 'Professional Services', 'service'],
  ['manufacturing', 'Manufacturing & Industrial Operations', 'product'],
  ['nonprofit_org', 'Nonprofit Organisation', 'ngo'],
]) {
  const d = await db.collection('domains').findOne({ slug });
  if (!d) await db.collection('domains').insertOne({ slug, name, businessTypeId: btIds[btkey], active: true, createdAt: new Date(), updatedAt: new Date() });
}

await c.close();
console.log('SEED DONE');