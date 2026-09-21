import mongoose from 'mongoose';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';
import { connectDB } from '../src/config/db.js';
import KnowYourselfQuestion from '../src/models/KnowYourselfQuestion.js';
import Domain from '../src/models/Domain.js';
import BusinessType from '../src/models/BusinessType.js';
import { DATA, MANUFACTURING_DOMAINS, PILLAR_TO_CATEGORY } from './manufacturingQuestionData.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKUP_DIR = path.resolve(__dirname, '..', 'backups');

const NEW_DOMAIN_NAMES = {
  pharmaceuticals_biomanufacturing: 'Pharmaceuticals & Bio-Manufacturing',
  automotive_heavy_engineering: 'Automotive & Heavy Engineering',
};

/**
 * Replace the Manufacturing (Product-Based) questions in place with the NEW
 * Manufacturing question bank.
 *
 * - Writes a timestamped JSON backup of any affected collections BEFORE any change.
 * - Ensures the 2 new domains (Pharma, Automotive) exist under the Product
 *   (Manufacturing) business type; never renames or duplicates existing domains.
 * - Deactivates all old Manufacturing-domain questions (historical session safe).
 * - Validates every source row (domain, pillar, 4 options, scores 1-4, glossary),
 *   then inserts all new questions as active.
 * - Only touches the 6 Manufacturing domains. Nothing else is modified.
 */
async function writeBackups() {
  const stamps = new Date().toISOString().replace(/[:.]/g, '-');
  const now = new Date().toISOString();
  const affectedDomains = await Domain.find({ slug: { $in: MANUFACTURING_DOMAINS } }).lean();
  const oldQuestions = await KnowYourselfQuestion.find({ domain: { $in: MANUFACTURING_DOMAINS } }).lean();
  const write = (name, data) =>
    fs.writeFileSync(path.join(BACKUP_DIR, `${name}.pre-manufacturing-import-${stamps}.json`), JSON.stringify(data, null, 2));
  write('knowyourselfquestions', { exportedAt: now, count: oldQuestions.length, docs: oldQuestions });
  write('domains', { exportedAt: now, count: affectedDomains.length, docs: affectedDomains });
  console.log(`[backup] wrote ${BACKUP_DIR}/knowyourselfquestions.pre-manufacturing-import-${stamps}.json (${oldQuestions.length} docs)`);
  console.log(`[backup] wrote ${BACKUP_DIR}/domains.pre-manufacturing-import-${stamps}.json (${affectedDomains.length} docs)`);
}

async function ensureDomains(productType) {
  // Existing Manufacturing domains are reused untouched. Only create the two
  // brand-new ones (Pharma, Automotive) and link them to the Product type.
  for (const slug of MANUFACTURING_DOMAINS) {
    const existing = await Domain.findOne({ slug });
    if (existing) {
      if (!existing.businessTypeId && productType) {
        existing.businessTypeId = productType._id;
        await existing.save();
        console.log(`[domain] linked existing "${existing.name}" (${slug}) -> ${productType.name}`);
      } else {
        console.log(`[domain] reused existing "${existing.name}" (${slug})`);
      }
      continue;
    }
    if (!NEW_DOMAIN_NAMES[slug]) {
      throw new Error(`Missing domain "${slug}" is not a new domain but is missing from DB. Aborting.`);
    }
    await Domain.create({
      name: NEW_DOMAIN_NAMES[slug],
      slug,
      description: '',
      active: true,
      businessTypeId: productType ? productType._id : null,
    });
    console.log(`[domain] created "${NEW_DOMAIN_NAMES[slug]}" (${slug})`);
  }
}

