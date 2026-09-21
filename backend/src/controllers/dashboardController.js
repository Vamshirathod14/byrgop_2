import { asyncHandler } from '../middleware/errors.js';
import AssessmentSession from '../models/AssessmentSession.js';
import KnowYourselfSession from '../models/KnowYourselfSession.js';
import AuditLog from '../models/AuditLog.js';
import Question from '../models/Question.js';
import KnowYourselfQuestion from '../models/KnowYourselfQuestion.js';

const nowStart = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export const dashboard = asyncHandler(async (_req, res) => {
  const today = nowStart();

  const [onboardingTotal, onboardingCompleted, onboardingToday, kyTotal, kyCompleted, kyToday, contactRequests, kyAvg, domainsBySource, onboardingScores, scoreBucketAgg, recentKY, recentContacts, recentActivity, questionCount, kyQuestionCount, timedOut] =
    await Promise.all([
      AssessmentSession.countDocuments(),
      AssessmentSession.countDocuments({ status: 'completed' }),
      AssessmentSession.countDocuments({ createdAt: { $gte: today } }),
      KnowYourselfSession.countDocuments(),
      KnowYourselfSession.countDocuments({ status: 'completed' }),
      KnowYourselfSession.countDocuments({ startedAt: { $gte: today } }),
      KnowYourselfSession.countDocuments({ contactConsent: true }),
      KnowYourselfSession.aggregate([
        { $match: { status: 'completed', 'result.score': { $exists: true } } },
        { $group: { _id: null, avg: { $avg: '$result.score' } } },
      ]),
      KnowYourselfSession.aggregate([
        { $match: { domain: { $exists: true, $ne: null } } },
        { $group: { _id: '$domain', value: { $sum: 1 } } },
        { $sort: { value: -1 } },
      ]),
      AssessmentSession.aggregate([
        { $match: { status: 'completed', 'result.overallPct': { $exists: true } } },
        { $group: { _id: null, avg: { $avg: '$result.overallPct' } } },
      ]),
      KnowYourselfSession.aggregate([
        { $match: { status: 'completed', 'result.score': { $exists: true } } },
        {
          $project: {
            bucket: {
              $switch: {
                branches: [
                  { case: { $gte: ['$result.score', 65] }, then: 'Strong (65+)' },
                  { case: { $gte: ['$result.score', 50] }, then: 'Moderate (50-64)' },
                  { case: { $gte: ['$result.score', 35] }, then: 'Gaps (35-49)' },
                ],
                default: 'Critical (<35)',
              },
            },
          },
        },
        { $group: { _id: '$bucket', value: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      KnowYourselfSession.find({})
        .select('sessionId email domain domainLabel status result startedAt completedAt contactConsent contactSubmittedAt phone proBonoRequested proBonoSubmittedAt')
        .sort({ startedAt: -1 })
        .limit(8),
      KnowYourselfSession.find({ contactConsent: true })
        .select('sessionId email phone domain domainLabel status result startedAt completedAt contactSubmittedAt')
        .sort({ contactSubmittedAt: -1 })
        .limit(6),
      AuditLog.find({}).sort({ timestamp: -1 }).limit(10),
      Question.countDocuments({ active: true }),
      KnowYourselfQuestion.countDocuments({ active: true }),
      AssessmentSession.aggregate([{ $unwind: '$answers' }, { $match: { 'answers.timedOut': true } }, { $count: 'n' }]),
    ]);

  const kyAvgScore = kyAvg[0]?.avg ? Math.round(kyAvg[0].avg) : null;
  const onboardingAvgPct = onboardingScores[0]?.avg ? Math.round(onboardingScores[0].avg) : null;
  const timedOutCount = timedOut?.[0]?.n || 0;

  const avgScore =
    kyAvgScore != null && onboardingAvgPct != null
      ? Math.round((kyAvgScore / 80 * 100 + onboardingAvgPct) / 2)
      : kyAvgScore != null
        ? Math.round(kyAvgScore / 80 * 100)
        : onboardingAvgPct;

  const kpis = {
    totalAssessments: onboardingTotal + kyTotal,
    completedAssessments: onboardingCompleted + kyCompleted,
    knowYourselfAssessments: kyTotal,
    contactRequests,
    todayAssessments: onboardingToday + kyToday,
    avgScore,
    totalTimedOutAnswers: timedOutCount,
  };

  const completionRate = kpis.totalAssessments > 0
    ? Math.round((kpis.completedAssessments / kpis.totalAssessments) * 100)
    : 0;

  res.json({
    kpis,
    completionRate,
    onboarding: {
      total: onboardingTotal,
      completed: onboardingCompleted,
      inProgress: onboardingTotal - onboardingCompleted,
      avgPct: onboardingAvgPct,
    },
    knowYourself: {
      total: kyTotal,
      completed: kyCompleted,
      today: kyToday,
      avgScore: kyAvgScore,
      questionCount: kyQuestionCount,
    },
    content: {
      questionCount,
      kyQuestionCount,
    },
    domainDistribution: domainsBySource.map((d) => ({ domain: d._id, value: d.value })),
    scoreDistribution: scoreBucketAgg.reduce((acc, g) => {
      acc[g._id] = g.value;
      return acc;
    }, {}),
    recentAssessments: recentKY,
    recentContacts: recentContacts,
    recentActivity: recentActivity,
    scoreBuckets: scoreBucketAgg.map((g) => ({
      label: g._id,
      value: g.value,
      color: BUCKET_COLORS[g._id] || '#888',
    })),
  });
});

const BUCKET_COLORS = {
  'Strong (65+)': '#0D8845',
  'Moderate (50-64)': '#FCA700',
  'Gaps (35-49)': '#F5630D',
  'Critical (<35)': '#E52032',
  'No score': '#888',
};