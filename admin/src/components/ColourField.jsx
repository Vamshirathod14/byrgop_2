// Answer-colour picker used by the onboarding question form. Shows a swatch
// panel of the six BYRGOP brand colours; selecting one stores its HEX value via
// `onChange`. Any valid hex is also accepted (in case a legacy value was saved).
import { useState } from 'react';
import { ANSWER_COLOURS, DEFAULT_YES_COLOR, DEFAULT_NO_COLOR } from '../utils/color.js';

export function colourValue(value) {
  if (!value) return null;
  return ANSWER_COLOURS.find((c) => c.hex.toLowerCase() === String(value).trim().toLowerCase()) || null;
}

export default function ColourField({ label, value, onChange }) {
  const [open, setOpen] = useState(false);
  const selected = colourValue(value);

  const pick = (hex) => {
    onChange(hex);
    setOpen(false);
  };

  return (
    <div>
      {label && (
        <label className="mb-1 block text-xs uppercase tracking-[0.15em] text-mist-muted">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`w-full rounded-lg border px-3 py-2 text-left text-sm outline-none transition-colors focus-visible:border-brand-accent/60 ${
          open
            ? 'border-brand-accent/60 bg-slate-100'
            : 'border-slate-200 bg-slate-50 hover:border-slate-300 focus-visible:border-brand-accent/60'
        }`}
      >
        {selected ? (
          <span className="flex items-center gap-2.5">
            <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-black/10" style={{ background: selected.hex }} />
            <span className="truncate font-semibold text-mist">{selected.label}</span>
            <span className="ml-auto text-[11px] uppercase opacity-60 text-mist-muted"></span>
          </span>
        ) : (
          <span className="flex items-center gap-2.5 text-mist-muted/85">
            <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-black/10" style={{ background: value }} />
            <span className="truncate font-mono text-xs">{value || 'Default (green / red)'}</span>
          </span>
        )}
      </button>

      {open && (
        <div className="mt-2">
          <p className="mb-1 text-[11px] text-mist-muted/80">Brand colours</p>
          <div className="flex flex-wrap gap-1.5">
            {ANSWER_COLOURS.map((c) => {
              const isSelected = value && c.hex.toLowerCase() === String(value).trim().toLowerCase();
              return (
                <button
                  type="button"
                  key={c.key}
                  onClick={() => pick(c.hex)}
                  className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                    isSelected
                      ? 'border-brand-accent/60 bg-brand-accent/10 text-mist'
                      : 'border-slate-200 bg-white text-mist-muted hover:border-slate-300'
                  }`}
                >
                  <span className="h-2.5 w-2.5 rounded-full border border-black/10" style={{ background: c.hex }} />
                  {c.label}
                  {c.hex.toLowerCase() === DEFAULT_YES_COLOR.toLowerCase() && <span className="opacity-50">· Yes default</span>}
                  {c.hex.toLowerCase() === DEFAULT_NO_COLOR.toLowerCase() && <span className="opacity-50">· No default</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}