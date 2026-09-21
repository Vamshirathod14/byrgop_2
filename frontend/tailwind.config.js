import { brand } from './src/theme/brand.js';

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: brand.ink[950],
          900: brand.ink[900],
          850: brand.ink[850],
          800: brand.ink[800],
          700: brand.ink[700],
        },
        blue: brand.palette.blue,
        green: brand.palette.green,
        orange: brand.palette.orange,
        yellow: brand.palette.yellow,
        red: brand.palette.red,
        purple: brand.palette.purple,
        brand: {
          accent: brand.accent,
          accentHover: brand.accentHover,
        },
        mist: {
          DEFAULT: brand.text,
          soft: brand.premiumWhite.soft,
          warm: brand.premiumWhite.warm,
          muted: brand.textMuted,
        },
      },
      fontFamily: {
        display: [brand.fonts.display],
        body: [brand.fonts.body],
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      boxShadow: {
        glow: `0 0 60px -12px ${brand.accent}55`,
        'glow-blue': `0 0 60px -14px ${brand.palette.blue[500]}aa`,
        card: '0 24px 80px -32px rgba(0,0,0,0.75)',
      },
      keyframes: {
        'pulse-soft': {
          '0%, 100%': { opacity: 0.35 },
          '50%': { opacity: 0.7 },
        },
      },
      animation: {
        'pulse-soft': 'pulse-soft 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
