import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { brand } from '../theme/brand.js';
import { percentToExtent } from './kyPercentScale.js';
import { BYRGOP_CHART_COLORS, pillarChartColor } from './byrgopChartColors.js';

/* ─────────────────────────────────────────────────────────────
   KNOW-YOURSELF RESULT VISUALIZATIONS

   The result page renders EXACTLY four visualization types:

     1. Radar   (rendered by KnowYourselfResult — this module's
        VisualizationArea embeds it via `radarSlot`)
     2. Bubble
     3. Bullet
     4. Bar

   The removed former view is permanently gone and no other chart type
   is offered by the selector.

   Every view consumes ONLY the normalized `data` array produced by
   toPillarData(result.categories) — i.e. the exact same six-pillar
   percentages returned by the backend (result.categories[].percent).
   No scores are invented; no second dataset is created.

   COLORS: all four charts take their pillar colors from the single
   centralized 6-color BYRGOP palette (byrgopChartColors.js). toPillarData
   assigns color = pillarChartColor(pillarIndex), so the same pillar gets
   the same BYRGOP color in the Radar, Bubble, Bullet and Bar views and no
   chart holds its own hardcoded color array. Neutral geometry (grid lines,
   axes, labels) uses the existing design-system whites only — never a hue.
   ───────────────────────────────────────────────────────────── */

const ease = [0.22, 1, 0.36, 1];
const VW = 460;
const VH = 340;

const SOFT = brand.premiumWhite.soft;

export const VIEWS = [
  { id: 'radar', label: 'Radar' },
  { id: 'bar', label: 'Bar' },
  { id: 'bullseye', label: 'Bullseye' },
  { id: 'bubble', label: 'Bubble' },
];

/* Single source of truth: normalize backend categories for every chart.
   `percent` is the backend's canonical 0–100 integer, passed through
   untouched so labels and geometry always read the very same number.
   The color is assigned deterministically from the centralized palette by
   pillar index — the same pillar always receives the same BYRGOP color
   across Radar / Bubble / Bullet / Bar. */
export function toPillarData(categories) {
  return (categories || []).map((c, i) => ({
    key: c.key,
    name: c.name,
    percent: c.percent,
    color: pillarChartColor(i),
  }));
}

function withAlpha(hex, alpha) {
  const h = String(hex).replace('#', '');
  const n = parseInt(h, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

function lines(name) {
  const w = String(name || '').trim().split(/\s+/);
  if (w.length <= 1) return [String(name)];
  if (w.length === 2) return [w[0], w[1]];
  if (w.length === 3) {
    if (w[1] === '&') return [w[0], `${w[1]} ${w[2]}`];
    return [`${w[0]} ${w[1]}`, w[2]];
  }
  const mid = Math.ceil(w.length / 2);
  return [w.slice(0, mid).join(' '), w.slice(mid).join(' ')];
}

function ChartFrame({ label, children, width = VW, height = VH }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease }}
      className="mx-auto flex h-full w-full items-center justify-center"
    >
      <svg viewBox={`0 0 ${width} ${height}`} className="font-bodoni max-h-full max-w-full w-full h-auto mx-auto" role="img" aria-label={label}>
        {children}
      </svg>
    </motion.div>
  );
}

/* Hover tooltip — pillar name + percent only (same style as the radar tooltip). */
function HoverTip({ x, y, c, vw = VW, vh = VH }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 4, scale: 0.96 }}
      transition={{ duration: 0.18 }}
      className="pointer-events-none absolute z-10 -translate-x-1/2 whitespace-nowrap rounded-xl border border-white/10 bg-ink-850/95 px-3.5 py-2 shadow-card backdrop-blur-md"
      style={{ left: `${(x / vw) * 100}%`, top: `${(y / vh) * 100}%`, marginTop: '-2.6rem' }}
    >
      <p className="font-bodoni flex items-center gap-2 text-sm font-semibold" style={{ color: SOFT }}>
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: c.color }} />
        {c.name}
      </p>
      <p className="font-bodoni text-right text-base font-bold tabular-nums" style={{ color: c.color }}>
        {c.percent}%
      </p>
    </motion.div>
  );
}

/* ── Selection UI ───────────────────────────────────────────
   TwelveLayouts-style switcher NAV BAR: one compact surface holding
   tab buttons, centered and wrapped on small screens. The active tab is
   a solid accent chip with glow (reference: solid `#2563eb` active tab);
   only one visualization is ever live at a time. */
