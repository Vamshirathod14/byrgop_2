// Light-mode design tokens for the BYRGOP Admin Console.
// The Admin Panel is light-mode only (no theme switching, never follows the OS).
export const adminBrand = {
  name: 'BYRGOP',
  tagline: 'Business Profit Architects',
  logo: '/byrgop-logo.png',
  // Shared premium white hierarchy with the main site (IntroScreen source of truth).
  premiumWhite: {
    bright: '#FFFFFF',
    soft: '#F6F5F1',
    warm: '#F2EFE8',
  },
  palette: {
    // 400/500 are fills and tints; 600/700 are the readable text shades on light surfaces.
    blue: { 400: '#3D97DB', 500: '#0A78CF', 600: '#0861AA', 700: '#0B4E8A' },
    green: { 400: '#2DA363', 500: '#0D8845', 600: '#0A7039', 700: '#0A5A31' },
    orange: { 400: '#F67F39', 500: '#F5630D', 600: '#D4540A', 700: '#9A3E00' },
    yellow: { 400: '#FCB22E', 500: '#FCA700', 600: '#D88D00', 700: '#8F5F00' },
    red: { 400: '#EB5564', 500: '#E52032', 600: '#C31B2A', 700: '#A61A26' },
    purple: { 400: '#8C56BB', 500: '#7038A5', 600: '#5C2E89', 700: '#4B2371' },
  },
  // "ink" shades in light mode: 900-850-800 are light surfaces, 950 is the
  // dark ink used for text sitting on accent (amber) fills.
  ink: {
    950: '#20242C',
    900: '#F6F5F1',
    850: '#FFFFFF',
    800: '#FFFFFF',
    700: '#F1EFEA',
  },
  accent: '#FCA700',
  accentHover: '#FCB22E',
  // Darker amber reserved for accent-colored TEXT on light surfaces (badges,
  // links, active nav, session ids). Plain `accent` fails WCAG on white (~2:1).
  accentText: '#8A5300',
  text: '#20242C',
  textMuted: '#5B6470',
  surface: '#E8E6E0',
  border: '#E4E2DC',
  danger: '#D43C3C',
  success: '#1F9D65',
  bgBase: '#F6F5F1',
  bgSurface: '#FFFFFF',
};