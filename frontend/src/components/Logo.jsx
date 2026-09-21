import { useState } from 'react';
import { brand } from '../theme/brand.js';

export default function Logo({ height = 44, light = true }) {
  const [missing, setMissing] = useState(false);

  if (missing) {
    return (
      <span
        className="font-display font-bold tracking-[0.18em] select-none"
        style={{ fontSize: height * 0.6, color: light ? brand.text : brand.ink[900] }}
      >
        BYRGOP
      </span>
    );
  }

  return (
    <img
      src={brand.logo}
      alt="BYRGOP"
      style={{ height }}
      className="w-auto object-contain select-none"
      onError={() => setMissing(true)}
    />
  );
}
