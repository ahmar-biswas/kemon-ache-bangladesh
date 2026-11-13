// One data point on the dashboard (Ahmar, M4). Two compact variants, both two columns plus
// the source line(s) underneath (R1):
//   "area": left = short name, value and year, world rank; right = strip with end values,
//           then the position (where an official direction exists).
//   "side": left = short name, value and year; right = strip, then world rank and position.
// The full name is on hover and in Details. The strip shows the slicer's country with its value,
// the median tick, and the goal line with its number.
import { useId } from 'react';
import { position } from '../data/compare.ts';
import type { LatestIndicator, LatestPoint } from '../data/types.ts';
import { t, type Lang } from '../i18n/index.ts';
import { indicatorName, indicatorShortName } from '../lib/display.ts';
import { formatNumber, formatYear } from '../lib/format.ts';
import { valueParts } from '../lib/formatValue.ts';
import { MiniStrip } from './MiniStrip.tsx';
import { CompactSources } from './SourceLine.tsx';

interface Props {
  lang: Lang;
  data: LatestIndicator;
  names: Record<string, string>;
  selected: string | null;
  variant?: 'area' | 'side';
}

export function MetricRow({ lang, data, names, selected, variant = 'area' }: Props) {
  const tipA = useId();
  const tipB = useId();
  const bgd = data.bangladesh;
  const parts = bgd ? valueParts(bgd, lang, true) : null;
  const pts = data.points;
  const bgdPt = pts.find((p) => p.country === 'BGD');
  const peers = pts.filter((p) => p.country !== 'BGD');
  const cmpUnit = data.compare_bangladesh?.unit ?? data.unit;
  const pos = position<LatestPoint>(data.favourable_direction, bgdPt, peers);
  const n = (v: number) => formatNumber(v, lang, 0);
  const year = (y: number) => formatYear(y, lang);
  const rank = data.rank?.kind === 'calculated' ? data.rank : null;

  const rankLine = (tipId: string) => rank && (
    <span className="metric__rank-text">
      {t(lang, 'rank.short', { rank: n(rank.rank), n: n(rank.out_of) })}
      <button type="button" className="info-button" popoverTarget={tipId} aria-label={t(lang, 'rank.more')}>
        i
      </button>
      <span id={tipId} popover="auto" className="info-pop glass">
        {t(lang, 'rank.calculated', { rank: n(rank.rank), n: n(rank.out_of), year: year(rank.year) })}
        <br />
        {t(lang, 'rank.formula', { year: year(rank.year) })}{' '}
        <a href={rank.source_url} target="_blank" rel="noopener noreferrer">
          {t(lang, 'rank.list')}
        </a>
      </span>
    </span>
  );
  const posText =
    pos &&
    (pos.kind === 'ahead'
      ? t(lang, 'badge.ahead_short', { n: n(pos.ahead.length), m: n(pos.m) })
      : pos.kind === 'behind'
        ? t(lang, 'badge.behind_short', { n: n(pos.behind.length), m: n(pos.m) })
        : t(lang, 'badge.level_short'));

  return (
    <article className={`metric metric--${variant}`} data-figure="">
      <div className="metric__main">
        <h3 className="metric__name" title={indicatorName(data.id, lang)}>
          {indicatorShortName(data.id, lang)}
        </h3>
        {bgd && parts ? (
          <p className="metric__value">
            <span className="metric__num num" data-value="">
              {parts.number}
            </span>
            {parts.unit && <span className="metric__unit">{parts.unit}</span>}
            <span className="metric__year">{year(bgd.year)}</span>
          </p>
        ) : (
          <p className="metric__value metric__value--na" data-not-available="">
            {t(lang, 'data.not_available')}
          </p>
        )}
        {variant === 'area' && rank && <p className="metric__line">{rankLine(tipA)}</p>}
      </div>

      <div className="metric__chart">
        <MiniStrip
          lang={lang}
          unit={cmpUnit}
          points={pts}
          names={names}
          selected={selected}
          median={data.median}
          target={data.target}
          outOf={data.rank?.kind === 'published' ? data.rank.out_of : undefined}
          unitNote={data.compare_id ? t(lang, 'peers.unit_ppp_short') : undefined}
          showEnds={variant === 'area'}
        />
        {(variant === 'side' ? rank || posText : posText) && (
          <p className="metric__line">
            {variant === 'side' && rankLine(tipA)}
            {posText && <span className="metric__pos">{posText}</span>}
          </p>
        )}
      </div>

      {/* Laptop layout: rank and position in their own column (CSS hides the copies above). */}
      <div className="metric__side">
        {rank && <span>{rankLine(tipB)}</span>}
        {posText && <span className="metric__pos">{posText}</span>}
      </div>

      <div className="metric__sources">
        {bgd && (
          <CompactSources
            records={data.compare_bangladesh ? [bgd, data.compare_bangladesh] : [bgd]}
            lang={lang}
            linkLabels={[t(lang, 'source.link_own'), t(lang, 'source.link_ppp')]}
          />
        )}
      </div>
    </article>
  );
}
