import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import PrimaryButton from '../components/PrimaryButton.jsx';
import ThoughtBubbleCard from '../components/ThoughtBubbleCard.jsx';
import { brand } from '../theme/brand.js';
import api from '../api/client.js';
import {
  ONBOARDING_BUSINESS_TYPES,
  onboardingQuestionsFromConfig,
} from '../onboarding.js';

const ease = [0.22, 1, 0.36, 1];
const six = brand.mark;
// Card accents drawn from the official six-colour mark.
const CARD_ACCENTS = [brand.mark[0], brand.mark[3], brand.mark[5]];

// Single source of truth lives in brand.js — same values IntroScreen established.
const premiumWhite = brand.premiumWhite;

export default function IntroScreen({
  onBegin,
  loading = false,
  errorText = '',
  initialKey = null,
}) {
  const [isBubbleOpen, setIsBubbleOpen] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const closeTimerRef = useRef(null);
  const audioRef = useRef(null);
  const containerRef = useRef(null);
  const [businessTypes, setBusinessTypes] = useState(null);
  const [selected, setSelected] = useState(null);
  // Resolved local questions (per business type) prefetched from the backend
  // onboarding config so Proceed is instant. There is NO local default bank: a
  // type whose config resolves to [] is unavailable.
  const [questionsByType, setQuestionsByType] = useState({});
  const configFetchKeyRef = useRef(null);
  const questionsFetchingRef = useRef({});

  // Fetch the four business types from the backend config (fallback to local).
  // Deduped across React StrictMode's dev double-invoke of the mount effect.
  useEffect(() => {
    const key = initialKey ?? '';
    if (configFetchKeyRef.current === key) return;
    configFetchKeyRef.current = key;
    clearQuestions();
    api
      .onboardingMeta()
      .then((meta) => {
        const types = meta.businessTypes || [];
        setBusinessTypes(types);
        if (initialKey) {
          const t = types.find((bt) => bt.key === initialKey) || null;
          setSelected(t);
          if (t) loadQuestions(t.key);
        }
      })
      .catch(() => {
        setBusinessTypes(ONBOARDING_BUSINESS_TYPES);
        if (initialKey) {
          const t = ONBOARDING_BUSINESS_TYPES.find((bt) => bt.key === initialKey) || null;
          setSelected(t);
          if (t) loadQuestions(t.key);
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialKey]);

  // Clear any per-type question cache (new mount from a retake must resolve a
  // fresh selection, never another type's answers).
  const clearQuestions = () => {
    questionsFetchingRef.current = {};
    setQuestionsByType({});
  };

  // Prefetch the Admin-configured onboarding questions for a business type.
  // Best-effort: an empty/errored config stays empty so the type renders as
  // unavailable (Proceed is gated). The backend is the single source of truth.
  const loadQuestions = (key) => {
    if (questionsFetchingRef.current[key]) return;
    if (questionsByType[key]) return;
    questionsFetchingRef.current[key] = true;
    api
      .onboardingMeta(key)
      .then((meta) => {
        setQuestionsByType((prev) => ({
          ...prev,
          [key]: onboardingQuestionsFromConfig(meta.questions),
        }));
      })
      .catch(() => {
        setQuestionsByType((prev) => ({ ...prev, [key]: [] }));
      })
      .finally(() => {
        questionsFetchingRef.current[key] = false;
      });
  };

  const handleSelect = (bt) => {
    setSelected(bt);
    loadQuestions(bt.key);
  };

  // Questions resolved for the currently selected type. `undefined` while that
  // type's config is still fetching; `[]` means it resolved to unavailable.
  const readyQuestions = selected ? questionsByType[selected.key] : null;
  const readyForSelected =
    selected && Object.prototype.hasOwnProperty.call(questionsByType, selected.key);

  const isFinePointer = () => {
    return (
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(hover: hover) and (pointer: fine)').matches
    );
  };

  const handleToggleAudio = (e) => {
    if (e) {
      e.stopPropagation();
    }
    const audio = audioRef.current;
    if (!audio) return;

    if (!audio.paused && !audio.ended && isPlayingAudio) {
      audio.pause();
      audio.currentTime = 0;
      setIsPlayingAudio(false);
    } else {
      audio.currentTime = 0;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlayingAudio(true);
          })
          .catch((err) => {
            console.warn('Audio play failed with primary source, trying wav fallback:', err);
            audio.src = '/audio.wav';
            audio.load();
            audio
              .play()
              .then(() => setIsPlayingAudio(true))
              .catch((err2) => {
                console.error('All audio formats failed:', err2);
                setIsPlayingAudio(false);
              });
          });
      }
    }
  };

  useEffect(() => {
    if (!isBubbleOpen) return;

    let timeoutId;
    const handleOutsidePointer = (e) => {
      if (containerRef.current && containerRef.current.contains(e.target)) {
        return;
      }
      setIsBubbleOpen(false);
    };

    timeoutId = setTimeout(() => {
      window.addEventListener('click', handleOutsidePointer);
    }, 150);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('click', handleOutsidePointer);
    };
  }, [isBubbleOpen]);

  const handleLogoPointerEnter = () => {
    if (isFinePointer()) {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      setIsBubbleOpen(true);
    }
  };

  const handleLogoPointerLeave = (e) => {
    if (isFinePointer() && e.pointerType === 'mouse') {
      closeTimerRef.current = setTimeout(() => {
        setIsBubbleOpen(false);
      }, 300);
    }
  };

  const handleCardPointerEnter = () => {
    if (isFinePointer()) {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    }
  };

  const handleCardPointerLeave = (e) => {
    if (isFinePointer() && e.pointerType === 'mouse') {
      closeTimerRef.current = setTimeout(() => {
        setIsBubbleOpen(false);
      }, 250);
    }
  };

  const handleToggle = (e) => {
    if (e) {
      e.stopPropagation();
    }
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setIsBubbleOpen((prev) => !prev);
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-page px-4 sm:px-6 py-8 sm:py-12">
      {/* Hidden Audio Element with Multi-Format Codec Fallbacks for Android & iOS */}
      <audio
        ref={audioRef}
        preload="auto"
        playsInline
        onEnded={() => setIsPlayingAudio(false)}
        onPause={() => setIsPlayingAudio(false)}
        onPlay={() => setIsPlayingAudio(true)}
      >
        <source src="/audio.m4a" type="audio/mp4" />
        <source src="/audio.wav" type="audio/wav" />
        <source src="/audio.opus" type="audio/opus" />
      </audio>

      {/* Top gradient line */}
      <motion.div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${brand.palette.blue[500]}, ${brand.palette.yellow[500]}, ${brand.palette.purple[500]}, transparent)`,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.4 }}
      />

      {/* Subtle background glow - Responsive */}
      <div className="pointer-events-none absolute inset-0 opacity-30">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] lg:w-[600px] lg:h-[600px] rounded-full bg-purple-500/10 blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-[200px] h-[200px] sm:w-[300px] sm:h-[300px] lg:w-[400px] lg:h-[400px] rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      {/* Logo & Controls - Top Left - Interactive with Thought Bubble */}
      <motion.div
        ref={containerRef}
        data-thought-bubble="true"
        className="absolute top-4 left-4 z-50 sm:top-6 sm:left-6 lg:top-8 lg:left-8"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease }}
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <div
            className="relative group cursor-pointer inline-block"
            onPointerEnter={handleLogoPointerEnter}
            onPointerLeave={handleLogoPointerLeave}
            onClick={handleToggle}
          >
            <img
              src="/byrgop_logo_1.jpeg"
              alt="BYRGOP"
              className="h-12 w-auto object-contain drop-shadow-lg transition-transform duration-300 group-hover:scale-105 sm:h-16 md:h-20 lg:h-24"
            />
          </div>

          {/* Eye and Speaker Icons - One below other beside the logo */}
          <div className="flex flex-col items-center justify-center gap-1 sm:gap-1.5">
            {/* Eye Icon - Triggers Thought Bubble Card on click or hover */}
            <button
              type="button"
              onClick={handleToggle}
              onPointerEnter={handleLogoPointerEnter}
              onPointerLeave={handleLogoPointerLeave}
              className="flex h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 items-center justify-center rounded-lg bg-white/10 text-white/90 hover:bg-white/20 hover:text-white transition-all shadow-sm backdrop-blur-xs cursor-pointer active:scale-95"
              title="Learn about BYRGOP colors"
              aria-label="Learn about BYRGOP colors"
            >
              <svg
                className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-4.5 md:w-4.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            </button>

            {/* Speaker Icon - Plays audio on click with live animated state */}
            <button
              type="button"
              onClick={handleToggleAudio}
              className={`flex h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 items-center justify-center rounded-lg transition-all shadow-sm backdrop-blur-xs cursor-pointer active:scale-95 ${
                isPlayingAudio
                  ? 'bg-blue-500/30 text-blue-300 ring-2 ring-blue-400 shadow-blue-500/20'
                  : 'bg-white/10 text-white/90 hover:bg-white/20 hover:text-white'
              }`}
              title={isPlayingAudio ? 'Stop Audio' : 'Play Audio'}
              aria-label={isPlayingAudio ? 'Stop Audio' : 'Play Audio'}
            >
              <svg
                className={`h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-4.5 md:w-4.5 ${isPlayingAudio ? 'animate-pulse' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                />
              </svg>
            </button>
          </div>
        </div>

        <ThoughtBubbleCard
          isOpen={isBubbleOpen}
          onClose={() => setIsBubbleOpen(false)}
          onPointerEnter={handleCardPointerEnter}
          onPointerLeave={handleCardPointerLeave}
        />
      </motion.div>

      {/* Telugu & Hindi - Top Right - matching DisclaimerScreen */}
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

      {/* Main Content - Centered */}
      <motion.div
        className="relative z-10 mx-auto flex max-w-4xl flex-col items-center text-center"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2, ease }}
      >
        {/* Hero Title */}
        <h1
          className="font-display text-center text-3xl font-bold leading-tight sm:text-4xl md:text-5xl lg:text-[4rem] tracking-[-0.02em] px-4"
          style={{
            color: premiumWhite.bright,
            textShadow: '0 2px 20px rgba(0,0,0,0.5)',
          }}
        >
          <span className="whitespace-nowrap">Are you a Business Owner</span>
          <br />
          <span className="font-display font-semibold" style={{ color: premiumWhite.soft }}>
            / Decision Maker?
          </span>
        </h1>

        {/* Business Type Selection - gates Proceed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35, ease }}
          className="mt-10 w-full max-w-2xl"
        >
          <div className="grid w-full grid-cols-1 grid-rows-2 gap-3 sm:grid-cols-2">
            {(businessTypes || ONBOARDING_BUSINESS_TYPES).map((bt, i) => {
              const accent = CARD_ACCENTS[i % CARD_ACCENTS.length];
              const isSel = selected?.key === bt.key;
              return (
                <motion.button
                  key={bt.key}
                  type="button"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelect(bt)}
                  aria-pressed={isSel}
                  className={`group relative overflow-hidden rounded-2xl border px-4 py-3 text-center transition-all duration-300 sm:py-4 ${
                    isSel
                      ? 'bg-white/[0.07]'
                      : 'border-white/[0.10] bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.05]'
                  }`}
                  style={isSel ? { borderColor: accent, boxShadow: `0 0 28px ${accent}33` } : undefined}
                >
                  <h2
                    className="font-display text-base font-semibold sm:text-lg"
                    style={{ color: premiumWhite.bright }}
                  >
                    {bt.label}
                  </h2>
                  <div
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
                    style={{ background: accent, transform: isSel ? 'scaleX(1)' : undefined }}
                  />
                  {isSel && (
                    <motion.span
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold"
                      style={{ background: `${accent}26`, color: accent }}
                    >
                      ✓
                    </motion.span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Unavailable / loading states for the selected type */}
        {selected && readyForSelected && readyQuestions.length === 0 && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
            className="font-display mt-5 text-sm font-medium tracking-[0.02em]"
            style={{ color: premiumWhite.soft }}
          >
            Onboarding questions are not available for this business type at the
            moment.
          </motion.p>
        )}
        {selected && !readyForSelected && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
            className="mt-5 text-sm"
            style={{ color: premiumWhite.soft }}
          >
            Loading questions…
          </motion.p>
        )}

        {/* Proceed Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.6, ease }}
          className="mt-8 sm:mt-10"
        >
          <PrimaryButton
            onClick={() => {
              if (selected && readyForSelected && readyQuestions.length > 0) {
                onBegin(selected.key, selected.label, readyQuestions);
              }
            }}
            disabled={
              !selected ||
              !readyForSelected ||
              !Array.isArray(readyQuestions) ||
              readyQuestions.length === 0 ||
              loading
            }
            className="font-display min-w-[6.5rem] sm:min-w-[8rem] px-6 sm:px-8 py-3 sm:py-3.5 text-base sm:text-lg lg:text-xl font-bold tracking-[0.05em]"
          >
            PROCEED
          </PrimaryButton>
        </motion.div>

        {!selected && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.9 }}
            className="font-display mt-3 text-xs"
            style={{ color: premiumWhite.soft }}
          >
            Select a business type to proceed.
          </motion.p>
        )}

        {errorText ? (
          <p
            role="alert"
            className="mt-4 text-sm"
            style={{ color: brand.palette.red[500] }}
          >
            {errorText}
          </p>
        ) : null}

        {/* Animated Dots with 3D drop shadow and spring bounce */}
        <motion.div
          className="mt-8 flex items-center justify-center gap-4 sm:gap-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          {six.map((c, i) => (
            <motion.div
              key={i}
              className="relative"
              initial={{ y: -50, opacity: 0, scale: 0.5 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{
                delay: 1 + i * 0.1,
                duration: 0.7,
                type: 'spring',
                stiffness: 200,
                damping: 15,
              }}
            >
              <div
                className="h-4 w-4 sm:h-5 sm:w-5 rounded-full shadow-xl transition-transform duration-300 hover:scale-125 cursor-pointer"
                style={{
                  background: c,
                  boxShadow: `0 4px 20px ${c}60`,
                }}
              />
              <motion.div
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-1 w-6 sm:w-8 rounded-full bg-black/30 blur-sm"
                initial={{ scaleX: 0.3, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{
                  delay: 1 + i * 0.1,
                  duration: 0.5,
                  ease: 'easeOut',
                }}
              />
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}