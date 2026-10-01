import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { brand } from '../theme/brand.js';
import { toPercent, percentToUnit, percentToExtent } from './kyPercentScale.js';

/* ─────────────────────────────────────────────────────────────
   KNOW-YOURSELF RESULT VISUALIZATIONS
   One assessment result dataset → multiple visualization formats.
   All views consume ONLY the normalized `data` array produced by
   toPillarData(result.categories) — i.e. the exact same six-pillar
   percentages returned by the backend (result.categories[].percent).
   No scores are invented; no second dataset is created.
   ───────────────────────────────────────────────────────────── */

const ease = [0.22, 1, 0.36, 1];
const VW = 460;
const VH = 340;

const BRIGHT = brand.premiumWhite.bright;
const SOFT = brand.premiumWhite.soft;
const WARM = brand.premiumWhite.warm;
const MUTED = brand.textMuted;

export const VIEWS = [
  { id: 'radar', label: 'Radar' },
  { id: 'bullseye', label: 'Bullseye' },
  { id: 'polar', label: 'Polar' },
  { id: 'nested', label: 'Nested Donut' },
  // `id` kept as 'diverging' (it is the view's persisted key); the label now
  // states the truth — the view is no longer centred on 50%, it is a plain
  // absolute 0–100 bar on a shared zero baseline.
  { id: 'diverging', label: 'Bar 0–100' },
  { id: 'heatmap', label: 'Heatmap' },
  { id: 'bubble', label: 'Bubble' },
  { id: 'bar', label: 'Bar' },
  { id: 'scatter', label: 'Scatter' },
];

/* Single source of truth: normalize backend categories for every chart.
   `percent` is the backend's canonical 0–100 integer, passed through
   untouched so labels and geometry always read the very same number. */