async function main() {
  await connectDB();

  // ── 1. Back up affected collections before any change ──
  await writeBackups();

  // ── 2. Resolve the Product (Manufacturing) business type ──
  const productType = await BusinessType.findOne({ key: 'product' }).lean();
  if (!productType) {
    console.error('ABORT: No "product" BusinessType found. Refusing to proceed without a parent type.');
    await mongoose.disconnect();
    process.exit(1);
  }
  console.log(`[bt] Product type: ${productType.name} (${productType._id})`);

  // ── 3. Ensure all 6 Manufacturing domains exist under Product type ──
  await ensureDomains(productType);

  // ── 4. Identify + deactivate OLD Manufacturing questions ──
  const oldQs = await KnowYourselfQuestion.find({ type: 'domain', domain: { $in: MANUFACTURING_DOMAINS } }).lean();
  const oldActive = oldQs.filter((q) => q.active);
  console.log(`\nOld Manufacturing questions found (all): ${oldQs.length} | active: ${oldActive.length}`);
  const deactRes = await KnowYourselfQuestion.updateMany(
    { type: 'domain', domain: { $in: MANUFACTURING_DOMAINS }, active: true },
    { $set: { active: false } }
  );
  console.log(`Deactivated old Manufacturing questions: ${deactRes.modifiedCount}`);

  // ── 5. Validate source rows before insert ──
  const validPillars = Object.keys(PILLAR_TO_CATEGORY);
  const validDomains = new Set(MANUFACTURING_DOMAINS);
  const problems = [];
  const seenByDomain = new Map(); // slug -> Set(lowercase text)
  for (let i = 0; i < DATA.length; i++) {
    const q = DATA[i];
    if (!q.text) problems.push(`row ${i + 1}: missing text`);
    if (!validDomains.has(q.domain)) problems.push(`row ${i + 1}: unknown domain ${q.domain}`);
    if (!q.pillar || !validPillars.includes(q.pillar)) problems.push(`row ${i + 1}: invalid pillar ${q.pillar}`);
    if (!Array.isArray(q.options) || q.options.length !== 4) {
      problems.push(`row ${i + 1}: must have 4 options`);
    } else {
      q.options.forEach((o, j) => {
        if (!o.text) problems.push(`row ${i + 1} option ${j}: missing text`);
        if (![1, 2, 3, 4].includes(Number(o.score))) problems.push(`row ${i + 1} option ${j}: invalid score ${o.score}`);
      });
    }
    // glossary validation
    const gl = q.glossary || [];
    const seenGl = new Set();
    for (const g of gl) {
      const abbr = String(g.abbreviation || '').trim();
      if (!abbr || !String(g.fullForm || '').trim()) problems.push(`row ${i + 1}: bad glossary entry ${JSON.stringify(g)}`);
      const key = abbr.toLowerCase();
      if (seenGl.has(key)) problems.push(`row ${i + 1}: duplicate glossary abbreviation ${abbr}`);
      seenGl.add(key);
    }
    if (q.text) {
      const set = seenByDomain.get(q.domain) || new Set();
      const t = q.text.trim().toLowerCase();
      if (set.has(t)) problems.push(`row ${i + 1}: duplicate question text in domain ${q.domain}: "${q.text}"`);
      set.add(t);
      seenByDomain.set(q.domain, set);
    }
  }
  if (problems.length) {
    console.error('\nVALIDATION FAILED. Aborting import before any insert. Problems:');
    problems.forEach((p) => console.error('  -', p));
    await mongoose.disconnect();
    process.exit(1);
  }

  // ── 6. Insert new Manufacturing questions (all active) ──
  const toInsert = DATA.map((q) =>
    KnowYourselfQuestion({
      text: q.text.trim(),
      type: 'domain',
      domain: q.domain,
      category: PILLAR_TO_CATEGORY[q.pillar],
      options: q.options.map((o) => ({ text: o.text.trim(), score: Number(o.score), active: true })),
      glossary: (q.glossary || []).map((g) => ({ abbreviation: g.abbreviation.trim(), fullForm: g.fullForm.trim() })),
      active: true,
    })
  );
  const inserted = await KnowYourselfQuestion.insertMany(toInsert, { ordered: false });
  console.log(`Inserted new Manufacturing questions: ${inserted.length}`);

  await mongoose.disconnect();
  console.log('Import complete.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
