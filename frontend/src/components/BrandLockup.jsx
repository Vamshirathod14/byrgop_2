import { brand } from '../theme/brand.js';
import BrandMark from './BrandMark.jsx';

// Premium BYRGOP brand lockup/header.
// Left  : six-colour arc mark + "BYRGOP" wordmark + "BUSINESS PROFIT ARCHITECTS" tagline.
// Right : bilingual lockup (Telugu + Hindi). Values come from brand.bilingual and only
//         render when the client has supplied approved copy — nothing is invented here.
// Responsive: side-by-side on desktop, wraps to a stacked layout on small screens.

export default function BrandLockup({
  markHeight = 44,
  light = true,
  showTagline = true,
  showBilingual = true,
  className = '',
}) {
  const ink = light ? brand.text : brand.ink[900];
  const muted = light ? 'rgba(246,247,250,0.58)' : 'rgba(10,14,22,0.6)';
  const rule = light ? 'rgba(255,255,255,0.10)' : 'rgba(10,14,22,0.12)';

  const telugu = (brand.bilingual?.telugu || '').trim();
  const hindi = (brand.bilingual?.hindi || '').trim();
  const hasBilingual = Boolean(telugu || hindi);

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-x-8 gap-y-5 ${className}`}
    >
      {/* Left brand lockup */}
      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
        <BrandMark
          height={markHeight}
          className="shrink-0"
        />
        <div className="flex min-w-0 flex-col justify-center leading-none">
          <span
            className="font-bold tracking-[0.12em] select-none"
            style={{
              fontFamily: brand.fonts.body,
              fontSize: markHeight * 0.52,
              color: ink,
              lineHeight: 1,
            }}
          >
            BYRGOP
          </span>
          {showTagline && (
            <span
              className="mt-1.5 font-medium uppercase tracking-[0.34em] select-none"
              style={{ fontSize: markHeight * 0.13, color: muted, lineHeight: 1 }}
            >
              Business Profit Architects
            </span>
          )}
        </div>
      </div>

      {/* Right bilingual lockup */}
      {showBilingual && hasBilingual && (
        <div
          className="flex shrink-0 items-center gap-6 border-l pl-6"
          style={{ borderColor: rule }}
          lang="und"
        >
          {telugu && (
            <span
              lang="te"
              className="font-script-te font-semibold leading-none select-none"
              style={{ fontSize: markHeight * 0.34, color: ink }}
            >
              {telugu}
            </span>
          )}
          {hindi && (
            <span
              lang="hi"
              className="font-script-hi font-semibold leading-none select-none"
              style={{ fontSize: markHeight * 0.34, color: ink }}
            >
              {hindi}
            </span>
          )}
        </div>
      )}
    </div>
  );
}