// ─── 12th Anniversary visitor registration event window ───
// The event runs in the venue's timezone (Asia/Kolkata). All QR validity
// boundaries are derived from wall-clock times in that zone so enforcement is
// consistent no matter where the server or clients run.

export const EVENT_TIMEZONE = 'Asia/Kolkata';

// Registration/QR validity window (inclusive) — one calendar week.
export const EVENT_START = { year: 2026, month: 9, day: 23, hour: 0, minute: 0, second: 0 }; // 23 Sep 2026
export const EVENT_END = { year: 2026, month: 10, day: 1, hour: 23, minute: 59, second: 59 }; // 1 Oct 2026

// Parses wall-clock values into a UTC Date via Intl. formatToParts caused by
// timezone offset discovery. Iterates twice to converge (no DST in IST, but the
// loop is DST-safe for robustness under any configured timezone).
function zonedPartsToUtc(tz, spec) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const offsetFor = (ms) => {
    const parts = Object.fromEntries(
      dtf.formatToParts(new Date(ms)).map((p) => [p.type, p.value])
    );
    const hour = String(Number(parts.hour) % 24);
    const asUTC = Date.UTC(parts.year, parts.month - 1, parts.day, hour, parts.minute, parts.second);
    return asUTC - ms;
  };
  let guess = Date.UTC(spec.year, spec.month - 1, spec.day, spec.hour, spec.minute, spec.second);
  const off1 = offsetFor(guess);
  guess = guess - off1;
  const off2 = offsetFor(guess);
  if (off1 === off2) return new Date(guess);
  return new Date(guess - (off2 - off1)); // DST boundary adjustment
}

// Absolute boundaries used for window enforcement (computed once).
export const EVENT_START_AT = zonedPartsToUtc(EVENT_TIMEZONE, EVENT_START);
export const EVENT_END_AT = zonedPartsToUtc(EVENT_TIMEZONE, EVENT_END);

// Window status for a given date (defaults to "now").
//   'open'            → inside [start, end]
//   'not_started'     → before start
//   'closed'          → after end
export function eventWindowStatus(now = new Date()) {
  if (now < EVENT_START_AT) return 'not_started';
  if (now > EVENT_END_AT) return 'closed';
  return 'open';
}