import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sector } from 'recharts';
import PrimaryButton from '../components/PrimaryButton.jsx';
import { brand } from '../theme/brand.js';
import { NEUTRAL_COLOR } from '../onboarding.js';
import { categoryLabel } from '../lib/categories.js';

const ease = [0.22, 1, 0.36, 1];
const premiumWhite = brand.premiumWhite;

const normalizedKey = (value) => String(value || '').trim().toLowerCase();

function resolveCategory(category) {
  const key = normalizedKey(category);
  if (['strategic', 'strategy'].includes(key)) return 'strategic';
  if (['operational', 'operations', 'operation'].includes(key)) return 'operational';
  if (['revenue', 'finance', 'finances'].includes(key)) return 'revenue';
  return null;
}

// The centre emoji reflects the actual onboarding Yes/No answers — how many of
// the three pillars were answered "Yes" — NOT the Admin-configured answer
// colours. The colours are visual only and must never drive the emoji, so the
// count is derived from each category's stored answer text ("Yes"/"No").
function getCenterEmoji(data) {
  const yesCount = data.filter((d) => normalizedKey(d.answer) === 'yes').length;

  if (yesCount === 3) {
    return { emoji: '😄', status: 'Strong Foundation' };
  } else if (yesCount === 2) {
    return { emoji: '🙂', status: 'Growing Steady' };
  } else if (yesCount === 1) {
    return { emoji: '😐', status: 'Needs Attention' };
  }
  return { emoji: '😢', status: 'Immediate Action' };
}