export function toPillarData(categories) {
  return (categories || []).map((c) => ({
    key: c.key,
    name: c.name,
    percent: c.percent,
    color: c.color || brand.accent,
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

function polar(angleDeg, radius, cx, cy) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return [cx + radius * Math.cos(a), cy + radius * Math.sin(a)];
}

function lines(name) {
  const w = String(name).split(' ');
  if (w.length <= 2) return [String(name)];
  const mid = Math.ceil(w.length / 2);
  return [w.slice(0, mid).join(' '), w.slice(mid).join(' ')];
}

function ChartFrame({ label, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease }}
      className="mx-auto w-full"
    >
      <svg viewBox={`0 0 ${VW} ${VH}`} className="font-display h-auto w-full" role="img" aria-label={label}>
        {children}
      </svg>
    </motion.div>
  );
}

/* Hover tooltip — pillar name + percent only (same style as the radar tooltip). */
function HoverTip({ x, y, c }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 4, scale: 0.96 }}
      transition={{ duration: 0.18 }}
      className="pointer-events-none absolute z-10 -translate-x-1/2 whitespace-nowrap rounded-xl border border-white/10 bg-ink-850/95 px-3.5 py-2 shadow-card backdrop-blur-md"
      style={{ left: `${(x / VW) * 100}%`, top: `${(y / VH) * 100}%`, marginTop: '-2.6rem' }}
    >
      <p className="font-display flex items-center gap-2 text-sm font-semibold" style={{ color: SOFT }}>
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: c.color }} />
        {c.name}
      </p>
      <p className="font-display text-right text-base font-bold tabular-nums" style={{ color: c.color }}>
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
      className="mx-auto flex w-full flex-wrap items-center justify-center gap-1.5 rounded-2xl border border-white/10 bg-ink-850/85 p-2 shadow-card backdrop-blur-sm sm:gap-2 sm:p-2.5"
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
            className={`font-display rounded-lg px-2.5 py-1.5 text-[11px] font-semibold tracking-wide transition-all duration-200 sm:px-3.5 sm:py-2 sm:text-xs ${
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
   canvas-style visualization (max ~680px, card surface — reference uses
   the same max-width box for spider/polar/donut/bubble/bar/scatter). */
function ChartBox({ children }) {
  return (
    <div
      className="mx-auto w-full max-w-[680px] rounded-2xl border border-white/10 bg-ink-850/70 p-5 shadow-card sm:p-7"
      data-testid="chart-box"
    >
      {children}
    </div>
  );
}

/* ── Dedicated visualization stage ─────────────────────────
   TwelveLayouts-style view panel: a centered area that the active
   visualization dominates. Content size defines height, generous
   vertical rhythm, never a side column or a small card. */
export function ResultVisualizationStage({ children }) {
  return (
    <div
      className="relative z-10 mx-auto mt-6 flex min-h-[min(52vh,420px)] w-full items-center justify-center"
      data-testid="viz-stage"
    >
      {children}
    </div>
  );
}

/* ── Active panel ──────────────────────────────────────────
   Reference-style switching: one view mounted at a time, fading/sliding
   in on change (reference `fadeIn` 0.4s translateY(10px)). */
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
        {view === 'bullseye' && <BullseyeGaugeView data={data} overall={overall} />}
        {view === 'polar' && (
          <ChartBox>
            <PolarWheelView data={data} />
          </ChartBox>
        )}
        {view === 'nested' && (
          <ChartBox>
            <NestedDonutView data={data} overall={overall} />
          </ChartBox>
        )}
        {view === 'diverging' && (
          <div className="mx-auto w-full max-w-[800px]">
            <DivergingBarView data={data} />
          </div>
        )}
        {view === 'heatmap' && <HeatmapView data={data} />}
        {view === 'bubble' && (
          <ChartBox>
            <BubblePlotView data={data} />
          </ChartBox>
        )}
        {view === 'bar' && (
          <ChartBox>
            <BarChartView data={data} />
          </ChartBox>
        )}
        {view === 'scatter' && (
          <ChartBox>
            <ScatterPlotView data={data} />
          </ChartBox>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

/* ── 1. Existing radar is rendered directly from KnowYourselfResult ────── */

/* ── 2. Concentric bullseye (reference: 580×580 target, nodes orbit
        the core ring, hover-grow on the nodes) ──────────────
        Node distance from the centre is strictly proportional to the
        percentage on a ZERO baseline: 0% sits on the centre, 100% sits
        exactly on the outer ring. No head offset — otherwise a 20%
        pillar would drift out past 45% of the radius. */
export function BullseyeGaugeView({ data, overall }) {
  const n = data.length;
  const maxOffset = 40; // % of the box half-width, matching the r=240 ring
  const lin = (p) => percentToExtent(p, maxOffset);
  return (
    <div
      className="relative mx-auto aspect-square w-full max-w-[min(86vw,580px)]"
      data-testid="bullseye"
    >
      {/* concentric target rings */}
      <svg viewBox="0 0 600 600" className="pointer-events-none absolute inset-0 h-full w-full" role="img" aria-hidden="true">
        {[240, 165, 95].map((r) => (
          <circle key={r} cx={300} cy={300} r={r} fill="none" stroke={withAlpha('#FFFFFF', 0.14)} strokeWidth={2} strokeDasharray="6 6" />
        ))}
      </svg>

      {/* center core — overall score */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15, type: 'spring', stiffness: 210, damping: 18 }}
        className="absolute left-1/2 top-1/2 z-10 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border-2 text-center px-1 sm:h-28 sm:w-28"
        style={{
          borderColor: brand.accent,
          background: 'linear-gradient(145deg, #1b1400, #0a0a0f)',
          boxShadow: `0 0 30px ${withAlpha(brand.accent, 0.35)}`,
        }}
      >
        <span className="font-display text-[9px] font-extrabold tracking-[0.2em] sm:text-[10px]" style={{ color: withAlpha('#FFFFFF', 0.66) }}>
          OVERALL
        </span>
        <span className="font-display text-2xl font-extrabold tabular-nums sm:text-3xl" style={{ color: BRIGHT }}>
          {overall ?? 0}
          <span className="text-base sm:text-lg">%</span>
        </span>
      </motion.div>

      {/* pillar nodes — positioned by angle + percentage radius */}
      {data.map((c, i) => {
        const ang = ((i * (360 / n) - 90) * Math.PI) / 180;
        const off = lin(c.percent);
        return (
          <div
            key={c.key}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${50 + off * Math.cos(ang)}%`, top: `${50 + off * Math.sin(ang)}%` }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.08, type: 'spring', stiffness: 200, damping: 18 }}
              whileHover={{ scale: 1.12 }}
              className="flex h-16 w-16 flex-col items-center justify-center gap-0.5 rounded-full border-2 text-center px-1 sm:h-24 sm:w-24"
              style={{ background: withAlpha(c.color, 0.16), borderColor: c.color, boxShadow: '0 8px 20px rgba(0,0,0,0.45)' }}
            >
              <span className="font-display text-[9px] font-semibold leading-tight sm:text-[10px]" style={{ color: SOFT }}>
                {c.name}
              </span>
              <span className="font-display text-base font-extrabold tabular-nums sm:text-lg" style={{ color: c.color }}>
                {c.percent}%
              </span>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}

