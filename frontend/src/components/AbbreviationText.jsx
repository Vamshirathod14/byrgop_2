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
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
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

  return (
    <span
      ref={ref}
      role="button"
      tabIndex={0}
      aria-label={`${term} — ${entry?.fullForm || ''}`}
      data-testid="glossary-term"
      data-abbr={term}
      className="relative inline-block cursor-help font-medium"
      style={{ borderBottom: `1px dotted ${brand.accent}99` }}
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
      {term}
      <AnimatePresence>
        {open && (
          <motion.span
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            data-testid="glossary-tooltip"
            data-abbr={term}
            className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 w-max max-w-[260px] -translate-x-1/2 rounded-xl border border-white/10 bg-ink-850/95 px-3.5 py-2 text-left shadow-card backdrop-blur-md"
          >
            <span className="block font-display text-sm leading-snug font-semibold" style={{ color: brand.premiumWhite.bright }}>
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