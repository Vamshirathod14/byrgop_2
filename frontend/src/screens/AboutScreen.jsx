import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PrimaryButton from '../components/PrimaryButton.jsx';
import api from '../api/client.js';
import { brand } from '../theme/brand.js';

const ease = [0.22, 1, 0.36, 1];
const six = brand.mark;
const premiumWhite = brand.premiumWhite;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FRAMEWORK_TABS = [
  { id: 'philosophy', label: '6 Pillar Philosophy', shortLabel: 'Philosophy' },
  { id: 'process', label: '6 Step Process', shortLabel: 'Process' },
  { id: 'phases', label: '6 Phases of Business', shortLabel: 'Phases' },
  { id: 'values', label: '6 Core Values', shortLabel: 'Values' },
  { id: 'ethics', label: '6 Ethical Standards', shortLabel: 'Ethical Standards' },
];

const TEAM_MEMBERS = [
  {
    name: 'RADHA KRISHNA ABBURU',
    value: 'IIM Calcutta–educated strategy leader with a progressive executive trajectory spanning Executive Vice President, Associate Partner, and Chief Strategy Officer roles across IBM, Accenture, ADP India, and BlueRose Technologies, driving growth, client outcomes, and operational transformation in complex global enterprises.',
    color: '#0A78CF',
    initials: 'RKA',
    image: '/rk_sir.jpeg',
  },
  {
    name: 'Aishwarya Muppala',
    value: "Executive corporate strategy leader with cross-border experience in Canada and India, holding an MBA, Master's in Network Management, and Bachelor's in Information Technology. Demonstrated success at Amazon, Fleming College, ILAC, and EFREI leading technical teams, building enterprise solutions, and advancing operational excellence.",
    color: '#FCA700',
    initials: 'AM',
    image: '/aishwarya.jpeg',
  },
  {
    name: 'RAMAVATH VAMSHI',
    value: 'Digital transformation leader with experience across DRDL and V Soft, delivering data-driven products and enterprise digital solutions. Holds a Computer Science and Engineering degree from JNTU Hyderabad, with expertise leading cross-functional teams and end-to-end product delivery across sectors.',
    color: '#7038A5',
    initials: 'RV',
    image: '/vamshi.jpeg',
  },
  {
    name: 'DIVYA\nDASIKA',
    value: "Strategy and digital transformation professional with international experience across France and India at L'Oréal and Deloitte. Holds a Master's in Management from ESSEC Business School and a Computer Science degree, combining strategic leadership with data-driven enterprise transformation expertise.",
    color: '#0D8845',
    initials: 'DD',
    image: '/divya.jpeg',
  },
];