/* ── 3. Polar wheel ──────────────────────────────────────── */
export function PolarWheelView({ data }) {
  const n = data.length;
  const cx = 230;
  const cy = VH / 2;
  const R = 105;
  const step = 360 / n;
  return (
    <ChartFrame label="Polar wheel showing each pillar percentage as a spoke length">
      {[25, 50, 75, 100].map((ring) => (
        <circle key={ring} cx={cx} cy={cy} r={percentToExtent(ring, R)} fill="none" stroke={withAlpha('#FFFFFF', 0.12)} strokeWidth={1.1} />
      ))}
      {data.map((c, i) => {
        const a = i * step - 90;
        const [ex, ey] = polar(a, R, cx, cy);
        const [vx, vy] = polar(a, percentToExtent(c.percent, R), cx, cy);
        const rad = ((i * step - 90) * Math.PI) / 180;
        const cosA = Math.cos(rad);
        const lx = cx + (R + 22) * Math.cos(rad);
        const ly = cy + (R + 22) * Math.sin(rad);
        const anchor = Math.abs(cosA) < 0.35 ? 'middle' : cosA > 0 ? 'start' : 'end';
        const lbl = lines(c.name);
        const multi = lbl.length > 1;
        return (
          <g key={c.key}>
            <line x1={cx} y1={cy} x2={ex} y2={ey} stroke={withAlpha('#FFFFFF', 0.16)} strokeWidth={1} />
            <motion.line
              x1={cx}
              y1={cy}
              x2={vx}
              y2={vy}
              stroke={c.color}
              strokeWidth={2.5}
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.15 + i * 0.07, ease }}
            />
            <motion.circle
              cx={vx}
              cy={vy}
              r={5}
              fill={c.color}
              stroke={brand.ink[900]}
              strokeWidth={1.4}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 + i * 0.07, duration: 0.3 }}
              style={{ transformOrigin: `${vx}px ${vy}px` }}
            />
            {lbl.map((ln, li) => (
              <text key={li} x={lx} y={ly - (multi ? 8 : 2) + li * 11} textAnchor={anchor} dominantBaseline="middle" fill={withAlpha('#FFFFFF', 0.62)} style={{ fontSize: 9.5 }}>
                {ln}
              </text>
            ))}
            <text x={lx} y={ly + (multi ? 17 : 14)} textAnchor={anchor} dominantBaseline="middle" fill={c.color} style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.06em' }}>
              {c.percent}%
            </text>
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r={5} fill={brand.accent} />
    </ChartFrame>
  );
}

/* ── 4. Nested donut ─────────────────────────────────────────
   One concentric ring per pillar, each ring an INDEPENDENT 0–100 gauge:
   the filled arc spans percentToUnit(percent) of that ring's own full
   circumference, so 20% draws exactly a fifth of its ring, 50% half, 100%
   closes it. Rings are never normalised against the sum of the pillars —
   a pillar is only ever measured against the 0–100 scale. */
