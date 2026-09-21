import { categoryLabel } from '../lib/categories.js';

export const brand = {
  name: 'BYRGOP',
  tagline: 'Business Profit Architects',
  logo: '/logo.jpg',
  // Premium white text hierarchy established by IntroScreen (source of truth):
  // bright = H1/major titles/important numbers · soft = H2-H3/supporting titles
  // warm = paragraphs/descriptions/body copy
  premiumWhite: {
    bright: '#FFFFFF',
    soft: '#F8F6F0',
    warm: '#F5F0E8',
  },
  palette: {
    blue: { 300: '#6BB1E8', 400: '#3D97DB', 500: '#0A78CF', 600: '#0861AA', 700: '#064A84' },
    green: { 300: '#5FC58E', 400: '#2DA363', 500: '#0D8845', 600: '#0A7039', 700: '#08582D' },
    orange: { 300: '#F8A066', 400: '#F67F39', 500: '#F5630D', 600: '#D4540A', 700: '#A84308' },
    yellow: { 300: '#FDC15C', 400: '#FCB22E', 500: '#FCA700', 600: '#D88D00', 700: '#B07300' },
    red: { 300: '#F08B94', 400: '#EB5564', 500: '#E52032', 600: '#C31B2A', 700: '#9A1521' },
    purple: { 300: '#A97ACD', 400: '#8C56BB', 500: '#7038A5', 600: '#5C2E89', 700: '#48246D' },
  },
  ink: {
    950: '#06080E',
    900: '#0A0E16',
    850: '#0D1220',
    800: '#111728',
    700: '#1A2336',
  },
  accent: '#FCA700',
  accentHover: '#FCB22E',
  text: '#F6F7FA',
  textMuted: 'rgba(246,247,250,0.58)',
  surface: 'rgba(255,255,255,0.04)',
  surfaceStrong: 'rgba(255,255,255,0.07)',
  border: 'rgba(255,255,255,0.10)',
  danger: '#E52032',
  success: '#0D8845',
  // Page backgrounds — used across every screen's root gradient.
  bgBase: '#0a0a0f',
  bgSurface: '#14141e',
  // Official six-colour mark (ink order: Blue, Yellow, Red, Green, Orange, Purple)
  mark: ['#0A78CF', '#FCA700', '#E52032', '#0D8845', '#F5630D', '#7038A5'],
  // Bilingual brand lockup (right side of the header).
  // IMPORTANT: fill these ONLY with wording the client has explicitly approved.
  // Until then keep both empty — do NOT invent or transliterate.
  bilingual: {
    telugu: '',
    hindi: '',
  },
  // Scratchpad for approved copy when it arrives.
  bilingualLabels: {
    telugu: 'Telugu',
    hindi: 'Hindi',
  },
  fonts: {
    display: "'Cormorant Garamond', serif",
    body: "'Inter', sans-serif",
  },
  categories: {
    strategic: { name: categoryLabel('strategic'), color: '#0A78CF', soft: 'rgba(10,120,207,0.16)' },
    operational: { name: categoryLabel('operational'), color: '#0D8845', soft: 'rgba(13,136,69,0.16)' },
    revenue: { name: categoryLabel('revenue'), color: '#F5630D', soft: 'rgba(245,99,13,0.16)' },
  },
  steps: [
    { key: 'strategic', color: '#0A78CF' },
    { key: 'operational', color: '#0D8845' },
    { key: 'revenue', color: '#F5630D' },
  ],
};
