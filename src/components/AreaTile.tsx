// One of the four area tiles on the dashboard (Ahmar, M4; DECISIONS.md 61, 62):
// heading, status count (a count of facts, never a score), the measures used, one compact row
// per measure, and a Summary | Details flag switch that opens the full details panel.
import { useId } from 'react';
import { position } from '../data/compare.ts';
import type { AreaConfig } from '../data/dashboard.ts';
import type { LatestFile, LatestPoint } from '../data/types.ts';
import { t, type Lang } from '../i18n/index.ts';
import { indicatorShortName } from '../lib/display.ts';
import { formatNumber } from '../lib/format.ts';
import { FlagSwitch } from './FlagSwitch.tsx';
import { MetricRow } from './MetricRow.tsx';
import { AreaIcon } from './Motifs.tsx';

interface Props {
  lang: Lang;
  area: AreaConfig;
  latest: LatestFile;
  selected: string | null;
  open: boolean;
  onToggle: (open: boolean) => void;
}

export function AreaTile({ lang, area, latest, selected, open, onToggle }: Props) {
  const howId = useId();
  const rows = area.summary.map((id) => latest.indicators[id]).filter((d): d is NonNullable<typeof d> => !!d);

  // Status: among measures with an official goal direction, how many Bangladesh is ahead on.
  const all = [...area.summary, ...area.extra].map((id) => latest.indicators[id]).filter((d): d is NonNullable<typeof d> => !!d);
  const positions = all
    .map((d) => {
      const bgd = d.points.find((p) => p.country === 'BGD');
      return position<LatestPoint>(d.favourable_direction, bgd, d.points.filter((p) => p.country !== 'BGD'));
    })
    .filter((p): p is NonNullable<typeof p> => !!p);
  const ahead = positions.filter((p) => p.kind === 'ahead').length;
  const n = (v: number) => formatNumber(v, lang, 0);
  const list = [...area.summary, ...area.extra].map((id) => indicatorShortName(id, lang)).join(lang === 'bn' ? ', ' : ', ');

  return (
    <section className={`area area--${area.icon}${open ? ' is-open' : ''}`} aria-labelledby={`area-${area.icon}`}>
      <header className="area__head">
        <div className="area__top">
          <h2 id={`area-${area.icon}`} className="area__title">
            <AreaIcon area={area.icon} />
            {t(lang, area.label)}
          </h2>
          <FlagSwitch
            className="flag-switch--small"
            label={t(lang, 'view.show')}
            options={[
              { label: t(lang, 'view.summary'), onSelect: () => onToggle(false) },
              { label: t(lang, 'view.details'), onSelect: () => onToggle(true) },
            ]}
            selected={open ? 1 : 0}
          />
        </div>
        <p className="area__status">
          {positions.length > 0 ? t(lang, 'status.count', { a: n(ahead), m: n(positions.length) }) : t(lang, 'status.none')}
          {positions.length > 0 && (
            <>
              {' '}
              <button type="button" className="info-button" popoverTarget={howId} aria-label={t(lang, 'status.how')}>
                i
              </button>
              <span id={howId} popover="auto" className="info-pop glass">
                {t(lang, 'status.formula')}
              </span>
            </>
          )}
        </p>
        <p className="area__subtitle">{t(lang, 'area.subtitle', { list })}</p>
      </header>

      <div className="area__rows">
        {rows.map((d) => (
          <MetricRow key={d.id} lang={lang} data={d} names={latest.names} selected={selected} />
        ))}
      </div>
    </section>
  );
}
