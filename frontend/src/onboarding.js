// The 3-question onboarding is served straight from memory so tapping
// "Let's Begin" shows the first question instantly — no network wait. The
// option's colour is never hardcoded here: it is the stage Admin attached to
// that answer option in the question bank. App.jsx seeds each entry with the
// real option (fetched via /next), and the backend result replaces the seed
// with the authoritative selected-option colour. This file has zero colour
// logic of its own.
import { categoryLabel } from './lib/categories.js';

export const ONBOARDING_BUSINESS_TYPES = [
  { key: 'service', label: 'Services' },
  { key: 'manufacturing', label: 'Manufacturing' },
  { key: 'nonprofit', label: 'Non-Profit' },
  { key: 'startup', label: 'Startup' },
];

// Maps a backend onboarding-config question (GET /assessments/onboarding) to
// the local question shape used by QuestionScreen / buildLocalQuestion.
// There is NO generic/common question bank and NO fallback: an empty config
// stays empty so the Intro screen shows the unavailable state for that
// business type. Per-question Yes/No colours travel through untouched — the
// fallback to defaults (optionColor) is only applied locally at render time.
function optionsFromConfig(options) {
  return (options || []).map((o) => ({
    text: o.text,
    score: o.score,
    color: o.color ?? null,
  }));
}

export function onboardingQuestionsFromConfig(questions) {
  if (!Array.isArray(questions) || questions.length === 0) return [];
  return questions.slice(0, 3).map((q) => {
    const src = optionsFromConfig(q.options);
    const yes = src.find((o) => String(o.text || '').trim().toLowerCase() === 'yes');
    const no = src.find((o) => String(o.text || '').trim().toLowerCase() === 'no');
    return {
      category: q.categoryKey,
      name: q.pillar || q.categoryLabel || categoryLabel(q.categoryKey, q.categoryKey),
      text: q.questionText,
      options: [
        { optionId: 'yes', text: 'Yes', color: yes?.color ?? null },
        { optionId: 'no', text: 'No', color: no?.color ?? null },
      ],
    };
  });
}

// Neutral track colour only for categories with NO selected option (still
// loading / unanswered). It never competes with a real Admin-configured stage
// colour — answered categories always use the selected option's colour.
export const NEUTRAL_COLOR = '#8B93A7';

// Shape expected by QuestionScreen (questionId, text, category, options with
// optionId/text/color).
export function buildLocalQuestion(q) {
  return {
    questionId: `local-${q.category}`,
    text: q.text,
    category: q.category,
    startedAt: new Date().toISOString(),
    timeoutSeconds: 45,
    options: q.options.map((o) => ({
      optionId: o.optionId,
      text: o.text,
      color: o.color ?? null,
    })),
  };
}

// Pull the stage Admin configured for a specific answer option out of a real
// backend question (shape returned by GET /assessments/:id/next/:category).
// Local onboarding options carry only 'yes'/'no' labels, so the match is made
// on the option text, which is identical to the real option's text.
export function optionStageFrom(question, optionText) {
  const text = String(optionText || '').trim().toLowerCase();
  const opt = (question?.options || []).find(
    (o) => String(o.text || '').trim().toLowerCase() === text
  );
  return opt?.stage || null;
}

// The Admin-configured colour of the answer option itself (not the stage
// colour). Falls back to the stage colour for legacy questions/snapshots.
export function optionColorFrom(question, optionText) {
  const text = String(optionText || '').trim().toLowerCase();
  const opt = (question?.options || []).find(
    (o) => String(o.text || '').trim().toLowerCase() === text
  );
  return opt?.color || opt?.stage?.color || null;
}

// Snapshot result rendered the moment the third answer lands. Colours are the
// selected option's configured stage colour when the real question has been
// fetched, otherwise a neutral placeholder until the backend result lands
// (which is the authoritative source). Scores are provisional: the real score
// arrives with the result and is deliberately not used to pick a colour.
export function makeSnapshotResult(entries) {
  return {
    overallPct: 0,
    overallEarned: 0,
    overallPossible: entries.length,
    totalAnswered: entries.length,
    totalTimedOut: 0,
    status: 'completed',
    scores: entries.map((e) => ({
      categoryKey: e.category,
      categoryName: e.name,
      answer: e.optionText || null,
      color: e.optionColor || e.stage?.color || NEUTRAL_COLOR,
      selectedOptionColor: e.optionColor || e.stage?.color || null,
      stage: e.stage || null,
      optionColor: e.optionColor || null,
      score: 0,
      earned: 0,
      possible: 1,
      answerScore: null,
      hasScore: false,
      weight: 1,
      content: null,
    })),
  };
}

// Merges the backend-computed category result into the local snapshot. The
// backend is the source of truth: per category it carries the selected option's
// stage and its configured colour (selectedOptionColor) alongside the computed
// score. Colour and score stay separate — the colour travels untouched from the
// Admin option to the donut; the score only ever represents scoring.
export function applyServerResult(snapshot, server) {
  if (!snapshot || !server || !Array.isArray(server.scores)) return snapshot;
  const byKey = new Map(server.scores.map((s) => [s.categoryKey, s]));
  const scores = (snapshot.scores || []).map((s) => {
    const sr = byKey.get(s.categoryKey);
    if (!sr) return s;
    const selectedOptionColor =
      sr.selectedOptionColor ?? sr.stage?.color ?? null;
    return {
      ...s,
      answer: sr.answer ?? s.answer ?? null,
      color: selectedOptionColor || NEUTRAL_COLOR,
      selectedOptionColor,
      optionColor: sr.optionColor ?? s.optionColor ?? null,
      stage: sr.stage || s.stage || null,
      score: sr.score ?? 0,
      earned: sr.earned ?? 0,
      possible: sr.possible ?? 1,
      answerScore: sr.answerScore ?? null,
      weight: sr.weight ?? 1,
      hasScore: sr.hasScore,
      content: sr.content ?? null,
    };
  });
  return { ...snapshot, scores };
}