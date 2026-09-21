import 'dotenv/config';
import { connectDB } from '../src/config/db.js';
import Category from '../src/models/Category.js';
import Stage from '../src/models/Stage.js';
import Question from '../src/models/Question.js';
import ResultContent from '../src/models/ResultContent.js';
import AssessmentSession from '../src/models/AssessmentSession.js';
import Domain from '../src/models/Domain.js';
import { DOMAIN_KEYS, DOMAIN_LABELS } from '../src/models/KnowYourselfQuestion.js';

const SEED_MARK = 'BYRGOP-DEMO';

const stages = [
  { key: 'initiation', name: 'Initiation', color: '#0A78CF', sortOrder: 1 },
  { key: 'due-diligence', name: 'Due Diligence', color: '#FCA700', sortOrder: 2 },
  { key: 'analysis', name: 'Analysis', color: '#E52032', sortOrder: 3 },
  { key: 'recommendations', name: 'Recommendations', color: '#0D8845', sortOrder: 4 },
  { key: 'implementation', name: 'Implementation', color: '#F5630D', sortOrder: 5 },
  { key: 'monitoring', name: 'Monitoring', color: '#7038A5', sortOrder: 6 },
];

const categories = [
  {
    key: 'strategic',
    name: 'Strategic',
    description: 'Clarity of vision, direction and long-term positioning.',
    color: '#0A78CF',
    sortOrder: 1,
  },
  {
    key: 'operational',
    name: 'Operational',
    description: 'Efficiency, process maturity and day-to-day execution.',
    color: '#0D8845',
    sortOrder: 2,
  },
  {
    key: 'revenue',
    name: 'Revenue',
    description: 'Commercial health, growth engine and client acquisition.',
    color: '#F5630D',
    sortOrder: 3,
  },
];

const demoQuestions = {
  strategic: [
    {
      text: 'Do you have a clearly documented 12-month business strategy?',
      weight: 20,
      stageKey: 'initiation',
      options: [
        { text: 'Yes', score: 1, stageKey: 'analysis' },
        { text: 'No', score: 0, stageKey: 'initiation' },
      ],
    },
    {
      text: 'Is your leadership team aligned on the top three priorities?',
      weight: 35,
      stageKey: 'due-diligence',
      options: [
        { text: 'Yes', score: 1, stageKey: 'recommendations' },
        { text: 'No', score: 0, stageKey: 'due-diligence' },
      ],
    },
    {
      text: 'Do you review and adapt your strategy at least quarterly?',
      weight: 45,
      stageKey: 'implementation',
      options: [
        { text: 'Yes', score: 1, stageKey: 'monitoring' },
        { text: 'No', score: 0, stageKey: 'implementation' },
      ],
    },
    {
      text: 'Can you articulate your competitive advantage in one sentence?',
      weight: 30,
      stageKey: 'analysis',
      options: [
        { text: 'Yes', score: 1, stageKey: 'recommendations' },
        { text: 'No', score: 0, stageKey: 'analysis' },
      ],
    },
  ],
  operational: [
    {
      text: 'Are your core business processes documented and repeatable?',
      weight: 25,
      stageKey: 'initiation',
      options: [
        { text: 'Yes', score: 1, stageKey: 'implementation' },
        { text: 'No', score: 0, stageKey: 'initiation' },
      ],
    },
    {
      text: 'Does your team have clear KPIs and regular performance reviews?',
      weight: 40,
      stageKey: 'recommendations',
      options: [
        { text: 'Yes', score: 1, stageKey: 'monitoring' },
        { text: 'No', score: 0, stageKey: 'recommendations' },
      ],
    },
    {
      text: 'Do operational bottlenecks get identified and resolved quickly?',
      weight: 35,
      stageKey: 'implementation',
      options: [
        { text: 'Yes', score: 1, stageKey: 'implementation' },
        { text: 'No', score: 0, stageKey: 'analysis' },
      ],
    },
    {
      text: 'Is your current team structure suited to your growth stage?',
      weight: 30,
      stageKey: 'analysis',
      options: [
        { text: 'Yes', score: 1, stageKey: 'monitoring' },
        { text: 'No', score: 0, stageKey: 'due-diligence' },
      ],
    },
  ],
  revenue: [
    {
      text: 'Do you have a predictable, repeatable sales process?',
      weight: 40,
      stageKey: 'initiation',
      options: [
        { text: 'Yes', score: 1, stageKey: 'implementation' },
        { text: 'No', score: 0, stageKey: 'initiation' },
      ],
    },
    {
      text: 'Do you track revenue by client and by offering?',
      weight: 25,
      stageKey: 'monitoring',
      options: [
        { text: 'Yes', score: 1, stageKey: 'monitoring' },
        { text: 'No', score: 0, stageKey: 'analysis' },
      ],
    },
    {
      text: 'Are you winning new business without relying on one client?',
      weight: 35,
      stageKey: 'recommendations',
      options: [
        { text: 'Yes', score: 1, stageKey: 'implementation' },
        { text: 'No', score: 0, stageKey: 'recommendations' },
      ],
    },
    {
      text: 'Do you have pricing that reflects the value you deliver?',
      weight: 30,
      stageKey: 'due-diligence',
      options: [
        { text: 'Yes', score: 1, stageKey: 'monitoring' },
        { text: 'No', score: 0, stageKey: 'due-diligence' },
      ],
    },
  ],
};

