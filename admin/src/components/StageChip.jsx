import { darkText } from '../utils/color.js';

const COLOURS = [
  ['#0A78CF', 'Blue'],
  ['#FCA700', 'Yellow'],
  ['#E52032', 'Red'],
  ['#0D8845', 'Green'],
  ['#F5630D', 'Orange'],
  ['#7038A5', 'Purple'],
  ['#3D97DB', 'Blue'],
  ['#0861AA', 'Blue'],
  ['#FCB22E', 'Yellow'],
  ['#D88D00', 'Yellow'],
  ['#EB5564', 'Red'],
  ['#C31B2A', 'Red'],
  ['#2DA363', 'Green'],
  ['#0A7039', 'Green'],
  ['#F67F39', 'Orange'],
  ['#D4540A', 'Orange'],
  ['#8C56BB', 'Purple'],
  ['#5C2E89', 'Purple'],
];

const norm = (c) => (c || '').replace('#', '').toUpperCase();

export function stageColour(color) {
  if (!color) return null;
  const h = norm(color);
  if (!/^[0-9A-F]{6}$/.test(h)) return null;
  const exact = COLOURS.find(([c]) => norm(c) === h);
  if (exact) return { hex: h, name: exact[1] };
  let best = null;
  let bestD = Infinity;
  for (const [c, name] of COLOURS) {
    const r = parseInt(c.slice(1, 3), 16);
    const g = parseInt(c.slice(3, 5), 16);
    const b = parseInt(c.slice(5, 7), 16);
    const R = parseInt(h.slice(0, 2), 16);
    const G = parseInt(h.slice(2, 4), 16);
    const B = parseInt(h.slice(4, 6), 16);
    const d = (R - r) ** 2 + (G - g) ** 2 + (B - b) ** 2;
    if (d < bestD) {
      bestD = d;
      best = name;
    }
  }
  return { hex: h, name: best };
}

export function StageDot({ color, size = 10, ring = true }) {
  return (
    <span
      className={`inline-block shrink-0 rounded-full ${ring ? 'ring-1 ring-brand-accent/50' : ''}`}
      style={{ width: size, height: size, background: color }}
    />
  );
}

export function StageChip({ stage, showColour = true, className = '' }) {
  if (!stage) return null;
  const col = stageColour(stage.color);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${className}`}
      style={{
        color: darkText(stage.color),
        borderColor: `${stage.color}55`,
        background: `${stage.color}1e`,
      }}
    >
      <StageDot color={stage.color} size={8} />
      <span className="font-semibold">{stage.name}</span>
      {showColour && col && (
        <span className="text-[10px] uppercase tracking-[0.1em]" style={{ opacity: 0.8 }}>
          {col.name}
        </span>
      )}
    </span>
  );
}