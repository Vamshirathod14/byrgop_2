import { useState } from 'react';

// Renders a partner logo image (bni.jpeg / aces.jpeg) with a shared height so
// both are shown at the same visual scale. Aspect ratios are preserved via the
// stylesheet (height set, width auto) — never cropped or distorted. If an image
// is ever missing, the slot stays empty instead of showing a broken image or a
// text placeholder.
export default function Logo({ src, alt = '', side = 'left' }) {
  const [missing, setMissing] = useState(false);

  if (missing) {
    return <span className={`logo logo-${side} logo-hidden`} aria-hidden="true" />;
  }

  return (
    <img className={`logo logo-${side}`} src={src} alt={alt} onError={() => setMissing(true)} />
  );
}