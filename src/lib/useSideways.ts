// The sideways opening shared by "The full picture" and a measure's own view (Ahmar, M4
// review 3; DECISIONS.md 86, 87). The panel opens from the clicked tile and widens SIDEWAYS
// ONLY until it fills the width: its clip animates, so the content does not move. Closing
// shrinks it back. On narrow screens (stacked tiles) the panel lies over the tapped tile and
// grows downward from it (Ahmar, M8); a measure's own view slides in from the side.
// Reduced motion: no animation. Escape closes (unless `paused`).
import { useCallback, useEffect, useLayoutEffect, useRef, type RefObject } from 'react';

export interface Origin {
  top: number;
  right: number;
  bottom: number;
  left: number;
  /** The tile's own height: on narrow screens the panel grows down from it (Ahmar, M8). */
  height?: number;
}

/** Narrow screens: just the tile's rectangle at the panel's top (top and sides fixed). */
const tileOnly = (el: HTMLElement, o: Origin) => `inset(0px 0px ${Math.max(0, el.offsetHeight - (o.height ?? 0))}px 0px round ${RADIUS}px)`;

const OPEN_MS = 640;
const CLOSE_MS = 420;
const SOOTHE = 'cubic-bezier(.22, 1, .36, 1)';
const RADIUS = 14;

export const clipOf = (o: Origin) => `inset(${o.top}px ${o.right}px ${o.bottom}px ${o.left}px round ${RADIUS}px)`;
const FULL = `inset(0px 0px 0px 0px round ${RADIUS}px)`;

/** Wide layout (tiles side by side or 2 × 2): the panel covers the tiles and can widen from one. */
const overlays = () => window.matchMedia?.('(min-width: 900px)').matches ?? false;
const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

export function useSideways(ref: RefObject<HTMLElement | null>, origin: Origin | null, onClose: () => void, paused = false) {
  const closing = useRef(false);

  // Open: from the tile's strip to the full width (top and bottom stay where they are).
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.focus({ preventScroll: true });
    if (reduced() || typeof el.animate !== 'function') return;
    if (origin && overlays()) {
      el.animate([{ clipPath: clipOf(origin) }, { clipPath: FULL }], { duration: OPEN_MS, easing: SOOTHE });
    } else if (origin?.height) {
      // Narrow: the panel lies over the tapped tile and grows downward from it.
      el.animate([{ clipPath: tileOnly(el, origin) }, { clipPath: FULL }], { duration: OPEN_MS, easing: SOOTHE });
    } else {
      el.animate([{ opacity: 0, transform: 'translateX(-24px)' }, { opacity: 1, transform: 'none' }], { duration: OPEN_MS, easing: SOOTHE });
    }
  }, [ref, origin]);

  // Close: shrink back into the tile, then hand control back.
  const requestClose = useCallback(() => {
    const el = ref.current;
    if (closing.current) return;
    closing.current = true;
    if (!el || reduced() || typeof el.animate !== 'function') return onClose();
    el.classList.add('is-closing');
    const anim =
      origin && overlays()
        ? el.animate([{ clipPath: FULL }, { clipPath: clipOf(origin) }], { duration: CLOSE_MS, easing: 'cubic-bezier(.4, 0, .2, 1)', fill: 'forwards' })
        : origin?.height
        ? el.animate([{ clipPath: FULL }, { clipPath: tileOnly(el, origin) }], { duration: CLOSE_MS, easing: 'cubic-bezier(.4, 0, .2, 1)', fill: 'forwards' })
        : el.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(-24px)' }], { duration: CLOSE_MS, easing: 'ease-in', fill: 'forwards' });
    // Finish once, whichever comes first: the animation's end, or a timer (animations pause
    // in hidden tabs, and the panel must still close).
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      onClose();
    };
    anim.onfinish = finish;
    window.setTimeout(finish, CLOSE_MS + 120);
  }, [ref, origin, onClose]);

  useEffect(() => {
    if (paused) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && requestClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [requestClose, paused]);

  return requestClose;
}
