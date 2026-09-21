import crypto from 'crypto';
import AssessmentSession from '../models/AssessmentSession.js';
import Category from '../models/Category.js';
import Question from '../models/Question.js';
import { rollQuestion, toPublicQuestion, getTimeoutSeconds, findBestQuestion } from './questionPool.js';
import { buildResult } from './scoringEngine.js';
import { resolveStage } from './stages.js';
import { isValidOnboardingBusinessType } from '../config/onboarding.js';
import { resolveOptionHex } from '../config/optionColors.js';

function isExpired(startedAt) {
  const timeoutMs = getTimeoutSeconds() * 1000;
  return Date.now() - new Date(startedAt).getTime() > timeoutMs;
}

// ── Per-session write serialization ────────────────────────────────────────
// The assessment flow issues concurrent requests that all load‑modify‑save the
// SAME AssessmentSession document (e.g. the Q(n+1) prefetch GET /next racing
// the Q(n) answer POST /answer). Without serialization, both handlers save the
// same document from the same `__v` snapshot and the second save throws a
// Mongoose VersionError, which surfaced as an HTTP 500 on /answer.
//
// We serialize writes per sessionId and retry on VersionError (reloading a
// fresh document each attempt), so the race is fixed at the source — not
// hidden behind error handling. All operations below are written to be safe to
// re-run against a fresh document (idempotent).
const sessionWriteQueues = new Map(); // sessionId -> handled tail promise

function enqueueSessionWrite(sessionId, task) {
  const prev = sessionWriteQueues.get(sessionId) || Promise.resolve();
  const run = prev.then(
    () => task(),
    () => task()
  );
  const tail = run.then(
    () => undefined,
    () => undefined
  );
  sessionWriteQueues.set(sessionId, tail);
  tail.then(() => {
    if (sessionWriteQueues.get(sessionId) === tail) sessionWriteQueues.delete(sessionId);
  });
  return run;
}

const MAX_WRITE_ATTEMPTS = 3;

async function runWrite(sessionId, body) {
  let lastError;
  for (let attempt = 1; attempt <= MAX_WRITE_ATTEMPTS; attempt += 1) {
    try {
      return await body();
    } catch (err) {
      const versionConflict =
        err &&
        (err.name === 'VersionError' ||
          /No matching document found for id/.test(err.message || ''));
      if (versionConflict && attempt < MAX_WRITE_ATTEMPTS) {
        lastError = err;
        continue;
      }
      throw err;
    }
  }
  throw lastError || new Error('Write failed');
}

export async function createSession({ businessType } = {}) {
  if (!isValidOnboardingBusinessType(businessType)) {
    throw Object.assign(
      new Error(`Onboarding business type '${businessType}' is not one of the four supported types`),
      { status: 400 }
    );
  }

  const categories = await Category.find({ active: true }).sort({ sortOrder: 1 }).lean();
  if (categories.length === 0) {
    throw Object.assign(new Error('No active assessment categories configured'), { status: 400 });
  }

  // Per-category validity checks are independent reads of the same collection —
  // run them in parallel instead of multiplying the MongoDB round trips
  // one-by-one. This was the dominant cost of session creation. If any category
  // has no configured question for this business type the session is refused:
  // that type is "unavailable" and no other type's questions are substituted.
  await Promise.all(
    categories.map(async (c) => {
      const valid = await findBestQuestion(c, businessType);
      if (!valid) {
        throw Object.assign(
          new Error(`Category '${c.key}' has no active questions for '${businessType}'`),
          { status: 400 }
        );
      }
    })
  );

  const sessionId = crypto.randomBytes(6).toString('hex').toUpperCase();
  const session = await AssessmentSession.create({
    sessionId,
    status: 'in_progress',
    businessType,
    answers: [],
  });

  const pending = {};
  for (const c of categories) pending[c.key] = true;

  return { sessionId, categories: categories.map((c) => c.key), pending };
}

export async function getNextQuestion(sessionId, categoryKey) {
  return enqueueSessionWrite(sessionId, () =>
    runWrite(sessionId, async () => {
      // Independent reads fetched together: the session lookup decides which
      // questions are still "new" (seen set), the category lookup feeds the
      // roll. Parallel saves one round trip on every question fetch.
      const [session, category] = await Promise.all([
        AssessmentSession.findOne({ sessionId }),
        Category.findOne({ key: categoryKey, active: true }),
      ]);
      if (!session) throw Object.assign(new Error('Session not found'), { status: 404 });
      if (!category) throw Object.assign(new Error('Category not found'), { status: 404 });
      if (session.status === 'completed') {
        throw Object.assign(new Error('Session already completed'), { status: 409 });
      }

      const seen = new Set((session.answers || []).map((a) => String(a.question)));
      const { question } = await rollQuestion({
        categoryKey,
        excludeQuestionIds: [...seen],
        category,
        businessType: session.businessType,
      });
      if (!question) throw Object.assign(new Error('No active questions in this category'), { status: 400 });

      const alreadyIssued = (session.answers || []).some(
        (a) => String(a.question) === String(question._id) && !a.timedOut
      );
      if (!alreadyIssued) {
        session.answers.push({
          category: category._id,
          categoryKey: category.key,
          question: question._id,
          questionText: question.text,
          score: 0,
          weight: question.weight,
          stageKey: question.stageKey || null,
          timedOut: false,
          startedAt: new Date(),
        });
        session.lastActiveAt = new Date();
        await session.save();
      }

      return { question: await toPublicQuestion(question), category: category.key };
    })
  );
}

