/* ─────────────────────────────────────────────────────────────
   BYRGOP CHART COLORS — the ONE source of truth for result
   visualization colors.

   The official six-colour BYRGOP mark already exists in the design
   system (theme/brand.js → `brand.mark`, ink order: Blue, Yellow,
   Red, Green, Orange, Purple). We reuse those exact hex values —
   nothing is invented here.

   Every result chart (Radar, Bubble, Bullet, Bar) imports this
   module and nothing else for its data colors:

       byrgopChartColors.js
               ↓
          pillarChartColor(index)
               ↓
      ┌──────┼──────────┬────────────┐
     Radar  Bubble    Bullet       Bar

   No chart keeps its own color array; with six pillars and six
   colors the mapping is exactly one color per pillar, deterministically
   by pillar index — the same pillar always receives the same BYRGOP
   color in every chart. A hypothetical extra pillar reuses a palette
   color (modulo) rather than ever introducing a 7th color.
   ───────────────────────────────────────────────────────────── */

import { brand } from '../theme/brand.js';

/** The six BYRGOP brand colours, frozen — the existing official mark. */
export const BYRGOP_CHART_COLORS = Object.freeze([...brand.mark]);

export const BYRGOP_CHART_COLOR_COUNT = BYRGOP_CHART_COLORS.length;

/**
 * Deterministic pillar → color mapping. Pillar index `i` always gets
 * BYRGOP_CHART_COLORS[i]; because every Know-Yourself result has exactly
 * six pillars this yields all six colors exactly once. The positive modulo
 * just guarantees a future extra pillar can never introduce a 7th color.
 */
export function pillarChartColor(index) {
  const i = Number(index);
  const n = BYRGOP_CHART_COLOR_COUNT;
  return BYRGOP_CHART_COLORS[((i % n) + n) % n];
}