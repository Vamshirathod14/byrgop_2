import { asyncHandler } from '../middleware/errors.js';
import { createSession, getNextQuestion, submitAnswer, recordTimeout, getResult } from '../services/sessionFlow.js';

export const startAssessment = asyncHandler(async (req, res) => {
  const session = await createSession(req.body || {});
  res.status(201).json(session);
});

export const nextQuestion = asyncHandler(async (req, res) => {
  const { sessionId, category } = req.params;
  const data = await getNextQuestion(sessionId, category);
  res.json(data);
});

export const recordQuestionTimeout = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const { questionId, categoryKey } = req.body;
  const session = await recordTimeout(sessionId, questionId, categoryKey);
  res.json({ timedOut: true, sessionId: session.sessionId });
});

export const answerQuestion = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const result = await submitAnswer(sessionId, req.body);
  res.json(result);
});

export const assessmentResult = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const result = await getResult(sessionId);
  res.json({ sessionId, ...result });
});
