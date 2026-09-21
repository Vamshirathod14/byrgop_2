import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import PrimaryButton from '../components/PrimaryButton.jsx';
import ByrgopLoader from '../components/ByrgopLoader.jsx';
import { VisualizationSelector, VisualizationArea, ResultVisualizationStage, toPillarData } from '../components/ResultVisualizations.jsx';
import api from '../api/client.js';
import { brand } from '../theme/brand.js';

const ease = [0.22, 1, 0.36, 1];
const premiumWhite = brand.premiumWhite;

// Band severity colours — semantic, but drawn from the centralized brand
// palette (green/yellow/orange/red 300) instead of arbitrary Tailwind hues.
function bandColor(band) {
  if (band === 'STRONG FOUNDATION') return brand.palette.green[300];
  if (band === 'MODERATE PERFORMANCE') return brand.palette.yellow[300];
  if (band === 'SIGNIFICANT GAPS') return brand.palette.orange[300];
  return brand.palette.red[300];
}

/* ── Radar / spider chart (six axes) ────────────────────── */
const VW = 336;
const VH = 264;
const CX = 168;
const CY = 130;
const R = 84;

function polar(angleDeg, radius) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return [CX + radius * Math.cos(a), CY + radius * Math.sin(a)];
}

function labelLines(name) {
  const words = name.split(' ');
  if (words.length <= 2) return words;
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
}

