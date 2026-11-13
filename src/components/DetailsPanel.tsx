// The Details view of one area: the tile grows into it (shared-element view transition named
// "area-grow", set by the homepage). It shows every measure of the area as a full M3 Tile:
// explanation, full peer strip with goal line, position badge and formula, world rank,
// source lines. The area's status count (a count of facts, not a score) sits in the heading.
// Rows arrive one after another (a secondary action, after the grow). Escape closes it.
// Loaded only when first needed: it uses the full data files (R10).
import { useEffect, useRef } from 'react';
import { position } from '../data/compare.ts';
import { COUNTRIES, MEDIANS, RECORDS, indicatorMeta } from '../data/all.ts';
import type { AreaConfig } from '../data/dashboard.ts';
import type { LatestFile, LatestPoint } from '../data/types.ts';
import { t, type Lang } from '../i18n/index.ts';
import { formatNumber } from '../lib/format.ts';
import { FlagSwitch } from './FlagSwitch.tsx';
import { AreaIcon } from './Motifs.tsx';
import { Tile } from './Tile.tsx';

interface Props {
  lang: Lang;
  area: AreaConfig;
  latest: LatestFile;
  onClose: () => void;
}

export function DetailsPanel({ lang, area, latest, onClose }: Props) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

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
      style={{ viewTransitionName: 'area-grow' }}
      aria-labelledby={`details-${area.icon}`}
    >
      <header className="details__head">
        <h2 id={`details-${area.icon}`}>
          <span className="story__disc" aria-hidden="true" />
          <AreaIcon area={area.icon} />
          {t(lang, area.label)}
        </h2>
        <FlagSwitch
          className="flag-switch--small"
          label={t(lang, 'view.show')}
          options={[
            { label: t(lang, 'view.summary'), onSelect: onClose },
            { label: t(lang, 'view.details'), onSelect: () => {} },
          ]}
          selected={1}
        />
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