const resultBands = [
  { min: 0, max: 40, title: 'Foundation', interpretation: 'Early-stage maturity with clear room to strengthen fundamentals.', recommendations: ['Define a focused set of priorities', 'Document core processes', 'Establish baseline metrics'] },
  { min: 41, max: 70, title: 'Developing', interpretation: 'Good foundations in place, with opportunities to formalise and scale.', recommendations: ['Codify repeatable ways of working', 'Invest in capability building', 'Introduce structured review cadence'] },
  { min: 71, max: 100, title: 'Mature', interpretation: 'Strong maturity. Focus shifts to optimisation and sustainable growth.', recommendations: ['Optimise for margin and efficiency', 'Deepen strategic foresight', 'Reinforce leadership depth'] },
];

async function seed() {
  await connectDB();
  console.log('[seed] starting...');

  // Know Yourself business domains (idempotent upsert by slug)
  for (const slug of DOMAIN_KEYS) {
    await Domain.updateOne(
      { slug },
      { $set: { name: DOMAIN_LABELS[slug], active: true } },
      { upsert: true }
    );
  }

  for (const s of stages) {
    await Stage.updateOne({ key: s.key }, { $set: { ...s, active: true } }, { upsert: true });
  }
  const stageKeys = new Set(stages.map((s) => s.key));

  for (const c of categories) {
    await Category.updateOne({ key: c.key }, { $set: { ...c, active: true } }, { upsert: true });
  }
  const catDocs = {};
  for (const c of categories) {
    catDocs[c.key] = await Category.findOne({ key: c.key });
  }

  const ids = await Question.find({ mark: SEED_MARK }).distinct('_id');
  if (ids.length) await Question.deleteMany({ _id: { $in: ids } });

  for (const [key, questions] of Object.entries(demoQuestions)) {
    for (const q of questions) {
      const refs = [q.stageKey, ...q.options.map((o) => o.stageKey)].filter(Boolean);
      for (const ref of refs) {
        if (!stageKeys.has(ref)) {
          throw new Error(`Unknown stageKey '${ref}' on question: ${q.text}`);
        }
      }
      await Question.create({
        ...q,
        mark: SEED_MARK,
        category: catDocs[key]._id,
        active: true,
      });
    }
  }

  await ResultContent.deleteMany({ mark: SEED_MARK });
  for (const [key, cat] of Object.entries(catDocs)) {
    for (const band of resultBands) {
      await ResultContent.create({
        minScore: band.min,
        maxScore: band.max,
        title: band.title,
        interpretation: band.interpretation,
        recommendations: band.recommendations,
        mark: SEED_MARK,
        category: cat._id,
        active: true,
      });
    }
  }

  console.log('[seed] categories:', Object.keys(catDocs).length);
  console.log('[seed] stages:', stageKeys.size);
  console.log('[seed] domains:', DOMAIN_KEYS.length);
  console.log('[seed] demo questions:',
    Object.values(demoQuestions).reduce((s, qs) => s + qs.length, 0));
  console.log('[seed] result bands:', resultBands.length * 3);
  console.log('[seed] done. NOTE: all content is placeholder demo data managed from Admin.');
}

seed()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('[seed] failed', e);
    process.exit(1);
  });
