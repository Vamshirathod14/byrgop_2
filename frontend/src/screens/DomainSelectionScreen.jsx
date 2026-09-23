import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import PrimaryButton from '../components/PrimaryButton.jsx';
import api from '../api/client.js';
import { brand } from '../theme/brand.js';

const ease = [0.22, 1, 0.36, 1];
const premiumWhite = brand.premiumWhite;

const STATUS = { loading: 'loading', ready: 'ready', error: 'error', comingSoon: 'coming-soon' };

// Last option in the domain list. The slug has no matching Domain document, so
// the backend serves the existing generic 18-question pool for the assignment.
const OTHERS_DOMAIN = { slug: 'others', name: 'Others' };

export default function DomainSelectionScreen({
  onBegin,
  onBack,
  businessType,
  onLogoClick,
  mode = 'select',
  initialDomain = null,
}) {
  const [status, setStatus] = useState(STATUS.loading);
  const [domains, setDomains] = useState([]);
  const [selected, setSelected] = useState(null);
  const [err, setErr] = useState(null);

  const isChange = mode === 'change';

  // Dedupe fetches across React StrictMode's dev double-invoke of the mount
  // effect (mount -> cleanup -> mount). Only one fetch fires per distinct
  // (businessType, initialDomain) input; a genuine change still refetches.
  const fetchedKeyRef = useRef(null);

  const loadDomains = async () => {
    setStatus(STATUS.loading);
    setErr(null);
    setSelected(null);
    try {
      const data = await api.domains(businessType?.key);
      if (!Array.isArray(data) || data.length === 0) {
        // No available domains for the selected business type — its assessment
        // is not ready yet (e.g. Startup / Non-Profit). Shown explicitly as a
        // "Coming Soon" state instead of a broken/empty list. The backend is
        // the source of truth: adding domains for the type there automatically
        // flips this back to the normal domain-selection flow.
        setStatus(STATUS.comingSoon);
        return;
      }
      setDomains(data);
      // Preselect the domain the user already has when changing it from the
      // questions screen (preserving the other selection).
      const preselected =
        data.find((d) => d.slug === initialDomain) ||
        (initialDomain === OTHERS_DOMAIN.slug ? OTHERS_DOMAIN : null);
      setSelected(preselected || null);
      setStatus(STATUS.ready);
    } catch (e) {
      setErr(e.message);
      setStatus(STATUS.error);
    }
  };

  useEffect(() => {
    const key = `${businessType?.key ?? ''}|${initialDomain ?? ''}`;
    if (fetchedKeyRef.current === key) return;
    fetchedKeyRef.current = key;
    loadDomains();
  }, [businessType?.key, initialDomain]);

  const canStart = status === STATUS.ready && !!selected;

  const handleStart = () => {
    if (!canStart) return;
    setErr(null);
    onBegin({ domain: selected });
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-page py-6 sm:py-8">
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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] lg:w-[600px] lg:h-[600px] rounded-full bg-purple-500/10 blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-[200px] h-[200px] sm:w-[300px] sm:h-[300px] lg:w-[400px] lg:h-[400px] rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      {/* Logo - Top Left - matching IntroScreen */}
      <motion.div
        className="absolute top-4 left-4 z-10 sm:top-6 sm:left-6 lg:top-8 lg:left-8"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease }}
      >
        <button
          type="button"
          onClick={onLogoClick}
          className="cursor-pointer bg-transparent border-0 p-0"
          aria-label="Return to home page"
        >
          <img
            src="/byrgop_logo_1.jpeg"
            alt="BYRGOP"
            className="h-12 w-auto object-contain drop-shadow-lg transition-opacity hover:opacity-80 sm:h-16 md:h-20 lg:h-24"
          />
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

      {/* Content */}
      <div className="relative z-10 flex w-full max-w-4xl flex-col items-center px-5 sm:px-6 pt-12 sm:pt-16 lg:pt-20 pb-12 sm:pb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease }}
          className="flex flex-col items-center mb-8 sm:mb-10"
        >
          <h1 
            className="font-display text-center text-2xl font-bold leading-tight sm:text-4xl md:text-5xl lg:text-[4.25rem] tracking-[-0.02em] text-balance"
            style={{ color: premiumWhite.bright }}
          >
            {isChange ? 'Change Your Business' : 'Select Your Business'}{' '}
            <span className="font-display font-semibold italic" style={{ color: brand.accent }}>
              Domain
            </span>
          </h1>
          {businessType?.label && (
            <button
              type="button"
              onClick={onBack}
              title="Change business type"
              className="mx-auto mt-3 inline-flex max-w-full flex-wrap items-center justify-center gap-2 rounded-full border border-white/15 px-3 py-1.5 text-center text-xs font-medium transition-colors hover:border-white/30 sm:px-4"
              style={{ color: premiumWhite.soft }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: brand.mark[0] }} />
              {businessType.label}
              <span style={{ color: premiumWhite.soft }}>· change</span>
            </button>
          )}
        </motion.div>

        {/* Domain cards grid */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease }}
          className="w-full max-w-2xl"
        >
          {/* Loading */}
          {status === STATUS.loading && (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-8 sm:px-5 sm:py-10">
              <div
                className="h-8 w-8 animate-spin rounded-full border-2"
                style={{ borderColor: 'rgba(255,255,255,0.12)', borderTopColor: brand.accent }}
              />
              <p className="font-display text-sm" style={{ color: premiumWhite.soft }}>
                Loading domains…
              </p>
            </div>
          )}

          {/* Coming Soon (assessment not available for this business type yet) */}
          {status === STATUS.comingSoon && (
            <motion.div
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, ease }}
              className="flex flex-col items-center rounded-xl border border-white/[0.08] bg-white/[0.03] px-5 py-10 text-center sm:px-8 sm:py-14"
            >
              <span
                className="inline-flex items-center gap-1.5 rounded-full border border-brand-accent/25 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em]"
                style={{ color: brand.accent }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: brand.accent, boxShadow: `0 0 10px ${brand.accent}` }}
                />
                Coming Soon
              </span>
              <h2 className="font-display mt-4 text-xl font-bold tracking-[-0.01em] sm:text-2xl" style={{ color: premiumWhite.bright }}>
                {businessType?.label || 'This'} assessment is coming soon.
              </h2>
              <p className="font-display mt-3 max-w-md text-sm leading-relaxed sm:text-base" style={{ color: premiumWhite.warm }}>
                The Know Yourself assessment for {businessType?.label || 'this'} businesses
                isn&rsquo;t available yet — we&rsquo;re currently preparing it.
              </p>
              <button
                type="button"
                onClick={onBack}
                className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2 text-sm font-medium transition-colors hover:border-white/30"
                style={{ color: premiumWhite.bright }}
              >
                <span aria-hidden="true">←</span>
                {isChange ? 'Back to Questions' : 'Back to Business Type'}
              </button>
            </motion.div>
          )}

          {/* Error */}
          {status === STATUS.error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/[0.05] px-4 py-8 text-center sm:px-5 sm:py-10">
              <p className="font-display text-sm" style={{ color: brand.palette.red[400] }}>
                Could not load domains.
              </p>
              <PrimaryButton variant="border" onClick={loadDomains} className="mt-4">
                Retry
              </PrimaryButton>
            </div>
          )}

          {/* Domain list */}
          {status === STATUS.ready && (
            <div className="flex flex-col gap-2.5">
              {[...domains, OTHERS_DOMAIN].map((d, i) => {
                const isSel = selected?.slug === d.slug;
                return (
                  <motion.button
                    key={d.slug || d._id || i}
                    type="button"
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 + i * 0.06, duration: 0.45, ease }}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.995 }}
                    onClick={() => setSelected(d)}
                    className={`group flex items-center gap-3 rounded-xl border px-3.5 py-3.5 text-left transition-all duration-300 sm:gap-4 sm:px-5 sm:py-4 ${
                      isSel
                        ? 'border-brand-accent/40 bg-white/[0.06]'
                        : 'border-white/[0.08] bg-white/[0.025] hover:border-white/20 hover:bg-white/[0.04]'
                    }`}
                    style={
                      isSel
                        ? { boxShadow: `0 0 20px ${brand.accent}18` }
                        : undefined
                    }
                  >
                    {/* Accent dot */}
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full transition-all duration-300 ${
                        isSel ? 'scale-110' : 'opacity-40 group-hover:opacity-70'
                      }`}
                      style={{ background: isSel ? brand.accent : brand.mark[0] }}
                    />

                    {/* Domain name */}
                    <span
                      className={`min-w-0 flex-1 break-words font-display text-base font-semibold tracking-wide transition-colors duration-300 sm:text-lg ${
                        isSel ? 'text-mist' : 'text-mist-soft group-hover:text-mist'
                      }`}
                      style={{ color: isSel ? premiumWhite.bright : premiumWhite.soft }}
                    >
                      {d.name}
                    </span>

                    {/* Right indicator */}
                    <span
                      className={`shrink-0 text-sm transition-all duration-300 ${
                        isSel
                          ? 'translate-x-0 opacity-100'
                          : '-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-50'
                      }`}
                      style={{ color: isSel ? brand.accent : undefined }}
                    >
                      {isSel ? '✓' : '→'}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          )}
        </motion.section>

        {/* Error */}
        <AnimatePresence>
          {err && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="font-display mt-4 text-sm text-center break-words px-1"
              style={{ color: brand.palette.red[400] }}
            >
              {err}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Start Button */}
          {status !== STATUS.comingSoon && (
            <div className="mt-8 flex w-full flex-col items-center">
              <PrimaryButton
                onClick={handleStart}
                disabled={!canStart}
                className="font-display w-full max-w-xs sm:w-auto min-w-[6.5rem] sm:min-w-[8rem] px-6 sm:px-8 py-3 sm:py-3.5 text-base sm:text-lg lg:text-xl font-bold tracking-[0.05em] overflow-hidden"
              >
                {isChange ? 'Apply' : 'Assess'}
              </PrimaryButton>
              {!canStart && (
                <p className="font-display mt-3 text-xs text-center max-w-xs" style={{ color: premiumWhite.soft }}>
                  {status === STATUS.ready
                    ? isChange
                      ? 'Select a domain to continue.'
                      : 'Select a domain to begin.'
                    : 'Domains are loading — don\'t go anywhere.'}
                </p>
              )}
            </div>
          )}
      </div>
    </div>
  );
}