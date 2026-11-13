// "Bangladesh at a glance" card (Ahmar, M4 review 2): name, value, and a world-position bar,
// a track from rank 1 to the last rank with Bangladesh's marker on it, so where it stands in the
// world can be seen before it is read. Published ranks are shown as the publisher gives them;
// other ranks are calculated by this site (1 = highest value; DECISIONS.md 67).
import type { LatestIndicator } from '../data/types.ts';
import { t, type Lang } from '../i18n/index.ts';
import { indicatorName } from '../lib/display.ts';
import { formatNumber, formatYear } from '../lib/format.ts';
import { valueParts } from '../lib/formatValue.ts';
import { CompactSources } from './SourceLine.tsx';

interface Props {
  lang: Lang;
  data: LatestIndicator;
}

export function GlanceCard({ lang, data }: Props) {
  const bgd = data.bangladesh;
  const parts = bgd ? valueParts(bgd, lang) : null;
  const rank = data.rank;
  const n = (v: number) => formatNumber(v, lang, 0);
  const at = rank ? ((rank.rank - 1) / Math.max(1, rank.out_of - 1)) * 100 : 0;

  return (
    <article className="glance" data-figure="">
      <h3 className="glance__name">{indicatorName(data.id, lang)}</h3>
      {bgd && parts ? (
        <p className="glance__value">
          <span className="glance__num num" data-value="">
            {parts.number}
          </span>
          {parts.unit && <span className="glance__unit">{parts.unit}</span>}
          <span className="glance__year">{formatYear(bgd.year, lang)}</span>
        </p>
      ) : (
        <p className="glance__value" data-not-available="">
          {t(lang, 'data.not_available')}
        </p>
      )}
      {rank && (
        <div className="glance__world">
          <div className="glance__track" aria-hidden="true">
            <span className="glance__marker" style={{ left: `${at}%` }} />
          </div>
          <p className="glance__rank">
            <span>{t(lang, 'rank.world', { rank: n(rank.rank), n: n(rank.out_of) })}</span>
            <span className="muted">
              {rank.kind === 'calculated' ? `${formatYear(rank.year, lang)}, ${t(lang, 'derived.calculated_by_site')}` : formatYear(rank.year, lang)}
            </span>
          </p>
        </div>
      )}
      {bgd && (
        <CompactSources
          records={data.compare_bangladesh ? [bgd, data.compare_bangladesh] : [bgd]}
          lang={lang}
          linkLabels={[t(lang, 'source.link_own'), t(lang, 'source.link_ppp')]}
        />
      )}
    </article>
  );
}