export async function submitAnswer(sessionId, { questionId, optionId, categoryKey }) {
  return enqueueSessionWrite(sessionId, () =>
    runWrite(sessionId, async () => {
      const session = await AssessmentSession.findOne({ sessionId });
      if (!session) throw Object.assign(new Error('Session not found'), { status: 404 });
      if (session.status === 'completed') throw Object.assign(new Error('Session already completed'), { status: 409 });

      const category = await Category.findOne({ key: categoryKey });
      if (!category) throw Object.assign(new Error('Category not found'), { status: 404 });

      const question = await Question.findById(questionId);
      if (!question) throw Object.assign(new Error('Question not found'), { status: 404 });

      const option = (question.options || []).find(
        (o) => String(o._id) === String(optionId)
      );
      if (!option) throw Object.assign(new Error('Invalid answer option'), { status: 400 });

      const pendingEntry = (session.answers || []).find(
        (a) => String(a.question) === String(questionId)
      );
      const startedAt = pendingEntry?.startedAt || new Date();
      const timedOut = isExpired(startedAt);

      if (timedOut) {
        return { accepted: false, timedOut: true, reason: 'time_up', timeoutSeconds: getTimeoutSeconds() };
      }

      // Already recorded (duplicate request, retry after a lost response, or a
      // replayed submission). Acknowledge instead of pushing a second entry so
      // an idempotent retry never double-scores or duplicates the answer.
      if (pendingEntry && pendingEntry.optionId) {
        return { accepted: true, timedOut: false };
      }

      const stage = await resolveStage(option.stageKey || question.stageKey);

      // Snapshot the Admin-configured colour of the selected answer option
      // (same resolution the public question API uses) so the result chart
      // always shows the colour Admin configured for this answer — never a
      // stage's colour and never an inferred palette colour.
      const activeOptions = (question.options || []).filter((o) => o.active);
      const optionIndex = Math.max(
        0,
        activeOptions.findIndex((o) => String(o._id) === String(optionId))
      );
      const optionColor = resolveOptionHex({
        text: option.text,
        color: option.color,
        index: optionIndex,
      });

      const now = new Date();
      if (pendingEntry) {
        pendingEntry.optionId = option._id;
        pendingEntry.optionText = option.text;
        pendingEntry.optionColor = optionColor;
        pendingEntry.score = option.score;
        pendingEntry.stageKey = option.stageKey || question.stageKey || null;
        pendingEntry.stage = stage;
        pendingEntry.answeredAt = now;
      } else {
        session.answers.push({
          category: category._id,
          categoryKey: category.key,
          question: question._id,
          questionText: question.text,
          optionId: option._id,
          optionText: option.text,
          optionColor,
          score: option.score,
          weight: question.weight,
          stageKey: option.stageKey || question.stageKey || null,
          stage,
          timedOut: false,
          startedAt,
          answeredAt: now,
        });
      }
      session.lastActiveAt = new Date();
      await session.save();

      return { accepted: true, timedOut: false };
    })
  );
}

export async function recordTimeout(sessionId, questionId, categoryKey) {
  return enqueueSessionWrite(sessionId, () =>
    runWrite(sessionId, async () => {
      const session = await AssessmentSession.findOne({ sessionId });
      if (!session) throw Object.assign(new Error('Session not found'), { status: 404 });

      const existing = (session.answers || []).find((a) => String(a.question) === String(questionId));
      if (existing?.timedOut) return session;
      // A timeout that races an already-recorded answer must not clobber it —
      // the answer stays scored, the timeout is ignored.
      if (existing?.optionId) return session;

      const category = await Category.findOne({ key: categoryKey });
      const question = await Question.findById(questionId);

      if (existing) {
        existing.timedOut = true;
      } else if (question && category) {
        session.answers.push({
          category: category._id,
          categoryKey: category.key,
          question: question._id,
          questionText: question.text,
          timedOut: true,
          score: 0,
          weight: question.weight,
          startedAt: new Date(),
          answeredAt: new Date(),
        });
      }
      session.lastActiveAt = new Date();
      await session.save();
      return session;
    })
  );
}

export async function getResult(sessionId) {
  return enqueueSessionWrite(sessionId, () =>
    runWrite(sessionId, async () => {
      const session = await AssessmentSession.findOne({ sessionId });
      if (!session) throw Object.assign(new Error('Session not found'), { status: 404 });
      const stored = session.result;
      if (
        session.status === 'completed' &&
        stored &&
        typeof stored.overallPct === 'number' &&
        Array.isArray(stored.scores)
      ) {
        return stored;
      }
      return buildResult(session);
    })
  );
}