// Bangladeshi motifs (8.7), each used only where the spec says. All decorative: hidden from screen readers.
import { useId } from 'react';

/** Jamdani weave band: diamond-and-dot motif. Header, footer and empty states only. */
export function Jamdani() {
  const id = useId();
  return (
    <svg className="jamdani" aria-hidden="true" focusable="false" preserveAspectRatio="none">
      <defs>
        <pattern id={id} width="28" height="14" patternUnits="userSpaceOnUse">
          <path d="M7 1 L13 7 L7 13 L1 7 Z" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="7" cy="7" r="1.4" fill="currentColor" />
          <circle cx="21" cy="3" r="0.9" fill="currentColor" />
          <circle cx="21" cy="11" r="0.9" fill="currentColor" />
          <path d="M18 7 H24" stroke="currentColor" strokeWidth="0.8" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

/** Alpona line ornament for a corner: About and 404 pages only. `flip` mirrors it. */
export function Alpona({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 120" aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
        <path d="M4 4 C40 6 70 20 84 50 C92 68 90 90 76 112" />
        <path d="M4 4 C6 40 20 70 50 84 C68 92 90 90 112 76" />
        <path d="M4 4 C28 18 44 30 56 56" />
        <circle cx="56" cy="56" r="6" />
        <circle cx="56" cy="56" r="2" />
        <path d="M30 14 c4 4 4 10 0 14 c-4 -4 -4 -10 0 -14 Z" />
        <path d="M14 30 c4 4 10 4 14 0 c-4 -4 -10 -4 -14 0 Z" />
        <path d="M70 40 c5 2 8 7 7 12" />
        <path d="M40 70 c2 5 7 8 12 7" />
        <circle cx="84" cy="50" r="1.6" fill="currentColor" />
        <circle cx="50" cy="84" r="1.6" fill="currentColor" />
      </g>
    </svg>
  );
}

/** Rickshaw wheel loader: 12 spokes, 1.5 px lines, turns slowly; static under reduced motion. */
export function RickshawWheel({ size = 40 }: { size?: number }) {
  const spokes = Array.from({ length: 12 }, (_, i) => (i * Math.PI) / 6);
  return (
    <svg className="rickshaw-wheel" width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="20" cy="20" r="17" />
        <circle cx="20" cy="20" r="14.5" strokeWidth="0.75" />
        <circle cx="20" cy="20" r="2.5" />
        {spokes.map((a, i) => (
          <line key={i} x1={20 + Math.cos(a) * 2.5} y1={20 + Math.sin(a) * 2.5} x2={20 + Math.cos(a) * 14.5} y2={20 + Math.sin(a) * 14.5} strokeWidth="1" />
        ))}
      </g>
    </svg>
  );
}

export type AreaId = 'economy' | 'poverty' | 'education' | 'health';

/** Area icons: 24 px, 1.5 px stroke, round caps, one style. */
export function AreaIcon({ area }: { area: AreaId }) {
  return (
    <svg className="area-icon" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        {area === 'economy' && (
          // The taka sign ৳ as a line glyph.
          <>
            <path d="M6 5.5 C7.5 4 9.5 4.5 9.5 6.5 V16 C9.5 18.5 11.5 20 14 20 C16.8 20 18.5 18 18.5 15.5 C18.5 13.5 17.2 12.2 15.6 12" />
            <path d="M5.5 10 H14" />
          </>
        )}
        {area === 'education' && (
          // An open book with a pen.
          <>
            <path d="M3 6.5 C5.5 5.5 8.5 5.5 11.5 7 V19 C8.5 17.5 5.5 17.5 3 18.5 Z" />
            <path d="M11.5 7 C13.5 5.8 15.5 5.4 17.5 5.6" />
            <path d="M11.5 19 C14 17.8 16.5 17.5 21 18.5 V12" />
            <path d="M21 3.5 L17.5 10.5 L16.6 12.4 L18.4 11.2 L21.9 4.2 Z" />
          </>
        )}
        {area === 'health' && (
          // A heart with a pulse line.
          <>
            <path d="M12 20 C6 16 3 12.5 3 9 C3 6.5 5 4.5 7.5 4.5 C9.5 4.5 11 5.7 12 7.2 C13 5.7 14.5 4.5 16.5 4.5 C19 4.5 21 6.5 21 9 C21 12.5 18 16 12 20 Z" />
            <path d="M5.5 11.5 H9 L10.5 9 L12.5 14 L14 11.5 H18.5" />
          </>
        )}
        {area === 'poverty' && (
          // Two unequal stacks.
          <>
            <path d="M3 20 H21" />
            <rect x="5" y="15" width="5" height="5" rx="0.8" />
            <rect x="14" y="5" width="5" height="15" rx="0.8" />
            <path d="M14 10 H19 M14 15 H19" />
          </>
        )}
      </g>
    </svg>
  );
}
