import Question from '../models/Question.js';
import Category from '../models/Category.js';
import { isValidOnboardingBusinessType } from '../config/onboarding.js';
import { resolveOptionColor, DEFAULT_YES_COLOR, DEFAULT_NO_COLOR } from '../config/optionColors.js';

// Dedicated admin data-access layer for the intro onboarding question bank.
//
// Every onboarding question belongs to exactly one of the four business types.
// All operations below REQUIRE an explicit, valid businessType and are scoped
// strictly to it: an Admin can never read, edit or delete a question belonging
// to another business type through a mismatched businessType request.

export const YES_STAGE_KEY = 'recommendations';
export const NO_STAGE_KEY = 'initiation';

export { DEFAULT_YES_COLOR, DEFAULT_NO_COLOR };

function requireBusinessType(businessType) {
  if (!isValidOnboardingBusinessType(businessType)) {
    throw Object.assign(
      new Error('A valid businessType is required (service, manufacturing, nonprofit or startup)'),
      { status: 400 }
    );
  }
  return String(businessType).trim().toLowerCase();
}

// Default Yes/No option set used by the admin create flow. The stage keys reuse
// the standard stage keys seeded by scripts/seed.js, matching the seed script.
// Option colours (hex values) carry through when supplied; missing colours fall
// back to the Yes (green) / No (red) defaults. Non-hex colours are rejected here.
function toYesNoOptions(options) {
  if (Array.isArray(options) && options.length) {
    return options.map((o, i) => {
      const { color, error } = resolveOptionColor({
        text: o.text,
        color: o.color,
        index: i,
      });
      if (error) throw Object.assign(new Error(error), { status: 400 });
      return {
        text: String(o.text || '').trim(),
        score: Number(o.score) || 0,
        stageKey: o.stageKey || null,
        active: o.active !== false,
        color,
      };
    });
  }
  return [
    { text: 'Yes', score: 1, stageKey: YES_STAGE_KEY, active: true, color: DEFAULT_YES_COLOR },
    { text: 'No', score: 0, stageKey: NO_STAGE_KEY, active: true, color: DEFAULT_NO_COLOR },
  ];
}

export async function listOnboardingQuestions({ businessType, includeInactive = false }) {
  const bt = requireBusinessType(businessType);
  const filter = { businessType: bt };
  if (includeInactive !== true) filter.active = true;
  return Question.find(filter)
    .populate('category', 'key name color')
    .sort({ displayOrder: 1, createdAt: 1 })
    .lean();
}

export async function getOnboardingQuestion({ id, businessType }) {
  const bt = requireBusinessType(businessType);
  const q = await Question.findById(id).populate('category', 'key name color');
  if (!q || q.businessType !== bt) {
    throw Object.assign(new Error('Question not found'), { status: 404 });
  }
  return q;
}

export async function createOnboardingQuestion(payload = {}) {
  const businessType = requireBusinessType(payload.businessType);
  const category = payload.category;
  if (!category) throw Object.assign(new Error('A category is required'), { status: 400 });
  const cat = await Category.findById(category);
  if (!cat) throw Object.assign(new Error('Invalid category'), { status: 400 });
  const text = String(payload.text || '').trim();
  if (!text) throw Object.assign(new Error('Question text is required'), { status: 400 });
  return Question.create({
    text,
    category: cat._id,
    businessType,
    weight: Number(payload.weight) || 10,
    stageKey: payload.stageKey || null,
    options: toYesNoOptions(payload.options),
    active: payload.active !== false,
    displayOrder: Math.max(0, Number(payload.displayOrder) || 0),
  });
}

export async function updateOnboardingQuestion({ id, businessType, patch = {} }) {
  const bt = requireBusinessType(businessType);
  const q = await Question.findById(id).populate('category', 'key name color');
  if (!q || q.businessType !== bt) {
    throw Object.assign(new Error('Question not found'), { status: 404 });
  }
  if (patch.category) {
    const cat = await Category.findById(patch.category);
    if (!cat) throw Object.assign(new Error('Invalid category'), { status: 400 });
    q.category = cat._id;
  }
  if (patch.text !== undefined) {
    const text = String(patch.text || '').trim();
    if (!text) throw Object.assign(new Error('Question text is required'), { status: 400 });
    q.text = text;
  }
  if (patch.weight !== undefined) q.weight = Number(patch.weight) || q.weight;
  if (patch.stageKey !== undefined) q.stageKey = patch.stageKey || null;
  if (patch.active !== undefined) q.active = patch.active === true;
  if (patch.options !== undefined) q.options = toYesNoOptions(patch.options);
  if (patch.displayOrder !== undefined) q.displayOrder = Math.max(0, Number(patch.displayOrder) || 0);
  await q.save();
  return q;
}

export async function setOnboardingQuestionActive({ id, businessType, active }) {
  const bt = requireBusinessType(businessType);
  const q = await Question.findById(id).populate('category', 'key name color');
  if (!q || q.businessType !== bt) {
    throw Object.assign(new Error('Question not found'), { status: 404 });
  }
  q.active = active === true;
  await q.save();
  return q;
}

export async function deleteOnboardingQuestion({ id, businessType }) {
  const bt = requireBusinessType(businessType);
  const q = await Question.findById(id);
  if (!q || q.businessType !== bt) {
    throw Object.assign(new Error('Question not found'), { status: 404 });
  }
  await Question.deleteOne({ _id: q._id });
  return q;
}