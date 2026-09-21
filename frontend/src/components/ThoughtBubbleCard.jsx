import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { brand } from '../theme/brand.js';

const OPTIONS = [
  { id: 'rgb', text: 'Red, Green, Blue (RGB)' },
  { id: 'rob', text: 'Red, Orange, Blue (ROB)' },
  { id: 'ryb', text: 'Red, Yellow, Blue (RYB)' },
  { id: 'ryg', text: 'Red, Yellow, Green (RYG)' },
];

export default function ThoughtBubbleCard({ isOpen, onClose, onPointerEnter, onPointerLeave }) {
  const [selectedOption, setSelectedOption] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setSelectedOption(null);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSelect = (opt) => {
    setSelectedOption(opt);
  };

  const handleClose = (e) => {
    if (e) e.stopPropagation();
    setSelectedOption(null);
    onClose?.();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Mobile backdrop overlay for clean tap-outside dismissal on touch devices */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/45 backdrop-blur-xs sm:hidden pointer-events-auto"
            onClick={handleClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: -8 }}
            transition={{ type: 'spring', stiffness: 320, damping: 24 }}
            className="absolute top-12 left-0 sm:top-16 sm:left-4 md:top-20 md:left-6 z-50 w-[calc(100vw-2rem)] sm:w-[420px] max-w-[440px] pointer-events-auto select-none"
            onPointerEnter={onPointerEnter}
            onPointerLeave={onPointerLeave}
            onClick={(e) => e.stopPropagation()}
          >
          {/* 3D Oval Trail Bubbles (Small to Big - Near logo on mobile, right-aligned on desktop) */}
          <div className="relative flex justify-start pl-[115px] sm:justify-end sm:pl-0 sm:pr-16 pb-1.5 items-center gap-1.5 sm:gap-2 pointer-events-none">
            {/* Bubble 1 (Smallest) */}
            <div
              className="h-2.5 w-3.5 rounded-[100%] bg-gradient-to-b from-white via-[#EEF2F6] to-[#D5DEE8] border border-white"
              style={{
                boxShadow: '0 3px 6px rgba(0,0,0,0.35), inset 0 1px 2px #fff, inset 0 -1px 2px rgba(0,0,0,0.15)',
              }}
            />
            {/* Bubble 2 (Medium) */}
            <div
              className="h-3.5 w-5 rounded-[100%] bg-gradient-to-b from-white via-[#EEF2F6] to-[#D5DEE8] border border-white"
              style={{
                boxShadow: '0 4px 8px rgba(0,0,0,0.35), inset 0 1.5px 2px #fff, inset 0 -1.5px 2px rgba(0,0,0,0.15)',
              }}
            />
            {/* Bubble 3 (Largest) */}
            <div
              className="h-5 w-7 rounded-[100%] bg-gradient-to-b from-white via-[#EEF2F6] to-[#D5DEE8] border border-white"
              style={{
                boxShadow: '0 6px 12px rgba(0,0,0,0.35), inset 0 2px 3px #fff, inset 0 -2px 3px rgba(0,0,0,0.15)',
              }}
            />
          </div>

          {/* Cloud Bubble 3D Container */}
          <div className="relative">
            <div
              className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-b from-[#FFFFFF] via-[#F4F7FA] to-[#E2EAF2] p-5 sm:p-6 text-slate-800 border-[3px] border-white/90 backdrop-blur-md"
              style={{
                boxShadow:
                  '0 25px 60px -10px rgba(0, 0, 0, 0.7), 0 10px 25px -5px rgba(0, 0, 0, 0.4), inset 0 3px 6px #FFFFFF, inset 0 -4px 10px rgba(160, 175, 195, 0.5)',
              }}
            >
              {/* Subtle 3D inner rim highlight */}
              <div className="pointer-events-none absolute inset-1.5 rounded-[2.1rem] border border-white/80" />

              {/* Close Button */}
              <button
                type="button"
                onClick={handleClose}
                className="absolute top-3.5 right-3.5 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-slate-200/90 text-slate-600 hover:bg-slate-300 hover:text-slate-900 transition-colors text-xs font-bold shadow-sm cursor-pointer"
                aria-label="Close"
              >
                ✕
              </button>

              {!selectedOption ? (
                /* Question Phase */
                <motion.div
                  key="question-phase"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <h3 className="font-sans text-base sm:text-lg font-bold text-slate-900 leading-snug mb-4 pr-6">
                    According to you which are the primary colors?
                  </h3>

                  <div className="flex flex-col gap-2">
                    {OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSelect(opt)}
                        className="group flex items-center gap-3 w-full text-left rounded-xl border border-slate-300/80 bg-white/95 px-3.5 py-2.5 shadow-sm transition-all duration-200 hover:border-blue-500 hover:bg-blue-50/90 hover:shadow active:scale-[0.98] cursor-pointer"
                      >
                        {/* Radio Button */}
                        <div className="relative flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-slate-300 bg-white transition-colors group-hover:border-blue-600">
                          <span className="h-2.5 w-2.5 rounded-full bg-transparent transition-all group-hover:bg-blue-600" />
                        </div>

                        {/* Option text */}
                        <span className="font-sans text-sm font-medium text-slate-800 transition-colors group-hover:text-blue-950">
                          {opt.text}
                        </span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                /* Answer / Explanation Phase */
                <motion.div
                  key="answer-phase"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-3.5 pr-5"
                >
                  {/* BYRGOP color explanation statement */}
                  <div className="rounded-xl bg-white/95 border border-slate-200 p-4 shadow-sm space-y-2.5">
                    <p className="font-sans text-sm sm:text-[14.5px] font-medium text-slate-900 leading-relaxed">
                      In fact, <strong className="text-[#0A78CF] font-bold">Blue</strong>,{' '}
                      <strong className="text-[#FCA700] font-bold">Yellow</strong>,{' '}
                      <strong className="text-[#E52032] font-bold">Red</strong> are the primary colors and{' '}
                      <strong className="text-[#0D8845] font-bold">Green</strong>,{' '}
                      <strong className="text-[#F5630D] font-bold">Orange</strong>,{' '}
                      <strong className="text-[#7038A5] font-bold">Purple</strong> are secondary colors.
                    </p>
                    <p className="font-sans text-sm sm:text-[14.5px] font-medium text-slate-900 leading-relaxed">
                      We placed these colors in order aligning 6 stages of business and called{' '}
                      <strong className="font-extrabold text-slate-950 tracking-wider">BYRGOP</strong>.
                    </p>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