function RadarChart({ categories }) {
  const n = categories.length;
  const step = 360 / n;
  const point = (i, value) => polar(i * step, (R * value) / 100);

  // Hover state — scores appear only on hover, never permanently on the graph.
  const [hover, setHover] = useState(null); // { c, x, y }

  const shape = categories.map((c, i) => point(i, c.percent).join(','));

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${VW} ${VH}`} className="mx-auto h-auto w-full" role="img" aria-label="Six-category business health radar">
      {/* rings - brighter white */}
      {[25, 50, 75, 100].map((ring) => (
        <g key={`ring-${ring}`}>
          <polygon
            points={categories.map((_, i) => polar(i * step, (R * ring) / 100).join(',')).join(' ')}
            fill="none"
            stroke="rgba(255,255,255,0.35)"
            strokeWidth={1.2}
          />
          {/* Ring labels - offset to the upper-left so they never collide with the top pillar label/percentage */}
          <text
            x={CX - 30}
            y={CY + (R * ring / 100 + 8) * Math.sin(-Math.PI / 2)}
            fill="rgba(255,255,255,0.4)"
            fontSize={7.5}
            textAnchor="end"
            dominantBaseline="middle"
            className="font-display"
          >
            {ring}%
          </text>
        </g>
      ))}
      {/* axes - brighter white */}
      {categories.map((c, i) => {
        const [x, y] = polar(i * step, R);
        return <line key={c.key} x1={CX} y1={CY} x2={x} y2={y} stroke="rgba(255,255,255,0.2)" strokeWidth={1} />;
      })}
      {/* cobweb polygon */}
      <motion.polygon
        points={shape.join(' ')}
        fill={`${brand.accent}26`}
        stroke={brand.accent}
        strokeWidth={2.5}
        strokeLinejoin="round"
        initial={{ opacity: 0, scale: 0.55 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ transformOrigin: `${CX}px ${CY}px` }}
        transition={{ duration: 1, delay: 0.35, ease }}
      />
      {/* vertices */}
      {categories.map((c, i) => {
        const [x, y] = point(i, c.percent);
        return (
          <motion.circle
            key={`dot-${c.key}`}
            cx={x}
            cy={y}
            r={4}
            fill={c.color || brand.accent}
            stroke={brand.ink[900]}
            strokeWidth={1.5}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            style={{ transformOrigin: `${x}px ${y}px` }}
            transition={{ delay: 0.9 + i * 0.06, duration: 0.3 }}
          />
        );
      })}
      {/* invisible hover hit-areas → score tooltip on hover */}
      {categories.map((c, i) => {
        const [hx, hy] = point(i, c.percent);
        const isHover = hover?.c.key === c.key;
        return (
          <circle
            key={`hit-${c.key}`}
            cx={hx}
            cy={hy}
            r={14}
            fill="transparent"
            className="cursor-pointer"
            onMouseEnter={() => setHover({ c, x: hx, y: hy })}
            onMouseLeave={() => setHover(null)}
          >
            {isHover && <animate attributeName="r" values="14;15;14" dur="1.2s" repeatCount="indefinite" />}
          </circle>
        );
      })}
      {/* labels — pillar name, with its percentage on a separate line below it */}
      {categories.map((c, i) => {
        const a = ((i * step - 90) * Math.PI) / 180;
        const cosA = Math.cos(a);
        const lx = CX + (R + 22) * cosA;
        const ly = CY + (R + 22) * Math.sin(a);
        const anchor = Math.abs(cosA) < 0.35 ? 'middle' : cosA > 0 ? 'start' : 'end';
        const lines = labelLines(c.name);
        const multi = lines.length > 1;
        return (
          <text key={`lbl-${c.key}`} className="fill-white/70" style={{ fontSize: 10, letterSpacing: '0.02em' }}>
            {lines.map((ln, li) => (
              <tspan key={li} x={lx} y={ly - (multi ? 9 : 4) + li * 12} textAnchor={anchor} dominantBaseline="middle">
                {ln}
              </tspan>
            ))}
            <tspan x={lx} y={ly + (multi ? 19 : 14)} textAnchor={anchor} dominantBaseline="middle" fontSize={9.5} letterSpacing="0.08em" style={{ fill: c.color || brand.accent, fontWeight: 700 }}>
              {c.percent}%
            </tspan>
          </text>
        );
      })}
      </svg>

      {/* Hover tooltip — BYRGOP typography/colour system, no permanent labels */}
      <AnimatePresence>
        {hover && (
          <motion.div
            key="radar-tooltip"
            initial={{ opacity: 0, y: 4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-xl border border-white/10 bg-ink-850/95 px-3.5 py-2 shadow-card backdrop-blur-md"
            style={{
              left: `${(hover.x / VW) * 100}%`,
              top: `${(hover.y / VH) * 100}%`,
              marginTop: '-3.2rem',
            }}
          >
            <p className="font-display flex items-center gap-2 whitespace-nowrap text-sm font-semibold" style={{ color: premiumWhite.soft }}>
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: hover.c.color || brand.accent }} />
              {hover.c.name}
            </p>
            <p className="font-display text-right text-base font-bold tabular-nums" style={{ color: hover.c.color || brand.accent }}>
              {hover.c.percent}%
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Circular overall score indicator ───────────────────── */
function ScoreRing({ percent, size = 190, label = 'Overall' }) {
  const color = bandColor(percent >= 80 ? 'STRONG FOUNDATION' : percent >= 63 ? 'MODERATE PERFORMANCE' : percent >= 44 ? 'SIGNIFICANT GAPS' : '');
  const r = 85;
  const circ = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 200 200" className="h-full w-full">
        <circle cx={100} cy={100} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={12} />
        <motion.circle
          cx={100}
          cy={100}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ * (1 - percent / 100) }}
          transition={{ duration: 1.5, delay: 0.4, ease }}
          transform="rotate(-90 100 100)"
          style={{ filter: `drop-shadow(0 0 12px ${color}66)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-[10px] font-medium uppercase tracking-[0.25em]" style={{ color: premiumWhite.soft }}>
          {label}
        </span>
        <motion.span
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="font-display text-5xl font-bold tabular-nums"
          style={{ color: premiumWhite.bright }}
        >
          {percent}
          <span className="text-2xl">%</span>
        </motion.span>
      </div>
    </div>
  );
}

function ContextChips({ businessTypeLabel, domainLabel }) {
  if (!businessTypeLabel && !domainLabel) return null;
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {businessTypeLabel && (
        <span className="font-display inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-1.5 text-xs font-medium" style={{ color: premiumWhite.warm }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: brand.mark[0] }} />
          {businessTypeLabel}
        </span>
      )}
      {domainLabel && (
        <span className="font-display inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-1.5 text-xs font-medium" style={{ color: premiumWhite.warm }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: brand.mark[3] }} />
          {domainLabel}
        </span>
      )}
    </div>
  );
}

