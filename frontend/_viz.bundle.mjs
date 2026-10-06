// src/components/ResultVisualizations.jsx
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

// src/lib/categories.js
var CATEGORY_LABELS = Object.freeze({
  strategic: "Strategy",
  operational: "Operations",
  revenue: "Finances"
});
function categoryLabel(key, fallback = null) {
  if (key == null) return fallback;
  return CATEGORY_LABELS[String(key).toLowerCase().trim()] ?? fallback;
}

// src/theme/brand.js
var brand = {
  name: "BYRGOP",
  tagline: "Business Profit Architects",
  logo: "/logo.jpg",
  // Premium white text hierarchy established by IntroScreen (source of truth):
  // bright = H1/major titles/important numbers · soft = H2-H3/supporting titles
  // warm = paragraphs/descriptions/body copy
  premiumWhite: {
    bright: "#FFFFFF",
    soft: "#F8F6F0",
    warm: "#F5F0E8"
  },
  palette: {
    blue: { 300: "#6BB1E8", 400: "#3D97DB", 500: "#0A78CF", 600: "#0861AA", 700: "#064A84" },
    green: { 300: "#5FC58E", 400: "#2DA363", 500: "#0D8845", 600: "#0A7039", 700: "#08582D" },
    orange: { 300: "#F8A066", 400: "#F67F39", 500: "#F5630D", 600: "#D4540A", 700: "#A84308" },
    yellow: { 300: "#FDC15C", 400: "#FCB22E", 500: "#FCA700", 600: "#D88D00", 700: "#B07300" },
    red: { 300: "#F08B94", 400: "#EB5564", 500: "#E52032", 600: "#C31B2A", 700: "#9A1521" },
    purple: { 300: "#A97ACD", 400: "#8C56BB", 500: "#7038A5", 600: "#5C2E89", 700: "#48246D" }
  },
  ink: {
    950: "#06080E",
    900: "#0A0E16",
    850: "#0D1220",
    800: "#111728",
    700: "#1A2336"
  },
  accent: "#FCA700",
  accentHover: "#FCB22E",
  text: "#F6F7FA",
  textMuted: "rgba(246,247,250,0.58)",
  surface: "rgba(255,255,255,0.04)",
  surfaceStrong: "rgba(255,255,255,0.07)",
  border: "rgba(255,255,255,0.10)",
  danger: "#E52032",
  success: "#0D8845",
  // Page backgrounds — used across every screen's root gradient.
  bgBase: "#0a0a0f",
  bgSurface: "#14141e",
  // Official six-colour mark (ink order: Blue, Yellow, Red, Green, Orange, Purple)
  mark: ["#0A78CF", "#FCA700", "#E52032", "#0D8845", "#F5630D", "#7038A5"],
  // Bilingual brand lockup (right side of the header).
  // IMPORTANT: fill these ONLY with wording the client has explicitly approved.
  // Until then keep both empty — do NOT invent or transliterate.
  bilingual: {
    telugu: "",
    hindi: ""
  },
  // Scratchpad for approved copy when it arrives.
  bilingualLabels: {
    telugu: "Telugu",
    hindi: "Hindi"
  },
  fonts: {
    display: "'Cormorant Garamond', serif",
    body: "'Inter', sans-serif"
  },
  categories: {
    strategic: { name: categoryLabel("strategic"), color: "#0A78CF", soft: "rgba(10,120,207,0.16)" },
    operational: { name: categoryLabel("operational"), color: "#0D8845", soft: "rgba(13,136,69,0.16)" },
    revenue: { name: categoryLabel("revenue"), color: "#F5630D", soft: "rgba(245,99,13,0.16)" }
  },
  steps: [
    { key: "strategic", color: "#0A78CF" },
    { key: "operational", color: "#0D8845" },
    { key: "revenue", color: "#F5630D" }
  ]
};

// src/components/kyPercentScale.js
var PERCENT_MIN = 0;
var PERCENT_MAX = 100;
function toPercent(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return PERCENT_MIN;
  if (n < PERCENT_MIN) return PERCENT_MIN;
  if (n > PERCENT_MAX) return PERCENT_MAX;
  return n;
}
function percentToUnit(value) {
  return toPercent(value) / PERCENT_MAX;
}
function percentToExtent(value, maxExtent) {
  return percentToUnit(value) * maxExtent;
}

// src/components/byrgopChartColors.js
var BYRGOP_CHART_COLORS = Object.freeze([...brand.mark]);
var BYRGOP_CHART_COLOR_COUNT = BYRGOP_CHART_COLORS.length;
function pillarChartColor(index) {
  const i = Number(index);
  const n = BYRGOP_CHART_COLOR_COUNT;
  return BYRGOP_CHART_COLORS[(i % n + n) % n];
}

