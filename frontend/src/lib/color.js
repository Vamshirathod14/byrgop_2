// Shared per-answer colour helpers for the assessment screens.
//
// Answer colours are HEX strings stored on each option. The backend serves the
// stored hex (or the default for missing values). This module resolves an
// option's colour to a renderable hex with a safe default fallback for legacy
// data, and picks a readable foreground colour for text placed on that fill.

// The six BYRGOP brand colours (admin swatch list). Colours are stored/served
// as hex; this list is only used for the default swatch convenience and the
// readable-text computation.
export const ANSWER_COLOURS = [
  { key: 'blue', label: 'Blue', hex: '#0A78CF' },
  { key: 'yellow', label: 'Yellow', hex: '#FCA700' },
  { key: 'red', label: 'Red', hex: '#E52032' },
  { key: 'green', label: 'Green', hex: '#0D8845' },
  { key: 'orange', label: 'Orange', hex: '#F5630D' },
  { key: 'purple', label: 'Purple', hex: '#7038A5' },
];

// Fallback defaults for missing colours (mirrors the backend defaults).
export const DEFAULT_YES_COLOR = '#4CAF50';
export const DEFAULT_NO_COLOR = '#E53935';

const HEX_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function isHexColor(value) {
  return typeof value === 'string' && HEX_RE.test(value.trim());
}

// Always resolve an option's colour to a renderable hex. Never lets a
// malformed/missing colour reach the UI: falls back to the configured defaults
// so two different questions always use their own (possibly distinct)
// per-question colours, and identical ones naturally share.
export function optionColor({ text, color, index = 0 }) {
  if (isHexColor(color)) return color.trim();
  const label = String(text || '').trim().toLowerCase();
  if (label === 'yes') return DEFAULT_YES_COLOR;
  if (label === 'no') return DEFAULT_NO_COLOR;
  return index < 2 ? DEFAULT_YES_COLOR : DEFAULT_NO_COLOR;
}

// Foreground colour for text placed on top of `hex`, chosen by WCAG-ish
// relative luminance so Yes/No buttons and option badges stay readable.
export function readableTextColor(hex) {
  const clean = String(hex || '').replace('#', '');
  if (clean.length === 3) {
    return readableTextColor(`#${clean[0]}${clean[0]}${clean[1]}${clean[1]}${clean[2]}${clean[2]}`);
  }
  const int = parseInt(clean, 16);
  if (!Number.isFinite(int) || clean.length !== 6) return '#111827';
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? '#111827' : '#FFFFFF';
}