// Email validation regex
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const COUNTRY_CODES = [
  { code: '+1', label: 'US / Canada (+1)' },
  { code: '+44', label: 'UK (+44)' },
  { code: '+61', label: 'Australia (+61)' },
  { code: '+91', label: 'India (+91)' },
  { code: '+971', label: 'UAE (+971)' },
  { code: '+65', label: 'Singapore (+65)' },
  { code: '+27', label: 'South Africa (+27)' },
  { code: '+49', label: 'Germany (+49)' },
  { code: '+33', label: 'France (+33)' },
  { code: '+81', label: 'Japan (+81)' },
  { code: '+86', label: 'China (+86)' },
  { code: '+52', label: 'Mexico (+52)' },
];

// Phone validation rules keyed by country code. India (+91) requires exactly 10
// digits; all other countries accept a generic 4–15 digit local number, matching
// the backend PHONE_RULES. Only digits are considered — spaces/characters never
// count toward the length.
const PHONE_RULES = {
  '+91': { exact: 10, max: 10, error: 'Indian phone number must be exactly 10 digits' },
};

function phoneDigits(raw) {
  return String(raw || '').replace(/\D/g, '');
}

function isPhoneValid(countryCode, raw) {
  const digits = phoneDigits(raw);
  const rule = PHONE_RULES[countryCode];
  if (rule) return digits.length === rule.exact;
  return digits.length >= 4 && digits.length <= 15;
}

function phoneErrorFor(countryCode, raw) {
  const digits = phoneDigits(raw);
  if (!digits) return 'Phone number is required';
  const rule = PHONE_RULES[countryCode];
  if (rule) return digits.length !== rule.exact ? rule.error : '';
  if (digits.length < 4 || digits.length > 15) return 'Enter a valid phone number';
  return '';
}