export function VisualizationSelector({ value, onChange }) {
  return (
    <div
      className="mx-auto flex w-fit max-w-full flex-wrap items-center justify-center gap-1.5 rounded-2xl border border-white/10 bg-ink-850/85 p-1.5 shadow-card backdrop-blur-sm sm:gap-2.5 sm:p-2"
      role="group"
      aria-label="Visualization type"
      data-testid="viz-selector"
    >
      {VIEWS.map((v) => {
        const active = value === v.id;
        return (
          <button
            key={v.id}
            type="button"
            onClick={() => onChange(v.id)}
            aria-pressed={active}
            aria-label={`Show ${v.label} visualization`}
            data-testid={`viz-${v.id}`}
            style={
              active
                ? {
                    background: `linear-gradient(135deg, ${brand.accent}, ${brand.palette.orange[500]})`,
                    color: brand.ink[900],
                    boxShadow: `0 3px 12px ${withAlpha(brand.accent, 0.45)}`,
                  }
                : undefined
            }
            className={`font-bodoni rounded-xl px-2.5 sm:px-5 md:px-6 py-1.5 sm:py-2 md:py-2.5 text-xs sm:text-sm md:text-base font-bold tracking-wide transition-all duration-200 ${
              active
                ? ''
                : 'text-mist-muted hover:bg-white/5 hover:text-mist'
            }`}
          >
            {v.label}
          </button>
        );
      })}
    </div>
  );
}

/* Reference chart-box: the centered, substantial panel that holds each
   canvas-style visualization (max ~680px, card surface). */
function ChartBox({ children }) {
  return (
    <div
      className="mx-auto flex h-[270px] sm:h-[400px] md:h-[420px] w-full max-w-[680px] items-center justify-center rounded-2xl border border-white/10 bg-ink-850/70 p-1.5 sm:p-5 md:p-7 shadow-card"
      data-testid="chart-box"
    >
      {children}
    </div>
  );
}

/* ── Dedicated visualization stage ───────────────────────── */
export function ResultVisualizationStage({ children }) {
  return (
    <div
      className="relative z-10 mx-auto mt-2.5 sm:mt-4 flex min-h-0 md:min-h-[360px] w-full items-start justify-center"
      data-testid="viz-stage"
    >
      {children}
    </div>
  );
}

/* ── Active panel ──────────────────────────────────────────
   One view mounted at a time, fading/sliding in on change. The radar is
   embedded via radarSlot (it is rendered by KnowYourselfResult so its
   grid/labels/polygon share the single radarScale.js coordinate system). */
export function VisualizationArea({ view, data, overall, radarSlot }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={view}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.28, ease }}
        className="w-full"
        data-testid="viz-area"
      >
        {view === 'radar' && <ChartBox>{radarSlot}</ChartBox>}
        {view === 'bar' && (
          <ChartBox>
            <BarChartView data={data} />
          </ChartBox>
        )}
        {view === 'bullseye' && (
          <ChartBox>
            <BullseyeChartView data={data} overall={overall} />
          </ChartBox>
        )}
        {view === 'bubble' && (
          <ChartBox>
            <BubblePlotView data={data} />
          </ChartBox>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

/* ── Bubble chart ────────────────────────────────────────── */
/* Bubble size is strictly proportional with a ZERO baseline: 0% has no
   bubble, 100% keeps the previous 31-unit maximum radius. No floor radius,
   otherwise a 0% pillar would draw a large dot and 20% would read as ~43%
   of the max. Pillar color comes from the centralized palette (via
   toPillarData), so a pillar is the same color here as in Radar/Bullet/Bar. */
export function BubblePlotView({ data }) {
  const [hover, setHover] = useState(null);
  const width = 520;
  const height = 350;
  const plotLeft = 46;
  const plotRight = 504;
  const plotTop = 36;
  const plotBottom = 224;
  const slotW = (plotRight - plotLeft) / data.length;
  const yFor = (p) => plotBottom - percentToExtent(p, plotBottom - plotTop);
  const rFor = (p) => percentToExtent(p, 31);
  return (
    <div className="relative w-full">
      <ChartFrame label="Bubble plot where bubble size represents each pillar percentage" width={width} height={height}>
        {[0, 25, 50, 75, 100].map((g) => (
          <g key={g}>
            <line x1={plotLeft} y1={yFor(g)} x2={plotRight} y2={yFor(g)} stroke={withAlpha('#FFFFFF', 0.1)} strokeWidth={1} />
            <text x={plotLeft - 6} y={yFor(g)} textAnchor="end" dominantBaseline="middle" fill={withAlpha('#FFFFFF', 0.55)} style={{ fontSize: 9, fontWeight: 600 }}>
              {g}
            </text>
          </g>
        ))}
        {data.map((c, i) => {
          const bx = plotLeft + slotW * (i + 0.5);
          const by = yFor(c.percent);
          const rr = rFor(c.percent);
          const isHover = hover === c.key;
          return (
            <g key={c.key}>
              <motion.circle
                cx={bx}
                cy={by}
                r={rr}
                fill={withAlpha(c.color, 0.65)}
                stroke={c.color}
                strokeWidth={isHover ? 3 : 2}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 + i * 0.06, duration: 0.4, ease }}
                style={{ transformOrigin: `${bx}px ${by}px` }}
                className="cursor-pointer"
                onMouseEnter={() => setHover(c.key)}
                onMouseLeave={() => setHover(null)}
              />
              {/* Pillar name below the chart */}
              {lines(c.name).map((ln, li) => (
                <text
                  key={li}
                  x={bx}
                  y={plotBottom + 16 + li * 13}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#FFFFFF"
                  style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: '0.01em' }}
                >
                  {ln}
                </text>
              ))}
            </g>
          );
        })}
      </ChartFrame>
      {hover && (() => {
        const c = data.find((d) => d.key === hover);
        const bx = plotLeft + slotW * (data.findIndex((d) => d.key === hover) + 0.5);
        return <HoverTip x={bx} y={yFor(c.percent)} c={c} vw={width} vh={height} />;
      })()}
    </div>
  );
}

