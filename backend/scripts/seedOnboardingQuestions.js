import 'dotenv/config';
import { connectDB } from '../src/config/db.js';
import Category from '../src/models/Category.js';
import Question from '../src/models/Question.js';

// Idempotent seeding of the intro onboarding questions for ALL four business
// types. There is no generic/common question bank — each type resolves exactly
// its own Admin-configured three Yes/No questions (Strategy / Operations /
// Financial).
//
// Services and Manufacturing keep the exact question wording they historically
// served as "generic" questions, but now stored as explicitly scoped records so
// every query touches only the selected business type's questions.
//
// Seed is $setOnInsert + "only when the (category → type) pair has no scoped
// question yet", so Admin edits and additions are never overwritten on a rerun.

const DEFAULT_WEIGHT = 10;

// Yes/No option stages reuse the standard stage keys seeded by scripts/seed.js.
const YES_STAGE_KEY = 'recommendations';
const NO_STAGE_KEY = 'initiation';

// Startup questions (per the product spec): Strategy / Operations / Financial.
const STARTUP_QUESTIONS = [
  {
    category: 'strategic',
    text: 'Are you spending excessive cycles refining capabilities and presenting, instead of confirming PMF and sustained user retention?',
  },
  {
    category: 'operational',
    text: 'Do solution implementation, client onboarding, and routine fulfillment execute seamlessly without requiring continual founder oversight?',
  },
  {
    category: 'revenue',
    text: 'Are you finding that notwithstanding successful capital raises or user growth, your unit-level profitability and cash runway diminish rapidly?',
  },
];

// Non-Profit questions (per the product spec): Strategy / Operations / Finance.
const NONPROFIT_QUESTIONS = [
  {
    category: 'strategic',
    text: 'Are you spending more time chasing grant requirements and writing proposals than checking if your programs actually create real impact?',
  },
  {
    category: 'operational',
    text: 'Can your team run daily community programs and field activities without you stepping in to handle every issue?',
  },
  {
    category: 'revenue',
    text: 'Are you struggling to keep the lights on and cover basic costs, even when you win new grants or receive donations?',
  },
];

// Services / Manufacturing questions. These are the questions the two types
// have always served (historically via the shared "generic" bank); they are now
// explicit per-type records.
const SERVICES_QUESTIONS = [
  {
    category: 'strategic',
    text: 'Do you spend 80% of your day firefighting operational issues rather than focusing on strategic growth?',
  },
  {
    category: 'operational',
    text: 'Can you take 15 days off without work calling you?',
  },
  {
    category: 'revenue',
    text: "Do you think despite increasing your revenue, your bottom line net profit isn't growing?",
  },
];

const MANUFACTURING_QUESTIONS = SERVICES_QUESTIONS.map((q) => ({ ...q }));

const SEED = {
  service: SERVICES_QUESTIONS,
  manufacturing: MANUFACTURING_QUESTIONS,
  nonprofit: NONPROFIT_QUESTIONS,
  startup: STARTUP_QUESTIONS,
};

async function seed() {
  await connectDB();

  const cats = await Category.find({ key: { $in: ['strategic', 'operational', 'revenue'] } }).lean();
  const byKey = new Map(cats.map((c) => [c.key, c]));
  if (byKey.size < 3) {
    throw new Error('Run `npm run seed` first so the onboarding categories exist');
  }

  let ensured = 0;
  for (const [businessType, questions] of Object.entries(SEED)) {
    for (const [i, q] of questions.entries()) {
      const cat = byKey.get(q.category);
      if (!cat) continue;

      const existing = await Question.findOne({
        category: cat._id,
        businessType,
      }).lean();

      // An Admin-created or previously-seeded scoped question already covers
      // this (category → type) pair — respect it and move on.
      if (existing) {
        console.log(`[onboarding-seed] keep existing '${businessType}' · ${q.category} (id ${String(existing._id)})`);
        continue;
      }

      await Question.create({
        text: q.text,
        category: cat._id,
        businessType,
        weight: DEFAULT_WEIGHT,
        stageKey: null,
        options: [
          { text: 'Yes', score: 1, stageKey: YES_STAGE_KEY, active: true, color: '#4CAF50' },
          { text: 'No', score: 0, stageKey: NO_STAGE_KEY, active: true, color: '#E53935' },
        ],
        active: true,
        displayOrder: i + 1,
      });
      ensured += 1;
      console.log(`[onboarding-seed] created '${businessType}' · ${q.category}`);
    }
  }

  console.log(`[onboarding-seed] done — ${ensured} new question(s); all four business types configured explicitly`);
}

seed()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('[onboarding-seed] failed', e);
    process.exit(1);
  });