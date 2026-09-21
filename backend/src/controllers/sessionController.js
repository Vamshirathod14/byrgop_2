import { asyncHandler } from '../middleware/errors.js';
import AssessmentSession from '../models/AssessmentSession.js';

export const listSessions = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const sessions = await AssessmentSession.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit);
  res.json(sessions);
});

export const getSession = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
  const session = isObjectId
    ? await AssessmentSession.findById(id)
    : await AssessmentSession.findOne({ sessionId: id });
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json(session);
});

export const sessionStats = asyncHandler(async (req, res) => {
  const total = await AssessmentSession.countDocuments();
  const completed = await AssessmentSession.countDocuments({ status: 'completed' });
  const inProgress = await AssessmentSession.countDocuments({ status: 'in_progress' });
  const timedOutAnswers = await AssessmentSession.aggregate([
    { $unwind: '$answers' },
    { $match: { 'answers.timedOut': true } },
    { $count: 'n' },
  ]);
  const questionCount = (await import('../models/Question.js')).default.countDocuments();

  res.json({
    totalSessions: total,
    completed,
    inProgress,
    totalTimedOutAnswers: timedOutAnswers[0]?.n ?? 0,
    totalQuestions: await questionCount,
  });
});