/* ── Bar chart (horizontal) ──────────────────────────────── */
/* One horizontal 0–100 track per pillar. The filled portion is exactly
   percentToExtent(percent, track width), on the same absolute 0–100 scale.
   Pillar colors use the centralized BYRGOP palette:
   B - #0A78CF, Y - #FCA700, R - #E52032, G - #0D8845, O - #F5630D, P - #7038A5. */
export function BarChartView({ data }) {
  const plotLeft = 130;
  const plotRight = 430;
  const rowH = 44;
  const row0Y = 60;
  const trackW = plotRight - plotLeft;
  const lastY = row0Y + rowH * data.length - 8;
  const wFor = (p) => percentToExtent(p, trackW);
  return (
    <ChartFrame label="Horizontal bar chart of the six pillar percentages on a zero to one hundred scale">
      {[0, 25, 50, 75, 100].map((g) => {
        const x = plotLeft + wFor(g);
        return (
          <g key={g}>
            <line x1={x} y1={row0Y - 10} x2={x} y2={lastY} stroke={withAlpha('#FFFFFF', 0.07)} strokeWidth={1} />
            <text x={x} y={row0Y - 18} textAnchor="middle" dominantBaseline="middle" fill={withAlpha('#FFFFFF', 0.4)} style={{ fontSize: 8 }}>
              {g}
            </text>
          </g>
        );
      })}
      {data.map((c, i) => {
        const cy = row0Y + i * rowH;
        const w = wFor(c.percent);
        return (
          <g key={c.key}>
            <text x={plotLeft - 10} y={cy} textAnchor="end" dominantBaseline="middle" fill={SOFT} style={{ fontSize: 9.5 }}>
              {c.name}
            </text>
            {/* neutral track — design-system white, never a data color */}
            <rect x={plotLeft} y={cy - 5} width={trackW} height={10} rx={5} fill={withAlpha('#FFFFFF', 0.1)} />
            {w > 0 && (
              <motion.rect
                x={plotLeft}
                y={cy - 5}
                width={w}
                height={10}
                rx={5}
                fill={c.color}
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ duration: 0.55, delay: 0.08 + i * 0.06, ease }}
                style={{ transformOrigin: `${plotLeft}px ${cy}px` }}
              />
            )}
            <text x={plotLeft + w + 7} y={cy} textAnchor="start" dominantBaseline="middle" fill={c.color} style={{ fontSize: 10, fontWeight: 700 }}>
              {c.percent}%
            </text>
          </g>
        );
      })}
    </ChartFrame>
  );
}

// Backward compatibility alias
export const BulletChartView = BarChartView;

/* ── Bullseye chart ──────────────────────────────────────── */
/* Diagnostic target chart with concentric percentage rings:
     - 0%, 25%, 50%, 75%, 100% full solid gray circles with percentage ticks
     - Six radial pillar nodes mapped continuously to their exact percentage:
       positioned at/near the concentric circle corresponding to their score
     - Circular Node Badges:
         Rendered as a circular badge with pillar name and bold percentage score
         in that pillar's designated BYRGOP brand color:
           B - #0A78CF (Blue)
           Y - #FCA700 (Yellow)
           R - #E52032 (Red)
           G - #0D8845 (Green)
           O - #F5630D (Orange)
           P - #7038A5 (Purple) */

function formatNodeBadge(c) {
  const rawWords = String(c.name || '').trim().split(/\s+/);
  if (rawWords.length <= 1) {
    return { line1: rawWords[0] || '', line2: '' };
  }
  if (rawWords.length === 2) {
    return { line1: rawWords[0], line2: rawWords[1] };
  }
  if (rawWords.length === 3 && rawWords[1] === '&') {
    return { line1: rawWords[0], line2: `${rawWords[1]} ${rawWords[2]}` };
  }
  const mid = Math.ceil(rawWords.length / 2);
  return {
    line1: rawWords.slice(0, mid).join(' '),
    line2: rawWords.slice(mid).join(' '),
  };
}

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(min-width: 768px)').matches
  );
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(min-width: 768px)');
    const handler = (e) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isDesktop;
}