export function NestedDonutView({ data, overall }) {
  const cx = 170;
  const cy = VH / 2;
  const rOuter = 150;
  const rInner = 40;
  const tInner = 6;
  // Radial band left for the pillar rings, between the outer edge and the
  // overall ring. Dividing it by the pillar count keeps every ring the same
  // thickness whatever the category count.
  const gap = 2;
  const band = 15;
  const pitch = (rOuter - (rInner + tInner / 2 + gap)) / Math.max(data.length, 1);
  return (
    <div className="mx-auto flex w-full flex-col items-center">
      <ChartFrame label="Nested donut showing each pillar percentage on its own zero to one hundred percent ring">
        {data.map((c, i) => {
          const ringR = rOuter - pitch * (i + 0.5);
          const pct = toPercent(c.percent);
          return (
            <g key={c.key}>
              {/* full-circumference 0–100 track for this pillar */}
              <circle cx={cx} cy={cy} r={ringR} fill="none" stroke={withAlpha(c.color, 0.18)} strokeWidth={band} />
              {/* fill = percent/100 of that same circumference, from 12 o'clock */}
              <motion.circle
                cx={cx}
                cy={cy}
                r={ringR}
                fill="none"
                stroke={c.color}
                strokeWidth={band}
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray={1}
                initial={{ strokeDashoffset: 1 }}
                animate={{ strokeDashoffset: 1 - percentToUnit(pct) }}
                transition={{ duration: 0.8, delay: 0.15 + i * 0.07, ease }}
                transform={`rotate(-90 ${cx} ${cy})`}
              />
            </g>
          );
        })}
        <circle cx={cx} cy={cy} r={rInner} fill="none" stroke={withAlpha('#FFFFFF', 0.14)} strokeWidth={tInner} />
        <motion.circle
          cx={cx}
          cy={cy}
          r={rInner}
          fill="none"
          stroke={brand.accent}
          strokeWidth={tInner}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          initial={{ strokeDashoffset: 1 }}
          animate={{ strokeDashoffset: 1 - percentToUnit(overall) }}
          transition={{ duration: 1, delay: 0.3, ease }}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
        <text x={cx} y={cy - 2} textAnchor="middle" dominantBaseline="middle" fill={BRIGHT} style={{ fontSize: 22, fontWeight: 700 }}>
          {overall != null ? overall : ''}
          {overall != null && <tspan style={{ fontSize: 13 }}>%</tspan>}
        </text>
        <text x={cx} y={cy + 18} textAnchor="middle" dominantBaseline="middle" fill={MUTED} style={{ fontSize: 8, letterSpacing: '0.18em' }}>
          OVERALL
        </text>
      </ChartFrame>
      <div className="mt-4 grid w-full grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2">
        {data.map((c) => (
          <div key={c.key} className="font-display flex items-center gap-2 text-xs" style={{ color: SOFT }}>
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: c.color }} />
            <span className="truncate">{c.name}</span>
            <span className="ml-auto font-bold tabular-nums" style={{ color: c.color }}>
              {c.percent}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── 5. Absolute 0–100 bar (replaces the old 50%-centred diverging bar) ──
   Every bar starts from the SAME zero baseline at the left and its length is
   exactly percent/100 of the plot width, so this chart uses the identical
   fixed 0–100 scale as the radar, polar, nested donut, bullseye, bar,
   scatter and bubble views.

   The 50% line is a plain reference gridline, exactly like the 0/25/50/75/100
   gridlines in the other charts — it no longer moves the bar origin, so it
   cannot change the magnitude a bar represents. */
export function DivergingBarView({ data }) {
  const plotLeft = 124;
  const plotRight = 430;
  const plotTop = 26;
  const plotBottom = 42 + 44 * data.length - 6;
  const plotW = plotRight - plotLeft;
  const xFor = (p) => plotLeft + percentToExtent(p, plotW);
  return (
    <ChartFrame label="Bars showing each pillar percentage on a zero to one hundred percent scale">
      {[0, 25, 50, 75, 100].map((g) => (
        <g key={g}>
          <line
            x1={xFor(g)}
            y1={plotTop - 8}
            x2={xFor(g)}
            y2={plotBottom}
            stroke={withAlpha('#FFFFFF', g === 50 ? 0.22 : 0.1)}
            strokeWidth={g === 50 ? 1.2 : 1}
            strokeDasharray={g === 50 ? '4 3' : undefined}
          />
          <text
            x={xFor(g)}
            y={plotTop - 12}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={withAlpha('#FFFFFF', 0.45)}
            style={{ fontSize: 8 }}
          >
            {g}
          </text>
        </g>
      ))}
      <line x1={plotLeft} y1={plotTop - 8} x2={plotLeft} y2={plotBottom} stroke={withAlpha('#FFFFFF', 0.3)} strokeWidth={1.4} />
      {data.map((c, i) => {
        const cy = 42 + i * 44;
        const pct = toPercent(c.percent);
        const len = percentToExtent(pct, plotW);
        return (
          <g key={c.key}>
            <line x1={plotLeft} y1={cy} x2={plotRight} y2={cy} stroke={withAlpha('#FFFFFF', 0.06)} strokeWidth={1} />
            {len > 0 && (
              <motion.rect
                x={plotLeft}
                y={cy - 6}
                width={len}
                height={12}
                rx={6}
                fill={c.color}
                opacity={0.9}
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 0.9 }}
                transition={{ duration: 0.55, delay: 0.08 + i * 0.06, ease }}
                style={{ transformOrigin: `${plotLeft}px ${cy}px` }}
              />
            )}
            <text x={plotLeft - 8} y={cy} textAnchor="end" dominantBaseline="middle" fill={SOFT} style={{ fontSize: 9.5 }}>
              {c.name}
            </text>
            <text
              x={Math.min(xFor(pct) + 5, plotRight - 2)}
              y={cy}
              textAnchor="start"
              dominantBaseline="middle"
              fill={c.color}
              style={{ fontSize: 9.5, fontWeight: 700 }}
            >
              {c.percent}%
            </text>
          </g>
        );
      })}
    </ChartFrame>
  );
}

/* ── 6. Heatmap (reference-style tile grid: 3-col cells, big %) ── */
export function HeatmapView({ data }) {
  return (
    <div
      className="mx-auto grid w-full max-w-[780px] grid-cols-1 gap-4 sm:grid-cols-3"
      data-testid="heatmap-grid"
    >
      {data.map((c, i) => (
        <motion.div
          key={c.key}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.08 * i, duration: 0.3, ease }}
          whileHover={{ scale: 1.04 }}
          className="flex flex-col items-center justify-center gap-2 rounded-2xl border px-4 py-7 sm:py-9"
          style={{ borderColor: withAlpha(c.color, 0.55), background: withAlpha(c.color, 0.12) }}
        >
          <p className="font-display truncate text-sm font-bold sm:text-base" style={{ color: c.color }}>
            {c.name}
          </p>
          <p className="font-display text-4xl font-extrabold tabular-nums sm:text-5xl" style={{ color: BRIGHT }}>
            {c.percent}
            <span className="text-2xl">%</span>
          </p>
        </motion.div>
      ))}
    </div>
  );
}

