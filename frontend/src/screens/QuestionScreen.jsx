import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Timer from '../components/Timer.jsx';
import PrimaryButton from '../components/PrimaryButton.jsx';
import { brand } from '../theme/brand.js';

const ease = [0.22, 1, 0.36, 1];
const six = brand.mark;

// Premium White Shades — centralized in brand.js (IntroScreen source of truth)
const premiumWhite = brand.premiumWhite;

function matchOption(question, prefix) {
  return (question.options || []).find((o) =>
    String(o.text).trim().toLowerCase().startsWith(prefix)
  );
}

export default function QuestionScreen({ question, index, total, onAnswer, onTimeout, onRestart, loading = false }) {
  // First 3 onboarding questions always get 45 seconds; later questions use
  // the backend-provided timeout.
  const effectiveTimeout = index < 3 ? 45 : question ? question.timeoutSeconds : 45;
  const [secondsLeft, setSecondsLeft] = useState(effectiveTimeout);
  const [selected, setSelected] = useState(null);
  const [tick, setTick] = useState(0);
  const selectTimerRef = useRef(null);
  const expiredRef = useRef(false);
  const timerIntervalRef = useRef(null);
  const mountedAtRef = useRef(Date.now());

  useEffect(() => () => {
    if (selectTimerRef.current) clearTimeout(selectTimerRef.current);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
  }, []);

  // Brand gold accent (centralized token — replaces off-brand #c68505)
  const goldColor = brand.accent;

  const cat = question
    ? brand.categories[question.category] || {
        name: question.category,
        color: brand.palette.blue[500],
        soft: brand.palette.blue[500] + '22',
      }
    : null;

  const yesOption = question ? matchOption(question, 'yes') || question.options?.[0] : null;
  const noOption = question ? matchOption(question, 'no') || question.options?.[1] : null;

  // The timer starts only once the first question actually arrives.
  useEffect(() => {
    if (!question || loading) return;
    const timeout = index < 3 ? 45 : question.timeoutSeconds;
    
    // Reset timer when question changes
    mountedAtRef.current = Date.now();
    setSecondsLeft(timeout);
    setSelected(null);
    setTick(0);
    expiredRef.current = false;
    
    // Clear any existing timer
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    
    // Start the timer
    timerIntervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - mountedAtRef.current) / 1000;
      const remaining = Math.max(0, Math.ceil(timeout - elapsed));
      setSecondsLeft(remaining);
      
      // When timer hits 0, restart it
      if (remaining === 0) {
        // Reset mountedAt to current time
        mountedAtRef.current = Date.now();
        setSecondsLeft(timeout);
        // The interval continues running - no need to restart
      }
    }, 500);
    
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [question?.questionId, question?.timeoutSeconds, index, loading]);

  // Remove the timeout navigation effect - no longer needed since timer restarts infinitely

  const handleSelect = (optionId) => {
    if (selected || optionId == null || expiredRef.current) return;
    setSelected(optionId);
    // Stop the timer when user answers
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    selectTimerRef.current = setTimeout(() => onAnswer(optionId), 50);
  };

  const displaySeconds = secondsLeft;

  return (
    <div className="flex min-h-screen flex-col bg-page px-6 py-7 sm:px-10">
      {/* Logo - Top Left — clickable, returns to landing - Matches IntroScreen exactly */}
      <motion.div
        className="absolute top-4 left-4 z-10 sm:top-6 sm:left-6 lg:top-8 lg:left-8"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease }}
      >
        <button
          type="button"
          onClick={onRestart}
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

      {/* Telugu & Hindi - Top Right - Matches IntroScreen exactly */}
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

      {/* Progress Bar - Top Center */}
      <header className="flex items-center justify-center pt-12 sm:pt-2">
        <div className="flex items-center gap-2">
          {brand.steps.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <span
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  i < index ? 'w-8' : i === index ? 'w-10' : 'w-6'
                }`}
                style={{
                  background:
                    i < index ? s.color : i === index ? s.color : 'rgba(255,255,255,0.12)',
                  opacity: i > index ? 0.35 : 1,
                  boxShadow: i <= index ? `0 0 12px ${s.color}66` : 'none',
                }}
              />
              {i < total - 1 && <span className="h-px w-2 bg-white/10" />}
            </div>
          ))}
        </div>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center py-10">
        {loading ? (
          <div className="flex w-full flex-col items-center justify-center" />
        ) : (
          <div className="flex w-full max-w-2xl flex-col items-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={question.questionId}
                initial={{ opacity: 0, y: 34, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.99 }}
                transition={{ duration: 0.6, ease }}
                className="flex w-full flex-col items-center"
              >
                <div className="mb-6 sm:mb-10">
                  <Timer 
                    secondsLeft={displaySeconds} 
                    total={effectiveTimeout} 
                    color={goldColor}
                  />
                </div>

                {/* Question Text */}
                <h1 
                  className="font-display max-w-2xl text-balance text-center text-2xl font-bold leading-tight sm:text-3xl md:text-4xl lg:text-5xl tracking-[-0.02em]"
                  style={{ color: premiumWhite.bright }}
                >
                  {question.text}
                </h1>

                {/* YES/NO Buttons - Centered */}
                <div className="mt-8 flex w-full max-w-md flex-row items-center justify-center gap-4 sm:gap-6 sm:mt-12">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.5, ease }}
                    className="flex justify-center"
                  >
                    <PrimaryButton
                      onClick={() => handleSelect(yesOption?.optionId)}
                      disabled={!!selected}
                      className={`font-display min-w-[6.5rem] sm:min-w-[8rem] px-6 sm:px-8 py-3 sm:py-3.5 text-base sm:text-lg lg:text-xl font-bold tracking-[0.05em] overflow-hidden ${
                        selected === yesOption?.optionId ? 'ring-2 ring-white/50' : ''
                      }`}
                    >
                      {selected === yesOption?.optionId ? '✓ ' : ''}YES
                    </PrimaryButton>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25, duration: 0.5, ease }}
                    className="flex justify-center"
                  >
                    <PrimaryButton
                      onClick={() => handleSelect(noOption?.optionId)}
                      disabled={!!selected}
                      className={`font-display min-w-[6.5rem] sm:min-w-[8rem] px-6 sm:px-8 py-3 sm:py-3.5 text-base sm:text-lg lg:text-xl font-bold tracking-[0.05em] overflow-hidden ${
                        selected === noOption?.optionId ? 'ring-2 ring-white/50' : ''
                      }`}
                    >
                      {selected === noOption?.optionId ? '✓ ' : ''}NO
                    </PrimaryButton>
                  </motion.div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}