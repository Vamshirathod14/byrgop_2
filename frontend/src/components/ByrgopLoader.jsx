import { brand } from '../theme/brand.js';

// Lightweight pure-CSS loader: the six BYRGOP mark balls (blue, yellow, red,
// green, orange, purple) sweep in from the left, assemble into the brand's
// ascending-arc arrangement, hold briefly, then release out to the right.
// No images, videos or external assets. Respects prefers-reduced-motion.

const WIDTH = 52;
const HEIGHT = 20;
const SIZE = 6;

// Arrangement mirroring BrandMark's ascending arc (low-left → high-right).
const SLOT_X = [3, 11, 19, 27, 35, 43];
const SLOT_Y = [18, 17.5, 16.1, 13.7, 10.3, 6];

// Sweep-in (left) and release (right) offsets per ball.
const FROM = [
  [-20, 14],
  [-18, 13],
  [-16, 11],
  [-13, 9],
  [-10, 6],
  [-7, 3],
];
const TO = [
  [18, -14],
  [20, -12],
  [22, -9],
  [24, -6],
  [26, -3],
  [28, 0],
];

const STAGGER = 0.18; // seconds between ball enter phases

export default function ByrgopLoader({ className = '' }) {
  return (
    <span
      className={`byrgop-loader inline-block shrink-0 ${className}`}
      style={{ width: WIDTH, height: HEIGHT }}
      role="img"
      aria-label="BYRGOP balls assembling"
      aria-hidden="true"
    >
      {brand.mark.map((color, i) => (
        <span
          key={color}
          className="byrgop-ball"
          style={{
            width: SIZE,
            height: SIZE,
            left: SLOT_X[i],
            top: SLOT_Y[i] - SIZE / 2,
            background: color,
            animationDelay: `${-i * STAGGER}s`,
            '--dx': `${FROM[i][0]}px`,
            '--dy': `${FROM[i][1]}px`,
            '--ex': `${TO[i][0]}px`,
            '--ey': `${TO[i][1]}px`,
          }}
        />
      ))}
    </span>
  );
}