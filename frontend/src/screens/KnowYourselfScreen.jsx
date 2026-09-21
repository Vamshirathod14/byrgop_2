import { AnimatePresence, motion } from 'framer-motion';
import PrimaryButton from '../components/PrimaryButton.jsx';
import AbbreviationText from '../components/AbbreviationText.jsx';
import { brand } from '../theme/brand.js';
import { NOT_APPLICABLE_VALUE } from '../lib/kyIdentity.js';

const ease = [0.22, 1, 0.36, 1];
const LETTERS = ['A', 'B', 'C', 'D', 'E'];

// Premium White Shades — centralized in brand.js
const premiumWhite = brand.premiumWhite;

// Generic, always-present 5th option for every question. Tracking only — never
// scored. Mirrors the styling/selection behaviour of the normal options.
function NotApplicableOption({ selected, onSelect, busy, index, compact }) {
  const isSel = selected === NOT_APPLICABLE_VALUE;
  return (
    <motion.button
      type="button"
      data-testid="ky-not-applicable"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 + index * 0.07, duration: 0.45, ease }}
      whileHover={!isSel ? { scale: 1.015 } : undefined}
      whileTap={!isSel ? { scale: 0.985 } : undefined}
      onClick={() => !busy && onSelect(NOT_APPLICABLE_VALUE)}
      aria-pressed={isSel}
      className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition-all duration-300 sm:gap-4 sm:px-4 sm:py-3 ${
        isSel ? 'bg-white/[0.07]' : 'border-white/[0.10] bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.05]'
      }`}
      style={
        isSel
          ? { borderColor: brand.accent, boxShadow: `0 0 28px ${brand.accent}33` }
          : undefined
      }
    >
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border font-display text-xs font-bold transition-colors duration-300 sm:h-8 sm:w-8 sm:text-sm"
        style={
          isSel
            ? { borderColor: brand.accent, color: brand.accent, background: `${brand.accent}1a` }
            : { borderColor: 'rgba(255,255,255,0.14)', color: 'rgba(246,247,250,0.65)' }
        }
      >
        {LETTERS[index]}
      </span>
      <span className={`flex-1 text-sm leading-relaxed sm:text-base ${isSel ? 'text-mist' : 'text-mist-warm'}`} style={{ color: isSel ? premiumWhite.bright : premiumWhite.warm }}>
        Not Applicable
      </span>
      {isSel && (
        <motion.span
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="shrink-0 text-base sm:text-lg"
          style={{ color: brand.accent }}
        >
          ✓
        </motion.span>
      )}
    </motion.button>
  );
}

/**
 * Question step for the Know Yourself assessment.
 * No numerical counters are shown anywhere — only a visual completion
 * percentage. Previous/Next let users revisit and change earlier answers;
 * the chosen option stays highlighted because selection lives in App.
 */
export default function KnowYourselfScreen({
  question,
  answeredCount,
  answeredHere,
  total,
  selected,
  onSelect,
  onNext,
  onPrevious,
  onLogoClick,
  isFirst,
  isLast,
  busy,
  businessTypeLabel,
  domainLabel,
  onChangeBusiness,
  onChangeDomain,
}) {
  // Question-level abbreviation glossary, configured in Admin against the
  // question itself. Applies to this question's text and all its options.
  const glossary = Array.isArray(question?.glossary) ? question.glossary : [];

  // Exact completion %: recorded answers, plus the current selection if it
  // adds a newly-answered question.
  const effective = answeredCount + (selected && !answeredHere ? 1 : 0);
  const fillPct = total > 0 ? Math.min(100, Math.round((effective / total) * 100)) : 0;
  const basePct = total > 0 ? Math.round((answeredCount / total) * 100) : 0;

  return (
    <div className="relative flex min-h-screen flex-col bg-page px-4 sm:px-6 py-3 sm:py-5">
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

      {/* Logo - Top Left - matching IntroScreen exactly */}
      <motion.div
        className="absolute top-3 left-3 z-10 sm:top-4 sm:left-4 lg:top-6 lg:left-6"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease }}
      >
        {onLogoClick ? (
          <button type="button" onClick={onLogoClick} className="cursor-pointer bg-transparent border-0 p-0" aria-label="Return to home page">
            <img src="/byrgop_logo_1.jpeg" alt="BYRGOP" className="h-10 w-auto object-contain drop-shadow-lg transition-opacity hover:opacity-80 sm:h-14 md:h-16 lg:h-20" />
          </button>
        ) : (
          <img src="/byrgop_logo_1.jpeg" alt="BYRGOP" className="h-10 w-auto object-contain drop-shadow-lg sm:h-14 md:h-16 lg:h-20" />
        )}
      </motion.div>

      {/* Telugu & Hindi - Top Right - matching IntroScreen - Always visible */}
      <motion.div
        className="absolute top-3 right-3 z-10 flex flex-col items-end gap-0.5 sm:top-4 sm:right-4 lg:top-6 lg:right-6"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease }}
      >
        <span
          className="font-display text-sm font-semibold tracking-wider leading-none sm:text-base md:text-lg lg:text-xl xl:text-2xl"
          style={{ color: premiumWhite.bright }}
        >
          బిర్‌గాప్
        </span>
        <span
          className="font-display text-sm font-semibold tracking-wider leading-none sm:text-base md:text-lg lg:text-xl xl:text-2xl"
          style={{ color: premiumWhite.bright }}
        >
          बिरगाप
        </span>
      </motion.div>

      {/* Header */}
      <header className="flex flex-col items-center pt-11 sm:pt-12 md:pt-14 text-center">
        {/* Compact selections header — Business Type / Domain with Change actions */}
        <div className="flex w-full max-w-xl flex-col items-center gap-1 px-3">
          <div className="flex min-w-0 max-w-full flex-wrap items-center justify-center gap-x-2 gap-y-0.5">
            <span className="font-display text-[10px] font-medium sm:text-xs" style={{ color: premiumWhite.soft }}>
              Business Type:
            </span>
            <span className="font-display truncate text-xs font-semibold sm:text-sm" style={{ color: premiumWhite.bright }}>
              {businessTypeLabel || '—'}
            </span>
            {onChangeBusiness && (
              <button
                type="button"
                onClick={onChangeBusiness}
                className="font-display cursor-pointer rounded-full border border-white/15 px-1.5 py-0.5 text-[10px] font-medium transition-colors hover:border-white/30"
                style={{ color: brand.accent }}
              >
                Change
              </button>
            )}
          </div>
          <div className="flex min-w-0 max-w-full flex-wrap items-center justify-center gap-x-2 gap-y-0.5">
            <span className="font-display text-[10px] font-medium sm:text-xs" style={{ color: premiumWhite.soft }}>
              Domain:
            </span>
            <span className="font-display truncate text-xs font-semibold sm:text-sm" style={{ color: premiumWhite.bright }}>
              {domainLabel || '—'}
            </span>
            {onChangeDomain && (
              <button
                type="button"
                onClick={onChangeDomain}
                className="font-display cursor-pointer rounded-full border border-white/15 px-1.5 py-0.5 text-[10px] font-medium transition-colors hover:border-white/30"
                style={{ color: brand.accent }}
              >
                Change
              </button>
            )}
          </div>
        </div>

        {/* Mobile progress bar */}
        <div className="mt-2 w-full max-w-xs sm:hidden">
          <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.08]">
            <motion.div
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${brand.mark[0]}, ${brand.accent})` }}
              animate={{ width: `${fillPct}%` }}
              transition={{ duration: 0.6, ease }}
            />
          </div>
          <div className="mt-1 flex justify-center">
            <span key={`m-${fillPct}`} className="font-display text-xs tabular-nums" style={{ color: premiumWhite.warm }}>
              {basePct}%
            </span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center py-2 sm:py-3">
        {/* Vertical progress rail (tablet & up) */}
        <div className="hidden sm:flex sm:items-center sm:gap-5 md:gap-6 w-full max-w-4xl">
          <aside className="flex flex-col items-center gap-2">
            <div className="relative h-48 w-1.5 overflow-hidden rounded-full bg-white/[0.08]">
              <motion.div
                className="absolute bottom-0 left-0 right-0 rounded-full"
                style={{
                  background: `linear-gradient(180deg, ${brand.accent}, ${brand.mark[0]})`,
                  boxShadow: `0 0 18px ${brand.accent}55`,
                }}
                animate={{ height: `${fillPct}%` }}
                transition={{ duration: 0.7, ease }}
              />
            </div>
            <motion.span
              key={fillPct}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="font-display text-base tabular-nums"
              style={{ color: premiumWhite.warm }}
            >
              {basePct}%
            </motion.span>
          </aside>

          {/* Question focus area - Desktop */}
          <div className="flex-1 flex flex-col items-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={question.questionIndex}
                initial={{ opacity: 0, y: 30, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.99 }}
                transition={{ duration: 0.55, ease }}
                className="flex w-full flex-col items-center"
              >
                <h1 className="mb-3 sm:mb-4 text-balance text-center font-display text-lg font-semibold leading-snug sm:text-xl md:text-2xl lg:text-3xl tracking-[-0.02em]" style={{ color: premiumWhite.bright }}>
                  <AbbreviationText text={question.text} glossary={glossary} />
                </h1>

                <div className="w-full space-y-1.5 sm:space-y-2 max-w-2xl">
                  {question.options.map((opt, i) => {
                    const isSel = selected === opt.optionId;
                    return (
                      <motion.button
                        key={opt.optionId}
                        type="button"
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.12 + i * 0.07, duration: 0.45, ease }}
                        whileHover={!isSel ? { scale: 1.015 } : undefined}
                        whileTap={!isSel ? { scale: 0.985 } : undefined}
                        onClick={() => !busy && onSelect(opt.optionId)}
                        aria-pressed={isSel}
                        className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition-all duration-300 sm:gap-4 sm:px-4 sm:py-3 ${
                          isSel ? 'bg-white/[0.07]' : 'border-white/[0.10] bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.05]'
                        }`}
                        style={
                          isSel
                            ? {
                                borderColor: brand.accent,
                                boxShadow: `0 0 28px ${brand.accent}33`,
                              }
                            : undefined
                        }
                      >
                        <span
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border font-display text-xs font-bold transition-colors duration-300 sm:h-8 sm:w-8 sm:text-sm"
                          style={
                            isSel
                              ? { borderColor: brand.accent, color: brand.accent, background: `${brand.accent}1a` }
                              : { borderColor: 'rgba(255,255,255,0.14)', color: 'rgba(246,247,250,0.65)' }
                          }
                        >
                          {LETTERS[i]}
                        </span>
                        <span className={`flex-1 text-sm leading-relaxed sm:text-base ${isSel ? 'text-mist' : 'text-mist-warm'}`} style={{ color: isSel ? premiumWhite.bright : premiumWhite.warm }}>
                          <AbbreviationText text={opt.text} glossary={glossary} />
                        </span>
                        {isSel && (
                          <motion.span
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="shrink-0 text-base sm:text-lg"
                            style={{ color: brand.accent }}
                          >
                            ✓
                          </motion.span>
                        )}
                      </motion.button>
                    );
                  })}
                  <NotApplicableOption
                    selected={selected}
                    onSelect={onSelect}
                    busy={busy}
                    index={question.options.length}
                  />
                </div>

                {/* Navigation - Desktop */}
                <div className="mt-4 sm:mt-5 flex w-full max-w-2xl items-center justify-between gap-3 sm:gap-4">
                  {!isFirst ? (
                    <button
                      type="button"
                      onClick={() => !busy && onPrevious()}
                      disabled={busy}
                      className="rounded-xl border border-white/[0.10] bg-white/[0.03] px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold transition-colors hover:border-white/30 disabled:opacity-40"
                      style={{ color: premiumWhite.warm }}
                    >
                      ← Previous
                    </button>
                  ) : (
                    <span />
                  )}

                  {isLast ? (
                    <PrimaryButton
                      onClick={() => selected && onNext(selected)}
                      disabled={!selected || busy}
                      className="font-display px-5 py-2 text-sm sm:text-base font-bold tracking-[0.05em] overflow-hidden"
                      style={{ minWidth: '7rem' }}
                    >
                      {busy ? 'Submitting…' : 'Submit Assessment'}
                    </PrimaryButton>
                  ) : (
                    <PrimaryButton
                      onClick={() => selected && onNext(selected)}
                      disabled={!selected || busy}
                      className="font-display px-5 py-2 text-sm sm:text-base font-bold tracking-[0.05em] overflow-hidden"
                      style={{ minWidth: '5rem' }}
                    >
                      Next →
                    </PrimaryButton>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Mobile layout - Larger and more readable */}
        <div className="flex sm:hidden flex-col items-center w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={question.questionIndex}
              initial={{ opacity: 0, y: 30, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.99 }}
              transition={{ duration: 0.55, ease }}
              className="flex w-full flex-col items-center"
            >
              <h1 className="mb-3 text-balance text-center font-display text-base font-semibold leading-snug sm:text-lg" style={{ color: premiumWhite.bright }}>
                <AbbreviationText text={question.text} glossary={glossary} />
              </h1>

              <div className="w-full space-y-2 max-w-md">
                {question.options.map((opt, i) => {
                  const isSel = selected === opt.optionId;
                  return (
                    <motion.button
                      key={opt.optionId}
                      type="button"
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.12 + i * 0.07, duration: 0.45, ease }}
                      whileHover={!isSel ? { scale: 1.015 } : undefined}
                      whileTap={!isSel ? { scale: 0.985 } : undefined}
                      onClick={() => !busy && onSelect(opt.optionId)}
                      aria-pressed={isSel}
                      className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition-all duration-300 ${
                        isSel ? 'bg-white/[0.07]' : 'border-white/[0.10] bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.05]'
                      }`}
                      style={
                        isSel
                          ? {
                              borderColor: brand.accent,
                              boxShadow: `0 0 28px ${brand.accent}33`,
                            }
                          : undefined
                      }
                    >
                      <span
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border font-display text-xs font-bold transition-colors duration-300"
                        style={
                          isSel
                            ? { borderColor: brand.accent, color: brand.accent, background: `${brand.accent}1a` }
                            : { borderColor: 'rgba(255,255,255,0.14)', color: 'rgba(246,247,250,0.65)' }
                        }
                      >
                        {LETTERS[i]}
                      </span>
                      <span className={`flex-1 text-sm leading-relaxed ${isSel ? 'text-mist' : 'text-mist-warm'}`} style={{ color: isSel ? premiumWhite.bright : premiumWhite.warm }}>
                        <AbbreviationText text={opt.text} glossary={glossary} />
                      </span>
                      {isSel && (
                        <motion.span
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="shrink-0 text-base"
                          style={{ color: brand.accent }}
                        >
                          ✓
                        </motion.span>
                      )}
                    </motion.button>
                  );
                })}
                <NotApplicableOption
                  selected={selected}
                  onSelect={onSelect}
                  busy={busy}
                  index={question.options.length}
                />
              </div>

              {/* Navigation - Mobile */}
              <div className="mt-4 flex w-full max-w-md items-center justify-between gap-3">
                {!isFirst ? (
                  <button
                    type="button"
                    onClick={() => !busy && onPrevious()}
                    disabled={busy}
                    className="rounded-xl border border-white/[0.10] bg-white/[0.03] px-3 py-2 text-xs font-semibold transition-colors hover:border-white/30 disabled:opacity-40"
                    style={{ color: premiumWhite.warm }}
                  >
                    ← Previous
                  </button>
                ) : (
                  <span />
                )}

                {isLast ? (
                  <PrimaryButton
                    onClick={() => selected && onNext(selected)}
                    disabled={!selected || busy}
                    className="font-display px-4 py-2 text-sm font-bold tracking-[0.05em] overflow-hidden"
                    style={{ minWidth: '6.5rem' }}
                  >
                    {busy ? 'Submitting…' : 'Submit Assessment'}
                  </PrimaryButton>
                ) : (
                  <PrimaryButton
                    onClick={() => selected && onNext(selected)}
                    disabled={!selected || busy}
                    className="font-display px-4 py-2 text-sm font-bold tracking-[0.05em] overflow-hidden"
                    style={{ minWidth: '5rem' }}
                  >
                    Next →
                  </PrimaryButton>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}