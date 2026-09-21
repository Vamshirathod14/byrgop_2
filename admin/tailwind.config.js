import { adminBrand } from './src/theme/brand.js';

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: adminBrand.ink[950],
          900: adminBrand.ink[900],
          850: adminBrand.ink[850],
          800: adminBrand.ink[800],
          700: adminBrand.ink[700],
        },
        blue: adminBrand.palette.blue,
        green: adminBrand.palette.green,
        orange: adminBrand.palette.orange,
        yellow: adminBrand.palette.yellow,
        red: adminBrand.palette.red,
        purple: adminBrand.palette.purple,
        brand: {
          accent: adminBrand.accent,
          accentHover: adminBrand.accentHover,
          accentText: adminBrand.accentText,
        },
        mist: {
          DEFAULT: adminBrand.text,
          soft: adminBrand.premiumWhite.soft,
          warm: adminBrand.premiumWhite.warm,
          muted: adminBrand.textMuted,
        },
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      fontFamily: {
        display: ['Poppins', 'system-ui', 'sans-serif'],
        body: ['Poppins', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
