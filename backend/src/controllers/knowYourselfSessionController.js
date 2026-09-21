import * as kyService from '../services/knowYourselfService.js';
import KnowYourselfSession from '../models/KnowYourselfSession.js';
import { asyncHandler } from '../middleware/errors.js';

export const getKYMeta = asyncHandler(async (_req, res) => {
  res.json(await kyService.getKYMeta());
});

export const startKYSession = async (req, res, next) => {
  try {
    const session = await kyService.startKYSession();
    res.status(201).json(session);
  } catch (err) { next(err); }
};

export const startKYAssignment = async (req, res, next) => {
  try {
    const { email, domain, businessType, browserId } = req.body;
    const session = await kyService.startKYAssignment(email, domain, businessType, browserId);
    res.status(201).json(session);
  } catch (err) { next(err); }
};

export const resumeKYAssignment = async (req, res, next) => {
  try {
    const { email, browserId } = req.query;
    const result = await kyService.resumeKYAssignment({ email, browserId });
    res.json(result);
  } catch (err) { next(err); }
};

export const getKYQuestion = async (req, res, next) => {
  try {
    const { sessionId, index } = req.params;
    const question = await kyService.getKYQuestion(sessionId, parseInt(index, 10));
    res.json({ question });
  } catch (err) { next(err); }
};

export const submitKYAnswer = async (req, res, next) => {
  try {
    const result = await kyService.submitKYAnswer(req.params.sessionId, req.body);
    res.json(result);
  } catch (err) { next(err); }
};

export const getKYResult = async (req, res, next) => {
  try {
    const result = await kyService.getKYResult(req.params.sessionId);
    res.json(result);
  } catch (err) { next(err); }
};

export const submitKYContact = async (req, res, next) => {
  try {
    const result = await kyService.submitKYContact(req.params.sessionId, req.body);
    res.status(201).json(result);
  } catch (err) { next(err); }
};

export const submitKYEmail = async (req, res, next) => {
  try {
    const result = await kyService.submitKYEmail(req.params.sessionId, req.body);
    res.json(result);
  } catch (err) { next(err); }
};

export const submitKYProBono = async (req, res, next) => {
  try {
    const result = await kyService.submitKYProBono(req.params.sessionId, req.body);
    res.status(201).json(result);
  } catch (err) { next(err); }
};

export const submitKYReportRequest = async (req, res, next) => {
  try {
    const result = await kyService.submitKYReportRequest(req.params.sessionId, req.body);
    res.status(201).json(result);
  } catch (err) { next(err); }
};

export const listKYSessions = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
  const filter = {};
  if (req.query.status && req.query.status !== 'all') filter.status = req.query.status;
  if (req.query.domain && req.query.domain !== 'all') filter.domain = req.query.domain;
  if (req.query.proBono === 'requested') filter.proBonoRequested = true;
  if (req.query.proBono === 'not_requested') filter.proBonoRequested = false;
  if (req.query.reportRequest === 'requested') filter['reportRequest.requested'] = true;
  if (req.query.reportRequest === 'not_requested') filter['reportRequest.requested'] = { $ne: true };
  const sessions = await KnowYourselfSession.find(filter)
    .sort({ startedAt: -1 })
    .limit(limit)
    .select('sessionId email phone domain domainLabel businessType status result contactConsent contactSubmittedAt proBonoRequested proBonoEmail proBonoPhone proBonoConsent proBonoSubmittedAt reportRequest startedAt completedAt answers selectedQuestions')
    .lean();

  // Real assessment progress, derived from the session:
  //   stage        -> where the user is in the journey (questions / result)
  //   answeredCount-> distinct questions answered so far
  //   totalQuestions-> how many questions were assigned (18 for assignments)
  res.json(
    sessions.map((s) => {
      const answeredCount = new Set((s.answers || []).map((a) => String(a.questionIndex))).size;
      const totalQuestions = (s.selectedQuestions || []).length;
      const notApplicableCount = (s.answers || []).filter((a) => a.isNotApplicable).length;
      let stage = 'Questions';
      if (s.status === 'completed') stage = 'Result / Completed';
      else if (s.status === 'abandoned') stage = 'Abandoned';
      else if (totalQuestions === 0) stage = 'Not started';
      const { answers, selectedQuestions, ...rest } = s;
      return { ...rest, answeredCount, totalQuestions, notApplicableCount, stage };
    })
  );
});
