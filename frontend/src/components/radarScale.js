/* ─────────────────────────────────────────────────────────────
   RADAR SCALE — the single source of truth for the Know-Yourself
   radar chart.

   Everything the radar draws is derived from ONE configuration:

     RADAR_SCALE = { min: 0, max: 100, ticks: [0, 25, 50, 75, 100] }

     · the grid rings      → RADAR_SCALE.ticks (0 is the centre point)
     · the tick labels     → the same ticks, positioned by radiusFor()
     · the plotted polygon → radiusFor(category percent)

   so a ring, its label and a data point can never disagree: they are
   all the same radial coordinate system (0 → centre, 100 → outer ring,
   strictly linear, zero baseline — see kyPercentScale.js).

   Tick labels are placed with `polar()` on an actual AXIS vertex of the
   drawn ring polygon, at exactly `radiusFor(tick)` from the centre. The
   ring polygons are built from the very same call, so a label can never
   drift off its ring — it sits on the polygon's own vertex.
   ───────────────────────────────────────────────────────────── */

import { PERCENT_MIN, PERCENT_MAX } from './kyPercentScale.js';

/** Domain + tick configuration. Scores are canonical 0–100 percentages. */
export const RADAR_SCALE = Object.freeze({
  min: PERCENT_MIN, // 0   → centre of the chart
  max: PERCENT_MAX, // 100 → outermost ring
  ticks: Object.freeze([0, 25, 50, 75, 100]),
});

/** Chart geometry (SVG user units — the viewBox scales these uniformly
    on desktop / tablet / mobile, so nothing is ever pixel-fixed). */
export const RADAR_VIEW = Object.freeze({ w: 336, h: 264, cx: 168, cy: 130, r: 84 });

/**
 * The one radial mapping: a 0–100 score → user units from the centre.
 * 0 → 0 (centre), 100 → RADAR_VIEW.r (outer ring), strictly linear.
 * Rings, labels and data points all go through this function.
 */
export function radiusFor(score) {
  const n = Number(score);
  const value = Number.isFinite(n) ? Math.min(Math.max(n, RADAR_SCALE.min), RADAR_SCALE.max) : RADAR_SCALE.min;
  return (RADAR_VIEW.r * (value - RADAR_SCALE.min)) / (RADAR_SCALE.max - RADAR_SCALE.min);
}

/** Angle (SVG degrees, 0 = up) of axis `index` for an n-axis radar. */
export function axisAngle(index, count) {
  return (360 / count) * index;
}

/** [x, y] of a point `radius` user units out along `angleDeg`. */
export function polar(angleDeg, radius) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return [RADAR_VIEW.cx + radius * Math.cos(a), RADAR_VIEW.cy + radius * Math.sin(a)];
}

/** The axis the tick labels ride — the one pointing straight down
    (index floor(n/2); for six pillars that is exactly 180°). */
export function tickLabelAxisIndex(count) {
  return Math.floor(count / 2);
}

/** Every vertex of the ring polygon for a tick — the drawn grid ring. */
export function ringPoints(count, tick) {
  return Array.from({ length: count }, (_, i) => polar(axisAngle(i, count), radiusFor(tick)));
}

/** The exact point where a tick label sits: ON its ring (an axis vertex),
    at exactly radiusFor(tick) from the centre. */
export function tickLabelPoint(tick, count) {
  return polar(axisAngle(tickLabelAxisIndex(count), count), radiusFor(tick));
}

/** A data point: axis `index`, at exactly radiusFor(percent) from the centre. */
export function dataPoint(count, index, percent) {
  return polar(axisAngle(index, count), radiusFor(percent));
}
