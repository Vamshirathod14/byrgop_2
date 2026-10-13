import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { brand } from '../theme/brand.js';

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Interactive full-form tooltip for a single matched abbreviation.
 *
 * The tooltip is rendered into `document.body` via a React portal. This is
 * what makes `position: fixed` truly viewport-relative: without the portal,
 * a `transform` on any ancestor (the option `<motion.button>`, the
 * framer-motion wrappers around it) makes the browser resolve "fixed"
 * against that ancestor instead of the viewport, which is why the tooltip
 * was landing off on the right side of the screen.
 *
 * Positioning is responsive:
 *   - Mobile (< 640px): bubble's left edge aligned to the term, opens
 *     rightward, wide right margin, flip-below fallback.
 *   - Desktop (>= 640px): bubble centred exactly on the BULB icon so it
 *     pops directly above the bulb wherever the mouse is.
 */
function AbbreviationTerm({ term, entry }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const termRef = useRef(null);
  const bulbRef = useRef(null);
  const bubbleRef = useRef(null);

  const fullText = `${term} — ${entry?.fullForm || ''}`;

  const computePos = () => {
    if (!termRef.current || !bulbRef.current) return;
    const rTerm = termRef.current.getBoundingClientRect();
    const rBulb = bulbRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const GAP = 8;

    const isMobile = vw < 640;
    const EDGE_LEFT = isMobile ? 12 : 16;
    const EDGE_RIGHT = isMobile ? 24 : 16;

    const bw = bubbleRef.current
      ? bubbleRef.current.getBoundingClientRect().width
      : Math.min(300, vw - EDGE_LEFT - EDGE_RIGHT);
    const bh = bubbleRef.current
      ? bubbleRef.current.getBoundingClientRect().height
      : 48;

    let x;
    if (isMobile) {
      x = rTerm.left;
      if (x + bw > vw - EDGE_RIGHT) x = vw - EDGE_RIGHT - bw;
      if (x < EDGE_LEFT) x = EDGE_LEFT;
    } else {
      // Desktop: centre on the bulb.
      const bulbCenter = rBulb.left + rBulb.width / 2;
      x = bulbCenter - bw / 2;
      if (x + bw > vw - EDGE_RIGHT) x = vw - EDGE_RIGHT - bw;
      if (x < EDGE_LEFT) x = EDGE_LEFT;
    }

    const spaceAbove = rTerm.top - GAP;
    const spaceBelow = vh - rTerm.bottom - GAP;
    const showBelow = spaceAbove < bh && spaceBelow > spaceAbove;

    let y;
    if (showBelow) {
      y = Math.min(rTerm.bottom + GAP, vh - EDGE_LEFT - bh);
    } else {
      y = Math.max(rTerm.top - GAP - bh, EDGE_LEFT);
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

  // The tooltip JSX. Rendered via portal so it lives at document.body.
  const bubble = (
    <AnimatePresence>
      {open && pos && (
        <motion.div
          ref={bubbleRef}
          data-glossary-tooltip="true"
          data-testid="glossary-tooltip"
          data-abbr={term}
          initial={{ opacity: 0, y: pos.showBelow ? -4 : 4, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: pos.showBelow ? -4 : 4, scale: 0.97 }}
          transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none fixed z-[9999] block rounded-xl border border-white/15 bg-ink-850/98 px-4 py-2.5 text-left shadow-card backdrop-blur-md"
          style={{
            left: pos.x,
            top: pos.y,
            maxWidth: 'min(20rem, calc(100vw - 2.5rem))',
            width: 'max-content',
            whiteSpace: 'normal',
            overflowWrap: 'break-word',
          }}
        >
          <span
            className="font-fraunces block text-sm leading-snug font-semibold"
            style={{ color: brand.premiumWhite.bright }}
          >
            {fullText}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <span
      ref={termRef}
      role="button"
      tabIndex={0}
      aria-label={fullText}
      data-testid="glossary-term"
      data-abbr={term}
      className="relative inline-flex items-baseline gap-1 cursor-help font-medium"
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
        ref={bulbRef}
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="inline-block shrink-0 transition-colors duration-200"
        style={{
          width: '0.85em',
          height: '0.85em',
          color: open ? brand.accent : `${brand.accent}cc`,
          transform: 'translateY(0.05em)',
        }}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 18h6" />
        <path d="M10 21h4" />
        <path d="M12 3a6 6 0 0 0-4 10.5c.7.65 1 1.5 1 2.5v.5h6V16c0-1 .3-1.85 1-2.5A6 6 0 0 0 12 3z" />
      </svg>

      {/* Portal: the tooltip lives at document.body, so fixed positioning is
          resolved against the real viewport, not against any transformed
          ancestor on the page. */}
      {typeof document !== 'undefined' && createPortal(bubble, document.body)}
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