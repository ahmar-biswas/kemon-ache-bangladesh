// "The full picture" of one area (Ahmar, M4 review 3). It opens from the clicked tile and widens
// SIDEWAYS ONLY to fill the width of the four tiles: the top and bottom edges stay fixed.
// Economy (left) grows to the right, Education (right) to the left, the middle two both ways.
// Closing shrinks it back into the tile. Done by animating the panel's clip, which is smooth
// and does not move the content. On narrow screens (stacked tiles) it slides in from the side.
//
// Inside: every measure of the area as a full M3 Tile (explanation, full peer strip with goal
// line, position badge and formula, world rank, source lines) and the area's status count
// (a count of facts, not a score). The measures rise in one after another once it has opened.
// Escape or "Back to the summary" closes it. Loaded only when first needed (R10).
import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { position } from '../data/compare.ts';
import { COUNTRIES, MEDIANS, RECORDS, indicatorMeta } from '../data/all.ts';
import type { AreaConfig } from '../data/dashboard.ts';
import type { LatestFile, LatestPoint } from '../data/types.ts';
import { t, type Lang } from '../i18n/index.ts';
import { formatNumber } from '../lib/format.ts';
import { AreaIcon } from './Motifs.tsx';
import { Tile } from './Tile.tsx';

interface Props {
  lang: Lang;
  area: AreaConfig;
  latest: LatestFile;
  /** The clicked tile's place inside the four-tile area (px from each edge), or null. */
  origin: { top: number; right: number; bottom: number; left: number } | null;
  onClose: () => void;
}

const OPEN_MS = 640;
const CLOSE_MS = 420;
const SOOTHE = 'cubic-bezier(.22, 1, .36, 1)';
const RADIUS = 14;

const clip = (o: { top: number; right: number; bottom: number; left: number }) =>
  `inset(${o.top}px ${o.right}px ${o.bottom}px ${o.left}px round ${RADIUS}px)`;
const FULL = `inset(0px 0px 0px 0px round ${RADIUS}px)`;

/** Wide layout (tiles side by side or 2 × 2): the panel covers the tiles and can widen from one. */
const overlays = () => window.matchMedia?.('(min-width: 900px)').matches ?? false;
const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

export function DetailsPanel({ lang, area, latest, origin, onClose }: Props) {
  const ref = useRef<HTMLElement>(null);
  const closing = useRef(false);

  // Open: from the tile's strip to the full width (top and bottom stay where they are).
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.focus({ preventScroll: true });
    if (reduced()) return;
    if (origin && overlays() && typeof el.animate === 'function') {
      el.animate([{ clipPath: clip(origin) }, { clipPath: FULL }], { duration: OPEN_MS, easing: SOOTHE });
    } else if (typeof el.animate === 'function') {
      el.animate([{ opacity: 0, transform: 'translateX(-24px)' }, { opacity: 1, transform: 'none' }], { duration: OPEN_MS, easing: SOOTHE });
    }
  }, [origin]);

  // Close: shrink back into the tile, then hand control back.
  const requestClose = useCallback(() => {
    const el = ref.current;
    if (closing.current) return;
    closing.current = true;
    if (!el || reduced() || typeof el.animate !== 'function') return onClose();
    el.classList.add('is-closing');
    const anim =
      origin && overlays()
        ? el.animate([{ clipPath: FULL }, { clipPath: clip(origin) }], { duration: CLOSE_MS, easing: 'cubic-bezier(.4, 0, .2, 1)', fill: 'forwards' })
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
  }, [origin, onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && requestClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [requestClose]);

  const ids = [area.headline, ...area.more];
  const positions = ids
    .map((id) => latest.indicators[id])
    .map((d) => d && position<LatestPoint>(d.favourable_direction, d.points.find((p) => p.country === 'BGD'), d.points.filter((p) => p.country !== 'BGD')))
    .filter((p): p is NonNullable<typeof p> => !!p);
  const n = (v: number) => formatNumber(v, lang, 0);

  return (
    <section
      ref={ref}
      tabIndex={-1}
      className={`details details--${area.icon}`}
      aria-labelledby={`details-${area.icon}`}
    >
      <header className="details__head">
        <h2 id={`details-${area.icon}`}>
          <span className="story__disc" aria-hidden="true" />
          <AreaIcon area={area.icon} />
          {t(lang, area.label)}
          <span className="details__kicker">{t(lang, 'view.full_picture')}</span>
        </h2>
        <button type="button" className="story__open details__close" onClick={requestClose}>
          <svg width="16" height="10" viewBox="0 0 16 10" aria-hidden="true" focusable="false">
            <path d="M15 5 H2 M6 1 L2 5 L6 9" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {t(lang, 'details.close')}
        </button>
      </header>
      {positions.length > 0 && (
        <p className="details__status">
          {t(lang, 'details.status', { a: n(positions.filter((p) => p.kind === 'ahead').length), m: n(positions.length) })}{' '}
          <span className="muted">{t(lang, 'status.formula')}</span>
        </p>
      )}
      <div className="details__grid">
        {ids.map((id, i) => {
          const meta = indicatorMeta(id);
          const records = RECORDS[id];
          if (!meta || !records) return null;
          const cmpId = meta.compare_id;
          const cmpMeta = cmpId ? indicatorMeta(cmpId) : undefined;
          return (
            <div key={id} className="details__item" style={{ ['--i' as string]: i }}>
              <Tile
                lang={lang}
                meta={meta}
                records={records}
                medians={MEDIANS[id]}
                compare={cmpId && cmpMeta ? { meta: cmpMeta, records: RECORDS[cmpId] ?? [], medians: MEDIANS[cmpId] } : undefined}
                countries={COUNTRIES}
                since={latest.since}
                wide={i === 0}
                rank={latest.indicators[id]?.rank ?? null}
                target={latest.indicators[id]?.target ?? null}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
