import Category from '../models/Category.js';
import ResultContent from '../models/ResultContent.js';
import { categoryDisplayName } from '../config/categoryLabels.js';
import { getStageMap } from './stages.js';

function clamp01(n) {
  return Math.max(0, Math.min(1, n));
}

export function roundPct(n) {
  return Math.round(clamp01(n) * 100);
}

// The donut colour is the colour Admin attached to the selected answer option
// (its stage), not anything derived from the score. `stageMap` lets us resolve
// a stored stageKey once (cheaply, cached by the stages service) for older
// sessions that were snapshotted before the full stage object existed.
export function scoreCategories(answers, categories, stageMap = null) {
  const byKey = new Map(categories.map((c) => [c.key, c]));
  const out = {};
  for (const key of byKey.keys()) out[key] = null;

  for (const a of answers || []) {
    if (a.timedOut || a.optionId == null) continue;
    if (out[a.categoryKey]) continue;

    const weight = Number(a.weight) || 0;
    const answerScore = Number(a.score) || 0;
    const earned = weight * answerScore;
    const possible = weight;
    const category = byKey.get(a.categoryKey);

    const optionStage =
      a.stage ||
      (a.stageKey && stageMap ? stageMap[a.stageKey] || null : null);

    out[a.categoryKey] = {
      earned,
      possible,
      answerScore,
      weight,
      pct: possible > 0 ? roundPct(earned / possible) : 0,
      categoryName: categoryDisplayName(a.categoryKey, category?.name ?? a.categoryKey),
      color: category?.color ?? '#8B93A7',
      answer: a.optionText ?? null,
      optionColor: a.optionColor ?? null,
      stage: optionStage,
      selectedOptionColor: a.optionColor ?? optionStage?.color ?? null,
    };
  }

  return out;
}

export async function buildResult(session) {
  const categories = await Category.find({ active: true }).sort({ sortOrder: 1 }).lean();
  const stageMap = await getStageMap();
  const scores = scoreCategories(session.answers, categories, stageMap);

  let totalEarned = 0;
  let totalPossible = 0;
  const categoryResults = {};

  for (const c of categories) {
    const s = scores[c.key];
    if (s === null) {
      categoryResults[c.key] = { score: null, content: null };
      continue;
    }
    totalEarned += s.earned;
    totalPossible += s.possible;

    const content = await ResultContent.findOne({
      category: c._id,
      active: true,
      minScore: { $lte: s.pct },
      maxScore: { $gte: s.pct },
    }).lean();

    categoryResults[c.key] = { score: s, content };
  }

  const breakdown = categories.map((c) => {
    const s = scores[c.key];
    return {
      categoryKey: c.key,
      categoryName: categoryDisplayName(c.key, c.name),
      color: c.color,
      score: s?.pct ?? 0,
      earned: s?.earned ?? 0,
      possible: s?.possible ?? 0,
      answerScore: s?.answerScore ?? null,
      hasScore: s !== null,
      weight: s?.weight ?? null,
      answer: s?.answer ?? null,
      optionColor: s?.optionColor ?? null,
      stage: s?.stage ?? null,
      selectedOptionColor: s?.selectedOptionColor ?? null,
      content: categoryResults[c.key]?.content ?? null,
    };
  });

  const scoredCount = breakdown.filter((b) => b.hasScore).length;
  const status =
    scoredCount >= categories.length && categories.length > 0 ? 'completed' : session.status;

  const result = {
    scores: breakdown,
    overallPct: totalPossible > 0 ? roundPct(totalEarned / totalPossible) : 0,
    overallEarned: totalEarned,
    overallPossible: totalPossible,
    totalAnswered: (session.answers || []).filter((a) => !a.timedOut && a.optionId).length,
    totalTimedOut: (session.answers || []).filter((a) => a.timedOut).length,
    status,
  };

  session.result = result;
  session.status = status;
  session.lastActiveAt = new Date();
  await session.save();

  return result;
}
