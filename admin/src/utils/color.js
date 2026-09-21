// Text-safe color helpers for the light theme.
// Stage/category colors are chosen for *fills* (dots, chips, chart bars) and are
// often too light to read as small text on white. `darkText` keeps the hue but
// darkens the color until it clears WCAG AA (>= 4.5:1) on white surfaces.

// The six brand colours offered as swatches in the admin colour pickers. Answer
// colours are stored/transmitted as HEX strings; this list is the convenience
// swatch panel, NOT an allowed-value whitelist.
export const ANSWER_COLOURS = [
  { key: 'blue', label: 'Blue', hex: '#0A78CF' },
  { key: 'yellow', label: 'Yellow', hex: '#FCA700' },
  { key: 'red', label: 'Red', hex: '#E52032' },
  { key: 'green', label: 'Green', hex: '#0D8845' },
  { key: 'orange', label: 'Orange', hex: '#F5630D' },
  { key: 'purple', label: 'Purple', hex: '#7038A5' },
];

// Defaults applied to missing answer colours (must mirror backend).
export const DEFAULT_YES_COLOR = '#4CAF50';
export const DEFAULT_NO_COLOR = '#E53935';

const HEX_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function isAnswerColour(value) {
  return typeof value === 'string' && HEX_RE.test(value.trim());
}

// Hex for display. Any valid hex passes through; one of the six brand colours
// could also be given as a key ('blue' → '#0A78CF'). Returns null otherwise.
export function answerColourHex(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (HEX_RE.test(trimmed)) return trimmed;
  return ANSWER_COLOURS.find((c) => c.key === trimmed.toLowerCase())?.hex || null;
}

// Human label ('Blue') for one of the six brand swatch colours, null for a
// custom hex (which has no label).
export function answerColourLabel(value) {
  if (typeof value !== 'string') return null;
  const hex = answerColourHex(value);
  if (!hex) return null;
  return ANSWER_COLOURS.find((c) => c.hex.toLowerCase() === hex.toLowerCase())?.label || null;
}

// Field-level validation: empty is allowed (defaults apply), anything else must
// be a valid hex colour.
export function answerColourError(value) {
  if (value == null || value === '') return null;
  return isAnswerColour(value) ? null : 'Choose a valid hex colour (e.g. #0A78CF).';
}

const parse = (hex) => {
  const m = String(hex || '').match(/^#?([0-9a-f]{6})$/i);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [n >> 16, (n >> 8) & 255, n & 255];
};

const luminance = ([r, g, b]) => {
  const f = (v) => {
    v /= 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};

// Darken `hex` (stepwise, preserving hue) until its luminance is in a range that
// clears ~4.5:1 on white. Colors already dark enough pass through unchanged.
export function darkText(hex) {
  const c = parse(hex);
  if (!c) return hex;
  let [r, g, b] = c;
  // Target luminance 0.15 => contrast ~4.9:1 on white; keeps 400/500 fills readable.
  for (let i = 0; i < 40; i++) {
    if (luminance([r, g, b]) <= 0.15) break;
    r = Math.round(r * 0.85);
    g = Math.round(g * 0.85);
    b = Math.round(b * 0.85);
  }
  return `rgb(${r}, ${g}, ${b})`;
}