import { asyncHandler } from '../middleware/errors.js';
import { logAudit, auditFrom } from '../services/auditService.js';
import {
  listOnboardingQuestions,
  getOnboardingQuestion,
  createOnboardingQuestion,
  updateOnboardingQuestion,
  setOnboardingQuestionActive,
  deleteOnboardingQuestion,
} from '../services/onboardingAdminService.js';

// Dedicated admin endpoints for the intro onboarding question bank. Every
// endpoint operates strictly within one businessType (query param or body), so
// an Admin manages exactly the selected business type's questions and can never
// touch another type's questions.

export const listQuestions = asyncHandler(async (req, res) => {
  const questions = await listOnboardingQuestions({
    businessType: req.query.businessType,
    includeInactive: req.query.includeInactive === 'true',
  });
  res.json(questions);
});

export const getQuestion = asyncHandler(async (req, res) => {
  const q = await getOnboardingQuestion({
    id: req.params.id,
    businessType: req.query.businessType,
  });
  res.json(q);
});

export const createQuestion = asyncHandler(async (req, res) => {
  const q = await createOnboardingQuestion(req.body || {});
  await logAudit({
    ...auditFrom(req),
    action: 'onboarding_question.created',
    entity: 'question',
    entityId: q._id,
    metadata: { text: q.text, businessType: q.businessType, category: q.category },
  });
  res.status(201).json(q);
});

export const updateQuestion = asyncHandler(async (req, res) => {
  const q = await updateOnboardingQuestion({
    id: req.params.id,
    businessType: req.body.businessType,
    patch: req.body || {},
  });
  await logAudit({
    ...auditFrom(req),
    action: 'onboarding_question.updated',
    entity: 'question',
    entityId: q._id,
    metadata: { text: q.text, businessType: q.businessType, category: q.category },
  });
  res.json(q);
});

export const setQuestionActive = asyncHandler(async (req, res) => {
  const q = await setOnboardingQuestionActive({
    id: req.params.id,
    businessType: req.body.businessType,
    active: req.body.active,
  });
  await logAudit({
    ...auditFrom(req),
    action: q.active ? 'onboarding_question.activated' : 'onboarding_question.deactivated',
    entity: 'question',
    entityId: q._id,
    metadata: { text: q.text, businessType: q.businessType, active: q.active },
  });
  res.json(q);
});

export const deleteQuestion = asyncHandler(async (req, res) => {
  const q = await deleteOnboardingQuestion({
    id: req.params.id,
    businessType: req.body.businessType || req.query.businessType,
  });
  await logAudit({
    ...auditFrom(req),
    action: 'onboarding_question.deleted',
    entity: 'question',
    entityId: q._id,
    metadata: { text: q.text, businessType: q.businessType },
  });
  res.json({ ok: true });
});