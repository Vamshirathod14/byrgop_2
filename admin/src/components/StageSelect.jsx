import { useEffect, useRef, useState } from 'react';
import { stageColour, StageDot } from './StageChip.jsx';

function Chevron() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      className="shrink-0 text-mist-muted"
      aria-hidden="true"
    >
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function OptionRow({ children, selected }) {
  return (
    <div
      className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left transition-colors ${
        selected ? 'bg-slate-100' : 'hover:bg-slate-100'
      }`}
    >
      {children}
    </div>
  );
}

export default function StageSelect({ label, value, stages = [], onChange, placeholder = 'No stage set' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const selected = stages.find((s) => s.key === value) || null;
  const selectedCol = selected ? stageColour(selected.color) : null;

  useEffect(() => {
    if (!open) return undefined;
    const onDocMouseDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocMouseDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const pick = (key) => {
    onChange(key);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      {label && (
        <label className="mb-1 block text-xs uppercase tracking-[0.15em] text-mist-muted">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus-visible:border-brand-accent/60 ${
          open
            ? 'border-brand-accent/60 bg-slate-100'
            : 'border-slate-200 bg-slate-50 hover:border-slate-300 focus-visible:border-brand-accent/60'
        }`}
      >
        {selected ? (
          <span className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-2.5">
              <StageDot color={selected.color} size={12} />
              <span className="min-w-0 text-left">
                <span className="block truncate font-semibold leading-tight text-mist">
                  {selected.name}
                </span>
                <span className="block text-[10px] uppercase tracking-[0.12em] text-mist-muted">
                  {selectedCol ? selectedCol.name : '—'}
                </span>
              </span>
            </span>
            <Chevron />
          </span>
        ) : (
          <span className="flex items-center justify-between gap-2">
            <span className="text-mist-muted/85">{placeholder}</span>
            <Chevron />
          </span>
        )}
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 max-h-64 overflow-auto rounded-xl border border-slate-200 bg-ink-850 p-1.5 shadow-xl shadow-black/40"
        >
          {!value && (
            <div className="px-2.5 py-1.5 text-xs uppercase tracking-[0.18em] text-mist-muted/85">
              Select a stage
            </div>
          )}
          {value && (
            <button
              type="button"
              role="option"
              onClick={() => pick('')}
              className="w-full outline-none"
            >
              <OptionRow selected={false}>
                <span className="h-3 w-3 shrink-0 rounded-full border border-dashed border-slate-300" />
                <span className="flex-1 text-left text-sm text-mist-muted">No stage</span>
              </OptionRow>
            </button>
          )}
          {stages.map((s) => {
            const col = stageColour(s.color);
            const isSelected = s.key === value;
            return (
              <button
                type="button"
                role="option"
                aria-selected={isSelected}
                key={s.key}
                onClick={() => pick(s.key)}
                className="group w-full outline-none"
              >
                <OptionRow selected={isSelected}>
                  <StageDot color={s.color} size={12} />
                  <span className="min-w-0 flex-1 text-left">
                    <span className={`block truncate text-sm font-semibold leading-tight ${isSelected ? 'text-mist' : 'text-mist group-hover:text-mist'}`}>
                      {s.name}
                    </span>
                    <span className="block text-[10px] uppercase tracking-[0.12em] text-mist-muted">
                      {col ? col.name : '—'}
                    </span>
                  </span>
                  {isSelected && (
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0 text-brand-accentText" aria-hidden="true">
                      <path d="M3 8.5l3.5 3.5L13 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </OptionRow>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}