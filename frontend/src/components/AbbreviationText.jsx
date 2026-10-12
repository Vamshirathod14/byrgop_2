import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { brand } from '../theme/brand.js';

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Interactive full-form tooltip for a single matched abbreviation.
 * Desktop: hover to reveal. Tablet/mobile: tap to toggle (tap elsewhere or
 * press Escape to close).
 *
 * Drawn into document.body via createPortal with position: fixed,
 * ensuring no ancestor transform or overflow can clip or offset the tooltip.
 */
function AbbreviationTerm({ term, entry }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const termRef = useRef(null);
  const bubbleRef = useRef(null);

  const fullText = `${term} — ${entry?.fullForm || ''}`;

  const computePos = () => {
    if (!termRef.current) return;
    const r = termRef.current.getBoundingClientRect();
    const vw = typeof window !== 'undefined' ? window.innerWidth : 390;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 844;
    const GAP = 8;
    const PADDING = 12;

    const bw = bubbleRef.current
      ? bubbleRef.current.getBoundingClientRect().width
      : Math.min(280, vw - PADDING * 2);
    const bh = bubbleRef.current
      ? bubbleRef.current.getBoundingClientRect().height
      : 44;

    // Center horizontally over term, clamped within viewport edges
    let x = r.left + r.width / 2 - bw / 2;
    if (x + bw > vw - PADDING) {
      x = vw - PADDING - bw;
    }
    if (x < PADDING) {
      x = PADDING;
    }

    // Vertical: prefer above, flip below if space is tight
    const spaceAbove = r.top - GAP;
    const spaceBelow = vh - r.bottom - GAP;
    const showBelow = spaceAbove < bh && spaceBelow > spaceAbove;

    let y;
    if (showBelow) {
      y = Math.min(r.bottom + GAP, vh - PADDING - bh);
    } else {
      y = Math.max(r.top - GAP - bh, PADDING);
    }

    setPos({ x, y, showBelow });
  };

  useEffect(() => {
    if (!open) return;
    computePos();

    const raf = requestAnimationFrame(() => computePos());

    const onDocPointer = (e) => {
      if (termRef.current && termRef.current.contains(e.target)) return;
      if (bubbleRef.current && bubbleRef.current.contains(e.target)) return;
      setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onMove = () => computePos();

    document.addEventListener('pointerdown', onDocPointer);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onMove, true);
    window.addEventListener('resize', onMove);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('pointerdown', onDocPointer);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onMove, true);
      window.removeEventListener('resize', onMove);
    };
  }, [open]);

  const tooltipElement =
    open && pos && typeof document !== 'undefined' ? (
      <AnimatePresence>
        <motion.div
          ref={bubbleRef}
          data-glossary-tooltip="true"
          data-testid="glossary-tooltip"
          data-abbr={term}
          initial={{ opacity: 0, y: pos.showBelow ? -4 : 4, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: pos.showBelow ? -4 : 4, scale: 0.96 }}
          transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none fixed z-[9999] rounded-xl border border-white/20 bg-ink-850/98 px-3.5 py-2 text-left shadow-2xl backdrop-blur-md"
          style={{
            left: `${pos.x}px`,
            top: `${pos.y}px`,
            maxWidth: 'min(300px, calc(100vw - 24px))',
            width: 'max-content',
            whiteSpace: 'normal',
            overflowWrap: 'break-word',
          }}
        >
          <span
            className="font-bodoni block text-xs sm:text-sm leading-snug font-semibold whitespace-normal break-words"
            style={{ color: brand.premiumWhite.bright }}
          >
            {fullText}
          </span>
        </motion.div>
      </AnimatePresence>
    ) : null;

  return (
    <span
      ref={termRef}
      role="button"
      tabIndex={0}
      aria-label={fullText}
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
      <span>{term}</span>
      <svg
        className="inline-block h-3.5 w-3.5 -translate-y-0.5 select-none opacity-90 transition-opacity hover:opacity-100"
        style={{ color: brand.accent, marginLeft: '1px' }}
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M10 2a6 6 0 00-6 6c0 2.23 1.22 4.17 3 5.19V14.5A1.5 1.5 0 008.5 16h3a1.5 1.5 0 001.5-1.5v-1.31c1.78-1.02 3-2.96 3-5.19a6 6 0 00-6-6zM8 17a1 1 0 001 1h2a1 1 0 001-1v-.5H8V17z" />
      </svg>

      {tooltipElement && createPortal(tooltipElement, document.body)}
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