const frameworksData = {
  philosophy: {
    id: 'philosophy',
    title: 'The Foundation of Business Profit Architecture',
    subtitle: 'Six essential pillars that work together to build a stronger, more profitable business.',
    items: [
      {
        name: 'Strategy',
        color: '#0A78CF',
        subtitle: 'The Vision & Direction',
        tagline: 'The Vision & Direction',
        role: 'Blue represents depth, stability, and clarity. Strategy defines where the enterprise is going, why it exists, and how it will differentiate itself in a competitive landscape.',
        impact: 'Without a clear Strategy, execution lacks alignment. Strategy aligns all resources toward long-term value creation, market positioning, and sustainable competitive advantage.',
      },
      {
        name: 'Finances',
        color: '#FCA700',
        subtitle: 'The Economic Engine',
        tagline: 'The Economic Engine',
        role: 'Yellow signifies value, prosperity, and financial vigilance. Finances form the analytical backbone that converts strategic ambition into measured economic performance.',
        impact: 'High revenue means little without profit margin control, cash flow discipline, and capital efficiency. Sound financial architecture ensures solvency, funds expansion, and maximizes return on investment.',
      },
      {
        name: 'Marketing',
        color: '#E52032',
        subtitle: 'The Market Presence & Magnetism',
        tagline: 'The Market Presence & Magnetism',
        role: 'Red embodies passion, urgency, and influence. Marketing builds market equity, establishes brand presence, and drives customer acquisition.',
        impact: 'An enterprise can offer superior products or services, but without effective positioning and channel execution, value remains uncaptured. Marketing connects value creation to market demand.',
      },
      {
        name: 'Operations',
        color: '#0D8845',
        subtitle: 'The Value Delivery System',
        tagline: 'The Value Delivery System',
        role: 'Green reflects efficiency, balance, and systematic execution. Operations transform strategic intent and customer demand into reliable, scalable output.',
        impact: 'Operational excellence reduces friction, eliminates waste, and builds repeatable processes. It ensures that delivery meets or exceeds customer expectations every single time.',
      },
      {
        name: 'People',
        color: '#F5630D',
        subtitle: 'The Capability & Leadership',
        tagline: 'The Capability & Leadership',
        role: 'Orange symbolizes human energy, collaboration, and culture. People drive execution; they are the heart of organizational performance.',
        impact: 'Processes and strategies are only as strong as the teams executing them. Building leadership capacity, defining governance structures, and fostering an accountability-driven culture turn strategy into operational reality.',
      },
      {
        name: 'Technology',
        color: '#7038A5',
        subtitle: 'The Enablement & Scale',
        tagline: 'The Enablement & Scale',
        role: 'Purple represents transformation, logic, and modern enterprise architecture. Technology acts as the force multiplier across all operational areas.',
        impact: 'Technology serves the business architecture—enabling speed, operational clarity, and scalable infrastructure. It empowers teams to work smarter and accelerates decision-making.',
      },
    ],
  },
  process: {
    id: 'process',
    title: 'From Understanding to Execution.',
    subtitle: 'A structured approach designed to turn business challenges into measurable results.',
    items: [
      { name: 'Initiation', color: '#0A78CF', subtitle: 'Consultation & Scope' },
      { name: 'Due Diligence', color: '#FCA700', subtitle: 'Audit & Risk Mapping' },
      { name: 'Analysis', color: '#E52032', subtitle: 'Root Cause & Benchmarks' },
      { name: 'Recommendations', color: '#0D8845', subtitle: 'Tailored Solutions' },
      { name: 'Implementation', color: '#F5630D', subtitle: 'Execution & Change' },
      { name: 'Monitoring', color: '#7038A5', subtitle: 'KPIs & Sustainability' },
    ],
  },
  phases: {
    id: 'phases',
    title: 'Every Business Has a Journey.',
    subtitle: 'Understanding where your business stands is the first step toward knowing what it needs next.',
    items: [
      { name: 'Ideation', color: '#0A78CF', subtitle: 'Where the business idea begins.' },
      { name: 'Foundation', color: '#FCA700', subtitle: 'Building structure & right systems.' },
      { name: 'Challenge', color: '#E52032', subtitle: 'Facing problems, risks & obstacles.' },
      { name: 'Growth', color: '#0D8845', subtitle: 'Expanding & improving performance.' },
      { name: 'Transformation', color: '#F5630D', subtitle: 'Adapting, improving & leading change.' },
      { name: 'Success', color: '#7038A5', subtitle: 'Achieving sustainable profitability.' },
    ],
  },
  values: {
    id: 'values',
    title: 'What We Stand For.',
    subtitle: 'The principles that shape how we think, work, and create value.',
    items: [
      { name: 'Integrity', color: '#0A78CF', subtitle: 'Honest & Transparent' },
      { name: 'Client-Centric', color: '#FCA700', subtitle: 'Focused on Your Success' },
      { name: 'Innovation', color: '#E52032', subtitle: 'Learn. Adapt. Evolve.' },
      { name: 'Execution', color: '#0D8845', subtitle: 'Strategy Into Action' },
      { name: 'Collaboration', color: '#F5630D', subtitle: 'Better Together' },
      { name: 'Sustainability', color: '#7038A5', subtitle: 'Growth That Lasts' },
    ],
  },
  ethics: {
    id: 'ethics',
    title: 'Trust Is the Foundation.',
    subtitle: 'The standards that guide every decision, relationship, and engagement.',
    items: [
      { name: 'Confidentiality', color: '#0A78CF', subtitle: 'Discretion & Data Security' },
      { name: 'Unbiased Advice', color: '#FCA700', subtitle: 'Facts Before Opinions' },
      { name: 'Fairness', color: '#E52032', subtitle: 'Equal Respect for Every Business' },
      { name: 'Independence', color: '#0D8845', subtitle: 'No Conflicts of Interest' },
      { name: 'Accountability', color: '#F5630D', subtitle: 'Ownership & Measurable Results' },
      { name: 'Social Responsibility', color: '#7038A5', subtitle: 'Giving Back & Building Communities' },
    ],
  },
};

const normalizePhone = (value) => {
  const digits = (value || '').replace(/[^\d]/g, '');
  return digits.length >= 7 && digits.length <= 15;
};

