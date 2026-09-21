import { motion } from 'framer-motion';
import PrimaryButton from '../components/PrimaryButton.jsx';
import { brand } from '../theme/brand.js';

const ease = [0.22, 1, 0.36, 1];
const premiumWhite = brand.premiumWhite;

/**
 * Clean confirmation overlay shown once when a returning user has an unfinished
 * Know Yourself assessment. Continue resumes the exact persisted session;
 * Start New discards the offer and proceeds with a fresh assessment.
 */
export default function ResumeModal({ answeredCount, totalQuestions, onContinue, onStartNew }) {
  return (
    <div data-testid="resume-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease }}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-ink-850 p-6 sm:p-8"
        style={{ boxShadow: `0 24px 60px rgba(0,0,0,0.5)` }}
      >
        <span
          className="font-display inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.24em]"
          style={{ color: brand.accent }}
        >
          Welcome back
        </span>

        <h2 className="font-display mt-3 text-xl font-semibold leading-snug sm:text-2xl" style={{ color: premiumWhite.bright }}>
          You have an assessment in progress
        </h2>

        <p className="font-display mt-4 text-sm leading-relaxed" style={{ color: premiumWhite.warm }}>
          You answered <span className="font-semibold" style={{ color: premiumWhite.bright }}>{answeredCount} of {totalQuestions}</span> questions.
        </p>
        <p className="font-display mt-1 text-sm leading-relaxed" style={{ color: premiumWhite.warm }}>
          Would you like to continue where you left off?
        </p>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <PrimaryButton
            variant="border"
            onClick={onStartNew}
            data-testid="resume-startnew"
            className="font-display min-w-[10rem] uppercase tracking-[0.16em]"
          >
            Start New
          </PrimaryButton>
          <PrimaryButton
            onClick={onContinue}
            data-testid="resume-continue"
            className="font-display min-w-[10rem] uppercase tracking-[0.16em]"
            style={{ background: brand.accent, color: '#0A0D16' }}
          >
            Continue
          </PrimaryButton>
        </div>
      </motion.div>
    </div>
  );
}