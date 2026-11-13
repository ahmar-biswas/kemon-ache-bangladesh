// The fixed page background (8.4, revised in Ahmar's M3 review): hue wash, muslin weave and
// fibres, river-delta contours, faint alpona streaks and two faint jamdani lines.
// The delta contours are the generated SVG (scripts/generate-background.ts), inlined.
// Everything except the base colour and hue wash is hidden for data savers (background.css).
import deltaSvg from '../assets/delta.svg?raw';
import { AlponaField, Jamdani } from './Motifs.tsx';

export function Backdrop() {
  return (
    <div className="backdrop" aria-hidden="true">
      <div className="backdrop__weave" />
      <div className="backdrop__delta" dangerouslySetInnerHTML={{ __html: deltaSvg }} />
      <AlponaField />
      <div className="backdrop__jamdani is-upper">
        <Jamdani />
      </div>
      <div className="backdrop__jamdani is-lower">
        <Jamdani />
      </div>
    </div>
  );
}
