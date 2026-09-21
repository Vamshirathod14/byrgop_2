import Question from '../models/Question.js';
import Category from '../models/Category.js';
import { validateActiveQuestion } from '../models/Question.js';
import { categoryDisplayName } from '../config/categoryLabels.js';
import { resolveOptionHex } from '../config/optionColors.js';
import { getStageMap } from './stages.js';
import { isValidOnboardingBusinessType } from '../config/onboarding.js';

export const getTimeoutSeconds = () =>
  Math.max(1, parseInt(process.env.QUESTION_TIMEOUT_SECONDS || '45', 10));

export function isValidQuestion(q) {
  if (!q || !q.active) return false;
  return validateActiveQuestion(q).length === 0;
}

// Resolve the single onboarding question for a (category, businessType) pair.
// Questions are strictly scoped to one of the four business types — there is
// no generic/common question bank and no fallback. Returns null when no active
// question is configured for the (category, businessType) pair.
export async function findBestQuestion(category, businessType) {
  const match = { category: category._id, active: true, businessType };
  const q = await Question.findOne(match)
    .sort({ displayOrder: 1, createdAt: 1 })
    .lean();
  return q && isValidQuestion(q) ? q : null;
}

// Public onboarding configuration for one business type: the resolved three
// questions (one per active category, in category sort order). Returns an empty
// array when a category has no valid scoped question — the type is then
// "unavailable" and no other type's questions are substituted.
export async function getOnboardingQuestionsForType(businessType) {
  const categories = await getActiveCategories();
  const out = [];
  for (const c of categories) {
    const q = await findBestQuestion(c, businessType);
    if (!q) continue;
    const label = categoryDisplayName(c.key, c.name);
    out.push({
      businessType: q.businessType,
      categoryKey: c.key,
      categoryLabel: label,
      pillar: label,
      questionText: q.text,
      answerType: 'yes_no',
      active: q.active,
      displayOrder: q.displayOrder ?? 0,
      weight: q.weight,
      options: (q.options || [])
        .filter((o) => o.active)
        .map((o, i) => ({ text: o.text, score: o.score, color: resolveOptionHex({ text: o.text, color: o.color, index: i }) })),
    });
  }
  return out;
}

export async function toPublicQuestion(q, startedAt = new Date()) {
  const stageMap = await getStageMap();
  return {
    questionId: q._id,
    text: q.text,
    weight: q.weight,
    category: q.categoryKey,
    startedAt: startedAt.toISOString(),
    timeoutSeconds: getTimeoutSeconds(),
    stage: stageMap[q.stageKey] || null,
    options: q.options
      .filter((o) => o.active)
      .map((o, i) => ({
        optionId: o._id,
        text: o.text,
        color: resolveOptionHex({ text: o.text, color: o.color, index: i }),
        stage: stageMap[o.stageKey] || null,
      })),
  };
}

export async function rollQuestion({ categoryKey, excludeQuestionIds = [], category = null, businessType }) {
  // Callers that already fetched the category (getNextQuestion) pass it in to
  // avoid a redundant MongoDB round trip. The lookup below keeps the function
  // safe for standalone use (e.g. preview tooling or re-rolls).
  if (!isValidOnboardingBusinessType(businessType)) {
    return { error: 'A valid businessType is required to roll an onboarding question' };
  }
  const cat = category || (await Category.findOne({ key: categoryKey, active: true }));
  if (!cat) return { error: `Category '${categoryKey}' is not active` };

  // Every business type serves exactly its own Admin-configured onboarding
  // question for this (category, businessType) pair — deterministically by
  // displayOrder. There is no generic fallback and no re-roll pool.
  const q = await findBestQuestion(cat, businessType);
  if (!q) return { error: 'No active questions available for this category' };
  return {
    question: { ...q, categoryKey: cat.key, categoryName: categoryDisplayName(cat.key, cat.name) },
    category: cat,
  };
}

export async function getActiveCategories() {
  return Category.find({ active: true }).sort({ sortOrder: 1 }).lean();
}
