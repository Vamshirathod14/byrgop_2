import { asyncHandler } from '../middleware/errors.js';
import { getOnboardingQuestionsForType } from '../services/questionPool.js';
import {
  ONBOARDING_BUSINESS_TYPES,
  isValidOnboardingBusinessType,
} from '../config/onboarding.js';

// Public intro configuration: the fixed four onboarding business types plus,
// when a businessType is supplied, the Admin-configured three Yes/No questions
// resolved for that type (businessType-scoped first, generic fallback).
export const getOnboardingConfig = asyncHandler(async (req, res) => {
  const key = req.query.businessType ? String(req.query.businessType).trim() : null;
  if (key && !isValidOnboardingBusinessType(key)) {
    return res.status(400).json({ error: `Unknown business type '${key}'` });
  }
  const questions = key ? await getOnboardingQuestionsForType(key) : [];
  res.json({
    businessTypes: ONBOARDING_BUSINESS_TYPES,
    businessType: key,
    questions,
  });
});