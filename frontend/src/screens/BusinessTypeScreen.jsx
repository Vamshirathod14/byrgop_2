import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../api/client.js';
import PrimaryButton from '../components/PrimaryButton.jsx';
import { brand } from '../theme/brand.js';

const ease = [0.22, 1, 0.36, 1];
const premiumWhite = brand.premiumWhite;

// Card accents drawn from the official six-colour mark.
const CARD_ACCENTS = [brand.mark[0], brand.mark[3], brand.mark[1], brand.mark[5]];

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
        // Fallback with all 4 types
        const fallback = [
          { key: 'service', label: 'Services' },
          { key: 'product', label: 'Manufacturing' },
          { key: 'ngo', label: 'Non-Profit' },
          { key: 'startup', label: 'Start-Up' },
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
    } else if (typeCount === 3) {
      return 'grid-cols-1 sm:grid-cols-3 max-w-4xl';
    } else if (typeCount === 4) {
      return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 max-w-5xl';
    } else {
      return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl';
    }
  };

  return (
    <div className="business-type-page font-fraunces relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-page py-6 sm:py-8">
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
          className="font-fraunces text-base font-semibold tracking-wider leading-none sm:text-lg md:text-xl lg:text-2xl xl:text-3xl"
          style={{ color: premiumWhite.bright }}
        >
          బిర్‌గాప్
        </span>
        <span
          className="font-fraunces text-base font-semibold tracking-wider leading-none sm:text-lg md:text-xl lg:text-2xl xl:text-3xl"
          style={{ color: premiumWhite.bright }}
        >
          बिरगाप
        </span>
      </motion.div>

      {/* Content */}
      <div className={`relative z-10 flex w-full ${typeCount >= 4 ? 'max-w-5xl' : 'max-w-4xl'} flex-col items-center px-5 sm:px-6 pt-12 sm:pt-16 lg:pt-20 pb-12 sm:pb-16`}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease }}
          className="flex w-full flex-col items-center mb-8 sm:mb-10"
        >
          {/* Heading — "Change Your Sector Type" / "Select Your Sector Type"
              stay on ONE line at every breakpoint. Sized so the longer phrase
              fits a 360px phone in Fraunces. */}
          <h1
            className="font-fraunces w-full max-w-full text-center text-xl font-bold leading-tight whitespace-nowrap sm:text-2xl md:text-3xl lg:text-4xl tracking-[-0.01em] px-2"
            style={{
              color: premiumWhite.bright,
              textShadow: '0 2px 20px rgba(0,0,0,0.5)',
            }}
          >
            {isChange ? 'Change Your ' : 'Select Your '}
            <span
              className="font-fraunces font-bold shine-gold-text tracking-normal"
              style={{ color: brand.accent }}
            >
              Sector Type
            </span>
          </h1>
          {isChange && onBack && (
            <button
              type="button"
              onClick={onBack}
              className="font-fraunces mx-auto mt-4 inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-1.5 text-xs font-medium transition-colors hover:border-white/30"
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
          <p className="font-fraunces text-sm text-center break-words" style={{ color: brand.palette.red[400] }}>
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
                  {/* Card label — font size reduced so the cards read as
                      supporting options under the heading, not as loud as
                      the heading itself. Weight also stepped down from
                      semibold to medium for the same reason. */}
                  <h2
                    className="font-fraunces text-sm font-medium sm:text-base md:text-lg"
                    style={{ color: premiumWhite.bright }}
                  >
                    {bt.label}
                  </h2>
                </div>
                <div
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
                  style={{ background: accent, transform: isSel ? 'scaleX(1)' : undefined }}
                />
                {isSel && (
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold sm:right-4 sm:top-4 sm:h-6 sm:w-6 sm:text-xs"
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
            className={`proceed-btn font-fraunces text-base sm:text-lg lg:text-xl font-bold tracking-[0.05em] ${
              selected ? 'continue-shine-btn continue-shine-active' : ''
            }`}
          >
            <span className="continue-shine-label">Continue</span>
          </PrimaryButton>
          {!selected && businessTypes && (
            <p className="font-fraunces text-xs text-center" style={{ color: premiumWhite.soft }}>
              Select a Sector type to continue.
            </p>
          )}
        </motion.div>
      </div>

      <style>{`
        /* Fraunces utility. Optical sizing stays automatic so the strokes
           adapt to every heading size. */
        .font-fraunces {
          font-family: 'Fraunces', 'Playfair Display', Georgia, 'Times New Roman', serif;
          font-optical-sizing: auto;
          font-variation-settings: 'opsz' 72, 'SOFT' 0, 'WONK' 0;
          font-feature-settings: 'lnum' 1, 'pnum' 1;
        }

        .shine-gold-text {
          position: relative;
          display: inline-block;
          padding-top: 0.05em;
          padding-bottom: 0.28em;
          margin-bottom: -0.28em;
          padding-right: 0.08em;
          padding-left: 0.04em;
          letter-spacing: 0.02em;
          font-weight: 700;
          overflow: visible;
          background-image: linear-gradient(
            100deg,
            #FCA700 0%,
            #F59E0B 25%,
            #FFF8E1 50%,
            #F59E0B 75%,
            #FCA700 100%
          );
          background-size: 250% 100%;
          background-position: 200% 0;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent !important;
          filter: drop-shadow(0 0 5px rgba(252, 167, 0, 0.4));
          animation: shine-gold-sweep 3s ease-in-out infinite;
        }

        @keyframes shine-gold-sweep {
          0%   { background-position: 200% 0; }
          60%  { background-position: -50% 0; }
          100% { background-position: -50% 0; }
        }

        .continue-shine-btn {
          position: relative;
        }

        .continue-shine-label {
          display: inline-block;
          color: inherit;
        }

        .continue-shine-active .continue-shine-label {
          background-image: linear-gradient(
            100deg,
            #060B13 0%,
            #060B13 28%,
            #FFFFFF 48%,
            #FFFDF5 52%,
            #060B13 72%,
            #060B13 100%
          );
          background-size: 250% 100%;
          background-position: 200% 0;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent !important;
          animation: continue-shine-sweep 3s ease-in-out infinite;
          will-change: background-position;
          transform: translateZ(0);
        }

        .continue-shine-active:hover:not(:disabled) .continue-shine-label,
        .continue-shine-active:focus-visible:not(:disabled) .continue-shine-label {
          animation-duration: 1.5s;
        }

        @keyframes continue-shine-sweep {
          0%   { background-position: 200% 0; }
          65%  { background-position: -60% 0; }
          100% { background-position: -60% 0; }
        }

        @media (prefers-reduced-motion: reduce) {
          .shine-gold-text {
            animation: none;
            background: none;
            -webkit-text-fill-color: #FCA700 !important;
            color: #FCA700;
          }
          .continue-shine-active .continue-shine-label {
            animation: none;
            background: none;
            -webkit-text-fill-color: currentColor !important;
          }
        }
      `}</style>
    </div>
  );
}