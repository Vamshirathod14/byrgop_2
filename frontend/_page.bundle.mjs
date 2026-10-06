// <define:import.meta.env>
var define_import_meta_env_default = {};

// src/screens/KnowYourselfResult.jsx
import { useEffect, useMemo, useState as useState2 } from "react";
import { AnimatePresence as AnimatePresence2, motion as motion3 } from "framer-motion";

// src/components/PrimaryButton.jsx
import { motion } from "framer-motion";
import { jsx, jsxs } from "react/jsx-runtime";
function PrimaryButton({
  children,
  onClick,
  variant = "primary",
  className = "",
  disabled = false,
  loading = false,
  ...rest
}) {
  const base = "inline-flex items-center justify-center gap-2 rounded-full px-9 py-4 text-sm font-semibold uppercase tracking-[0.16em] whitespace-nowrap transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none";
  const styles = variant === "primary" ? "bg-brand-accent text-ink-950 hover:bg-brand-accentHover hover:shadow-glow" : variant === "dark" ? "bg-ink-800 text-mist border border-white/10 hover:border-white/25 hover:bg-ink-700" : "border border-white/15 text-mist hover:border-white/35 hover:bg-white/5";
  return /* @__PURE__ */ jsxs(
    motion.button,
    {
      whileHover: { scale: disabled || loading ? 1 : 1.03 },
      whileTap: { scale: disabled || loading ? 1 : 0.98 },
      className: `${base} ${styles} ${className}`,
      onClick,
      disabled: disabled || loading,
      ...rest,
      children: [
        loading && /* @__PURE__ */ jsx(
          "span",
          {
            "aria-hidden": "true",
            className: "inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          }
        ),
        children
      ]
    }
  );
}

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

// src/components/ByrgopLoader.jsx
import { jsx as jsx2 } from "react/jsx-runtime";
var WIDTH = 52;
var HEIGHT = 20;
var SIZE = 6;
var SLOT_X = [3, 11, 19, 27, 35, 43];
var SLOT_Y = [18, 17.5, 16.1, 13.7, 10.3, 6];
var FROM = [
  [-20, 14],
  [-18, 13],
  [-16, 11],
  [-13, 9],
  [-10, 6],
  [-7, 3]
];
var TO = [
  [18, -14],
  [20, -12],
  [22, -9],
  [24, -6],
  [26, -3],
  [28, 0]
];
var STAGGER = 0.18;
function ByrgopLoader({ className = "" }) {
  return /* @__PURE__ */ jsx2(
    "span",
    {
      className: `byrgop-loader inline-block shrink-0 ${className}`,
      style: { width: WIDTH, height: HEIGHT },
      role: "img",
      "aria-label": "BYRGOP balls assembling",
      "aria-hidden": "true",
      children: brand.mark.map((color, i) => /* @__PURE__ */ jsx2(
        "span",
        {
          className: "byrgop-ball",
          style: {
            width: SIZE,
            height: SIZE,
            left: SLOT_X[i],
            top: SLOT_Y[i] - SIZE / 2,
            background: color,
            animationDelay: `${-i * STAGGER}s`,
            "--dx": `${FROM[i][0]}px`,
            "--dy": `${FROM[i][1]}px`,
            "--ex": `${TO[i][0]}px`,
            "--ey": `${TO[i][1]}px`
          }
        },
        color
      ))
    }
  );
}

// src/components/ResultVisualizations.jsx
import { useState } from "react";
import { AnimatePresence, motion as motion2 } from "framer-motion";

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
import { jsx as jsx3, jsxs as jsxs2 } from "react/jsx-runtime";
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
  return /* @__PURE__ */ jsx3(
    motion2.div,
    {
      initial: { opacity: 0, y: 8 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.35, ease },
      className: "mx-auto w-full",
      children: /* @__PURE__ */ jsx3("svg", { viewBox: `0 0 ${VW} ${VH}`, className: "font-display h-auto w-full", role: "img", "aria-label": label, children })
    }
  );
}
function HoverTip({ x, y, c }) {
  return /* @__PURE__ */ jsxs2(
    motion2.div,
    {
      initial: { opacity: 0, y: 4, scale: 0.96 },
      animate: { opacity: 1, y: 0, scale: 1 },
      exit: { opacity: 0, y: 4, scale: 0.96 },
      transition: { duration: 0.18 },
      className: "pointer-events-none absolute z-10 -translate-x-1/2 whitespace-nowrap rounded-xl border border-white/10 bg-ink-850/95 px-3.5 py-2 shadow-card backdrop-blur-md",
      style: { left: `${x / VW * 100}%`, top: `${y / VH * 100}%`, marginTop: "-2.6rem" },
      children: [
        /* @__PURE__ */ jsxs2("p", { className: "font-display flex items-center gap-2 text-sm font-semibold", style: { color: SOFT }, children: [
          /* @__PURE__ */ jsx3("span", { className: "h-2 w-2 shrink-0 rounded-full", style: { background: c.color } }),
          c.name
        ] }),
        /* @__PURE__ */ jsxs2("p", { className: "font-display text-right text-base font-bold tabular-nums", style: { color: c.color }, children: [
          c.percent,
          "%"
        ] })
      ]
    }
  );
}
function VisualizationSelector({ value, onChange }) {
  return /* @__PURE__ */ jsx3(
    "div",
    {
      className: "mx-auto flex w-full flex-wrap items-center justify-center gap-1.5 rounded-2xl border border-white/10 bg-ink-850/85 p-2 shadow-card backdrop-blur-sm sm:gap-2 sm:p-2.5",
      role: "group",
      "aria-label": "Visualization type",
      "data-testid": "viz-selector",
      children: VIEWS.map((v) => {
        const active = value === v.id;
        return /* @__PURE__ */ jsx3(
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
  return /* @__PURE__ */ jsx3(
    "div",
    {
      className: "mx-auto w-full max-w-[680px] rounded-2xl border border-white/10 bg-ink-850/70 p-5 shadow-card sm:p-7",
      "data-testid": "chart-box",
      children
    }
  );
}
function ResultVisualizationStage({ children }) {
  return /* @__PURE__ */ jsx3(
    "div",
    {
      className: "relative z-10 mx-auto mt-6 flex min-h-[min(52vh,420px)] w-full items-center justify-center",
      "data-testid": "viz-stage",
      children
    }
  );
}
function VisualizationArea({ view, data, overall, radarSlot }) {
  return /* @__PURE__ */ jsx3(AnimatePresence, { mode: "wait", initial: false, children: /* @__PURE__ */ jsxs2(
    motion2.div,
    {
      initial: { opacity: 0, y: 12 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -8 },
      transition: { duration: 0.28, ease },
      className: "w-full",
      "data-testid": "viz-area",
      children: [
        view === "radar" && /* @__PURE__ */ jsx3(ChartBox, { children: radarSlot }),
        view === "bubble" && /* @__PURE__ */ jsx3(ChartBox, { children: /* @__PURE__ */ jsx3(BubblePlotView, { data }) }),
        view === "bullet" && /* @__PURE__ */ jsx3(ChartBox, { children: /* @__PURE__ */ jsx3(BulletChartView, { data }) }),
        view === "bar" && /* @__PURE__ */ jsx3(ChartBox, { children: /* @__PURE__ */ jsx3(BarChartView, { data }) })
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
  return /* @__PURE__ */ jsxs2("div", { className: "relative", children: [
    /* @__PURE__ */ jsxs2(ChartFrame, { label: "Bubble plot where bubble size represents each pillar percentage", children: [
      [0, 25, 50, 75, 100].map((g) => /* @__PURE__ */ jsxs2("g", { children: [
        /* @__PURE__ */ jsx3("line", { x1: plotLeft, y1: yFor(g), x2: plotRight, y2: yFor(g), stroke: withAlpha("#FFFFFF", 0.1), strokeWidth: 1 }),
        /* @__PURE__ */ jsx3("text", { x: plotLeft - 6, y: yFor(g), textAnchor: "end", dominantBaseline: "middle", fill: withAlpha("#FFFFFF", 0.4), style: { fontSize: 8 }, children: g })
      ] }, g)),
      data.map((c, i) => {
        const bx = plotLeft + slotW * (i + 0.5);
        const by = yFor(c.percent);
        const rr = rFor(c.percent);
        const isHover = hover === c.key;
        return /* @__PURE__ */ jsxs2("g", { children: [
          /* @__PURE__ */ jsx3(
            motion2.circle,
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
          lines(c.name).map((ln, li) => /* @__PURE__ */ jsx3("text", { x: bx, y: plotBottom + 16 + li * 11, textAnchor: "middle", dominantBaseline: "middle", fill: withAlpha("#FFFFFF", 0.55), style: { fontSize: 8 }, children: ln }, li)),
          /* @__PURE__ */ jsxs2(
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
      return /* @__PURE__ */ jsx3(HoverTip, { x: bx, y: yFor(c.percent), c });
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
  return /* @__PURE__ */ jsxs2(ChartFrame, { label: "Bullet chart of the six pillar percentages on a zero to one hundred scale", children: [
    [0, 25, 50, 75, 100].map((g) => {
      const x = plotLeft + wFor(g);
      return /* @__PURE__ */ jsxs2("g", { children: [
        /* @__PURE__ */ jsx3("line", { x1: x, y1: row0Y - 10, x2: x, y2: lastY, stroke: withAlpha("#FFFFFF", 0.07), strokeWidth: 1 }),
        /* @__PURE__ */ jsx3("text", { x, y: row0Y - 18, textAnchor: "middle", dominantBaseline: "middle", fill: withAlpha("#FFFFFF", 0.4), style: { fontSize: 8 }, children: g })
      ] }, g);
    }),
    data.map((c, i) => {
      const cy = row0Y + i * rowH;
      const w = wFor(c.percent);
      return /* @__PURE__ */ jsxs2("g", { children: [
        /* @__PURE__ */ jsx3("text", { x: plotLeft - 10, y: cy, textAnchor: "end", dominantBaseline: "middle", fill: SOFT, style: { fontSize: 9.5 }, children: c.name }),
        /* @__PURE__ */ jsx3("rect", { x: plotLeft, y: cy - 5, width: trackW, height: 10, rx: 5, fill: withAlpha("#FFFFFF", 0.1) }),
        w > 0 && /* @__PURE__ */ jsx3(
          motion2.rect,
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
        /* @__PURE__ */ jsxs2("text", { x: plotLeft + w + 7, y: cy, textAnchor: "start", dominantBaseline: "middle", fill: c.color, style: { fontSize: 10, fontWeight: 700 }, children: [
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
  return /* @__PURE__ */ jsxs2(ChartFrame, { label: "Bar chart of the six pillar percentages", children: [
    [0, 25, 50, 75, 100].map((g) => /* @__PURE__ */ jsxs2("g", { children: [
      /* @__PURE__ */ jsx3("line", { x1: plotLeft, y1: yFor(g), x2: plotRight, y2: yFor(g), stroke: withAlpha("#FFFFFF", 0.1), strokeWidth: 1 }),
      /* @__PURE__ */ jsx3("text", { x: plotLeft - 6, y: yFor(g), textAnchor: "end", dominantBaseline: "middle", fill: withAlpha("#FFFFFF", 0.4), style: { fontSize: 8 }, children: g })
    ] }, g)),
    /* @__PURE__ */ jsx3("line", { x1: plotLeft, y1: plotBottom, x2: plotRight, y2: plotBottom, stroke: withAlpha("#FFFFFF", 0.25), strokeWidth: 1.2 }),
    data.map((c, i) => {
      const bx = plotLeft + slotW * (i + 0.5);
      const bw = 40;
      const h = plotBottom - yFor(c.percent);
      return /* @__PURE__ */ jsxs2("g", { children: [
        /* @__PURE__ */ jsx3(
          motion2.rect,
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
        /* @__PURE__ */ jsxs2(
          motion2.text,
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
        lines(c.name).map((ln, li) => /* @__PURE__ */ jsx3("text", { x: bx, y: plotBottom + 16 + li * 11, textAnchor: "middle", dominantBaseline: "middle", fill: withAlpha("#FFFFFF", 0.55), style: { fontSize: 8 }, children: ln }, li))
      ] }, c.key);
    })
  ] });
}

// src/components/radarScale.js
var RADAR_SCALE = Object.freeze({
  min: PERCENT_MIN,
  // 0   → centre of the chart
  max: PERCENT_MAX,
  // 100 → outermost ring
  ticks: Object.freeze([0, 25, 50, 75, 100])
});
var RADAR_VIEW = Object.freeze({ w: 336, h: 264, cx: 168, cy: 130, r: 84 });
function radiusFor(score) {
  const n = Number(score);
  const value = Number.isFinite(n) ? Math.min(Math.max(n, RADAR_SCALE.min), RADAR_SCALE.max) : RADAR_SCALE.min;
  return RADAR_VIEW.r * (value - RADAR_SCALE.min) / (RADAR_SCALE.max - RADAR_SCALE.min);
}
function axisAngle(index, count) {
  return 360 / count * index;
}
function polar(angleDeg, radius) {
  const a = (angleDeg - 90) * Math.PI / 180;
  return [RADAR_VIEW.cx + radius * Math.cos(a), RADAR_VIEW.cy + radius * Math.sin(a)];
}
function tickLabelAxisIndex(count) {
  return Math.floor(count / 2);
}
function ringPoints(count, tick) {
  return Array.from({ length: count }, (_, i) => polar(axisAngle(i, count), radiusFor(tick)));
}
function tickLabelPoint(tick, count) {
  return polar(axisAngle(tickLabelAxisIndex(count), count), radiusFor(tick));
}
function dataPoint(count, index, percent) {
  return polar(axisAngle(index, count), radiusFor(percent));
}

// src/api/client.js
var API_BASE = (define_import_meta_env_default.VITE_API_URL || "http://localhost:5000/api/v1").trim().replace(/([^:])\/{2,}/g, "$1/").replace(/\/+$/, "");
var adminTokenGetter = null;
async function request(path, options = {}) {
  const headers = { "Content-Type": "application/json" };
  const isAdminRoute = path.startsWith("/admin/");
  if (isAdminRoute && adminTokenGetter) {
    const token = adminTokenGetter();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, {
    headers,
    ...options
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body.error || `Request failed (${res.status})`);
    err.status = res.status;
    if (res.status === 401 && isAdminRoute) {
      err.isAdminAuthError = true;
    }
    throw err;
  }
  return body;
}
var api = {
  startAssessment: (payload) => request("/assessments", { method: "POST", body: JSON.stringify(payload || {}) }),
  // Intro onboarding configuration: the four business types; with a
  // businessType the same payload also carries that type's three questions.
  onboardingMeta: (businessType) => request(`/assessments/onboarding${businessType ? `?businessType=${encodeURIComponent(businessType)}` : ""}`),
  nextQuestion: (sessionId, category) => request(`/assessments/${sessionId}/next/${category}`),
  submitAnswer: (sessionId, payload) => request(`/assessments/${sessionId}/answer`, { method: "POST", body: JSON.stringify(payload) }),
  reportTimeout: (sessionId, payload) => request(`/assessments/${sessionId}/timeout`, { method: "POST", body: JSON.stringify(payload) }),
  getResult: (sessionId) => request(`/assessments/${sessionId}/result`),
  // Filtered server-side by the BusinessType → Domain relationship.
  domains: (businessTypeKey) => request(`/domains${businessTypeKey ? `?businessType=${encodeURIComponent(businessTypeKey)}` : ""}`),
  kyMeta: () => request("/know-yourself/meta"),
  startKY: () => request("/know-yourself", { method: "POST" }),
  startKYAssignment: (payload) => request("/know-yourself/assignment", { method: "POST", body: JSON.stringify(payload) }),
  resumeKY: (payload) => {
    const params = new URLSearchParams();
    if (payload?.email) params.set("email", payload.email);
    if (payload?.browserId) params.set("browserId", payload.browserId);
    const query = params.toString();
    return request(`/know-yourself/resume${query ? `?${query}` : ""}`);
  },
  kyQuestion: (sessionId, index) => request(`/know-yourself/${sessionId}/question/${index}`),
  submitKYAnswer: (sessionId, payload) => request(`/know-yourself/${sessionId}/answer`, { method: "POST", body: JSON.stringify(payload) }),
  kyResult: (sessionId) => request(`/know-yourself/${sessionId}/result`),
  submitKYContact: (sessionId, payload) => request(`/know-yourself/${sessionId}/contact`, { method: "POST", body: JSON.stringify(payload) }),
  submitKYEmail: (sessionId, payload) => request(`/know-yourself/${sessionId}/email`, { method: "POST", body: JSON.stringify(payload) }),
  submitKYProBono: (sessionId, payload) => request(`/know-yourself/${sessionId}/pro-bono`, { method: "POST", body: JSON.stringify(payload) }),
  submitKYReportRequest: (sessionId, payload) => request(`/know-yourself/${sessionId}/report-request`, { method: "POST", body: JSON.stringify(payload) }),
  submitContact: (payload) => request("/contact", { method: "POST", body: JSON.stringify(payload) }),
  bulkUploadKYQuestions: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return request("/admin/know-yourself/bulk-upload", { method: "POST", body: formData });
  }
};
var client_default = api;

// src/screens/KnowYourselfResult.jsx
import { Fragment, jsx as jsx4, jsxs as jsxs3 } from "react/jsx-runtime";
var ease2 = [0.22, 1, 0.36, 1];
var premiumWhite = brand.premiumWhite;
function bandColor(band) {
  if (band === "STRONG FOUNDATION") return brand.palette.green[300];
  if (band === "MODERATE PERFORMANCE") return brand.palette.yellow[300];
  if (band === "SIGNIFICANT GAPS") return brand.palette.orange[300];
  return brand.palette.red[300];
}
var { w: VW2, h: VH2, cx: CX, cy: CY, r: R } = RADAR_VIEW;
function labelLines(name) {
  const words = name.split(" ");
  if (words.length <= 2) return words;
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
}
function RadarChart({ categories }) {
  const n = categories.length;
  const step = axisAngle(1, n);
  const point = (i, value) => dataPoint(n, i, value);
  const [hover, setHover] = useState2(null);
  const shape = categories.map((c, i) => point(i, c.percent).join(","));
  return /* @__PURE__ */ jsxs3("div", { className: "relative", children: [
    /* @__PURE__ */ jsxs3("svg", { viewBox: `0 0 ${VW2} ${VH2}`, className: "mx-auto h-auto w-full", role: "img", "aria-label": "Six-category business health radar", children: [
      RADAR_SCALE.ticks.filter((ring) => ring > 0).map((ring) => /* @__PURE__ */ jsx4("g", { children: /* @__PURE__ */ jsx4(
        "polygon",
        {
          points: ringPoints(n, ring).map(([x, y]) => `${x},${y}`).join(" "),
          fill: "none",
          stroke: "rgba(255,255,255,0.35)",
          strokeWidth: 1.2
        }
      ) }, `ring-${ring}`)),
      categories.map((c, i) => {
        const [x, y] = polar(i * step, R);
        return /* @__PURE__ */ jsx4("line", { x1: CX, y1: CY, x2: x, y2: y, stroke: "rgba(255,255,255,0.2)", strokeWidth: 1 }, c.key);
      }),
      /* @__PURE__ */ jsx4(
        motion3.polygon,
        {
          points: shape.join(" "),
          fill: `${brand.accent}26`,
          stroke: brand.accent,
          strokeWidth: 2.5,
          strokeLinejoin: "round",
          initial: { opacity: 0, scale: 0.55 },
          animate: { opacity: 1, scale: 1 },
          style: { transformOrigin: `${CX}px ${CY}px` },
          transition: { duration: 1, delay: 0.35, ease: ease2 }
        }
      ),
      categories.map((c, i) => {
        const [x, y] = point(i, c.percent);
        return /* @__PURE__ */ jsx4(
          motion3.circle,
          {
            cx: x,
            cy: y,
            r: 4,
            fill: pillarChartColor(i),
            stroke: brand.ink[900],
            strokeWidth: 1.5,
            initial: { scale: 0 },
            animate: { scale: 1 },
            style: { transformOrigin: `${x}px ${y}px` },
            transition: { delay: 0.9 + i * 0.06, duration: 0.3 }
          },
          `dot-${c.key}`
        );
      }),
      categories.map((c, i) => {
        const [hx, hy] = point(i, c.percent);
        const isHover = hover?.c.key === c.key;
        return /* @__PURE__ */ jsx4(
          "circle",
          {
            cx: hx,
            cy: hy,
            r: 14,
            fill: "transparent",
            className: "cursor-pointer",
            onMouseEnter: () => setHover({ c, i, x: hx, y: hy }),
            onMouseLeave: () => setHover(null),
            children: isHover && /* @__PURE__ */ jsx4("animate", { attributeName: "r", values: "14;15;14", dur: "1.2s", repeatCount: "indefinite" })
          },
          `hit-${c.key}`
        );
      }),
      RADAR_SCALE.ticks.map((tick) => {
        const [tx, ty] = tickLabelPoint(tick, n);
        return /* @__PURE__ */ jsxs3(
          "text",
          {
            x: tx,
            y: ty,
            fill: "rgba(255,255,255,0.55)",
            stroke: "rgba(8,8,14,0.9)",
            strokeWidth: 2,
            style: { paintOrder: "stroke" },
            fontSize: 7.5,
            textAnchor: "middle",
            dominantBaseline: "middle",
            pointerEvents: "none",
            className: "font-display",
            children: [
              tick,
              "%"
            ]
          },
          `tick-${tick}`
        );
      }),
      categories.map((c, i) => {
        const a = (i * step - 90) * Math.PI / 180;
        const cosA = Math.cos(a);
        const lx = CX + (R + 22) * cosA;
        const ly = CY + (R + 22) * Math.sin(a);
        const anchor = Math.abs(cosA) < 0.35 ? "middle" : cosA > 0 ? "start" : "end";
        const lines2 = labelLines(c.name);
        const multi = lines2.length > 1;
        return /* @__PURE__ */ jsxs3("text", { className: "fill-white/70", style: { fontSize: 10, letterSpacing: "0.02em" }, children: [
          lines2.map((ln, li) => /* @__PURE__ */ jsx4("tspan", { x: lx, y: ly - (multi ? 9 : 4) + li * 12, textAnchor: anchor, dominantBaseline: "middle", children: ln }, li)),
          /* @__PURE__ */ jsxs3("tspan", { x: lx, y: ly + (multi ? 19 : 14), textAnchor: anchor, dominantBaseline: "middle", fontSize: 9.5, letterSpacing: "0.08em", style: { fill: pillarChartColor(i), fontWeight: 700 }, children: [
            c.percent,
            "%"
          ] })
        ] }, `lbl-${c.key}`);
      })
    ] }),
    /* @__PURE__ */ jsx4(AnimatePresence2, { children: hover && /* @__PURE__ */ jsxs3(
      motion3.div,
      {
        initial: { opacity: 0, y: 4, scale: 0.96 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 4, scale: 0.96 },
        transition: { duration: 0.18 },
        className: "pointer-events-none absolute z-10 -translate-x-1/2 rounded-xl border border-white/10 bg-ink-850/95 px-3.5 py-2 shadow-card backdrop-blur-md",
        style: {
          left: `${hover.x / VW2 * 100}%`,
          top: `${hover.y / VH2 * 100}%`,
          marginTop: "-3.2rem"
        },
        children: [
          /* @__PURE__ */ jsxs3("p", { className: "font-display flex items-center gap-2 whitespace-nowrap text-sm font-semibold", style: { color: premiumWhite.soft }, children: [
            /* @__PURE__ */ jsx4("span", { className: "h-2 w-2 shrink-0 rounded-full", style: { background: pillarChartColor(hover.i) } }),
            hover.c.name
          ] }),
          /* @__PURE__ */ jsxs3("p", { className: "font-display text-right text-base font-bold tabular-nums", style: { color: pillarChartColor(hover.i) }, children: [
            hover.c.percent,
            "%"
          ] })
        ]
      },
      "radar-tooltip"
    ) })
  ] });
}
function ScoreRing({ percent, size = 190, label = "Overall" }) {
  const color = bandColor(percent >= 80 ? "STRONG FOUNDATION" : percent >= 63 ? "MODERATE PERFORMANCE" : percent >= 44 ? "SIGNIFICANT GAPS" : "");
  const r = 85;
  const circ = 2 * Math.PI * r;
  return /* @__PURE__ */ jsxs3("div", { className: "relative", style: { width: size, height: size }, children: [
    /* @__PURE__ */ jsxs3("svg", { viewBox: "0 0 200 200", className: "h-full w-full", children: [
      /* @__PURE__ */ jsx4("circle", { cx: 100, cy: 100, r, fill: "none", stroke: "rgba(255,255,255,0.08)", strokeWidth: 12 }),
      /* @__PURE__ */ jsx4(
        motion3.circle,
        {
          cx: 100,
          cy: 100,
          r,
          fill: "none",
          stroke: color,
          strokeWidth: 12,
          strokeLinecap: "round",
          strokeDasharray: circ,
          initial: { strokeDashoffset: circ },
          animate: { strokeDashoffset: circ * (1 - percent / 100) },
          transition: { duration: 1.5, delay: 0.4, ease: ease2 },
          transform: "rotate(-90 100 100)",
          style: { filter: `drop-shadow(0 0 12px ${color}66)` }
        }
      )
    ] }),
    /* @__PURE__ */ jsxs3("div", { className: "absolute inset-0 flex flex-col items-center justify-center", children: [
      /* @__PURE__ */ jsx4("span", { className: "font-display text-[10px] font-medium uppercase tracking-[0.25em]", style: { color: premiumWhite.soft }, children: label }),
      /* @__PURE__ */ jsxs3(
        motion3.span,
        {
          initial: { opacity: 0, y: 8 },
          animate: { opacity: 1, y: 0 },
          transition: { delay: 0.9, duration: 0.5 },
          className: "font-display text-5xl font-bold tabular-nums",
          style: { color: premiumWhite.bright },
          children: [
            percent,
            /* @__PURE__ */ jsx4("span", { className: "text-2xl", children: "%" })
          ]
        }
      )
    ] })
  ] });
}
function ContextChips({ businessTypeLabel, domainLabel }) {
  if (!businessTypeLabel && !domainLabel) return null;
  return /* @__PURE__ */ jsxs3("div", { className: "flex flex-wrap items-center justify-center gap-2", children: [
    businessTypeLabel && /* @__PURE__ */ jsxs3("span", { className: "font-display inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-1.5 text-xs font-medium", style: { color: premiumWhite.warm }, children: [
      /* @__PURE__ */ jsx4("span", { className: "h-1.5 w-1.5 rounded-full", style: { background: brand.mark[0] } }),
      businessTypeLabel
    ] }),
    domainLabel && /* @__PURE__ */ jsxs3("span", { className: "font-display inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-1.5 text-xs font-medium", style: { color: premiumWhite.warm }, children: [
      /* @__PURE__ */ jsx4("span", { className: "h-1.5 w-1.5 rounded-full", style: { background: brand.mark[3] } }),
      domainLabel
    ] })
  ] });
}
var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
var COUNTRY_CODES = [
  { code: "+1", label: "US / Canada (+1)" },
  { code: "+44", label: "UK (+44)" },
  { code: "+61", label: "Australia (+61)" },
  { code: "+91", label: "India (+91)" },
  { code: "+971", label: "UAE (+971)" },
  { code: "+65", label: "Singapore (+65)" },
  { code: "+27", label: "South Africa (+27)" },
  { code: "+49", label: "Germany (+49)" },
  { code: "+33", label: "France (+33)" },
  { code: "+81", label: "Japan (+81)" },
  { code: "+86", label: "China (+86)" },
  { code: "+52", label: "Mexico (+52)" }
];
var PHONE_RULES = {
  "+91": { exact: 10, max: 10, error: "Indian phone number must be exactly 10 digits" }
};
function phoneDigits(raw) {
  return String(raw || "").replace(/\D/g, "");
}
function isPhoneValid(countryCode, raw) {
  const digits = phoneDigits(raw);
  const rule = PHONE_RULES[countryCode];
  if (rule) return digits.length === rule.exact;
  return digits.length >= 4 && digits.length <= 15;
}
function phoneErrorFor(countryCode, raw) {
  const digits = phoneDigits(raw);
  if (!digits) return "Phone number is required";
  const rule = PHONE_RULES[countryCode];
  if (rule) return digits.length !== rule.exact ? rule.error : "";
  if (digits.length < 4 || digits.length > 15) return "Enter a valid phone number";
  return "";
}
function ReportRequestModal({ open, sessionId, prefilledEmail, existing, onClose, onSaved }) {
  const [ownerName, setOwnerName] = useState2("");
  const [companyName, setCompanyName] = useState2("");
  const [email, setEmail] = useState2("");
  const [website, setWebsite] = useState2("");
  const [countryCode, setCountryCode] = useState2("+91");
  const [phone, setPhone] = useState2("");
  const [saving, setSaving] = useState2(false);
  const [error, setError] = useState2(null);
  useEffect(() => {
    if (!open) return;
    setOwnerName(existing?.ownerName || "");
    setCompanyName(existing?.companyName || "");
    setEmail(existing?.email || prefilledEmail || "");
    setWebsite(existing?.website || "");
    setCountryCode(existing?.countryCode || "+91");
    setPhone(existing?.phone || "");
    setSaving(false);
    setError(null);
  }, [open, sessionId]);
  if (!open) return null;
  const isEmailValid = EMAIL_RE.test(email.trim());
  const phoneValid = isPhoneValid(countryCode, phone);
  const phoneError = phoneErrorFor(countryCode, phone);
  const canSubmit = ownerName.trim() && companyName.trim() && isEmailValid && phoneValid && !saving;
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!ownerName.trim() || !companyName.trim() || !isEmailValid) {
      setError("Please fill all required fields with a valid email.");
      return;
    }
    if (!phoneValid) {
      setError(phoneError || "Please enter a valid phone number.");
      return;
    }
    setSaving(true);
    try {
      const resp = await client_default.submitKYReportRequest(sessionId, {
        ownerName: ownerName.trim(),
        companyName: companyName.trim(),
        email: email.trim().toLowerCase(),
        website: website.trim() || void 0,
        countryCode,
        phone: phoneDigits(phone)
      });
      onSaved({
        ownerName: ownerName.trim(),
        companyName: companyName.trim(),
        email: email.trim().toLowerCase(),
        website: website.trim() || null,
        countryCode,
        phone: phoneDigits(phone),
        requested: true,
        submittedAt: (/* @__PURE__ */ new Date()).toISOString(),
        emailStatus: resp?.emailStatus || null,
        emailMessageId: resp?.emailMessageId || null
      });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };
  return /* @__PURE__ */ jsx4(AnimatePresence2, { children: /* @__PURE__ */ jsx4(
    motion3.div,
    {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      className: "fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm",
      onClick: onClose,
      "data-testid": "report-request-modal",
      children: /* @__PURE__ */ jsxs3(
        motion3.div,
        {
          initial: { opacity: 0, scale: 0.96, y: 16 },
          animate: { opacity: 1, scale: 1, y: 0 },
          exit: { opacity: 0, scale: 0.96, y: 16 },
          transition: { duration: 0.25, ease: ease2 },
          className: "my-auto w-full max-w-lg rounded-2xl border border-white/10 bg-ink-850 p-6 shadow-card",
          style: { color: premiumWhite.bright },
          onClick: (e) => e.stopPropagation(),
          role: "dialog",
          "aria-modal": "true",
          children: [
            /* @__PURE__ */ jsxs3("div", { className: "flex items-start justify-between gap-4", children: [
              /* @__PURE__ */ jsxs3("div", { children: [
                /* @__PURE__ */ jsx4("h2", { className: "font-display text-xl font-bold", style: { color: premiumWhite.bright }, children: "Complete Report Delivery" }),
                /* @__PURE__ */ jsx4("p", { className: "font-display mt-1 text-sm", style: { color: premiumWhite.soft }, children: "Tell us where to send your complete BYRGOP report." })
              ] }),
              /* @__PURE__ */ jsx4(
                "button",
                {
                  type: "button",
                  onClick: onClose,
                  "aria-label": "Close",
                  "data-testid": "report-request-close",
                  className: "rounded-lg border border-white/10 p-1.5 text-mist-muted transition-colors hover:text-mist",
                  children: "\u2715"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs3("form", { onSubmit: handleSubmit, className: "mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2", children: [
              /* @__PURE__ */ jsx4(Field, { label: "Business Owner Name *", className: "sm:col-span-2", children: /* @__PURE__ */ jsx4("input", { type: "text", value: ownerName, onChange: (e) => setOwnerName(e.target.value), placeholder: "Owner name", "data-testid": "rr-owner", className: inputCls }) }),
              /* @__PURE__ */ jsx4(Field, { label: "Company Name *", className: "sm:col-span-2", children: /* @__PURE__ */ jsx4("input", { type: "text", value: companyName, onChange: (e) => setCompanyName(e.target.value), placeholder: "Company name", "data-testid": "rr-company", className: inputCls }) }),
              /* @__PURE__ */ jsx4(Field, { label: "Email *", className: "sm:col-span-2", children: /* @__PURE__ */ jsx4("input", { type: "email", value: email, onChange: (e) => setEmail(e.target.value), placeholder: "you@company.com", "data-testid": "rr-email", className: inputCls, autoComplete: "email" }) }),
              /* @__PURE__ */ jsx4(Field, { label: "Company Website", className: "sm:col-span-2", children: /* @__PURE__ */ jsx4("input", { type: "text", value: website, onChange: (e) => setWebsite(e.target.value), placeholder: "https://company.com (optional)", "data-testid": "rr-website", className: inputCls }) }),
              /* @__PURE__ */ jsx4(Field, { label: "Country Code", className: "sm:col-span-1", children: /* @__PURE__ */ jsx4("select", { value: countryCode, onChange: (e) => setCountryCode(e.target.value), "data-testid": "rr-country-code", className: inputCls, children: COUNTRY_CODES.map((c) => /* @__PURE__ */ jsx4("option", { value: c.code, children: c.label }, c.code + c.label)) }) }),
              /* @__PURE__ */ jsxs3(Field, { label: "Phone Number *", className: "sm:col-span-1", children: [
                /* @__PURE__ */ jsx4(
                  "input",
                  {
                    type: "tel",
                    value: phone,
                    onChange: (e) => setPhone(e.target.value.replace(/[^\d]/g, "")),
                    placeholder: "Digits only",
                    "data-testid": "rr-phone",
                    className: inputCls,
                    maxLength: PHONE_RULES[countryCode]?.max || 15,
                    "aria-invalid": !!phone && !phoneValid
                  }
                ),
                !!phone && !phoneValid && /* @__PURE__ */ jsx4("span", { className: "font-display mt-1 block text-[11px]", style: { color: brand.palette.red[400] }, "data-testid": "rr-phone-error", children: phoneError })
              ] }),
              error && /* @__PURE__ */ jsx4("p", { className: "font-display sm:col-span-2 text-sm", style: { color: brand.palette.red[400] }, "data-testid": "rr-error", children: error }),
              /* @__PURE__ */ jsxs3("div", { className: "sm:col-span-2 mt-2 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:justify-end", children: [
                /* @__PURE__ */ jsx4(
                  "button",
                  {
                    type: "button",
                    onClick: onClose,
                    className: "rounded-xl border border-white/10 px-5 py-2.5 text-sm font-semibold text-mist-muted transition-colors hover:text-mist",
                    children: "Cancel"
                  }
                ),
                /* @__PURE__ */ jsx4(
                  PrimaryButton,
                  {
                    type: "submit",
                    disabled: !canSubmit,
                    className: "font-display px-6 py-2.5 text-sm font-bold",
                    "data-testid": "rr-submit",
                    children: saving ? /* @__PURE__ */ jsxs3(Fragment, { children: [
                      /* @__PURE__ */ jsx4(ByrgopLoader, {}),
                      /* @__PURE__ */ jsx4("span", { children: "Sending report..." })
                    ] }) : "Submit"
                  }
                )
              ] })
            ] })
          ]
        }
      )
    }
  ) });
}
function Field({ label, children, className = "" }) {
  return /* @__PURE__ */ jsxs3("label", { className: `block ${className}`, children: [
    /* @__PURE__ */ jsx4("span", { className: "font-display mb-1.5 block text-xs font-medium uppercase tracking-[0.15em]", style: { color: premiumWhite.soft }, children: label }),
    children
  ] });
}
var inputCls = "w-full rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2.5 text-sm outline-none transition-colors focus:border-white/25 disabled:opacity-50";
function healthScoreEntity(headingLabel) {
  const stripped = String(headingLabel ?? "").replace(/^\s*your\s+/i, "").trim();
  return stripped || "Business";
}
function KnowYourselfResult({
  result,
  sessionId,
  onExplore,
  onLogoClick,
  onLogout,
  resultHeadingLabel
}) {
  const entityLabel = healthScoreEntity(resultHeadingLabel);
  const data = result?.result;
  const isV2 = !!data?.version && Array.isArray(data.categories);
  const [reportOpen, setReportOpen] = useState2(false);
  const [reportDone, setReportDone] = useState2(!!result?.reportRequest?.requested);
  const [reportExisting, setReportExisting] = useState2(result?.reportRequest || null);
  const [reportEmailStatus, setReportEmailStatus] = useState2(result?.reportRequest?.emailStatus || null);
  if (!isV2) {
    const score = data?.score ?? 0;
    const maxScore = data?.maxScore ?? 80;
    const pct = maxScore > 0 ? Math.round(score / maxScore * 100) : 0;
    return /* @__PURE__ */ jsxs3("div", { className: "relative flex min-h-screen flex-col overflow-hidden bg-page px-6 py-24", children: [
      /* @__PURE__ */ jsx4(
        motion3.div,
        {
          className: "pointer-events-none absolute inset-x-0 top-0 h-px",
          style: {
            background: `linear-gradient(90deg, transparent, ${brand.palette.blue[500]}, ${brand.palette.yellow[500]}, ${brand.palette.purple[500]}, transparent)`
          },
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          transition: { duration: 1.2, delay: 0.4 }
        }
      ),
      /* @__PURE__ */ jsxs3("div", { className: "pointer-events-none absolute inset-0 opacity-30", children: [
        /* @__PURE__ */ jsx4("div", { className: "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-purple-500/10 blur-3xl" }),
        /* @__PURE__ */ jsx4("div", { className: "absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-blue-500/10 blur-3xl" })
      ] }),
      /* @__PURE__ */ jsx4(
        motion3.div,
        {
          className: "absolute top-4 left-4 z-10 sm:top-6 sm:left-6 lg:top-8 lg:left-8",
          initial: { opacity: 0, x: -20 },
          animate: { opacity: 1, x: 0 },
          transition: { duration: 0.6, ease: ease2 },
          children: /* @__PURE__ */ jsx4("button", { type: "button", onClick: onLogoClick, className: "cursor-pointer bg-transparent border-0 p-0", "aria-label": "Return to home page", children: /* @__PURE__ */ jsx4("img", { src: "/byrgop_logo_1.jpeg", alt: "BYRGOP", className: "h-12 w-auto object-contain drop-shadow-lg transition-opacity hover:opacity-80 sm:h-16 md:h-20 lg:h-24" }) })
        }
      ),
      /* @__PURE__ */ jsxs3(
        motion3.div,
        {
          className: "absolute top-4 right-4 z-10 flex flex-col items-end gap-1 sm:top-6 sm:right-6 lg:top-8 lg:right-8",
          initial: { opacity: 0, x: 20 },
          animate: { opacity: 1, x: 0 },
          transition: { duration: 0.6, ease: ease2 },
          children: [
            /* @__PURE__ */ jsx4(
              "span",
              {
                className: "font-display text-base font-semibold tracking-wider leading-none sm:text-lg md:text-xl lg:text-2xl xl:text-3xl",
                style: { color: premiumWhite.bright },
                children: "\u0C2C\u0C3F\u0C30\u0C4D \u0C17\u0C3E\u0C2A\u0C4D"
              }
            ),
            /* @__PURE__ */ jsx4(
              "span",
              {
                className: "font-display text-base font-semibold tracking-wider leading-none sm:text-lg md:text-xl lg:text-2xl xl:text-3xl",
                style: { color: premiumWhite.bright },
                children: "\u092C\u093F\u0930\u0917\u093E\u092A"
              }
            )
          ]
        }
      ),
      /* @__PURE__ */ jsxs3("div", { className: "relative z-10 flex flex-col items-center justify-center", children: [
        /* @__PURE__ */ jsx4(ContextChips, { businessTypeLabel: result.businessTypeLabel, domainLabel: result.domainLabel || data?.domainLabel }),
        /* @__PURE__ */ jsxs3("h1", { className: "font-display mt-8 text-center text-3xl font-bold sm:text-4xl md:text-5xl", style: { color: premiumWhite.bright }, children: [
          entityLabel,
          " ",
          /* @__PURE__ */ jsx4("span", { className: "font-display font-semibold italic", style: { color: brand.accent }, children: "Assessment" })
        ] }),
        /* @__PURE__ */ jsxs3("div", { className: "mt-10 flex flex-col items-center", children: [
          /* @__PURE__ */ jsx4(ScoreRing, { percent: pct, label: "Score" }),
          /* @__PURE__ */ jsx4("h2", { className: "font-display mt-6 text-2xl font-bold uppercase tracking-[0.12em]", style: { color: bandColor(data?.band) }, children: data?.band }),
          /* @__PURE__ */ jsx4("p", { className: "font-display mt-2 max-w-md text-center text-sm leading-relaxed", style: { color: premiumWhite.warm }, children: data?.message })
        ] }),
        /* @__PURE__ */ jsx4("p", { className: "mt-8 text-xs", style: { color: premiumWhite.soft }, children: "Earlier assessment format \u2014 take a new assessment for a full six-dimension analysis." }),
        /* @__PURE__ */ jsx4("div", { className: "mt-10", children: /* @__PURE__ */ jsx4(PrimaryButton, { onClick: onExplore, className: "font-display min-w-[13rem] px-6 py-2.5 text-xl font-bold tracking-[0.05em]", children: "Explore BYRGOP" }) })
      ] })
    ] });
  }
  const cats = data.categories;
  const [view, setView] = useState2("radar");
  const pillarData = useMemo(() => toPillarData(cats), [cats]);
  return /* @__PURE__ */ jsxs3("div", { className: "relative flex min-h-screen flex-col overflow-hidden bg-page px-5 pb-16 pt-20 sm:px-10", children: [
    /* @__PURE__ */ jsx4(
      motion3.div,
      {
        className: "pointer-events-none absolute inset-x-0 top-0 h-px",
        style: {
          background: `linear-gradient(90deg, transparent, ${brand.palette.blue[500]}, ${brand.palette.yellow[500]}, ${brand.palette.purple[500]}, transparent)`
        },
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 1.2, delay: 0.4 }
      }
    ),
    /* @__PURE__ */ jsxs3("div", { className: "pointer-events-none absolute inset-0 opacity-30", children: [
      /* @__PURE__ */ jsx4("div", { className: "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-purple-500/10 blur-3xl" }),
      /* @__PURE__ */ jsx4("div", { className: "absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-blue-500/10 blur-3xl" })
    ] }),
    /* @__PURE__ */ jsx4(
      motion3.div,
      {
        className: "absolute top-4 left-4 z-10 sm:top-6 sm:left-6 lg:top-8 lg:left-8",
        initial: { opacity: 0, x: -20 },
        animate: { opacity: 1, x: 0 },
        transition: { duration: 0.6, ease: ease2 },
        children: /* @__PURE__ */ jsx4("button", { type: "button", onClick: onLogoClick, className: "cursor-pointer bg-transparent border-0 p-0", "aria-label": "Return to home page", children: /* @__PURE__ */ jsx4("img", { src: "/byrgop_logo_1.jpeg", alt: "BYRGOP", className: "h-12 w-auto object-contain drop-shadow-lg transition-opacity hover:opacity-80 sm:h-16 md:h-20 lg:h-24" }) })
      }
    ),
    /* @__PURE__ */ jsxs3(
      motion3.div,
      {
        className: "absolute top-4 right-4 z-10 flex flex-col items-end gap-1 sm:top-6 sm:right-6 lg:top-8 lg:right-8",
        initial: { opacity: 0, x: 20 },
        animate: { opacity: 1, x: 0 },
        transition: { duration: 0.6, ease: ease2 },
        children: [
          /* @__PURE__ */ jsx4(
            "span",
            {
              className: "font-display text-base font-semibold tracking-wider leading-none sm:text-lg md:text-xl lg:text-2xl xl:text-3xl",
              style: { color: premiumWhite.bright },
              children: "\u0C2C\u0C3F\u0C30\u0C4D\u200C\u0C17\u0C3E\u0C2A\u0C4D"
            }
          ),
          /* @__PURE__ */ jsx4(
            "span",
            {
              className: "font-display text-base font-semibold tracking-wider leading-none sm:text-lg md:text-xl lg:text-2xl xl:text-3xl",
              style: { color: premiumWhite.bright },
              children: "\u092C\u093F\u0930\u0917\u093E\u092A"
            }
          )
        ]
      }
    ),
    onLogout && /* @__PURE__ */ jsx4(
      motion3.div,
      {
        className: "absolute top-4 right-4 z-10 sm:top-6 sm:right-6 lg:top-8 lg:right-8",
        initial: { opacity: 0, x: 20 },
        animate: { opacity: 1, x: 0 },
        transition: { duration: 0.6, ease: ease2 },
        children: /* @__PURE__ */ jsx4(
          "button",
          {
            type: "button",
            onClick: onLogout,
            className: "font-display text-xs font-medium px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.03] text-white/70 hover:text-white hover:border-white/20 hover:bg-white/10 transition-all",
            "aria-label": "Log out",
            children: "Logout"
          }
        )
      }
    ),
    /* @__PURE__ */ jsxs3("header", { className: "relative z-10 flex flex-col items-center text-center", children: [
      /* @__PURE__ */ jsx4("span", { className: "font-display text-[10px] font-medium uppercase tracking-[0.32em]", style: { color: premiumWhite.soft }, children: brand.tagline }),
      /* @__PURE__ */ jsxs3("h1", { className: "font-display mt-2 text-2xl font-bold uppercase tracking-wide sm:text-3xl md:text-5xl", style: { color: premiumWhite.bright }, children: [
        entityLabel,
        " ",
        /* @__PURE__ */ jsx4("span", { className: "font-display italic normal-case font-semibold", style: { color: brand.accent }, children: "Health" }),
        " Score"
      ] }),
      /* @__PURE__ */ jsx4("div", { className: "mt-5", children: /* @__PURE__ */ jsx4(
        ContextChips,
        {
          businessTypeLabel: result.businessTypeLabel || data.businessTypeLabel,
          domainLabel: result.domainLabel || data.domainLabel
        }
      ) })
    ] }),
    /* @__PURE__ */ jsxs3(
      motion3.section,
      {
        initial: { opacity: 0, y: 22 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.7, ease: ease2 },
        className: "relative z-10 mx-auto mt-8 flex w-full max-w-4xl flex-col items-center",
        children: [
          /* @__PURE__ */ jsx4(ScoreRing, { percent: data.overallPercent }),
          /* @__PURE__ */ jsx4("h2", { className: "font-display mt-4 text-lg font-bold uppercase tracking-[0.12em]", style: { color: bandColor(data.band) }, children: data.band })
        ]
      }
    ),
    /* @__PURE__ */ jsxs3("main", { className: "relative z-10 mx-auto mt-10 w-full max-w-[1050px]", children: [
      /* @__PURE__ */ jsxs3("div", { className: "text-center", children: [
        /* @__PURE__ */ jsx4("p", { className: "font-display text-[10px] font-medium uppercase tracking-[0.32em]", style: { color: premiumWhite.soft }, children: "Assessment Visualization" }),
        /* @__PURE__ */ jsx4("h2", { className: "font-display mt-2 text-xl font-bold sm:text-3xl", style: { color: premiumWhite.bright }, children: "See the full picture" }),
        /* @__PURE__ */ jsx4("p", { className: "font-display mx-auto mt-1.5 max-w-md text-sm", style: { color: premiumWhite.warm }, children: "Explore your six-pillar business health across different visual formats." })
      ] }),
      /* @__PURE__ */ jsx4("div", { className: "mt-6 sm:mt-7", children: /* @__PURE__ */ jsx4(VisualizationSelector, { value: view, onChange: setView }) }),
      /* @__PURE__ */ jsx4(ResultVisualizationStage, { children: /* @__PURE__ */ jsx4(
        VisualizationArea,
        {
          view,
          data: pillarData,
          overall: data.overallPercent,
          radarSlot: /* @__PURE__ */ jsx4(RadarChart, { categories: cats })
        }
      ) })
    ] }),
    /* @__PURE__ */ jsx4("section", { className: "relative z-10 mx-auto mt-10 w-full max-w-4xl sm:mt-14", children: /* @__PURE__ */ jsx4("div", { className: "grid w-full grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4", children: cats.map((c, i) => /* @__PURE__ */ jsxs3(
      motion3.div,
      {
        initial: { opacity: 0, y: 18 },
        animate: { opacity: 1, y: 0 },
        transition: { delay: 0.5 + i * 0.08, duration: 0.5, ease: ease2 },
        className: "overflow-hidden rounded-2xl border border-white/[0.09] bg-white/[0.03]",
        children: [
          /* @__PURE__ */ jsx4("div", { className: "h-1 w-full", style: { background: c.color } }),
          /* @__PURE__ */ jsxs3("div", { className: "px-4 py-3.5 sm:px-5", children: [
            /* @__PURE__ */ jsx4("p", { className: "font-display truncate text-xs font-medium", style: { color: premiumWhite.soft }, children: c.name }),
            /* @__PURE__ */ jsxs3("p", { className: "font-display mt-1 text-2xl font-bold tabular-nums sm:text-3xl", style: { color: premiumWhite.bright }, children: [
              c.percent,
              /* @__PURE__ */ jsx4("span", { className: "text-base", children: "%" })
            ] })
          ] })
        ]
      },
      c.key
    )) }) }),
    data.notApplicableCount != null && data.notApplicableCount > 0 && /* @__PURE__ */ jsx4(
      motion3.div,
      {
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
        transition: { delay: 0.9, duration: 0.5, ease: ease2 },
        className: "relative z-10 mx-auto mt-5 w-full max-w-4xl",
        children: /* @__PURE__ */ jsxs3(
          "p",
          {
            className: "font-display text-center text-sm",
            style: { color: premiumWhite.soft },
            "data-testid": "ky-na-count",
            children: [
              "You marked ",
              /* @__PURE__ */ jsx4("span", { className: "font-semibold", style: { color: premiumWhite.warm }, children: data.notApplicableCount }),
              " ",
              data.notApplicableCount === 1 ? "question" : "questions",
              " as Not Applicable."
            ]
          }
        )
      }
    ),
    data.priority && /* @__PURE__ */ jsxs3(
      motion3.div,
      {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { delay: 1.15, duration: 0.65, ease: ease2 },
        className: "relative z-10 mx-auto mt-6 w-full max-w-4xl overflow-hidden rounded-2xl border px-6 py-5 sm:px-8",
        style: { borderColor: `${data.priority.color}40`, background: `${data.priority.color}0d` },
        children: [
          /* @__PURE__ */ jsx4("span", { className: "font-display text-[10px] font-semibold uppercase tracking-[0.24em]", style: { color: `${data.priority.color}cc` }, children: "Primary area to strengthen" }),
          /* @__PURE__ */ jsx4("p", { className: "font-display mt-1.5 text-xl font-bold sm:text-2xl", style: { color: premiumWhite.bright }, children: data.priority.name }),
          /* @__PURE__ */ jsxs3("p", { className: "font-display mt-0.5 text-sm tabular-nums", style: { color: data.priority.color }, children: [
            data.priority.percent,
            "% \xB7 ",
            data.priority.score,
            " of ",
            data.priority.maxScore,
            " points"
          ] }),
          /* @__PURE__ */ jsx4("p", { className: "font-display mt-1.5 max-w-2xl text-sm leading-relaxed", style: { color: premiumWhite.warm }, children: "Focusing here offers the greatest opportunity to lift your overall business health." })
        ]
      }
    ),
    /* @__PURE__ */ jsxs3(
      motion3.div,
      {
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.7, delay: 1.3, ease: ease2 },
        className: "relative z-10 mt-12 flex flex-col items-center",
        children: [
          /* @__PURE__ */ jsxs3("div", { className: "w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-5 text-center", "data-testid": "report-prompt", children: [
            /* @__PURE__ */ jsx4("p", { className: "font-display text-sm", style: { color: premiumWhite.warm }, children: reportDone ? reportEmailStatus === "sent" ? "\u2713 Your full report is on its way" : "\u2713 Details saved successfully" : "Want to get the complete report delivered to your email?" }),
            /* @__PURE__ */ jsx4(
              PrimaryButton,
              {
                onClick: () => setReportOpen(true),
                className: "font-display mt-4 px-6 py-2.5 text-sm font-bold",
                "data-testid": "report-yes",
                children: reportDone ? "UPDATE DETAILS" : "Yes"
              }
            ),
            /* @__PURE__ */ jsx4("p", { className: "font-display mt-2 text-[11px]", style: { color: premiumWhite.soft }, children: reportDone ? reportEmailStatus === "sent" ? `We've emailed the full 3-page report to ${reportExisting?.email ? `the address provided` : "your address"}.` : reportEmailStatus === "failed" ? "We couldn't email the report right now \u2014 our team will reach out." : "We'll send it to the address you provided." : "We'll send it to the address you provide below." })
          ] }),
          /* @__PURE__ */ jsx4(PrimaryButton, { onClick: onExplore, className: "font-display min-w-[13rem] px-6 py-2.5 text-xl font-bold tracking-[0.05em] mt-6", children: "Explore BYRGOP" })
        ]
      }
    ),
    /* @__PURE__ */ jsx4(
      ReportRequestModal,
      {
        open: reportOpen,
        sessionId,
        prefilledEmail: result?.email || "",
        existing: reportExisting,
        onClose: () => setReportOpen(false),
        onSaved: (data2) => {
          setReportOpen(false);
          setReportDone(true);
          if (data2?.emailStatus) setReportEmailStatus(data2.emailStatus);
          if (data2) setReportExisting((prev) => ({ ...prev || {}, ...data2 }));
        }
      }
    )
  ] });
}
export {
  RadarChart,
  KnowYourselfResult as default
};
