import { brand } from '../theme/brand.js';

// Six-colour mark: the official BYRGOP identity recreated as an inline SVG.
// An ascending arc of six fully-saturated circles (Blue → Yellow → Red → Green → Orange → Purple).
// No gradients, no faded fills — each circle uses the exact brand hex.

const R = 8;
const POINTS = [12, 32, 52, 72, 92, 112].map((x, i) => {
  const y = 40 - 18 * ((i / 5) ** 2);
  return { x, y };
});

export default function BrandMark({ height = 44, className = '' }) {
  const width = Math.round((height * 120) / 48);

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 120 48"
      fill="none"
      role="img"
      aria-label="BYRGOP six-colour mark"
      className={`select-none ${className}`}
    >
      {POINTS.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={R} fill={brand.mark[i]} />
      ))}
    </svg>
  );
}