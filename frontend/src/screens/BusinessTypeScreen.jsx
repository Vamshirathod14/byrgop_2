import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../api/client.js';
import PrimaryButton from '../components/PrimaryButton.jsx';
import { brand } from '../theme/brand.js';

const ease = [0.22, 1, 0.36, 1];
const premiumWhite = brand.premiumWhite;

// Card accents drawn from the official six-colour mark.
const CARD_ACCENTS = [brand.mark[0], brand.mark[3], brand.mark[5]];

export default function BusinessTypeScreen({ onSelect, onLogoClick, onBack, mode = 'select', initialKey = null }) {
  const [businessTypes, setBusinessTypes] = useState(null);
  const [selected, setSelected] = useState(null);
  const [err, setErr] = useState(null);

  const isChange = mode === 'change';

  // Dedupe the config fetch across React StrictMode's dev double-invoke of the
  // mount effect; the screen's remount-on-key change still refetches fresh.
  const fetchedKeyRef = useRef(null);

  useEffect(() => {
    const key = initialKey ?? '';
    if (fetchedKeyRef.current === key) return;
    fetchedKeyRef.current = key;
    api
      .kyMeta()
      .then((meta) => {
        // Get all business types from admin - dynamic
        const types = meta.businessTypes || [];
        setBusinessTypes(types);
        if (initialKey) {
          setSelected(types.find((bt) => bt.key === initialKey) || null);
        }
      })
      .catch((e) => {
        setErr(e.message);
        // Fallback with all 3 types
        const fallback = [
          { key: 'service', label: 'Service Based' },
          { key: 'product', label: 'Product Based' },
          { key: 'ngo', label: 'NGO / Non-Profit' },
        ];
        setBusinessTypes(fallback);
        if (initialKey) {
          setSelected(fallback.find((bt) => bt.key === initialKey) || null);
        }
      });
  }, [initialKey]);

  // Logo click handler
  const handleLogoClick = () => {
    if (onLogoClick) {
      onLogoClick();
    }
  };

  // Get the number of business types
  const typeCount = (businessTypes || []).length;

  // Determine grid columns based on count
  const getGridClasses = () => {
    if (typeCount === 1) {
      return 'grid-cols-1 max-w-xs mx-auto';
    } else if (typeCount === 2) {
      return 'grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto';
    } else {
      return 'grid-cols-1 sm:grid-cols-3 max-w-4xl';
    }
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
          onClick={handleLogoClick}
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
            {isChange ? 'Change Your' : 'Select Your'}{' '}
            <span className="font-display font-semibold italic" style={{ color: brand.accent }}>
              Business Type
            </span>
          </h1>
          {isChange && onBack && (
            <button
              type="button"
              onClick={onBack}
              className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-1.5 text-xs font-medium transition-colors hover:border-white/30"
              style={{ color: premiumWhite.soft }}
            >
              ← Back to questions
            </button>
          )}
        </motion.div>

        {!businessTypes && !err && (
          <div
            className="h-8 w-8 animate-spin rounded-full border-2"
            style={{ borderColor: 'rgba(255,255,255,0.12)', borderTopColor: brand.accent }}
          />
        )}

        {err && (
          <p className="font-display text-sm text-center break-words" style={{ color: brand.palette.red[400] }}>
            Could not load configuration — using defaults.
          </p>
        )}

        {/* Dynamic Grid - adapts to number of business types */}
        <div className={`grid w-full gap-4 sm:gap-5 mt-2 ${getGridClasses()}`}>
          {(businessTypes || []).map((bt, i) => {
            const accent = CARD_ACCENTS[i % CARD_ACCENTS.length];
            const isSel = selected?.key === bt.key;
            return (
              <motion.button
                key={bt.key}
                type="button"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + i * 0.12, duration: 0.6, ease }}
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelected(bt)}
                className={`group relative overflow-hidden rounded-2xl border p-5 text-center transition-all duration-300 sm:p-7 min-h-[5.75rem] sm:min-h-[140px] flex items-center justify-center ${
                  isSel ? 'bg-white/[0.07]' : 'border-white/[0.10] bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.05]'
                }`}
                style={isSel ? { borderColor: accent, boxShadow: `0 0 32px ${accent}33` } : undefined}
              >
                <div className="flex flex-col items-center">
                  <h2 className="font-display text-xl font-semibold sm:text-2xl" style={{ color: premiumWhite.bright }}>
                    {bt.label}
                  </h2>
                  {bt.description && (
                    <p className="font-display mt-2 text-sm leading-relaxed" style={{ color: premiumWhite.warm }}>
                      {bt.description}
                    </p>
                  )}
                </div>
                <div
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
                  style={{ background: accent, transform: isSel ? 'scaleX(1)' : undefined }}
                />
                {isSel && (
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold sm:right-5 sm:top-5"
                    style={{ background: `${accent}26`, color: accent }}
                  >
                    ✓
                  </motion.span>
                )}
              </motion.button>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.8, ease }}
          className="mt-8 sm:mt-12 flex w-full flex-col items-center gap-3"
        >
          <PrimaryButton
            onClick={() => selected && onSelect(selected.key, selected.label)}
            disabled={!selected}
            className="font-display w-full max-w-xs sm:w-auto min-w-[6.5rem] sm:min-w-[8rem] px-6 sm:px-8 py-3 sm:py-3.5 text-base sm:text-lg lg:text-xl font-bold tracking-[0.05em] overflow-hidden"
          >
            Continue
          </PrimaryButton>
          {!selected && businessTypes && (
            <p className="font-display text-xs text-center" style={{ color: premiumWhite.soft }}>
              Select a business type to continue.
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}