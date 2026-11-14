// "Compare with" slicer (Ahmar, M4): pick one peer to highlight in every chart on the page.
// A glass thumb glides behind the chosen chip. Three ways to use it:
//   click a chip; press on the chosen chip and drag along the rail (the thumb follows the
//   pointer and snaps to the nearest chip on release); or use the arrow keys (Home/End too).
// It is a radio group for screen readers. Under reduced motion the thumb moves without gliding.
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react';
import { t, type Lang } from '../i18n/index.ts';
import { countryLabel } from '../lib/names.ts';
import { useCompare } from './CompareContext.tsx';
import { slotStyle } from '../lib/peerColours.ts';

interface Props {
  lang: Lang;
  peers: string[];
  names: Record<string, string>;
}

/** A press only becomes a drag after the pointer moves this far (px), so clicks stay clicks. */
const DRAG_THRESHOLD = 4;

export function CountrySlicer({ lang, peers, names }: Props) {
  const { selected, select } = useCompare();
  const options: (string | null)[] = [null, ...peers];
  const index = Math.max(0, options.indexOf(selected));
  const railRef = useRef<HTMLDivElement>(null);
  const chipRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [thumb, setThumb] = useState<{ left: number; width: number } | null>(null);
  const [drag, setDrag] = useState<{ x: number; width: number } | null>(null);
  const press = useRef<{ startX: number; startLeft: number; width: number; moved: boolean; id: number } | null>(null);
  const swallowClick = useRef(false);

  // Place the thumb under the chosen chip (and again when the layout changes).
  const measure = useCallback(() => {
    const chip = chipRefs.current[index];
    if (!chip) return;
    setThumb({ left: chip.offsetLeft, width: chip.offsetWidth });
  }, [index]);
  useLayoutEffect(measure, [measure, lang]);
  useEffect(() => {
    const rail = railRef.current;
    if (!rail || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(rail);
    return () => ro.disconnect();
  }, [measure]);

  const nearest = (x: number) => {
    let best = 0;
    let bestD = Infinity;
    chipRefs.current.forEach((c, i) => {
      if (!c) return;
      const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - x);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    return best;
  };
  const railX = (e: PointerEvent) => e.clientX - (railRef.current?.getBoundingClientRect().left ?? 0) + (railRef.current?.scrollLeft ?? 0);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || !thumb) return;
    // Drags start on the chosen chip (where the thumb is).
    const chip = (e.target as HTMLElement).closest('.slicer__chip');
    if (chip !== chipRefs.current[index]) return;
    press.current = { startX: railX(e), startLeft: thumb.left, width: thumb.width, moved: false, id: e.pointerId };
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const p = press.current;
    if (!p) return;
    const dx = railX(e) - p.startX;
    if (!p.moved && Math.abs(dx) < DRAG_THRESHOLD) return;
    if (!p.moved) {
      p.moved = true;
      railRef.current?.setPointerCapture(p.id);
    }
    const max = (railRef.current?.scrollWidth ?? 0) - p.width;
    setDrag({ x: Math.min(Math.max(p.startLeft + dx, 0), max), width: p.width });
  };
  const endPress = () => {
    const p = press.current;
    press.current = null;
    if (!p?.moved) return;
    if (railRef.current?.hasPointerCapture(p.id)) railRef.current.releasePointerCapture(p.id);
    const x = (drag?.x ?? p.startLeft) + p.width / 2;
    const i = nearest(x);
    setDrag(null);
    swallowClick.current = true; // the click that follows a drag is not a chip click
    select(options[i] ?? null);
    chipRefs.current[i]?.focus({ preventScroll: true });
  };
  const onClickCapture = (e: MouseEvent) => {
    if (swallowClick.current) {
      swallowClick.current = false;
      e.stopPropagation();
      e.preventDefault();
    }
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const go = (i: number) => {
      e.preventDefault();
      const j = (i + options.length) % options.length;
      select(options[j] ?? null);
      chipRefs.current[j]?.focus();
    };
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') go(index + 1);
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') go(index - 1);
    else if (e.key === 'Home') go(0);
    else if (e.key === 'End') go(options.length - 1);
  };

  const label = (c: string | null) => (c ? countryLabel(c, lang, names) : t(lang, 'slicer.all'));
  const pos = drag ? { left: drag.x, width: drag.width } : thumb;

  return (
    <div className="slicer">
      <span className="slicer__label" id="slicer-label">
        {t(lang, 'slicer.label')}
      </span>
      <div
        ref={railRef}
        className={`slicer__rail glass${drag ? ' is-dragging' : ''}`}
        role="radiogroup"
        aria-labelledby="slicer-label"
        aria-describedby="slicer-hint"
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPress}
        onPointerCancel={() => {
          press.current = null;
          setDrag(null);
        }}
        onClickCapture={onClickCapture}
      >
        {pos && <span className={`slicer__thumb${drag ? ' is-dragging' : ''}`} style={{ transform: `translateX(${pos.left}px)`, width: pos.width }} aria-hidden="true" />}
        {options.map((c, i) => (
          <button
            key={c ?? 'all'}
            ref={(el) => {
              chipRefs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={i === index}
            tabIndex={i === index ? 0 : -1}
            className={`slicer__chip${i === index ? ' is-selected' : ''}`}
            style={c ? slotStyle(peers.indexOf(c)) : undefined}
            onClick={() => select(c)}
          >
            {c && <span className="slicer__dot" aria-hidden="true" />}
            {label(c)}
          </button>
        ))}
      </div>
      <p id="slicer-hint" className="visually-hidden">
        {t(lang, 'slicer.hint')}
      </p>
      <p className="visually-hidden" aria-live="polite">
        {selected ? t(lang, 'slicer.selected', { country: label(selected) }) : ''}
      </p>
    </div>
  );
}