/* ── 7. Bubble plot ──────────────────────────────────────── */
export function BubblePlotView({ data }) {
  const [hover, setHover] = useState(null);
  const plotLeft = 70;
  const plotRight = 430;
  const plotTop = 24;
  const plotBottom = 246;
  const slotW = (plotRight - plotLeft) / data.length;
  const yFor = (p) => plotBottom - percentToExtent(p, plotBottom - plotTop);
  // Bubble radius is proportional with a ZERO baseline: 0% has no bubble,
  // 100% keeps the previous 31-unit maximum. No floor radius, otherwise a
  // 0% pillar would draw a large dot and 20% would read as ~43% of the max.
  const rFor = (p) => percentToExtent(p, 31);
  return (
    <div className="relative">
      <ChartFrame label="Bubble plot where bubble size represents each pillar percentage">
        {[0, 25, 50, 75, 100].map((g) => (
          <g key={g}>
            <line x1={plotLeft} y1={yFor(g)} x2={plotRight} y2={yFor(g)} stroke={withAlpha('#FFFFFF', 0.1)} strokeWidth={1} />
            <text x={plotLeft - 6} y={yFor(g)} textAnchor="end" dominantBaseline="middle" fill={withAlpha('#FFFFFF', 0.4)} style={{ fontSize: 8 }}>
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
                fill={withAlpha(c.color, 0.5)}
                stroke={c.color}
                strokeWidth={2}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 + i * 0.06, duration: 0.4, ease }}
                style={{ transformOrigin: `${bx}px ${by}px` }}
                className="cursor-pointer"
                onMouseEnter={() => setHover(c.key)}
                onMouseLeave={() => setHover(null)}
              />
              {lines(c.name).map((ln, li) => (
                <text key={li} x={bx} y={plotBottom + 16 + li * 11} textAnchor="middle" dominantBaseline="middle" fill={withAlpha('#FFFFFF', 0.55)} style={{ fontSize: 8 }}>
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
        return <HoverTip x={bx} y={yFor(c.percent)} c={c} />;
      })()}
    </div>
  );
}

/* ── 8. Bar chart ────────────────────────────────────────── */
export function BarChartView({ data }) {
  const plotLeft = 34;
  const plotRight = 430;
  const plotTop = 22;
  const plotBottom = 244;
  const slotW = (plotRight - plotLeft) / data.length;
  const yFor = (p) => plotBottom - percentToExtent(p, plotBottom - plotTop);
  return (
    <ChartFrame label="Bar chart of the six pillar percentages">
      {[0, 25, 50, 75, 100].map((g) => (
        <g key={g}>
          <line x1={plotLeft} y1={yFor(g)} x2={plotRight} y2={yFor(g)} stroke={withAlpha('#FFFFFF', 0.1)} strokeWidth={1} />
          <text x={plotLeft - 6} y={yFor(g)} textAnchor="end" dominantBaseline="middle" fill={withAlpha('#FFFFFF', 0.4)} style={{ fontSize: 8 }}>
            {g}
          </text>
        </g>
      ))}
      <line x1={plotLeft} y1={plotBottom} x2={plotRight} y2={plotBottom} stroke={withAlpha('#FFFFFF', 0.25)} strokeWidth={1.2} />
      {data.map((c, i) => {
        const bx = plotLeft + slotW * (i + 0.5);
        const bw = 40;
        const h = plotBottom - yFor(c.percent);
        return (
          <g key={c.key}>
            <motion.rect
              x={bx - bw / 2}
              y={yFor(c.percent)}
              width={bw}
              height={h}
              rx={4}
              fill={c.color}
              opacity={0.92}
              initial={{ scaleY: 0, opacity: 0 }}
              animate={{ scaleY: 1, opacity: 0.92 }}
              transition={{ duration: 0.5, delay: 0.08 + i * 0.06, ease }}
              style={{ transformOrigin: `${bx}px ${plotBottom}px` }}
            />
            <motion.text
              x={bx}
              y={yFor(c.percent) - 7}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={c.color}
              style={{ fontSize: 10, fontWeight: 700 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 + i * 0.06, duration: 0.3 }}
            >
              {c.percent}%
            </motion.text>
            {lines(c.name).map((ln, li) => (
              <text key={li} x={bx} y={plotBottom + 16 + li * 11} textAnchor="middle" dominantBaseline="middle" fill={withAlpha('#FFFFFF', 0.55)} style={{ fontSize: 8 }}>
                {ln}
              </text>
            ))}
          </g>
        );
      })}
    </ChartFrame>
  );
}

/* ── 9. Scatter plot (categorical pillar positions) ──────── */
export function ScatterPlotView({ data }) {
  const [hover, setHover] = useState(null);
  const plotLeft = 70;
  const plotRight = 430;
  const plotTop = 24;
  const plotBottom = 246;
  const slotW = (plotRight - plotLeft) / data.length;
  const yFor = (p) => plotBottom - percentToExtent(p, plotBottom - plotTop);
  return (
    <div className="relative">
      <ChartFrame label="Scatter plot of pillar order against each pillar percentage">
        {[0, 25, 50, 75, 100].map((g) => (
          <g key={g}>
            <line x1={plotLeft} y1={yFor(g)} x2={plotRight} y2={yFor(g)} stroke={withAlpha('#FFFFFF', 0.1)} strokeWidth={1} />
            <text x={plotLeft - 6} y={yFor(g)} textAnchor="end" dominantBaseline="middle" fill={withAlpha('#FFFFFF', 0.4)} style={{ fontSize: 8 }}>
              {g}
            </text>
          </g>
        ))}
        {data.map((c, i) => {
          const bx = plotLeft + slotW * (i + 0.5);
          const by = yFor(c.percent);
          return (
            <g key={c.key}>
              <line x1={bx} y1={plotTop} x2={bx} y2={plotBottom} stroke={withAlpha('#FFFFFF', 0.06)} strokeWidth={1} />
              <motion.circle
                cx={bx}
                cy={by}
                r={hover === c.key ? 8 : 6}
                fill={c.color}
                stroke={brand.ink[900]}
                strokeWidth={1.6}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 + i * 0.06, duration: 0.35, ease }}
                style={{ transformOrigin: `${bx}px ${by}px` }}
                className="cursor-pointer"
                onMouseEnter={() => setHover(c.key)}
                onMouseLeave={() => setHover(null)}
              />
              <text x={bx} y={plotBottom + 12} textAnchor="middle" dominantBaseline="middle" fill={withAlpha('#FFFFFF', 0.4)} style={{ fontSize: 8.5 }}>
                {i + 1}
              </text>
              {lines(c.name).map((ln, li) => (
                <text key={li} x={bx} y={plotBottom + 26 + li * 11} textAnchor="middle" dominantBaseline="middle" fill={withAlpha('#FFFFFF', 0.55)} style={{ fontSize: 8 }}>
                  {ln}
                </text>
              ))}
            </g>
          );
        })}
      </ChartFrame>
      {hover && (() => {
        const idx = data.findIndex((d) => d.key === hover);
        const c = data[idx];
        return <HoverTip x={plotLeft + slotW * (idx + 0.5)} y={yFor(c.percent)} c={c} />;
      })()}
    </div>
  );
}