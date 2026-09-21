// Per-question answer colours.
//
// Approvals/onboarding questions store the colour of the Yes and No answer
// buttons as a HEX string on each option (`options[].color`). Admin picks the
// colours from a swatch panel of the six BYRGOP brand colours, but any valid
// hex value is a legal stored colour. A missing colour falls back to the
// defaults (Yes → #4CAF50, No → #E53935) so legacy questions stay valid; a
// colour that is present but not a valid hex is a hard validation error.

// The six brand colours offered as swatches in the admin colour picker. Other
// hex values are still valid; this list is the convenience panel, not a schema.
export const ANSWER_COLOURS = [
  { key: 'blue', label: 'Blue', hex: '#0A78CF' },
  { key: 'yellow', label: 'Yellow', hex: '#FCA700' },
  { key: 'red', label: 'Red', hex: '#E52032' },
  { key: 'green', label: 'Green', hex: '#0D8845' },
  { key: 'orange', label: 'Orange', hex: '#F5630D' },
  { key: 'purple', label: 'Purple', hex: '#7038A5' },
];

export const ANSWER_COLOUR_HEX = new Map(ANSWER_COLOURS.map((c) => [c.hex.toLowerCase(), c]));

// Defaults applied to legacy/missing answer colours.
export const DEFAULT_YES_COLOR = '#4CAF50';
export const DEFAULT_NO_COLOR = '#E53935';

const HEX_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function isAnswerColour(value) {
  return typeof value === 'string' && HEX_RE.test(value.trim());
}

// Label ('Blue') for one of the six brand swatch colours, null for a custom hex.
export function answerColourLabel(value) {
  if (typeof value !== 'string') return null;
  return ANSWER_COLOURS.find((c) => c.hex.toLowerCase() === value.trim().toLowerCase())?.label || null;
}

// Hex resolved for display. Any valid hex passes through; one of the six brand
// colours could also be given as a key ('blue' → '#0A78CF') for convenience.
// Returns null for anything that is not a colour.
export function answerColourHex(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (HEX_RE.test(trimmed)) return trimmed;
  return ANSWER_COLOURS.find((c) => c.key === trimmed.toLowerCase())?.hex || null;
}

// Resolve one option's stored colour to a hex string.
//
//   Onboarding Question (Yes/No): the option text picks the default (Yes →
//   default green, No → default red) when the colour is missing.
//   Know Yourself Question: KY options carry a per-question YES colour (first
//   two options) and NO colour (last two options); missing values backfill by
//   option index (index < 2 → default green, else → default red).
//
// Returns { color } with the hex value, or { error } when a colour is present
// but not a valid hex colour.
export function resolveOptionColor({ text, color, index = 0 }) {
  if (color === undefined || color === null || color === '') {
    if (text != null && String(text).toLowerCase().trim() === 'yes') {
      return { color: DEFAULT_YES_COLOR };
    }
    if (text != null && String(text).toLowerCase().trim() === 'no') {
      return { color: DEFAULT_NO_COLOR };
    }
    const i = Number.isInteger(index) ? index : 0;
    return { color: i < 2 ? DEFAULT_YES_COLOR : DEFAULT_NO_COLOR };
  }
  const hex = String(color).trim();
  if (!isAnswerColour(hex)) {
    return {
      error: `Invalid answer colour "${color}" — use a valid hex colour such as #0A78CF.`,
    };
  }
  return { color: hex };
}

export function normalizeOptionColor({ text, color, index }) {
  const { color: resolved, error } = resolveOptionColor({ text, color, index });
  if (error) throw new TypeError(error);
  return resolved;
}

// Resolved hex for public-facing APIs (question pool, KY serve/resume screens).
// Returns null when the resolved colour is invalid, so the UI never receives an
// unresolvable value.
export function resolveOptionHex({ text, color, index }) {
  const { color: hex, error } = resolveOptionColor({ text, color, index });
  return error ? null : hex;
}