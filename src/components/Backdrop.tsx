// The fixed page background (8.4): hue wash and grain come from CSS; the delta contours are
// the generated SVG (scripts/generate-background.ts), inlined so they need no extra request.
import deltaSvg from '../assets/delta.svg?raw';

export function Backdrop() {
  return (
    <div className="backdrop" aria-hidden="true">
      <div className="backdrop__delta" dangerouslySetInnerHTML={{ __html: deltaSvg }} />
    </div>
  );
}