export default function AboutScreen({ onAssess, onNavigateToLanding }) {
  const [activeTab, setActiveTab] = useState('philosophy');
  const [hoveredPillar, setHoveredPillar] = useState(null);
  const [showMascotInfo, setShowMascotInfo] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [err, setErr] = useState(null);

  const canSubmit = EMAIL_RE.test(email.trim()) && normalizePhone(phone) && !submitting;

  const currentFramework = frameworksData[activeTab];

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setErr(null);
    try {
      await api.submitContact({ email: email.trim(), phone });
      setSubmitted(true);
    } catch (e) {
      setErr(e.message);
      setSubmitted(false);
    } finally {
      setSubmitting(false);
    }
  };

  // Logo click handler
  const handleLogoClick = () => {
    if (onNavigateToLanding) {
      onNavigateToLanding();
    } else if (onAssess) {
      onAssess();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-page">
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

      {/* Atmospheric Background Ambient Glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Top/Left Subtle Glow */}
        <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] rounded-full bg-blue-600/[0.05] blur-[140px]" />
        {/* Right Subtle Glow */}
        <div className="absolute top-1/3 -right-20 w-[500px] h-[500px] rounded-full bg-slate-600/[0.04] blur-[140px]" />
        {/* Lower Subtle Glow */}
        <div className="absolute top-2/3 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-blue-500/[0.03] blur-[160px]" />
      </div>

      {/* Logo - Top Left - matching IntroScreen size */}
      <motion.div
        className="absolute top-4 left-4 z-30 sm:top-6 sm:left-6 lg:top-8 lg:left-8"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease }}
      >
        <button
          type="button"
          onClick={handleLogoClick}
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

      {/* Telugu & Hindi - Top Right - matching IntroScreen size */}
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

      {/* Main Content */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pt-28 pb-20 sm:px-6 sm:pt-36 sm:pb-24 md:px-12 md:pt-40 lg:pt-44">
        
        {/* About BYRGOP Section (Expanded & Richly Styled) */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease }}
          className="mt-4 sm:mt-6 mb-16 sm:mb-24 w-full max-w-5xl lg:max-w-6xl"
        >
          <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-12 md:gap-14 lg:gap-16">
            
            {/* Left Side: Bird Image with Ambient Halos & Hover Info Card */}
            <div className="md:col-span-5 flex justify-center relative">
              {/* Backlight halo behind image */}
              <div className="pointer-events-none absolute inset-0 -m-4 rounded-3xl bg-blue-500/10 blur-2xl opacity-60" />

              <div
                className="group relative aspect-square w-full max-w-[320px] sm:max-w-[380px] md:max-w-[420px] overflow-hidden rounded-3xl border border-white/20 shadow-2xl bg-black/40 cursor-pointer"
                onMouseEnter={() => {
                  if (typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
                    setShowMascotInfo(true);
                  }
                }}
                onMouseLeave={() => {
                  if (typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
                    setShowMascotInfo(false);
                  }
                }}
                onClick={() => setShowMascotInfo((prev) => !prev)}
                role="region"
                aria-label="BYRGOP Mascot Details"
              >
                <img
                  src="/byrgop_bird.jpeg"
                  alt="BYRGOP Mascot - Paradise Tanager"
                  className={`h-full w-full object-cover transition-all duration-700 ${showMascotInfo ? 'scale-105 filter blur-[2px] brightness-50' : 'group-hover:scale-105'}`}
                />
                <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/15" />

                {/* Responsive Badge Pill (Desktop: Hover, Mobile: Tap) */}
                {!showMascotInfo && (
                  <div className="pointer-events-none absolute bottom-3.5 left-1/2 -translate-x-1/2 flex items-center rounded-full bg-black/75 backdrop-blur-md px-4 py-1.5 text-[11.5px] font-medium text-slate-200 border border-white/20 shadow-lg transition-opacity">
                    <span className="hidden sm:inline">Hover to explore mascot</span>
                    <span className="sm:hidden">Tap to explore mascot</span>
                  </div>
                )}

                {/* Hover / Tap Card Overlay */}
                <AnimatePresence>
                  {showMascotInfo && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.25, ease }}
                      className="absolute inset-0 z-20 flex flex-col justify-start overflow-y-auto bg-black/85 p-5 sm:p-6 text-left border border-white/20 rounded-3xl backdrop-blur-md scrollbar-thin scrollbar-thumb-white/20"
                    >
                      {/* 6-Color Brand Line */}
                      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#0A78CF] via-[#FCA700] via-[#E52032] via-[#0D8845] via-[#F5630D] to-[#7038A5]" />

                      <div className="space-y-2.5 pt-1">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                          <h4 className="font-display text-lg sm:text-xl font-bold text-amber-400">
                            Paradise Tanager <span className="font-display text-sm sm:text-base font-normal text-slate-300 italic">(Tangara chilensis)</span>
                          </h4>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowMascotInfo(false);
                            }}
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white transition-colors cursor-pointer"
                            aria-label="Close mascot details"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        <p className="font-display text-base sm:text-lg md:text-[19px] leading-relaxed font-normal" style={{ color: premiumWhite.warm }}>
                          BYRGOP selected the Paradise Tanager (Tangara chilensis) as its mascot to embody strategic elevation, agility, and engineered survival in business. While the jungle floor represents the chaotic firefighting and margin erosion that trap many SME founders, the tanager thrives eighty feet above in the Amazon canopy through unflinching clarity, zero wasted motion, and precision. The bird&rsquo;s brilliant, six-color plumage serves not as ornament, but as an integrated blueprint directly aligning with BYRGOP&rsquo;s core pillars: Cerulean Blue for foundational initiation and balance, Golden Yellow for illuminating due diligence, Scarlet Red for urgent bottleneck analysis, Apple Green for visionary growth recommendations, Warm Amber/Orange for high-velocity execution and lean implementation, and Royal Purple for long-term profit governance and stewardship. Ultimately, the Paradise Tanager personifies the philosophy that true enterprise profitability is never an accident, but rather survival and scalable growth engineered through synchronized structural pillars.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Right Side: Text Content & Highlights */}
            <div className="md:col-span-7 flex flex-col justify-center space-y-5">
              <div className="text-center md:text-left">
                <h2 className="font-display text-xl sm:text-2xl md:text-3xl lg:text-[2.2rem] font-bold leading-tight tracking-tight text-white">
                  Commitment to Excellence
                </h2>
              </div>
              
              <p className="font-display text-left text-base sm:text-lg md:text-[19px] leading-relaxed font-normal" style={{ color: premiumWhite.warm }}>
                At BYRGOP | Business Profit Architects, we believe that SMEs drive economic growth and innovation. Our mission is to empower businesses with strategic insights, execution-focused solutions, and operational excellence. As your trusted advisor, we uphold the highest standards of integrity, transparency, and strategic innovation to foster sustainable and scalable success.
              </p>
            </div>
          </div>
        </motion.section>

        {/* 6-Fold Strategic Frameworks Explorer */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease }}
          className="mb-16 sm:mb-24 w-full max-w-6xl xl:max-w-[86rem] 2xl:max-w-[90rem] text-center"
        >
          {/* Framework Tabs Navigation */}
          <div className="mb-8 sm:mb-10 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3.5 md:gap-4 max-w-5xl mx-auto">
            {FRAMEWORK_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    setHoveredPillar(null);
                  }}
                  className={`font-display relative rounded-full px-4 sm:px-6 py-2.5 sm:py-3.5 text-sm sm:text-base md:text-lg font-semibold tracking-wide transition-all duration-300 cursor-pointer ${
                    isActive
                      ? 'text-white shadow-xl scale-105'
                      : 'text-slate-200 hover:text-white bg-white/[0.05] hover:bg-white/[0.10] border border-white/15'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeFrameworkTab"
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600/90 via-amber-500/80 to-purple-600/90 shadow-lg border border-white/40"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Dynamic Header for Active Framework */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab + '-header'}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease }}
              className="space-y-3 mb-8 sm:mb-10"
            >
              <h2 className="font-display text-xl sm:text-2xl md:text-3xl lg:text-[2.2rem] font-bold leading-tight tracking-tight text-white">
                {currentFramework.title}
              </h2>
              <p
                className="font-display mx-auto max-w-3xl text-base sm:text-lg md:text-[19px] leading-relaxed font-normal"
                style={{ color: premiumWhite.warm }}
              >
                {currentFramework.subtitle}
              </p>

              {/* What Is Business Profit Architecture? Intro for Philosophy Tab */}
              {activeTab === 'philosophy' && (
                <div className="mt-8 sm:mt-10 max-w-4xl mx-auto rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8 md:p-9 shadow-2xl backdrop-blur-md text-left space-y-4">
                  <h3 className="font-display text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white">
                    What Is Business Profit Architecture?
                  </h3>
                  <div
                    className="space-y-3.5 font-display text-base sm:text-lg md:text-[18.5px] leading-relaxed font-normal"
                    style={{ color: premiumWhite.warm }}
                  >
                    <p>
                      At BYRGOP, we view an enterprise not as a fragmented collection of departments, but as a living, interconnected engine. Sustainable growth and long-term enterprise value cannot be achieved through isolated fixes; they require a balanced, unified framework.
                    </p>
                    <p>
                      This is Business Profit Architecture (BPA)—a structured methodology built on six fundamental pillars. Each pillar represents a critical discipline, distinct yet vital to the stability and performance of the overall enterprise.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Dynamic Framework 6-Item Grid */}
          {activeTab === 'philosophy' && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
              className="mb-4 sm:mb-6 text-center text-xs sm:text-sm md:text-[15px] font-display text-slate-300/90 font-medium tracking-wide"
            >
              Hover or tap any pillar below to explore its role &amp; impact
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab + '-grid'}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease }}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-4 lg:gap-3 xl:gap-4"
            >
              {currentFramework.items.map((item, idx) => (
                <div
                  key={item.name}
                  className="relative h-full flex flex-col"
                  onMouseEnter={() => setHoveredPillar(idx)}
                  onMouseLeave={() => setHoveredPillar(null)}
                  onClick={() => setHoveredPillar(hoveredPillar === idx ? null : idx)}
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: idx * 0.05, ease }}
                    className={`group relative overflow-hidden rounded-2xl border bg-white/[0.03] px-3 py-4 sm:px-3.5 sm:py-6 flex flex-col items-center justify-center text-center h-full min-h-[140px] sm:min-h-[165px] shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-105 hover:bg-white/[0.06] cursor-pointer ${
                      hoveredPillar === idx ? 'border-white/40 ring-1 ring-white/20' : 'border-white/10'
                    }`}
                  >
                    {/* Colored Top Accent Bar */}
                    <div
                      className="pointer-events-none absolute inset-x-0 top-0 h-1 opacity-80 group-hover:opacity-100 transition-opacity"
                      style={{ background: item.color }}
                    />

                    {/* Subtle Ambient Hover Glow */}
                    <div
                      className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"
                      style={{ background: `${item.color}20` }}
                    />

                    {/* Pillar Title */}
                    <h3 className="font-display text-sm sm:text-[14.5px] md:text-base lg:text-[15px] xl:text-[16px] font-bold tracking-tight uppercase text-white leading-snug w-full px-0.5 whitespace-normal break-words">
                      {item.name}
                    </h3>

                    {/* Pillar Subtitle */}
                    <p className="font-display mt-2 text-xs sm:text-[13.5px] md:text-[14px] lg:text-[14.5px] text-white/85 font-medium leading-tight sm:leading-relaxed px-0.5">
                      {item.subtitle}
                    </p>
                  </motion.div>

                  {/* Mouseover Popover / Tooltip */}
                  {item.role && item.impact && (
                    <AnimatePresence>
                      {hoveredPillar === idx && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.96 }}
                          transition={{ duration: 0.2 }}
                          className={`absolute top-full mt-2.5 z-50 w-[320px] xs:w-[360px] sm:w-[400px] md:w-[440px] lg:w-[460px] max-w-[92vw] rounded-2xl border border-white/20 bg-[#0c121d]/95 backdrop-blur-xl p-5 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.85)] text-left ${
                            idx % 2 === 0 ? 'left-0' : 'right-0'
                          } ${
                            idx % 3 === 0
                              ? 'sm:left-0 sm:right-auto sm:translate-x-0'
                              : idx % 3 === 1
                              ? 'sm:left-1/2 sm:right-auto sm:-translate-x-1/2'
                              : 'sm:right-0 sm:left-auto sm:translate-x-0'
                          } ${
                            idx === 0
                              ? 'lg:left-0 lg:right-auto lg:translate-x-0'
                              : idx === 1
                              ? 'lg:left-0 lg:right-auto lg:translate-x-0'
                              : idx === 2 || idx === 3
                              ? 'lg:left-1/2 lg:right-auto lg:-translate-x-1/2'
                              : 'lg:right-0 lg:left-auto lg:translate-x-0'
                          }`}
                          style={{
                            boxShadow: `0 15px 35px -5px ${item.color}35, 0 0 0 1px rgba(255,255,255,0.15)`,
                          }}
                        >
                          {/* Top colored accent line */}
                          <div
                            className="absolute inset-x-0 top-0 h-1 rounded-t-2xl"
                            style={{ background: item.color }}
                          />

                          <div className="mb-3 pt-0.5">
                            <h4 className="font-display text-lg sm:text-xl md:text-2xl font-bold text-white tracking-tight leading-snug">
                              {item.name}
                            </h4>
                          </div>

                          <div className="space-y-3 text-sm sm:text-base md:text-[16px] font-display leading-relaxed text-white">
                            <p className="flex items-start gap-2.5">
                              <span className="text-white font-bold text-base select-none shrink-0 leading-none mt-1">•</span>
                              <span>{item.role}</span>
                            </p>
                            <p className="flex items-start gap-2.5">
                              <span className="text-white font-bold text-base select-none shrink-0 leading-none mt-1">•</span>
                              <span>{item.impact}</span>
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  )}
                </div>
              ))}
            </motion.div>
          </AnimatePresence>

          {/* Philosophy Deep Dive: Value Cycle & 3 Impact Boxes */}
          {activeTab === 'philosophy' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-10 sm:mt-14 w-full max-w-5xl mx-auto space-y-10"
            >
              {/* How the Pillars Work Together: The BPA Value Cycle */}
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-10 shadow-2xl backdrop-blur-md text-left space-y-4">
                <div className="space-y-1">
                  <p className="font-display text-xs sm:text-sm font-bold uppercase tracking-widest text-blue-400">
                    How the Pillars Work Together
                  </p>
                  <h3 className="font-display text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white">
                    The BPA Value Cycle
                  </h3>
                </div>

                <div className="space-y-3.5 font-display text-base sm:text-lg md:text-[19px] leading-relaxed font-normal" style={{ color: premiumWhite.warm }}>
                  <p>
                    A single weak pillar compromises the entire structure.
                  </p>
                  <p>
                    High sales (<span className="text-red-400 font-medium">Red</span>) supported by inefficient operations (<span className="text-emerald-400 font-medium">Green</span>) erodes margins.
                    <br />
                    Strong strategy (<span className="text-blue-400 font-medium">Blue</span>) without team alignment (<span className="text-orange-400 font-medium">Orange</span>) stalls execution.
                  </p>
                  <p className="pt-1 text-white font-semibold">
                    BYRGOP&rsquo;s Business Profit Architecture balances and integrates all six disciplines to construct a resilient, high-performing enterprise.
                  </p>
                </div>
              </div>

              {/* Why BYRGOP's Framework Delivers Impact */}
              <div className="space-y-5 text-left">
                <h3 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white text-center md:text-left">
                  Why BYRGOP&rsquo;s Framework Delivers Impact
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
                  {/* Box 01 */}
                  <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-7 shadow-xl backdrop-blur-md transition-all duration-300 hover:border-white/20 hover:bg-white/[0.06]">
                    <h4 className="font-display text-lg sm:text-xl md:text-[21px] font-bold tracking-tight text-white">
                      Holistic Diagnosis
                    </h4>
                    <p className="font-display mt-3 text-base sm:text-[17px] leading-relaxed font-normal" style={{ color: premiumWhite.warm }}>
                      We look across all six dimensions to identify the real bottlenecks&mdash;not just the visible symptoms.
                    </p>
                  </div>

                  {/* Box 02 */}
                  <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-7 shadow-xl backdrop-blur-md transition-all duration-300 hover:border-white/20 hover:bg-white/[0.06]">
                    <h4 className="font-display text-lg sm:text-xl md:text-[21px] font-bold tracking-tight text-white">
                      Structural Balance
                    </h4>
                    <p className="font-display mt-3 text-base sm:text-[17px] leading-relaxed font-normal" style={{ color: premiumWhite.warm }}>
                      We align strategy with operations, finance, people, marketing, and technology.
                    </p>
                  </div>

                  {/* Box 03 */}
                  <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-7 shadow-xl backdrop-blur-md transition-all duration-300 hover:border-white/20 hover:bg-white/[0.06]">
                    <h4 className="font-display text-lg sm:text-xl md:text-[21px] font-bold tracking-tight text-white">
                      Measurable Results
                    </h4>
                    <p className="font-display mt-3 text-base sm:text-[17px] leading-relaxed font-normal" style={{ color: premiumWhite.warm }}>
                      We use clear KPIs to measure improvement and business performance.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </motion.section>

        {/* Mission & Vision Cards */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35, ease }}
          className="mb-16 sm:mb-20 w-full max-w-5xl lg:max-w-6xl"
        >
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8">
            {/* Our Mission Card */}
            <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-8 sm:p-10 shadow-2xl backdrop-blur-md transition-all duration-300 hover:border-blue-500/30 hover:bg-white/[0.05]">
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-blue-500/60 to-transparent opacity-80 group-hover:opacity-100 transition-opacity"
              />
              <h3 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3">
                Our Mission
              </h3>
              <p className="font-display text-base sm:text-lg leading-relaxed font-normal" style={{ color: premiumWhite.warm }}>
                Empowering SMEs in India with innovative, data-driven, and execution-focused strategies to enhance operational efficiency, drive sustainable growth, and create a resilient competitive advantage in an evolving business landscape.
              </p>
            </div>

            {/* Our Vision Card */}
            <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-8 sm:p-10 shadow-2xl backdrop-blur-md transition-all duration-300 hover:border-blue-500/30 hover:bg-white/[0.05]">
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-blue-500/60 to-transparent opacity-80 group-hover:opacity-100 transition-opacity"
              />
              <h3 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3">
                Our Vision
              </h3>
              <p className="font-display text-base sm:text-lg leading-relaxed font-normal" style={{ color: premiumWhite.warm }}>
                To be the most trusted strategy consultancy for SMEs in India, fostering a culture of operational efficiency, relentless innovation, and strategic excellence that transforms local businesses into globally competitive enterprises.
              </p>
            </div>
          </div>
        </motion.section>

        {/* Pro Bono Consulting Card */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.38, ease }}
          className="mb-16 sm:mb-20 w-full max-w-5xl lg:max-w-6xl"
        >
          <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-8 sm:p-10 shadow-2xl backdrop-blur-md transition-all duration-300 hover:border-blue-500/30 hover:bg-white/[0.05]">
            {/* Top Accent Gradient Bar */}
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-blue-500/60 to-transparent opacity-80 group-hover:opacity-100 transition-opacity"
            />

            <div className="space-y-3 text-left">
              <h2 className="font-display text-xl sm:text-2xl md:text-3xl lg:text-[2.2rem] font-bold leading-tight tracking-tight text-white">
                Empowering Businesses with Pro Bono Support
              </h2>
              <p className="font-display text-base sm:text-lg font-medium text-blue-300/90">
                Unlock Strategic Growth for Your Business — Without the Cost
              </p>
              <p
                className="font-display text-base sm:text-lg leading-relaxed font-normal max-w-4xl"
                style={{ color: premiumWhite.warm }}
              >
                At BYRGOP, we believe every business deserves access to expert guidance,
                regardless of financial constraints. That&rsquo;s why we proudly offer pro bono support
                to select businesses, social enterprises, and mission-driven organizations in need of strategic direction.
              </p>
            </div>

            {/* 4 Core Pillars in Editorial Grid Flow */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-6 border-t border-white/10 text-left">
              <div className="space-y-1.5">
                <h3 className="font-display text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <span className="text-blue-400">✓</span> Strategic Roadmaps
                </h3>
                <p className="font-display text-xs sm:text-sm text-white/90 font-normal leading-relaxed" style={{ color: premiumWhite.warm }}>
                  Actionable growth strategies tailored to your unique goals and challenges.
                </p>
              </div>

              <div className="space-y-1.5">
                <h3 className="font-display text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <span className="text-blue-400">✓</span> Operational Excellence
                </h3>
                <p className="font-display text-xs sm:text-sm text-white/90 font-normal leading-relaxed" style={{ color: premiumWhite.warm }}>
                  Optimizing systems and processes to reduce overhead and improve scalability.
                </p>
              </div>

              <div className="space-y-1.5">
                <h3 className="font-display text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <span className="text-blue-400">✓</span> Leadership & Mentorship
                </h3>
                <p className="font-display text-xs sm:text-sm text-white/90 font-normal leading-relaxed" style={{ color: premiumWhite.warm }}>
                  Executive guidance to strengthen leadership and enhance strategic decision-making.
                </p>
              </div>

              <div className="space-y-1.5">
                <h3 className="font-display text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <span className="text-blue-400">✓</span> Execution Support
                </h3>
                <p className="font-display text-xs sm:text-sm text-white/90 font-normal leading-relaxed" style={{ color: premiumWhite.warm }}>
                  Practical implementation guidance to turn strategy into measurable results.
                </p>
              </div>
            </div>

            {/* Flowing Footer Note */}
            <div className="mt-8 pt-6 border-t border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs sm:text-sm text-white text-left">
              <p style={{ color: premiumWhite.warm }}>
                <strong className="text-white font-semibold">Who Can Apply:</strong> Early-stage SMEs, social enterprises, non-profits, women-led ventures, and startup founders.
              </p>
              <p className="text-white/80 italic shrink-0">
                Limited slots per quarter • Reach out below to inquire
              </p>
            </div>
          </div>
        </motion.section>

        {/* The Story Behind BYRGOP */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.39, ease }}
          className="mb-16 sm:mb-20 w-full max-w-5xl lg:max-w-6xl"
        >
          <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-8 sm:p-12 shadow-2xl backdrop-blur-md transition-all duration-300 hover:border-blue-500/30 hover:bg-white/[0.05]">
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-blue-500/60 to-transparent opacity-80 group-hover:opacity-100 transition-opacity"
            />

            <div className="space-y-6 text-left">
              <h2 className="font-display text-xl sm:text-2xl md:text-3xl lg:text-[2.2rem] font-bold leading-tight tracking-tight text-white">
                The Story Behind BYRGOP
              </h2>

              <p className="font-display text-lg sm:text-xl font-medium text-blue-400 leading-relaxed">
                Every great idea has a beginning. Ours began with a simple question about colors.
              </p>

              <div className="space-y-4 font-display text-base sm:text-lg leading-relaxed font-normal" style={{ color: premiumWhite.warm }}>
                <p>
                  One day, our founder was watching television with his granddaughter when a video about colors caught their attention.
                  Confidently, he identified red, green, and blue as the primary colors. His granddaughter disagreed—and that playful moment of disagreement led to a surprising discovery.
                </p>

                <p>
                  Blue, Yellow, and Red are the primary colors, while Green, Orange, and Purple are the secondary colors.
                </p>

                <p>
                  Six colors. Six distinct identities. One unexpected inspiration.
                </p>

                <p>
                  That moment became the seed of BYRGOP.
                </p>

                <p>
                  What began as a simple moment between a grandfather and his granddaughter became the inspiration for something much bigger.
                </p>

                <p>
                  Today, these six colors are more than our visual identity. They form the foundation of the BYRGOP philosophy across our 6 Pillars, 6 Step Process, 6 Phases of Business, 6 Values, and 6 Ethical Standards.
                </p>

                <p className="pt-2 text-white font-semibold text-base sm:text-lg">
                  Six Colors. Six Dimensions. One Purpose &mdash; Business Profit Architects.
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Final Assessment CTA Section */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.395, ease }}
          className="mb-16 sm:mb-20 w-full max-w-5xl lg:max-w-6xl text-center"
        >
          <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-8 sm:p-12 shadow-2xl backdrop-blur-md transition-all duration-300 hover:border-amber-500/30 hover:bg-white/[0.05]">
            {/* Top Accent Gradient Bar */}
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-amber-500/60 to-transparent opacity-80 group-hover:opacity-100 transition-opacity"
            />

            <div className="space-y-5 flex flex-col items-center justify-center">
              <h2 className="font-display text-xl sm:text-2xl md:text-3xl lg:text-[2.2rem] font-bold leading-tight tracking-tight text-white">
                Where Does Your Business Stand?
              </h2>
              <p
                className="font-display mx-auto max-w-2xl text-base sm:text-lg md:text-[19px] leading-relaxed font-normal"
                style={{ color: premiumWhite.warm }}
              >
                Get a clearer view of your business strengths, gaps, and opportunities.
              </p>
              <div className="pt-3">
                <PrimaryButton
                  onClick={() => {
                    if (onAssess) {
                      onAssess();
                    } else {
                      window.location.href = '/';
                    }
                  }}
                  className="font-display px-8 sm:px-10 py-3.5 sm:py-4 text-base sm:text-lg font-bold tracking-wide shadow-glow"
                >
                  Assess Your Business &rarr;
                </PrimaryButton>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Get in Touch Section */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.398, ease }}
          className="mb-16 sm:mb-24 w-full max-w-xl"
        >
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] px-6 py-10 sm:px-10 shadow-2xl backdrop-blur-md">
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-px"
              style={{
                background: `linear-gradient(90deg, transparent, ${brand.accent}, transparent)`,
              }}
            />
            <div className="text-center">
              <h2 className="font-display text-xl sm:text-2xl md:text-3xl lg:text-[2.2rem] font-bold leading-tight tracking-tight text-white">
                Get in Touch
              </h2>
              <p className="font-display mx-auto mt-4 max-w-lg text-base sm:text-lg md:text-xl leading-relaxed font-normal" style={{ color: premiumWhite.warm }}>
                Want to know more about how BYRGOP can support your business? Reach out and we&rsquo;ll get back to you.
              </p>
            </div>

            {submitted ? (
              <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-8 text-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, ease }}
                  className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full"
                  style={{ background: `${brand.palette.green[500]}22` }}
                >
                  <span className="text-2xl" style={{ color: brand.palette.green[400] }}>✓</span>
                </motion.div>
                <h3 className="font-display text-xl font-semibold" style={{ color: premiumWhite.bright }}>
                  Thank you. Our team will be in touch with you.
                </h3>
              </div>
            ) : (
              <div className="mt-8 space-y-4">
                <div>
                  <label className="font-display mb-1.5 block text-xs font-medium uppercase tracking-[0.15em]" style={{ color: premiumWhite.soft }}>
                    Email
                  </label>
                  <input
                    type="email"
                    inputMode="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="font-display w-full rounded-xl border border-white/[0.10] bg-white/[0.04] px-4 py-3 text-sm outline-none transition-colors focus:border-white/25"
                    style={{ 
                      color: premiumWhite.bright,
                    }}
                  />
                </div>
                <div>
                  <label className="font-display mb-1.5 block text-xs font-medium uppercase tracking-[0.15em]" style={{ color: premiumWhite.soft }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    inputMode="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="font-display w-full rounded-xl border border-white/[0.10] bg-white/[0.04] px-4 py-3 text-sm outline-none transition-colors focus:border-white/25"
                    style={{ 
                      color: premiumWhite.bright,
                    }}
                  />
                </div>
                {err && <p className="font-display text-xs" style={{ color: brand.palette.red[400] }}>{err}</p>}
                <PrimaryButton 
                  onClick={handleSubmit} 
                  disabled={!canSubmit} 
                  className="font-display w-full px-6 py-3 text-lg font-bold tracking-[0.05em]"
                >
                  {submitting ? 'Submitting…' : 'Get in Touch'}
                </PrimaryButton>
              </div>
            )}
          </div>
        </motion.section>

        {/* Our Team Section */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease }}
          className="mb-16 sm:mb-20 w-full max-w-5xl lg:max-w-6xl text-center"
        >
          <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-8 sm:p-12 shadow-2xl backdrop-blur-md transition-all duration-300 hover:border-blue-500/30 hover:bg-white/[0.05]">
            {/* Top Accent Gradient Bar */}
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-blue-500/60 to-transparent opacity-80 group-hover:opacity-100 transition-opacity"
            />

            {/* Section Header */}
            <div className="space-y-3 mb-10 text-center">
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-[2.4rem] font-bold leading-tight tracking-tight text-white">
                Our Team
              </h2>
              <p
                className="font-display mx-auto max-w-2xl text-base sm:text-lg leading-relaxed font-normal"
                style={{ color: premiumWhite.warm }}
              >
                The minds driving Business Profit Architecture through strategy, execution, and digital engineering.
              </p>
            </div>

            {/* 2x2 Grid of Horizontal Profile Cards (No vertical bars) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 items-stretch">
              {TEAM_MEMBERS.map((member, idx) => (
                <motion.div
                  key={member.name}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.08, ease }}
                  className="group/card relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 text-center sm:text-left shadow-xl backdrop-blur-md transition-all duration-300 hover:bg-white/[0.06] hover:border-white/20"
                >
                  {/* Photo / Avatar */}
                  <div className="relative shrink-0">
                    <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full p-[2px] transition-transform duration-300 group-hover/card:scale-105 bg-gradient-to-tr from-white/30 via-white/10 to-white/25 shadow-lg">
                      <div className="w-full h-full rounded-full bg-[#0d131f] flex items-center justify-center border border-white/20 shadow-inner overflow-hidden">
                        {member.image ? (
                          <img
                            src={member.image}
                            alt={member.name.replace('\n', ' ')}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white">
                            {member.initials}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Content Area */}
                  <div className="flex-1 flex flex-col justify-between h-full min-w-0">
                    <div>
                      {/* Name Header */}
                      <div className="flex items-center justify-center sm:justify-start w-full">
                        <h3 className="font-display text-lg sm:text-xl md:text-[22px] font-bold tracking-tight text-white uppercase leading-snug text-center sm:text-left">
                          {member.name.replace('\n', ' ')}
                        </h3>
                      </div>

                      {/* Value Add / Experience */}
                      {member.value && (
                        <p
                          className="font-display text-base sm:text-[16.5px] md:text-[17.5px] font-normal mt-3 leading-relaxed"
                          style={{ color: premiumWhite.warm }}
                        >
                          {member.value}
                        </p>
                      )}
                    </div>

                    {/* LinkedIn Button (Radha Krishna) */}
                    {member.linkedin && (
                      <div className="mt-3.5 pt-2.5 border-t border-white/10 flex justify-center sm:justify-start">
                        <a
                          href={member.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-white bg-[#0A66C2]/30 hover:bg-[#0A66C2]/55 border border-[#0A66C2]/60 shadow-sm transition-all duration-200 hover:scale-105"
                          title={`Connect with ${member.name.replace('\n', ' ')} on LinkedIn`}
                        >
                          <svg className="w-3.5 h-3.5 fill-current text-[#70b5f9]" viewBox="0 0 24 24">
                            <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.64a1.64 1.64 0 1 0 0 3.28 1.64 1.64 0 0 0 0-3.28" />
                          </svg>
                          <span>LinkedIn</span>
                        </a>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>


        {/* Animated Dots */}
        <motion.div
          className="mt-12 flex items-center justify-center gap-4 sm:gap-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          {six.map((c, i) => (
            <motion.div
              key={i}
              className="relative"
              initial={{ y: -40, opacity: 0, scale: 0.5 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{
                delay: 0.7 + i * 0.1,
                duration: 0.6,
                type: 'spring',
                stiffness: 200,
                damping: 15,
              }}
            >
              <div
                className="h-4 w-4 rounded-full shadow-xl transition-transform duration-300 hover:scale-125 cursor-pointer"
                style={{ background: c, boxShadow: `0 3px 16px ${c}55` }}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="font-display mt-6 text-[11px] font-medium uppercase tracking-[0.3em]"
          style={{ color: premiumWhite.soft }}
        >
          {brand.tagline}
        </motion.p>
      </div>
    </div>
  );
}