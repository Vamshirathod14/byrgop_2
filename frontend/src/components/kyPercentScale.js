/* ─────────────────────────────────────────────────────────────
   CANONICAL PERCENTAGE SCALE — KNOW-YOURSELF RESULT GRAPHS
   ─────────────────────────────────────────────────────────────
   The backend already returns a canonical 0–100 integer for every
   value a result graph consumes:

     result.categories[].percent   →  Math.round(score / maxScore * 100)
     result.overallPercent         →  Math.round(mean of category percent)

   (backend/src/services/knowYourselfService.js → buildKYResult)

   The text on the result page already prints those numbers verbatim, so
   scoring is NOT the problem — this module exists so that the *geometry*
   of every graph is derived from that same 0–100 number.

   Rules enforced here:

     1. 0 maps to 0 and 100 maps to the full extent. Never anything else.
     2. A value is never normalised against the current dataset — not the
        sum of the category percentages, not the strongest category, not
        the other categories. A 20% pillar drawn on its own is always a
        fifth of its own 0–100 track, even when it is the best pillar.
     3. Radius/offset helpers always start at a zero baseline, so a 0%
        value lands on the axis origin instead of being nudged outwards
        by a decorative head offset.
     4. Conversion happens exactly once, here, at the graph boundary.
        Everything downstream of `percentToUnit` works in 0–1 and never
        multiplies or divides by 100 again.
   ───────────────────────────────────────────────────────────── */

export const PERCENT_MIN = 0;
export const PERCENT_MAX = 100;

/**
 * The single conversion point for a value arriving from the result API.
 * Accepts the canonical 0–100 integer and returns the same scale, with
 * non-numeric input treated as 0 and out-of-range input clamped.
 * This is the ONLY place a percentage is normalised.
 */
export function toPercent(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return PERCENT_MIN;
  if (n < PERCENT_MIN) return PERCENT_MIN;
  if (n > PERCENT_MAX) return PERCENT_MAX;
  return n;
}

/** 0–100 → 0–1. Use for stroke-dashoffset, chart libraries, opacities. */
export function percentToUnit(value) {
  return toPercent(value) / PERCENT_MAX;
}

/** 0–100 → 0–360 degrees. Use for arc sweeps on a single 0–100 track. */
export function percentToAngle(value) {
  return percentToUnit(value) * 360;
}

/**
 * 0–100 → 0…maxExtent with a ZERO baseline, i.e. exactly proportional.
 * 0 → 0, 20 → 20% of maxExtent, 50 → half, 80 → 80%, 100 → maxExtent.
 */
export function percentToExtent(value, maxExtent) {
  return percentToUnit(value) * maxExtent;
}
