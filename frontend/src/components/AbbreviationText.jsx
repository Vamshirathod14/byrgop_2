import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { brand } from '../theme/brand.js';

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Interactive full-form tooltip for a single matched abbreviation.
 * Desktop: hover to reveal. Tablet/mobile: tap to toggle (tap elsewhere or
 * press Escape to close). Clicking/tapping the abbreviation does not bubble up,
 * so surrounding option selection is left untouched.
 */
function AbbreviationTerm({ term, entry }) {
  const [open, setOpen] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ placement: 'top', align: 'center' });
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      
      // Determine vertical placement: top if space, else bottom
      const placement = rect.top < 80 ? 'bottom' : 'top';
      
      // Determine horizontal alignment to prevent cutting off at left/right edges
      let align = 'center';
      if (rect.left + rect.width / 2 < 140) {
        align = 'left';
      } else if (vw - (rect.left + rect.width / 2) < 140) {
        align = 'right';
      }
      setTooltipPos({ placement, align });
    }

    const onDocPointer = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onDocPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDocPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const alignCls =
    tooltipPos.align === 'left'
      ? 'left-0 translate-x-0'
      : tooltipPos.align === 'right'
        ? 'right-0 translate-x-0'
        : 'left-1/2 -translate-x-1/2';

  const placeCls =
    tooltipPos.placement === 'bottom'
      ? 'top-full mt-2'
      : 'bottom-full mb-2';

  return (
    <span
      ref={ref}
      role="button"
      tabIndex={0}
      aria-label={`${term} — ${entry?.fullForm || ''}`}
      data-testid="glossary-term"
      data-abbr={term}
      className="relative inline-flex items-center cursor-help font-medium"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setOpen((o) => !o);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          setOpen((o) => !o);
        }
      }}
    >
      <span>{term}</span><svg
        className="inline-block h-3.5 w-3.5 -translate-y-0.5 text-amber-400 select-none opacity-90 transition-opacity hover:opacity-100"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M10 2a6 6 0 00-6 6c0 2.23 1.22 4.17 3 5.19V14.5A1.5 1.5 0 008.5 16h3a1.5 1.5 0 001.5-1.5v-1.31c1.78-1.02 3-2.96 3-5.19a6 6 0 00-6-6zM8 17a1 1 0 001 1h2a1 1 0 001-1v-.5H8V17z" />
      </svg>
      <AnimatePresence>
        {open && (
          <motion.span
            initial={{ opacity: 0, y: tooltipPos.placement === 'bottom' ? -6 : 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: tooltipPos.placement === 'bottom' ? -6 : 6 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            data-testid="glossary-tooltip"
            data-abbr={term}
            className={`pointer-events-none absolute z-50 w-max max-w-[240px] xs:max-w-[280px] sm:max-w-[320px] rounded-xl border border-white/15 bg-ink-850/98 p-2.5 sm:px-3.5 sm:py-2 text-left shadow-2xl backdrop-blur-md ${placeCls} ${alignCls}`}
          >
            <span className="font-bodoni block text-xs sm:text-sm leading-snug font-semibold whitespace-normal break-words" style={{ color: brand.premiumWhite.bright }}>
              {term} — {entry?.fullForm}
            </span>
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

/**
 * Renders `text` unchanged except that any known abbreviation from `glossary`
 * is wrapped in AbbreviationTerm. Matching is case-insensitive, word-boundary
 * aware and longest-first so a longer term wins over a shorter prefix. The
 * glossary array is the question-level glossary (question text + all options).
 */
export default function AbbreviationText({ text = '', glossary = [] }) {
  const { parts, lookup } = useMemo(() => {
    if (!text) return { parts: [text], lookup: new Map() };
    const lookup = new Map();
    for (const entry of glossary) {
      const abbr = entry?.abbreviation;
      if (!abbr) continue;
      lookup.set(String(abbr).toLowerCase(), entry);
    }
    if (lookup.size === 0) return { parts: [text], lookup };

    const terms = [...lookup.keys()].sort((a, b) => b.length - a.length).map(escapeRegExp);
    const re = new RegExp(`\\b(${terms.join('|')})\\b`, 'gi');
    return { parts: text.split(re), lookup };
  }, [text, glossary]);

  return (
    <>
      {parts.map((part, i) => {
        if (i % 2 === 1) {
          const entry = lookup.get(String(part).toLowerCase());
          if (entry) return <AbbreviationTerm key={`${i}-${part}`} term={part} entry={entry} />;
        }
        return part;
      })}
    </>
  );
}