export function BullseyeChartView({ data }) {
  const [hover, setHover] = useState(null);
  const isDesktop = useIsDesktop();
  const width = isDesktop ? 540 : 380;
  const height = 380;
  const cx = width / 2;
  const cy = height / 2;
  const maxR = isDesktop ? 168 : 145;
  const n = data.length || 6;
  const stepDeg = 360 / n;
  const TICKS = [0, 25, 50, 75, 100];
  const RINGS = [25, 50, 75, 100];

  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <ChartFrame label="Bullseye target chart of the six core pillars" width={width} height={height}>
        {/* Concentric Background Target Rings - Full Solid Gray Circles */}
        {RINGS.map((lvl) => {
          const r = percentToExtent(lvl, maxR);
          const isOuter = lvl === 100;
          return (
            <circle
              key={`ring-${lvl}`}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={withAlpha('#FFFFFF', isOuter ? 0.28 : 0.18)}
              strokeWidth={isOuter ? 1.8 : 1.2}
            />
          );
        })}

        {/* Center Origin Dot representing 0% */}
        <circle
          cx={cx}
          cy={cy}
          r={3}
          fill={withAlpha('#FFFFFF', 0.6)}
          stroke="none"
        />

        {/* Concentric Percentage Tick Labels along top vertical radius */}
        {TICKS.map((lvl) => {
          const r = percentToExtent(lvl, maxR);
          const ty = lvl === 0 ? cy - 8 : cy - r - 4;
          return (
            <text
              key={`tick-${lvl}`}
              x={cx}
              y={ty}
              textAnchor="middle"
              dominantBaseline="auto"
              fill={withAlpha('#FFFFFF', 0.65)}
              style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.04em' }}
            >
              {lvl}%
            </text>
          );
        })}

        {/* Six radial pillar nodes mapped continuously to their exact percentage */}
        {data.map((c, i) => {
          const ang = (i * stepDeg * Math.PI) / 180;
          const cosA = Math.cos(ang);
          const sinA = Math.sin(ang);
          const r = percentToExtent(c.percent, maxR);
          const nx = cx + r * cosA;
          const ny = cy + r * sinA;
          const isHover = hover === c.key;
          const nodeR = isHover ? 35 : 31;
          const { line1, line2 } = formatNodeBadge(c);

          return (
            <g
              key={c.key}
              className="cursor-pointer"
              onMouseEnter={() => setHover(c.key)}
              onMouseLeave={() => setHover(null)}
            >
              {/* Circular badge container */}
              <motion.circle
                cx={nx}
                cy={ny}
                r={nodeR}
                fill={brand.ink[900]}
                stroke={c.color}
                strokeWidth={isHover ? 3 : 2.2}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.12 + i * 0.06, duration: 0.45, ease }}
                style={{ transformOrigin: `${nx}px ${ny}px` }}
              />
              <circle
                cx={nx}
                cy={ny}
                r={nodeR}
                fill={withAlpha(c.color, isHover ? 0.28 : 0.16)}
                stroke="none"
              />

              {/* Title inside badge */}
              <text
                x={nx}
                y={line2 ? ny - 10 : ny - 6}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#FFFFFF"
                style={{ fontSize: line2 ? 8.2 : 9, fontWeight: 700, letterSpacing: '0.01em' }}
              >
                {line1}
              </text>
              {line2 && (
                <text
                  x={nx}
                  y={ny - 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={withAlpha('#FFFFFF', 0.88)}
                  style={{ fontSize: 7.8, fontWeight: 600 }}
                >
                  {line2}
                </text>
              )}

              {/* Percentage score inside badge */}
              <text
                x={nx}
                y={line2 ? ny + 11 : ny + 9}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={c.color}
                style={{ fontSize: 15, fontWeight: 800, letterSpacing: '0.02em' }}
              >
                {c.percent}%
              </text>
            </g>
          );
        })}
      </ChartFrame>

      {hover && (() => {
        const c = data.find((d) => d.key === hover);
        if (!c) return null;
        const idx = data.findIndex((d) => d.key === hover);
        const ang = (idx * stepDeg * Math.PI) / 180;
        const r = percentToExtent(c.percent, maxR);
        const nx = cx + r * Math.cos(ang);
        const ny = cy + r * Math.sin(ang);
        return <HoverTip x={nx} y={ny - 38} c={c} vw={width} vh={height} />;
      })()}
    </div>
  );
}