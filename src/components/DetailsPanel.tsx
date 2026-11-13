// The full details for one area, opened by an area tile's Summary | Details switch.
// Loaded only when opened (it uses the full data files), so the homepage stays small (R10).
// Shows the M3 Tile for every measure: explanation, full peer strip, position badge with its
// formula, global rank and source lines.
import { useEffect, useRef } from 'react';
import { COUNTRIES, MEDIANS, RECORDS, indicatorMeta } from '../data/all.ts';
import type { AreaConfig } from '../data/dashboard.ts';
import type { LatestFile } from '../data/types.ts';
import { t, type Lang } from '../i18n/index.ts';
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
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const ids = [...area.summary, ...area.extra];
  return (
    <section ref={ref} tabIndex={-1} className="details glass" aria-labelledby={`details-${area.icon}`}>
      <header className="details__head">
        <h2 id={`details-${area.icon}`}>
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
      <p className="muted details__hint">{t(lang, 'details.close_hint')}</p>
      <div className="details__grid">
        {ids.map((id, i) => {
          const meta = indicatorMeta(id);
          const records = RECORDS[id];
          if (!meta || !records) return null;
          const cmpId = meta.compare_id;
          const cmpMeta = cmpId ? indicatorMeta(cmpId) : undefined;
          return (
            <Tile
              key={id}
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
          );
        })}
      </div>
    </section>
  );
}
