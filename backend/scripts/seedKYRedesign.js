import 'dotenv/config';
import { connectDB } from '../src/config/db.js';
import KYCategory from '../src/models/KYCategory.js';
import KnowYourselfQuestion from '../src/models/KnowYourselfQuestion.js';
import Domain from '../src/models/Domain.js';

// Idempotent seeding for the 18-question / six-category redesign.
//  - Upserts the six default result categories (admin-managed afterwards).
//  - Assigns a category to active questions that lack one (additive $set only).
//  - Tops up any active domain pool to 9 questions with clearly-marked [TEST]
//    questions so every domain can run the assessment. Existing questions are
//    never modified or deleted.

const DEFAULT_CATEGORIES = [
  { key: 'strategic-direction', name: 'Strategic Direction', color: '#0A78CF', sortOrder: 1 },
  { key: 'financial-performance', name: 'Financial Performance', color: '#FCA700', sortOrder: 2 },
  { key: 'sales-market-growth', name: 'Sales & Market Growth', color: '#E52032', sortOrder: 3 },
  { key: 'operations-execution', name: 'Operations & Execution', color: '#0D8845', sortOrder: 4 },
  { key: 'people-organization', name: 'People & Organization', color: '#F5630D', sortOrder: 5 },
  { key: 'digital-innovation', name: 'Digital & Innovation', color: '#7038A5', sortOrder: 6 },
];

// Realistic stems + graded option sets per category. `{d}` is replaced with the
// domain name so wording stays specific and texts stay unique across domains.
const STEMS = [
  {
    category: 'strategic-direction',
    text: 'How clearly is the long-term strategy defined for your {d} business?',
    options: [
      ['Clear, written, and reviewed every quarter'],
      ['Defined but rarely revisited'],
      ['Informal and mostly in the leadership’s heads'],
      ['No defined strategy'],
    ],
  },
  {
    category: 'financial-performance',
    text: 'How well do you track cash flow and profitability in your {d} business?',
    options: [
      ['Tracked monthly with accurate forecasts'],
      ['Tracked quarterly with rough estimates'],
      ['Reviewed about once a year'],
      ['Not tracked systematically'],
    ],
  },
  {
    category: 'sales-market-growth',
    text: 'How effective is your sales pipeline at converting leads in the {d} market?',
    options: [
      ['Predictable pipeline with consistent conversion'],
      ['Active pipeline but uneven conversion'],
      ['Reactive, relying mostly on referrals'],
      ['No structured sales process'],
    ],
  },
  {
    category: 'operations-execution',
    text: 'How consistently do day-to-day operations in your {d} business run without bottlenecks?',
    options: [
      ['Documented, repeatable, and continuously improved'],
      ['Mostly consistent with occasional bottlenecks'],
      ['Frequent firefighting and delays'],
      ['Unstructured and unpredictable'],
    ],
  },
  {
    category: 'people-organization',
    text: 'How well are roles and responsibilities defined within your {d} team?',
    options: [
      ['Clear ownership with strong retention'],
      ['Defined roles with some overlap'],
      ['Informal structure, dependent on a few people'],
      ['No clear roles or retention plan'],
    ],
  },
  {
    category: 'digital-innovation',
    text: 'How effectively does your {d} business use digital tools to improve efficiency?',
    options: [
      ['Integrated tools with automation and analytics'],
      ['Core processes are digitised'],
      ['Isolated tools, mostly manual work'],
      ['Little to no digital adoption'],
    ],
  },
  {
    category: 'strategic-direction',
    text: 'How often do you review strategic goals for your {d} business against market changes?',
    options: [
      ['Quarterly reviews with documented adjustments'],
      ['Annual reviews when time allows'],
      ['Rarely reviewed'],
      ['Never formally reviewed'],
    ],
  },
  {
    category: 'financial-performance',
    text: 'How reliable are budgets and financial forecasts for your {d} business?',
    options: [
      ['Reliable, variance is tracked and explained'],
      ['Directionally right, often revised'],
      ['Prepared only when required by lenders'],
      ['No budgets or forecasts exist'],
    ],
  },
  {
    category: 'sales-market-growth',
    text: 'How actively does your {d} business pursue new customer segments?',
    options: [
      ['Systematic research and targeted campaigns'],
      ['Occasional experiments when capacity allows'],
      ['Growth depends on existing customers only'],
      ['No active pursuit of new segments'],
    ],
  },
];

async function seed() {
  await connectDB();

  // 1. Categories (idempotent upsert)
  for (const c of DEFAULT_CATEGORIES) {
    const exists = await KYCategory.findOne({ key: c.key });
    if (!exists) await KYCategory.create(c);
  }
  const cats = await KYCategory.find({ active: true }).sort({ sortOrder: 1 }).lean();
  console.log(`[ky-seed] categories ready: ${cats.length}`);
  if (cats.length < 6) throw new Error('Expected 6 active categories');

  // 2. Categorize existing ACTIVE questions that have no category ($set only).
  const uncategorized = await KnowYourselfQuestion.find({ active: true, category: null }).sort({ createdAt: 1 });
  let assigned = 0;
  for (const q of uncategorized) {
    q.category = cats[assigned % cats.length].key;
    await q.save(); // validates schema; only adds the category field
    assigned++;
  }
  console.log(`[ky-seed] categorized ${assigned} existing question(s)`);

  // 3. Top up domain pools to 9 active questions each with marked [TEST] items.
  const domains = await Domain.find({ active: true }).sort({ name: 1 }).lean();
  let created = 0;
  for (const d of domains) {
    const count = await KnowYourselfQuestion.countDocuments({
      active: true,
      type: 'domain',
      domain: d.slug,
      category: { $ne: null },
    });
    if (count >= 9) continue;
    for (let i = count; i < 9; i++) {
      const stem = STEMS[i % STEMS.length];
      const text = `[TEST] ${stem.text.replace('{d}', d.name)}${i >= STEMS.length ? ` (variant ${Math.floor(i / STEMS.length) + 1})` : ''}`;
      const exists = await KnowYourselfQuestion.exists({ text });
      if (exists) continue;
      const scores = [4, 3, 2, 1];
      await KnowYourselfQuestion.create({
        text,
        type: 'domain',
        domain: d.slug,
        category: stem.category,
        active: true,
        options: stem.options.map((o, idx) => ({
          text: o[0],
          score: scores[idx],
          active: true,
        })),
      });
      created++;
    }
  }
  console.log(`[ky-seed] created ${created} marked [TEST] domain question(s)`);

  // Summary
  const genericPool = await KnowYourselfQuestion.countDocuments({ active: true, type: 'generic', category: { $ne: null } });
  console.log('[ky-seed] generic pool:', genericPool);
  for (const d of domains) {
    const n = await KnowYourselfQuestion.countDocuments({ active: true, type: 'domain', domain: d.slug, category: { $ne: null } });
    console.log(`[ky-seed]   ${d.slug}: ${n}`);
  }
}

seed()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('[ky-seed] failed', e);
    process.exit(1);
  });
