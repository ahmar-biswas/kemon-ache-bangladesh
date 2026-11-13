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
//
// Each measure has two buttons (Milestone 5, DECISIONS.md 87): "Compare with other countries"
// and "Bangladesh over time". Each opens on top of this view, from the measure's tile, with the
// same sideways animation; its own data loads only then (DECISIONS.md 89).
import { lazy, Suspense, useCallback, useRef, useState } from 'react';
import { position } from '../data/compare.ts';
import { COUNTRIES, MEDIANS, RECORDS, compareIdFor, indicatorMeta } from '../data/details.ts';
import type { AreaConfig } from '../data/dashboard.ts';
import type { LatestFile, LatestPoint } from '../data/types.ts';
import { t, type Lang } from '../i18n/index.ts';
import { indicatorName } from '../lib/display.ts';
import { formatNumber } from '../lib/format.ts';
import { clipOf, useSideways, type Origin } from '../lib/useSideways.ts';
import { Loading } from './Loading.tsx';
import type { MeasureMode } from './measure/MeasureView.tsx';
import { AreaIcon } from './Motifs.tsx';
import { Tile } from './Tile.tsx';

const MeasureView = lazy(() => import('./measure/MeasureView.tsx').then((m) => ({ default: m.MeasureView })));

interface Props {
  lang: Lang;
  area: AreaConfig;
  latest: LatestFile;
  /** The clicked tile's place inside the four-tile area (px from each edge), or null. */
  origin: Origin | null;
  onClose: () => void;
}

export function DetailsPanel({ lang, area, latest, origin, onClose }: Props) {
  const ref = useRef<HTMLElement>(null);
  const [measure, setMeasure] = useState<{ id: string; mode: MeasureMode; origin: Origin | null; from: HTMLElement } | null>(null);
  // While a measure's view is open, Escape belongs to it.
  const requestClose = useSideways(ref, origin, onClose, measure !== null);

  const openMeasure = useCallback((id: string, mode: MeasureMode, button: HTMLElement) => {
    const panel = ref.current;
    const tile = button.closest<HTMLElement>('.details__item');
    let from: Origin | null = null;
    if (panel && tile) {
      // The tile's place inside the panel's box (which the measure view covers exactly).
      const p = panel.getBoundingClientRect();
      const r = tile.getBoundingClientRect();
      const top = Math.max(0, r.top - p.top);
      const bottom = Math.max(0, p.bottom - r.bottom);
      from = { top, right: Math.max(0, p.right - r.right), bottom, left: Math.max(0, r.left - p.left) };
    }
    setMeasure({ id, mode, origin: from, from: button });
  }, []);
  const closeMeasure = useCallback(() => {
    const back = measure?.from;
    setMeasure(null);
    if (back) requestAnimationFrame(() => back.focus({ preventScroll: true }));
  }, [measure]);

  const ids = [area.headline, ...area.more];
  const positions = ids
    .map((id) => latest.indicators[id])
    .map((d) => d && position<LatestPoint>(d.favourable_direction, d.points.find((p) => p.country === 'BGD'), d.points.filter((p) => p.country !== 'BGD')))
    .filter((p): p is NonNullable<typeof p> => !!p);
  const n = (v: number) => formatNumber(v, lang, 0);

  return (
    <>
    <section
      ref={ref}
      tabIndex={-1}
      className={`details details--${area.icon}${measure ? ' is-covered' : ''}`}
      aria-hidden={measure ? true : undefined}
      inert={measure ? true : undefined}
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
                actions={
                  // Inside the tile, top right (Ahmar, M5 review).
                  <div className="details__views" role="group" aria-label={t(lang, 'measure.views', { name: indicatorName(id, lang) })}>
                    {compareIdFor(meta) && (
                      <button type="button" className="story__open details__view" onClick={(e) => openMeasure(id, 'compare', e.currentTarget)}>
                        {t(lang, 'measure.compare')}
                      </button>
                    )}
                    <button type="button" className="story__open details__view" onClick={(e) => openMeasure(id, 'trend', e.currentTarget)}>
                      {t(lang, 'measure.trend')}
                    </button>
                  </div>
                }
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
      {measure && (
        <Suspense
          fallback={
            <div className="details measure" style={measure.origin ? { clipPath: clipOf(measure.origin) } : undefined}>
              <Loading lang={lang} />
            </div>
          }
        >
          <MeasureView
            key={`${measure.id}-${measure.mode}`}
            lang={lang}
            meta={indicatorMeta(measure.id)!}
            mode={measure.mode}
            target={latest.indicators[measure.id]?.target ?? null}
            origin={measure.origin}
            onClose={closeMeasure}
          />
        </Suspense>
      )}
    </>
  );
}