// src/components/ResultVisualizations.jsx
import { jsx, jsxs } from "react/jsx-runtime";
var ease = [0.22, 1, 0.36, 1];
var VW = 460;
var VH = 340;
var SOFT = brand.premiumWhite.soft;
var VIEWS = [
  { id: "radar", label: "Radar" },
  { id: "bubble", label: "Bubble" },
  { id: "bullet", label: "Bullet" },
  { id: "bar", label: "Bar" }
];
function toPillarData(categories) {
  return (categories || []).map((c, i) => ({
    key: c.key,
    name: c.name,
    percent: c.percent,
    color: pillarChartColor(i)
  }));
}
function withAlpha(hex, alpha) {
  const h = String(hex).replace("#", "");
  const n = parseInt(h, 16);
  const r = n >> 16 & 255;
  const g = n >> 8 & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}
function lines(name) {
  const w = String(name).split(" ");
  if (w.length <= 2) return [String(name)];
  const mid = Math.ceil(w.length / 2);
  return [w.slice(0, mid).join(" "), w.slice(mid).join(" ")];
}
function ChartFrame({ label, children }) {
  return /* @__PURE__ */ jsx(
    motion.div,
    {
      initial: { opacity: 0, y: 8 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.35, ease },
      className: "mx-auto w-full",
      children: /* @__PURE__ */ jsx("svg", { viewBox: `0 0 ${VW} ${VH}`, className: "font-display h-auto w-full", role: "img", "aria-label": label, children })
    }
  );
}
function HoverTip({ x, y, c }) {
  return /* @__PURE__ */ jsxs(
    motion.div,
    {
      initial: { opacity: 0, y: 4, scale: 0.96 },
      animate: { opacity: 1, y: 0, scale: 1 },
      exit: { opacity: 0, y: 4, scale: 0.96 },
      transition: { duration: 0.18 },
      className: "pointer-events-none absolute z-10 -translate-x-1/2 whitespace-nowrap rounded-xl border border-white/10 bg-ink-850/95 px-3.5 py-2 shadow-card backdrop-blur-md",
      style: { left: `${x / VW * 100}%`, top: `${y / VH * 100}%`, marginTop: "-2.6rem" },
      children: [
        /* @__PURE__ */ jsxs("p", { className: "font-display flex items-center gap-2 text-sm font-semibold", style: { color: SOFT }, children: [
          /* @__PURE__ */ jsx("span", { className: "h-2 w-2 shrink-0 rounded-full", style: { background: c.color } }),
          c.name
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "font-display text-right text-base font-bold tabular-nums", style: { color: c.color }, children: [
          c.percent,
          "%"
        ] })
      ]
    }
  );
}
function VisualizationSelector({ value, onChange }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: "mx-auto flex w-full flex-wrap items-center justify-center gap-1.5 rounded-2xl border border-white/10 bg-ink-850/85 p-2 shadow-card backdrop-blur-sm sm:gap-2 sm:p-2.5",
      role: "group",
      "aria-label": "Visualization type",
      "data-testid": "viz-selector",
      children: VIEWS.map((v) => {
        const active = value === v.id;
        return /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => onChange(v.id),
            "aria-pressed": active,
            "aria-label": `Show ${v.label} visualization`,
            "data-testid": `viz-${v.id}`,
            style: active ? {
              background: `linear-gradient(135deg, ${brand.accent}, ${brand.palette.orange[500]})`,
              color: brand.ink[900],
              boxShadow: `0 3px 12px ${withAlpha(brand.accent, 0.45)}`
            } : void 0,
            className: `font-display rounded-lg px-2.5 py-1.5 text-[11px] font-semibold tracking-wide transition-all duration-200 sm:px-3.5 sm:py-2 sm:text-xs ${active ? "" : "text-mist-muted hover:bg-white/5 hover:text-mist"}`,
            children: v.label
          },
          v.id
        );
      })
    }
  );
}
function ChartBox({ children }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: "mx-auto w-full max-w-[680px] rounded-2xl border border-white/10 bg-ink-850/70 p-5 shadow-card sm:p-7",
      "data-testid": "chart-box",
      children
    }
  );
}
function ResultVisualizationStage({ children }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: "relative z-10 mx-auto mt-6 flex min-h-[min(52vh,420px)] w-full items-center justify-center",
      "data-testid": "viz-stage",
      children
    }
  );
}
function VisualizationArea({ view, data, overall, radarSlot }) {
  return /* @__PURE__ */ jsx(AnimatePresence, { mode: "wait", initial: false, children: /* @__PURE__ */ jsxs(
    motion.div,
    {
      initial: { opacity: 0, y: 12 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -8 },
      transition: { duration: 0.28, ease },
      className: "w-full",
      "data-testid": "viz-area",
      children: [
        view === "radar" && /* @__PURE__ */ jsx(ChartBox, { children: radarSlot }),
        view === "bubble" && /* @__PURE__ */ jsx(ChartBox, { children: /* @__PURE__ */ jsx(BubblePlotView, { data }) }),
        view === "bullet" && /* @__PURE__ */ jsx(ChartBox, { children: /* @__PURE__ */ jsx(BulletChartView, { data }) }),
        view === "bar" && /* @__PURE__ */ jsx(ChartBox, { children: /* @__PURE__ */ jsx(BarChartView, { data }) })
      ]
    },
    view
  ) });
}
function BubblePlotView({ data }) {
  const [hover, setHover] = useState(null);
  const plotLeft = 70;
  const plotRight = 430;
  const plotTop = 24;
  const plotBottom = 246;
  const slotW = (plotRight - plotLeft) / data.length;
  const yFor = (p) => plotBottom - percentToExtent(p, plotBottom - plotTop);
  const rFor = (p) => percentToExtent(p, 31);
  return /* @__PURE__ */ jsxs("div", { className: "relative", children: [
    /* @__PURE__ */ jsxs(ChartFrame, { label: "Bubble plot where bubble size represents each pillar percentage", children: [
      [0, 25, 50, 75, 100].map((g) => /* @__PURE__ */ jsxs("g", { children: [
        /* @__PURE__ */ jsx("line", { x1: plotLeft, y1: yFor(g), x2: plotRight, y2: yFor(g), stroke: withAlpha("#FFFFFF", 0.1), strokeWidth: 1 }),
        /* @__PURE__ */ jsx("text", { x: plotLeft - 6, y: yFor(g), textAnchor: "end", dominantBaseline: "middle", fill: withAlpha("#FFFFFF", 0.4), style: { fontSize: 8 }, children: g })
      ] }, g)),
      data.map((c, i) => {
        const bx = plotLeft + slotW * (i + 0.5);
        const by = yFor(c.percent);
        const rr = rFor(c.percent);
        const isHover = hover === c.key;
        return /* @__PURE__ */ jsxs("g", { children: [
          /* @__PURE__ */ jsx(
            motion.circle,
            {
              cx: bx,
              cy: by,
              r: rr,
              fill: withAlpha(c.color, 0.5),
              stroke: c.color,
              strokeWidth: 2,
              initial: { scale: 0, opacity: 0 },
              animate: { scale: 1, opacity: 1 },
              transition: { delay: 0.1 + i * 0.06, duration: 0.4, ease },
              style: { transformOrigin: `${bx}px ${by}px` },
              className: "cursor-pointer",
              onMouseEnter: () => setHover(c.key),
              onMouseLeave: () => setHover(null)
            }
          ),
          lines(c.name).map((ln, li) => /* @__PURE__ */ jsx("text", { x: bx, y: plotBottom + 16 + li * 11, textAnchor: "middle", dominantBaseline: "middle", fill: withAlpha("#FFFFFF", 0.55), style: { fontSize: 8 }, children: ln }, li)),
          /* @__PURE__ */ jsxs(
            "text",
            {
              x: bx,
              y: plotBottom + 16 + lines(c.name).length * 11,
              textAnchor: "middle",
              dominantBaseline: "middle",
              fill: c.color,
              style: { fontSize: 9.5, fontWeight: 700, letterSpacing: "0.06em" },
              children: [
                c.percent,
                "%"
              ]
            }
          )
        ] }, c.key);
      })
    ] }),
    hover && (() => {
      const c = data.find((d) => d.key === hover);
      const bx = plotLeft + slotW * (data.findIndex((d) => d.key === hover) + 0.5);
      return /* @__PURE__ */ jsx(HoverTip, { x: bx, y: yFor(c.percent), c });
    })()
  ] });
}
function BulletChartView({ data }) {
  const plotLeft = 130;
  const plotRight = 430;
  const rowH = 44;
  const row0Y = 60;
  const trackW = plotRight - plotLeft;
  const lastY = row0Y + rowH * data.length - 8;
  const wFor = (p) => percentToExtent(p, trackW);
  return /* @__PURE__ */ jsxs(ChartFrame, { label: "Bullet chart of the six pillar percentages on a zero to one hundred scale", children: [
    [0, 25, 50, 75, 100].map((g) => {
      const x = plotLeft + wFor(g);
      return /* @__PURE__ */ jsxs("g", { children: [
        /* @__PURE__ */ jsx("line", { x1: x, y1: row0Y - 10, x2: x, y2: lastY, stroke: withAlpha("#FFFFFF", 0.07), strokeWidth: 1 }),
        /* @__PURE__ */ jsx("text", { x, y: row0Y - 18, textAnchor: "middle", dominantBaseline: "middle", fill: withAlpha("#FFFFFF", 0.4), style: { fontSize: 8 }, children: g })
      ] }, g);
    }),
    data.map((c, i) => {
      const cy = row0Y + i * rowH;
      const w = wFor(c.percent);
      return /* @__PURE__ */ jsxs("g", { children: [
        /* @__PURE__ */ jsx("text", { x: plotLeft - 10, y: cy, textAnchor: "end", dominantBaseline: "middle", fill: SOFT, style: { fontSize: 9.5 }, children: c.name }),
        /* @__PURE__ */ jsx("rect", { x: plotLeft, y: cy - 5, width: trackW, height: 10, rx: 5, fill: withAlpha("#FFFFFF", 0.1) }),
        w > 0 && /* @__PURE__ */ jsx(
          motion.rect,
          {
            x: plotLeft,
            y: cy - 5,
            width: w,
            height: 10,
            rx: 5,
            fill: c.color,
            initial: { scaleX: 0, opacity: 0 },
            animate: { scaleX: 1, opacity: 1 },
            transition: { duration: 0.55, delay: 0.08 + i * 0.06, ease },
            style: { transformOrigin: `${plotLeft}px ${cy}px` }
          }
        ),
        /* @__PURE__ */ jsxs("text", { x: plotLeft + w + 7, y: cy, textAnchor: "start", dominantBaseline: "middle", fill: c.color, style: { fontSize: 10, fontWeight: 700 }, children: [
          c.percent,
          "%"
        ] })
      ] }, c.key);
    })
  ] });
}
function BarChartView({ data }) {
  const plotLeft = 34;
  const plotRight = 430;
  const plotTop = 22;
  const plotBottom = 244;
  const slotW = (plotRight - plotLeft) / data.length;
  const yFor = (p) => plotBottom - percentToExtent(p, plotBottom - plotTop);
  return /* @__PURE__ */ jsxs(ChartFrame, { label: "Bar chart of the six pillar percentages", children: [
    [0, 25, 50, 75, 100].map((g) => /* @__PURE__ */ jsxs("g", { children: [
      /* @__PURE__ */ jsx("line", { x1: plotLeft, y1: yFor(g), x2: plotRight, y2: yFor(g), stroke: withAlpha("#FFFFFF", 0.1), strokeWidth: 1 }),
      /* @__PURE__ */ jsx("text", { x: plotLeft - 6, y: yFor(g), textAnchor: "end", dominantBaseline: "middle", fill: withAlpha("#FFFFFF", 0.4), style: { fontSize: 8 }, children: g })
    ] }, g)),
    /* @__PURE__ */ jsx("line", { x1: plotLeft, y1: plotBottom, x2: plotRight, y2: plotBottom, stroke: withAlpha("#FFFFFF", 0.25), strokeWidth: 1.2 }),
    data.map((c, i) => {
      const bx = plotLeft + slotW * (i + 0.5);
      const bw = 40;
      const h = plotBottom - yFor(c.percent);
      return /* @__PURE__ */ jsxs("g", { children: [
        /* @__PURE__ */ jsx(
          motion.rect,
          {
            x: bx - bw / 2,
            y: yFor(c.percent),
            width: bw,
            height: h,
            rx: 4,
            fill: c.color,
            opacity: 0.92,
            initial: { scaleY: 0, opacity: 0 },
            animate: { scaleY: 1, opacity: 0.92 },
            transition: { duration: 0.5, delay: 0.08 + i * 0.06, ease },
            style: { transformOrigin: `${bx}px ${plotBottom}px` }
          }
        ),
        /* @__PURE__ */ jsxs(
          motion.text,
          {
            x: bx,
            y: yFor(c.percent) - 7,
            textAnchor: "middle",
            dominantBaseline: "middle",
            fill: c.color,
            style: { fontSize: 10, fontWeight: 700 },
            initial: { opacity: 0 },
            animate: { opacity: 1 },
            transition: { delay: 0.2 + i * 0.06, duration: 0.3 },
            children: [
              c.percent,
              "%"
            ]
          }
        ),
        lines(c.name).map((ln, li) => /* @__PURE__ */ jsx("text", { x: bx, y: plotBottom + 16 + li * 11, textAnchor: "middle", dominantBaseline: "middle", fill: withAlpha("#FFFFFF", 0.55), style: { fontSize: 8 }, children: ln }, li))
      ] }, c.key);
    })
  ] });
}
export {
  BarChartView,
  BubblePlotView,
  BulletChartView,
  ResultVisualizationStage,
  VIEWS,
  VisualizationArea,
  VisualizationSelector,
  toPillarData
};