function ReportRequestModal({ open, sessionId, prefilledEmail, existing, onClose, onSaved }) {
  const [ownerName, setOwnerName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setOwnerName(existing?.ownerName || '');
    setCompanyName(existing?.companyName || '');
    setEmail(existing?.email || prefilledEmail || '');
    setWebsite(existing?.website || '');
    setCountryCode(existing?.countryCode || '+91');
    setPhone(existing?.phone || '');
    setSaving(false);
    setError(null);
  }, [open, sessionId]); // only reset when opening (existing/prefilledEmail are stable per open)

  if (!open) return null;

  const isEmailValid = EMAIL_RE.test(email.trim());
  const phoneValid = isPhoneValid(countryCode, phone);
  const phoneError = phoneErrorFor(countryCode, phone);
  const canSubmit =
    ownerName.trim() &&
    companyName.trim() &&
    isEmailValid &&
    phoneValid &&
    !saving;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!ownerName.trim() || !companyName.trim() || !isEmailValid) {
      setError('Please fill all required fields with a valid email.');
      return;
    }
    if (!phoneValid) {
      setError(phoneError || 'Please enter a valid phone number.');
      return;
    }
    setSaving(true);
    try {
      const resp = await api.submitKYReportRequest(sessionId, {
        ownerName: ownerName.trim(),
        companyName: companyName.trim(),
        email: email.trim().toLowerCase(),
        website: website.trim() || undefined,
        countryCode,
        phone: phoneDigits(phone),
      });
      onSaved({
        ownerName: ownerName.trim(),
        companyName: companyName.trim(),
        email: email.trim().toLowerCase(),
        website: website.trim() || null,
        countryCode,
        phone: phoneDigits(phone),
        requested: true,
        submittedAt: new Date().toISOString(),
        emailStatus: resp?.emailStatus || null,
        emailMessageId: resp?.emailMessageId || null,
      });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
        onClick={onClose}
        data-testid="report-request-modal"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          transition={{ duration: 0.25, ease }}
          className="my-auto w-full max-w-lg rounded-2xl border border-white/10 bg-ink-850 p-6 shadow-card"
          style={{ color: premiumWhite.bright }}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-bold" style={{ color: premiumWhite.bright }}>
                Complete Report Delivery
              </h2>
              <p className="font-display mt-1 text-sm" style={{ color: premiumWhite.soft }}>
                Tell us where to send your complete BYRGOP report.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              data-testid="report-request-close"
              className="rounded-lg border border-white/10 p-1.5 text-mist-muted transition-colors hover:text-mist"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Business Owner Name *" className="sm:col-span-2">
              <input type="text" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Owner name" data-testid="rr-owner" className={inputCls} />
            </Field>
            <Field label="Company Name *" className="sm:col-span-2">
              <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Company name" data-testid="rr-company" className={inputCls} />
            </Field>
            <Field label="Email *" className="sm:col-span-2">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" data-testid="rr-email" className={inputCls} autoComplete="email" />
            </Field>
            <Field label="Company Website" className="sm:col-span-2">
              <input type="text" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://company.com (optional)" data-testid="rr-website" className={inputCls} />
            </Field>
            <Field label="Country Code" className="sm:col-span-1">
              <select value={countryCode} onChange={(e) => setCountryCode(e.target.value)} data-testid="rr-country-code" className={inputCls}>
                {COUNTRY_CODES.map((c) => (
                  <option key={c.code + c.label} value={c.code}>{c.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Phone Number *" className="sm:col-span-1">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, ''))}
                placeholder="Digits only"
                data-testid="rr-phone"
                className={inputCls}
                maxLength={PHONE_RULES[countryCode]?.max || 15}
                aria-invalid={!!phone && !phoneValid}
              />
              {!!phone && !phoneValid && (
                <span className="font-display mt-1 block text-[11px]" style={{ color: brand.palette.red[400] }} data-testid="rr-phone-error">
                  {phoneError}
                </span>
              )}
            </Field>

            {error && (
              <p className="font-display sm:col-span-2 text-sm" style={{ color: brand.palette.red[400] }} data-testid="rr-error">
                {error}
              </p>
            )}

            <div className="sm:col-span-2 mt-2 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-semibold text-mist-muted transition-colors hover:text-mist"
              >
                Cancel
              </button>
              <PrimaryButton
                type="submit"
                disabled={!canSubmit}
                className="font-display px-6 py-2.5 text-sm font-bold"
                data-testid="rr-submit"
              >
                {saving ? (
                  <>
                    <ByrgopLoader />
                    <span>Sending report...</span>
                  </>
                ) : (
                  'Submit'
                )}
              </PrimaryButton>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Field({ label, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="font-display mb-1.5 block text-xs font-medium uppercase tracking-[0.15em]" style={{ color: premiumWhite.soft }}>
        {label}
      </span>
      {children}
    </label>
  );
}

const inputCls = 'w-full rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2.5 text-sm outline-none transition-colors focus:border-white/25 disabled:opacity-50';

/* ── Main ───────────────────────────────────────────────── */
export default function KnowYourselfResult({ result, sessionId, onExplore, onLogoClick, onLogout }) {
  const data = result?.result;
  const isV2 = !!data?.version && Array.isArray(data.categories);

  // Complete-report delivery request (collected + stored only — no email yet).
  const [reportOpen, setReportOpen] = useState(false);
  const [reportDone, setReportDone] = useState(!!result?.reportRequest?.requested);
  const [reportExisting, setReportExisting] = useState(result?.reportRequest || null);
  const [reportEmailStatus, setReportEmailStatus] = useState(result?.reportRequest?.emailStatus || null);

  /* Legacy sessions (pre-redesign): simple readable summary. */
  if (!isV2) {
    const score = data?.score ?? 0;
    const maxScore = data?.maxScore ?? 80;
    const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    return (
      <div className="relative flex min-h-screen flex-col overflow-hidden bg-page px-6 py-24">
        {/* Top gradient line - matching IntroScreen */}
        <motion.div
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${brand.palette.blue[500]}, ${brand.palette.yellow[500]}, ${brand.palette.purple[500]}, transparent)`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.4 }}
        />

        {/* Subtle background glow - matching IntroScreen */}
        <div className="pointer-events-none absolute inset-0 opacity-30">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-purple-500/10 blur-3xl" />
          <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-blue-500/10 blur-3xl" />
        </div>

        {/* Logo - Top Left — clickable, returns to landing - matching IntroScreen */}
        <motion.div
          className="absolute top-4 left-4 z-10 sm:top-6 sm:left-6 lg:top-8 lg:left-8"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease }}
        >
          <button type="button" onClick={onLogoClick} className="cursor-pointer bg-transparent border-0 p-0" aria-label="Return to home page">
            <img src="/byrgop_logo_1.jpeg" alt="BYRGOP" className="h-12 w-auto object-contain drop-shadow-lg transition-opacity hover:opacity-80 sm:h-16 md:h-20 lg:h-24" />
          </button>
        </motion.div>

        {/* Telugu & Hindi - Top Right - matching IntroScreen */}
        <motion.div
          className="absolute top-4 right-4 z-10 flex flex-col items-end gap-1 sm:top-6 sm:right-6 lg:top-8 lg:right-8"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease }}
        >
          <span
            className="font-display text-base font-semibold tracking-wider leading-none sm:text-lg md:text-xl lg:text-2xl xl:text-3xl"
            style={{ color: premiumWhite.bright }}
          >
            బిర్ గాప్
          </span>
          <span
            className="font-display text-base font-semibold tracking-wider leading-none sm:text-lg md:text-xl lg:text-2xl xl:text-3xl"
            style={{ color: premiumWhite.bright }}
          >
            बिरगाप
          </span>
        </motion.div>

        <div className="relative z-10 flex flex-col items-center justify-center">
          <ContextChips businessTypeLabel={result.businessTypeLabel} domainLabel={result.domainLabel || data?.domainLabel} />
          <h1 className="font-display mt-8 text-center text-3xl font-bold sm:text-4xl md:text-5xl" style={{ color: premiumWhite.bright }}>
            Business <span className="font-display font-semibold italic" style={{ color: brand.accent }}>Assessment</span>
          </h1>
          <div className="mt-10 flex flex-col items-center">
            <ScoreRing percent={pct} label="Score" />
            <h2 className="font-display mt-6 text-2xl font-bold uppercase tracking-[0.12em]" style={{ color: bandColor(data?.band) }}>
              {data?.band}
            </h2>
            <p className="font-display mt-2 max-w-md text-center text-sm leading-relaxed" style={{ color: premiumWhite.warm }}>
              {data?.message}
            </p>
          </div>
          <p className="mt-8 text-xs" style={{ color: premiumWhite.soft }}>
            Earlier assessment format — take a new assessment for a full six-dimension analysis.
          </p>
          <div className="mt-10">
            <PrimaryButton onClick={onExplore} className="font-display min-w-[13rem] px-6 py-2.5 text-xl font-bold tracking-[0.05em]">
              Explore BYRGOP
            </PrimaryButton>
          </div>
        </div>
      </div>
    );
  }

  const cats = data.categories;
  const [view, setView] = useState('radar');
  const pillarData = useMemo(() => toPillarData(cats), [cats]);

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-page px-5 pb-16 pt-20 sm:px-10">
      {/* Top gradient line - matching IntroScreen */}
      <motion.div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${brand.palette.blue[500]}, ${brand.palette.yellow[500]}, ${brand.palette.purple[500]}, transparent)`,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.4 }}
      />

      {/* Subtle background glow - matching IntroScreen */}
      <div className="pointer-events-none absolute inset-0 opacity-30">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-purple-500/10 blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      {/* Logo - Top Left - matching IntroScreen */}
      <motion.div
        className="absolute top-4 left-4 z-10 sm:top-6 sm:left-6 lg:top-8 lg:left-8"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease }}
      >
        <button type="button" onClick={onLogoClick} className="cursor-pointer bg-transparent border-0 p-0" aria-label="Return to home page">
          <img src="/byrgop_logo_1.jpeg" alt="BYRGOP" className="h-12 w-auto object-contain drop-shadow-lg transition-opacity hover:opacity-80 sm:h-16 md:h-20 lg:h-24" />
        </button>
      </motion.div>

      {/* Telugu & Hindi - Top Right - matching IntroScreen */}
      <motion.div
        className="absolute top-4 right-4 z-10 flex flex-col items-end gap-1 sm:top-6 sm:right-6 lg:top-8 lg:right-8"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease }}
      >
        <span
          className="font-display text-base font-semibold tracking-wider leading-none sm:text-lg md:text-xl lg:text-2xl xl:text-3xl"
          style={{ color: premiumWhite.bright }}
        >
          బిర్‌గాప్
        </span>
        <span
          className="font-display text-base font-semibold tracking-wider leading-none sm:text-lg md:text-xl lg:text-2xl xl:text-3xl"
          style={{ color: premiumWhite.bright }}
        >
          बिरगाप
        </span>
      </motion.div>

      {/* Logout button - Top Right */}
      {onLogout && (
        <motion.div
          className="absolute top-4 right-4 z-10 sm:top-6 sm:right-6 lg:top-8 lg:right-8"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease }}
        >
          <button
            type="button"
            onClick={onLogout}
            className="font-display text-xs font-medium px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.03] text-white/70 hover:text-white hover:border-white/20 hover:bg-white/10 transition-all"
            aria-label="Log out"
          >
            Logout
          </button>
        </motion.div>
      )}

      {/* Header */}
      <header className="relative z-10 flex flex-col items-center text-center">
        <span className="font-display text-[10px] font-medium uppercase tracking-[0.32em]" style={{ color: premiumWhite.soft }}>
          {brand.tagline}
        </span>
        <h1 className="font-display mt-2 text-2xl font-bold uppercase tracking-wide sm:text-3xl md:text-5xl" style={{ color: premiumWhite.bright }}>
          Business <span className="font-display italic normal-case font-semibold" style={{ color: brand.accent }}>Health</span> Score
        </h1>
        <div className="mt-5">
          <ContextChips
            businessTypeLabel={result.businessTypeLabel || data.businessTypeLabel}
            domainLabel={result.domainLabel || data.domainLabel}
          />
        </div>
      </header>

      {/* Score / status — kept independent from the visualization switcher */}
      <motion.section
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease }}
        className="relative z-10 mx-auto mt-8 flex w-full max-w-4xl flex-col items-center"
      >
        <ScoreRing percent={data.overallPercent} />
        <h2 className="font-display mt-4 text-lg font-bold uppercase tracking-[0.12em]" style={{ color: bandColor(data.band) }}>
          {data.band}
        </h2>
      </motion.section>

      {/* Hero: visualization heading → selector → dedicated large stage */}
      <main className="relative z-10 mx-auto mt-10 w-full max-w-[1050px]">
        <div className="text-center">
          <p className="font-display text-[10px] font-medium uppercase tracking-[0.32em]" style={{ color: premiumWhite.soft }}>
            Assessment Visualization
          </p>
          <h2 className="font-display mt-2 text-xl font-bold sm:text-3xl" style={{ color: premiumWhite.bright }}>
            See the full picture
          </h2>
          <p className="font-display mx-auto mt-1.5 max-w-md text-sm" style={{ color: premiumWhite.warm }}>
            Explore your six-pillar business health across different visual formats.
          </p>
        </div>

        <div className="mt-6 sm:mt-7">
          <VisualizationSelector value={view} onChange={setView} />
        </div>

        <ResultVisualizationStage>
          <VisualizationArea
            view={view}
            data={pillarData}
            overall={data.overallPercent}
            radarSlot={<RadarChart categories={cats} />}
          />
        </ResultVisualizationStage>
      </main>

      {/* Six category scores */}
      <section className="relative z-10 mx-auto mt-10 w-full max-w-4xl sm:mt-14">
        <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4">
          {cats.map((c, i) => (
            <motion.div
              key={c.key}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.08, duration: 0.5, ease }}
              className="overflow-hidden rounded-2xl border border-white/[0.09] bg-white/[0.03]"
            >
              <div className="h-1 w-full" style={{ background: c.color }} />
              <div className="px-4 py-3.5 sm:px-5">
                <p className="font-display truncate text-xs font-medium" style={{ color: premiumWhite.soft }}>
                  {c.name}
                </p>
                <p className="font-display mt-1 text-2xl font-bold tabular-nums sm:text-3xl" style={{ color: premiumWhite.bright }}>
                  {c.percent}
                  <span className="text-base">%</span>
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Not Applicable count — informational only, never part of the donut */}
      {data.notApplicableCount != null && data.notApplicableCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.5, ease }}
          className="relative z-10 mx-auto mt-5 w-full max-w-4xl"
        >
          <p
            className="font-display text-center text-sm"
            style={{ color: premiumWhite.soft }}
            data-testid="ky-na-count"
          >
            You marked <span className="font-semibold" style={{ color: premiumWhite.warm }}>{data.notApplicableCount}</span>{" "}
            {data.notApplicableCount === 1 ? 'question' : 'questions'} as Not Applicable.
          </p>
        </motion.div>
      )}

      {/* Primary insight — driven by the lowest category score */}
      {data.priority && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.15, duration: 0.65, ease }}
          className="relative z-10 mx-auto mt-6 w-full max-w-4xl overflow-hidden rounded-2xl border px-6 py-5 sm:px-8"
          style={{ borderColor: `${data.priority.color}40`, background: `${data.priority.color}0d` }}
        >
          <span className="font-display text-[10px] font-semibold uppercase tracking-[0.24em]" style={{ color: `${data.priority.color}cc` }}>
            Primary area to strengthen
          </span>
          <p className="font-display mt-1.5 text-xl font-bold sm:text-2xl" style={{ color: premiumWhite.bright }}>
            {data.priority.name}
          </p>
          <p className="font-display mt-0.5 text-sm tabular-nums" style={{ color: data.priority.color }}>
            {data.priority.percent}% · {data.priority.score} of {data.priority.maxScore} points
          </p>
          <p className="font-display mt-1.5 max-w-2xl text-sm leading-relaxed" style={{ color: premiumWhite.warm }}>
            Focusing here offers the greatest opportunity to lift your overall business health.
          </p>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 1.3, ease }}
        className="relative z-10 mt-12 flex flex-col items-center"
      >
        {/* Complete-report request prompt — available to every completed user */}
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-5 text-center" data-testid="report-prompt">
          <p className="font-display text-sm" style={{ color: premiumWhite.warm }}>
            {reportDone ? (reportEmailStatus === 'sent' ? '✓ Your full report is on its way' : '✓ Details saved successfully') : 'Want to get the complete report delivered to your email?'}
          </p>
          <PrimaryButton
            onClick={() => setReportOpen(true)}
            className="font-display mt-4 px-6 py-2.5 text-sm font-bold"
            data-testid="report-yes"
          >
            {reportDone ? 'UPDATE DETAILS' : 'Yes'}
          </PrimaryButton>
          <p className="font-display mt-2 text-[11px]" style={{ color: premiumWhite.soft }}>
            {reportDone
              ? reportEmailStatus === 'sent'
                ? `We've emailed the full 3-page report to ${reportExisting?.email ? `the address provided` : 'your address'}.`
                : reportEmailStatus === 'failed'
                  ? "We couldn't email the report right now — our team will reach out."
                  : "We'll send it to the address you provided."
              : "We'll send it to the address you provide below."}
          </p>
        </div>

        <PrimaryButton onClick={onExplore} className="font-display min-w-[13rem] px-6 py-2.5 text-xl font-bold tracking-[0.05em] mt-6">
          Explore BYRGOP
        </PrimaryButton>
      </motion.div>

      <ReportRequestModal
        open={reportOpen}
        sessionId={sessionId}
        prefilledEmail={result?.email || ''}
        existing={reportExisting}
        onClose={() => setReportOpen(false)}
        onSaved={(data) => {
          setReportOpen(false);
          setReportDone(true);
          if (data?.emailStatus) setReportEmailStatus(data.emailStatus);
          if (data) setReportExisting((prev) => ({ ...(prev || {}), ...data }));
        }}
      />
    </div>
  );
}