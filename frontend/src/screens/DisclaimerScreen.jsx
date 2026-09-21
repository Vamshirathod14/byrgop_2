import { useState } from 'react';
import { motion } from 'framer-motion';
import PrimaryButton from '../components/PrimaryButton.jsx';
import { brand } from '../theme/brand.js';

const ease = [0.22, 1, 0.36, 1];
const premiumWhite = brand.premiumWhite;

// Card accents drawn from the official six-colour mark.
const CARD_ACCENTS = [brand.mark[0], brand.mark[3], brand.mark[5]];

export default function DisclaimerScreen({ onAccept, onDecline, onLogoClick }) {
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [emailConsent, setEmailConsent] = useState(false);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  // Validate email function
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Check if email consent is checked and email is valid
  const isEmailValid = emailConsent && email.trim() !== '' && isValidEmail(email.trim());

  // Only disclaimer must be checked AND email must be valid if consent is given
  const canContinue = disclaimerAccepted && (emailConsent ? isEmailValid : true);

  const handleContinue = () => {
    if (!canContinue) return;
    
    // If email consent is checked but email is invalid, show error
    if (emailConsent && !isValidEmail(email.trim())) {
      setEmailError('Please enter a valid email address.');
      return;
    }
    
    setEmailError('');
    onAccept({
      email: emailConsent ? email.trim().toLowerCase() : '',
    });
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    if (emailError) {
      setEmailError('');
    }
  };

  const handleEmailConsentChange = (e) => {
    const checked = e.target.checked;
    setEmailConsent(checked);
    if (!checked) {
      setEmail('');
      setEmailError('');
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
            Welcome to the Profit Architecture Diagnostic (PAD)
          </h2>
        </motion.div>

        {/* Three Boxes - One by One (Vertical) */}
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
              Disclaimer & Terms of Use
            </h3>
            <div className="flex-1 space-y-3 text-xs sm:text-sm leading-relaxed" style={{ color: premiumWhite.warm }}>
              <p className="font-sans">
                This diagnostic is a proprietary strategic tool intended solely for informational guidance. It does not constitute formal legal, financial, tax, or investment advice, and financial results are not guaranteed. All underlying frameworks and intellectual property remain our exclusive property and may not be reproduced without written consent.
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

          {/* Box 2: About PAD - Green hover */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease }}
            whileHover={{ scale: 1.01, y: -2 }}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 flex flex-col transition-all duration-300 hover:border-green-500/50 hover:bg-green-500/[0.05]"
          >
            <h3 className="font-sans text-base sm:text-lg font-semibold mb-3 text-center" style={{ color: premiumWhite.bright }}>
              Welcome to the Profit Architecture Diagnostic (PAD)
            </h3>
            <div className="flex-1 space-y-3 text-xs sm:text-sm leading-relaxed" style={{ color: premiumWhite.warm }}>
              <p className="font-sans">
                Built on BYRGOP's Business Profit Architecture (BPA) framework, this diagnostic assesses six core operational pillars to uncover hidden profit leaks and growth opportunities. Complete 18 targeted questions in <strong className="font-bold">8–10</strong> minutes to receive an immediate, complimentary report detailing prioritized optimization strategies for your business.
              </p>
            </div>
          </motion.div>

          {/* Box 3: Email Consent & Privacy Confirmation - Purple hover */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease }}
            whileHover={{ scale: 1.01, y: -2 }}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 flex flex-col transition-all duration-300 hover:border-purple-500/50 hover:bg-purple-500/[0.05]"
          >
            <h3 className="font-sans text-base sm:text-lg font-semibold mb-3 text-center" style={{ color: premiumWhite.bright }}>
              Email Consent & Privacy Confirmation
            </h3>
            <div className="flex-1 space-y-3 text-xs sm:text-sm leading-relaxed" style={{ color: premiumWhite.warm }}>
              <p className="font-sans">
                By submitting your email, you agree to the assessment terms and authorize us to send your personalized diagnostic report and strategic insights. We enforce a strict zero-spam policy, never sell or share your data, and include a one-click unsubscribe link in every email.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailConsent}
                  onChange={handleEmailConsentChange}
                  className="mt-1 h-5 w-5 shrink-0 rounded border-white/20 bg-white/5 accent-[#C68505] cursor-pointer"
                />
                <span className="font-sans text-sm" style={{ color: premiumWhite.warm }}>
                  I consent to receive my diagnostic report via email.
                </span>
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={handleEmailChange}
                disabled={!emailConsent}
                className={`font-sans w-full rounded-xl border px-5 py-3 text-center text-base outline-none transition-colors sm:text-sm ${
                  emailError
                    ? 'border-red-500/50 bg-red-500/10'
                    : emailConsent && email.trim() !== '' && isValidEmail(email.trim())
                    ? 'border-green-500/50 bg-green-500/10'
                    : 'border-white/[0.12] bg-white/[0.04]'
                } focus:border-white/25 disabled:cursor-not-allowed disabled:opacity-40`}
                style={{ color: premiumWhite.bright }}
              />
              {emailError && (
                <p className="font-sans text-xs text-red-400">
                  {emailError}
                </p>
              )}
              {emailConsent && email.trim() !== '' && isValidEmail(email.trim()) && (
                <p className="font-sans text-xs text-green-400">
                  ✓ Valid email address
                </p>
              )}
              {!emailConsent && (
                <p className="font-sans text-xs" style={{ color: premiumWhite.soft }}>
                  Tick the checkbox above to enter your email.
                </p>
              )}
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
          {/* Go Back - Left on desktop, Bottom on mobile */}
          <PrimaryButton
            onClick={onDecline}
            className="font-sans w-full sm:w-auto min-w-[8rem] px-6 py-3 text-base font-bold tracking-[0.05em] overflow-hidden order-2 sm:order-1"
            style={{ 
              background: brand.accent,
              color: '#0A0D16',
              borderColor: brand.accent,
              border: '2px solid',
            }}
          >
            Go Back
          </PrimaryButton>

          {/* Continue - Right on desktop, Top on mobile */}
          <PrimaryButton
            onClick={handleContinue}
            disabled={!canContinue}
            className="font-sans w-full sm:w-auto min-w-[8rem] px-6 py-3 text-base font-bold tracking-[0.05em] overflow-hidden order-1 sm:order-2"
            style={{ 
              background: canContinue ? brand.accent : 'rgba(255,255,255,0.08)',
              color: canContinue ? '#0A0D16' : 'rgba(255,255,255,0.3)',
              cursor: canContinue ? 'pointer' : 'not-allowed',
              borderColor: canContinue ? brand.accent : 'rgba(255,255,255,0.1)',
              border: canContinue ? '2px solid' : '2px solid rgba(255,255,255,0.1)',
            }}
          >
            Continue
          </PrimaryButton>
        </motion.div>
      </div>
    </div>
  );
}