export default function ResultScreen({ result, onKY, onAbout, onLogoClick, onRetake, onLogout }) {
  const totalPossible = result?.overallPossible || 0;

  const CANONICAL_SLOTS = [
    { key: 'strategic', label: categoryLabel('strategic') },
    { key: 'operational', label: categoryLabel('operational') },
    { key: 'revenue', label: categoryLabel('revenue') },
  ];

  const scoresByCategory = {};
  for (const s of result?.scores || []) {
    const resolved = resolveCategory(s?.categoryKey);
    if (resolved) scoresByCategory[resolved] = s;
  }

  const buildDisplay = (slot, score) => {
    const earned = score?.earned ?? 0;
    const answer = score?.answer ?? null;
    const displayColor = score?.selectedOptionColor || score?.stage?.color || NEUTRAL_COLOR;
    return {
      categoryKey: slot.key,
      categoryName: slot.label,
      answer,
      stageKey: score?.stage?.key || score?.stageKey || null,
      stageName: score?.stage?.name || null,
      earned,
      possible: score?.possible ?? 0,
      score: score?.score ?? 0,
      hasScore: score?.hasScore,
      color: displayColor,
      stage: score?.stage || null,
      displayColor,
      title: score?.content?.title,
      interpretation: score?.content?.interpretation,
      recommendations: score?.content?.recommendations || [],
      contribution: totalPossible > 0 ? Math.round((earned / totalPossible) * 100) : 0,
    };
  };

  const canonicalData = CANONICAL_SLOTS.map((slot, i) => ({
    slotIndex: i,
    ...buildDisplay(slot, scoresByCategory[slot.key]),
  }));

  const timedOut = result?.totalTimedOut || 0;

  const DONUT_CX = 150;
  const DONUT_CY = 150;
  const DONUT_INNER = 88;
  const DONUT_OUTER = 124;
  const R_MID = (DONUT_INNER + DONUT_OUTER) / 2;

  const centerContent = getCenterEmoji(canonicalData);

  const slotGeometry = (i) => {
    const center = i * 120;
    return { start: center - 60 + 3, end: center + 60 - 3 };
  };

  // Custom arc path generator for optimal left-to-right reading direction
  const createArcPath = (startAngle, endAngle, categoryKey) => {
    const rad = (deg) => (deg * Math.PI) / 180;
    
    // Bottom sector (revenue / Finances) and Strategy arcs oriented to read left-to-right
    const isFinances = categoryKey === 'revenue';
    
    // For finances, drawing from start to end in normal order aligns text upright from left
    const a1 = isFinances ? startAngle : endAngle;
    const a2 = isFinances ? endAngle : startAngle;

    const x1 = DONUT_CX + R_MID * Math.cos(rad(a1));
    const y1 = DONUT_CY - R_MID * Math.sin(rad(a1));
    const x2 = DONUT_CX + R_MID * Math.cos(rad(a2));
    const y2 = DONUT_CY - R_MID * Math.sin(rad(a2));

    const largeArcFlag = Math.abs(endAngle - startAngle) <= 180 ? 0 : 1;
    const sweepFlag = isFinances ? 0 : 1;

    return `M ${x1} ${y1} A ${R_MID} ${R_MID} 0 ${largeArcFlag} ${sweepFlag} ${x2} ${y2}`;
  };

  const labelLayer = canonicalData.map((d, i) => {
    const { start, end } = slotGeometry(i);
    const pathId = `arc-path-${d.categoryKey}`;
    const dPath = createArcPath(start, end, d.categoryKey);

    return (
      <g key={`label-${d.categoryKey}`}>
        <defs>
          <path id={pathId} d={dPath} />
        </defs>
        <text
          fill="#FFFFFF"
          fontSize={13.5}
          style={{
            fontFamily: brand.fonts.display,
            letterSpacing: '0.03em',
            fontWeight: 600,
          }}
        >
          <textPath
            href={`#${pathId}`}
            startOffset="50%"
            textAnchor="middle"
            dominantBaseline="central"
          >
            {d.categoryName}
          </textPath>
        </text>
      </g>
    );
  });

  return (
    <div className="flex min-h-screen flex-col px-6 py-7 sm:px-10 bg-page">
      {/* Logo - Top Left */}
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

      {/* Telugu & Hindi - Top Right */}
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

      {/* Logout button - Top Right */}
      {onLogout && (
        <motion.div
          className="absolute top-4 right-4 z-10 sm:top-6 sm:right-6 lg:top-8 lg:right-8"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease }}
        >
          <button
            type="button"
            onClick={onLogout}
            className="font-display text-xs font-medium px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.03] text-white/70 hover:text-white hover:border-white/20 hover:bg-white/10 transition-all"
            aria-label="Log out"
          >
            Logout
          </button>
        </motion.div>
      )}

      <div className="flex flex-1 flex-col items-center justify-center py-6 sm:py-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease }}
          className="flex flex-col items-center"
        >
          <h1 
            className="font-display text-center text-3xl font-bold leading-tight sm:text-4xl md:text-5xl lg:text-[3.75rem] tracking-[-0.02em]"
            style={{ color: premiumWhite.bright }}
          >
            Your Business{' '}
            <span className="font-display font-semibold italic" style={{ color: brand.accent }}>
              Snapshot
            </span>
          </h1>
          <p 
            className="font-sans mt-2 max-w-xl text-center text-sm leading-relaxed sm:text-base md:text-lg lg:text-xl"
            style={{ color: premiumWhite.warm }}
          >
            Based on BYRGOP's Business Profit Architecture
          </p>
          {timedOut > 0 && (
            <p className="mt-2 text-xs" style={{ color: brand.palette.red[400] }}>
              {timedOut} question{timedOut > 1 ? 's were' : ' was'} timed out and replaced during
              this assessment.
            </p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.25, ease }}
          className="relative mt-4 sm:mt-6 w-full max-w-lg"
        >
          <div className="relative h-56 w-full sm:h-72 md:h-80">
            <div className="flex h-full w-full items-center justify-center">
              <motion.svg
                viewBox="0 0 300 300"
                className="h-60 w-60 sm:h-72 sm:w-72"
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.35, ease }}
                style={{ overflow: 'visible' }}
              >
                {canonicalData.map((d, i) => {
                  const { start, end } = slotGeometry(i);
                  const span = end - start;
                  const frac =
                    d.possible > 0 ? Math.max(0, Math.min(1, d.earned / d.possible)) : 0;
                  const fillEnd = start + span * frac;
                  return (
                    <g key={d.categoryKey} data-category-key={d.categoryKey}>
                      <Sector
                        data-category-key={d.categoryKey}
                        cx={150}
                        cy={150}
                        innerRadius={88}
                        outerRadius={124}
                        startAngle={start}
                        endAngle={end}
                        fill={d.displayColor}
                      />
                      {frac > 0 && (
                        <Sector
                          data-category-key={d.categoryKey}
                          cx={150}
                          cy={150}
                          innerRadius={88}
                          outerRadius={124}
                          startAngle={start}
                          endAngle={fillEnd}
                          fill={d.displayColor}
                          cornerRadius={7}
                        />
                      )}
                    </g>
                  );
                })}
                {labelLayer}
                
                <motion.g
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.5, ease }}
                >
                  <foreignObject x="75" y="85" width="150" height="130">
                    <div xmlns="http://www.w3.org/1999/xhtml" className="flex flex-col items-center justify-center h-full w-full">
                      <div className="text-6xl sm:text-7xl md:text-8xl mb-1" style={{ lineHeight: 1.2 }}>
                        {centerContent.emoji}
                      </div>
                      <div className="font-display text-[9px] sm:text-[10px] md:text-[11px] font-semibold text-center text-white/70 leading-tight px-1 max-w-full whitespace-nowrap">
                        {centerContent.status}
                      </div>
                    </div>
                  </foreignObject>
                </motion.g>
              </motion.svg>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5, ease }}
          className="mt-4 sm:mt-6 flex flex-col items-center"
        >
          <h2 
            className="font-display text-lg font-semibold text-center sm:text-xl md:text-2xl lg:text-3xl"
            style={{ color: premiumWhite.bright }}
          >
            Know more about 
          </h2>

          <div className="mt-3 sm:mt-4 flex w-full max-w-md flex-col items-center gap-3 sm:flex-row sm:w-auto">
            <PrimaryButton 
              onClick={onKY} 
              className="font-display min-w-[13rem]"
              style={{ background: brand.accent, color: '#0A0D16' }}
            >
              Your Business
            </PrimaryButton>
            <PrimaryButton
              onClick={onAbout}
              className="font-display min-w-[13rem]"
              style={{ background: brand.accent, color: '#0A0D16' }}
            >
              BYRGOP
            </PrimaryButton>
          </div>

          {onRetake && (
            <button
              type="button"
              onClick={onRetake}
              className="font-display text-sm text-center mt-3 transition-colors hover:opacity-70"
              style={{ color: premiumWhite.bright }}
            >
              Retake Assessment
            </button>
          )}
        </motion.div>
      </div>
    </div>
  );
}