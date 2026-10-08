import { useState } from 'react';
import { motion } from 'framer-motion';
import PrimaryButton from '../components/PrimaryButton.jsx';
import { brand } from '../theme/brand.js';

const ease = [0.22, 1, 0.36, 1];
const premiumWhite = brand.premiumWhite;

// Timer gold — matches the default `goldMain` used by the Timer component.
const TIMER_GOLD = '#FCA700';

// Pale cream highlight band used by the shine sweep.
const SHINE_HIGHLIGHT = '#FFF3D6';

// Card accents drawn from the official six-colour mark.
const CARD_ACCENTS = [brand.mark[0], brand.mark[3], brand.mark[5]];

/**
 * Render a copy body, honouring the only markup the backend sends: `**bold**`.
 *
 * The emphasised figures ("8–10 minutes") used to be `<strong>` in JSX. Moving
 * the copy into the backend's per-root table meant it became a string, so the
 * emphasis is expressed as markup and turned back into real `<strong>` here
 * rather than being flattened to plain text.
 */
function RichText({ text }) {
  const parts = String(text ?? '').split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={i} className="font-bold">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

// The "Welcome to the Profit Architecture Diagnostic (PAD)" copy is the same
// for every business type. It is intentionally a fixed constant here rather
// than read from the per-root `content` prop, so a Non-Profit or Start-Up user
// sees the identical wording as Manufacturing & Services.
const ABOUT_PAD = {
  title: 'Welcome to the Profit Architecture Diagnostic (PAD)',
  body:
    "Built on BYRGOP's Business Profit Architecture (BPA) framework, this diagnostic assesses six core " +
    'operational pillars to uncover hidden profit leaks and growth opportunities. Complete 18 targeted questions ' +
    'in 8–10 minutes to receive an immediate, complimentary report detailing prioritized optimization strategies ' +
    'for your business.',
};

export default function DisclaimerScreen({
  onAccept,
  onDecline,
  onLogoClick,
  // The copy for the business type the user is actually being assessed as,
  // resolved from `/know-yourself/meta` by the caller (`rootContentFor`) from
  // the CURRENT in-session business type — never from stale localStorage.
  //
  // This screen used to hard-code one block of Manufacturing & Services copy
  // for every root, so a Non-Profit user was told this was "BYRGOP's Business
  // Profit Architecture … hidden profit leaks" and read terms about their
  // "business". `content` is now required from the caller; the default below
  // is that same previous text so the component still renders standalone.
  //
  // NOTE: only `screenTitle` and `terms` come from the caller now. Box 2
  // ("Welcome to the Profit Architecture Diagnostic") uses the fixed
  // ABOUT_PAD constant above, so every business type sees the same text there.
  content = {
    entity: 'your business',
    resultActionLabel: 'Your Business',
    resultHeadingLabel: 'Your Business',
    screenTitle: 'Welcome to the Profit Architecture Diagnostic (PAD)',
    terms: {
      title: 'Disclaimer & Terms of Use',
      body:
        'This diagnostic is a proprietary strategic tool intended solely for informational guidance. It does not ' +
        'constitute formal legal, financial, tax, or investment advice, and financial results are not guaranteed. ' +
        'All underlying frameworks and intellectual property remain our exclusive property and may not be reproduced ' +
        'without written consent.',
    },
  },
}) {
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);

  // Only disclaimer must be checked
  const canContinue = disclaimerAccepted;

  const handleContinue = () => {
    if (!canContinue) return;
    onAccept({ email: '' });
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
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease }}
          className="text-center mb-8"
        >
          <h2 className="font-sans text-2xl sm:text-3xl font-bold" style={{ color: premiumWhite.bright }}>
            {content.screenTitle}
          </h2>
        </motion.div>

        {/* Two Boxes - One by One (Vertical) */}
        <div className="flex w-full max-w-3xl flex-col gap-4">
          {/* Box 1: Disclaimer & Terms of Use - Red hover */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease }}
            whileHover={{ scale: 1.01, y: -2 }}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 flex flex-col transition-all duration-300 hover:border-red-500/50 hover:bg-red-500/[0.05]"
          >
            <h3 className="font-sans text-base sm:text-lg font-semibold mb-3 text-center" style={{ color: premiumWhite.bright }}>
              {content.terms.title}
            </h3>
            <div className="flex-1 space-y-3 text-xs sm:text-sm leading-relaxed" style={{ color: premiumWhite.warm }}>
              <p className="font-sans">
                <RichText text={content.terms.body} />
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-white/10">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={disclaimerAccepted}
                  onChange={(e) => setDisclaimerAccepted(e.target.checked)}
                  className="mt-1 h-5 w-5 shrink-0 rounded border-white/20 bg-white/5 accent-[#C68505] cursor-pointer"
                />
                <span className="font-sans text-sm" style={{ color: premiumWhite.warm }}>
                  I reviewed and accept the Disclaimer.
                </span>
              </label>
            </div>
          </motion.div>

          {/* Box 2: About PAD - Green hover. Uses the fixed ABOUT_PAD constant
              so every business type sees the same text here. */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease }}
            whileHover={{ scale: 1.01, y: -2 }}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 flex flex-col transition-all duration-300 hover:border-green-500/50 hover:bg-green-500/[0.05]"
          >
            <h3 className="font-sans text-base sm:text-lg font-semibold mb-3 text-center" style={{ color: premiumWhite.bright }}>
              {ABOUT_PAD.title}
            </h3>
            <div className="flex-1 space-y-3 text-xs sm:text-sm leading-relaxed" style={{ color: premiumWhite.warm }}>
              <p className="font-sans">
                <RichText text={ABOUT_PAD.body} />
              </p>
            </div>
          </motion.div>
        </div>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.8, ease }}
          className="mt-8 sm:mt-10 flex w-full max-w-3xl flex-col sm:flex-row items-center gap-3 sm:justify-between"
        >
          {/* Go Back - Left on desktop, Bottom on mobile. Permanent gold shine. */}
          <PrimaryButton
            onClick={onDecline}
            className="disclaimer-shine-btn font-sans w-full sm:w-auto min-w-[8rem] px-6 py-3 text-base font-bold tracking-[0.05em] overflow-hidden order-2 sm:order-1"
            style={{ 
              background: brand.accent,
              color: '#0A0D16',
              borderColor: brand.accent,
              border: '2px solid',
            }}
          >
            <span className="disclaimer-shine-label">Go Back</span>
          </PrimaryButton>

          {/* Continue - Right on desktop, Top on mobile. Permanent gold shine
              when enabled; calm and disabled-styled when not. */}
          <PrimaryButton
            onClick={handleContinue}
            disabled={!canContinue}
            className={`disclaimer-shine-btn font-sans w-full sm:w-auto min-w-[8rem] px-6 py-3 text-base font-bold tracking-[0.05em] overflow-hidden order-1 sm:order-2 ${
              canContinue ? '' : 'disclaimer-shine-off'
            }`}
            style={{ 
              background: canContinue ? brand.accent : 'rgba(255,255,255,0.08)',
              color: canContinue ? '#0A0D16' : 'rgba(255,255,255,0.3)',
              cursor: canContinue ? 'pointer' : 'not-allowed',
              borderColor: canContinue ? brand.accent : 'rgba(255,255,255,0.1)',
              border: canContinue ? '2px solid' : '2px solid rgba(255,255,255,0.1)',
            }}
          >
            <span className="disclaimer-shine-label">Continue</span>
          </PrimaryButton>
        </motion.div>
      </div>

      {/* Permanent gold shine sweep for the Go Back and Continue buttons.
          The base colour is currentColor, so each button's own text colour is
          preserved. The sweep runs continuously while the button is enabled;
          when Continue is disabled the `.disclaimer-shine-off` class removes
          the sweep so a disabled button stays calm. GPU-layer promotion keeps
          the sweep animating reliably on Intel UHD 620 devices. */}
      <style>{`
        .disclaimer-shine-label {
          display: inline-block;
          color: currentColor;
          background-image: linear-gradient(
            100deg,
            currentColor 0%,
            currentColor 35%,
            ${SHINE_HIGHLIGHT} 50%,
            currentColor 65%,
            currentColor 100%
          );
          background-size: 250% 100%;
          background-position: 200% 0;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: disclaimer-shine-sweep 3.2s ease-in-out infinite;
          will-change: background-position;
          transform: translateZ(0);
        }
        @keyframes disclaimer-shine-sweep {
          0%   { background-position: 200% 0; }
          60%  { background-position: -50% 0; }
          100% { background-position: -50% 0; }
        }

        /* Disabled state — kill the sweep so a disabled Continue button is
           calm, and restore the plain text colour. */
        .disclaimer-shine-off .disclaimer-shine-label {
          animation: none;
          background: none;
          -webkit-text-fill-color: inherit;
          color: inherit;
        }

        @media (prefers-reduced-motion: reduce) {
          .disclaimer-shine-label {
            animation: none;
            background: none;
            -webkit-text-fill-color: inherit;
            color: inherit;
          }
        }
      `}</style>
    </div>
  );
}