// A headline tile (8.8, design contract): name, value, caveats, plain explanation with the
// official definition link, the peer strip, the position badge (or the neutral note), and the
// source line. The source line is never hidden (R1).
import type { CountriesFile, DataRecord, IndicatorMeta, MedianRecord } from '../data/types.ts';
import { latestMedian, latestRecent } from '../data/compare.ts';
import { t, type Lang } from '../i18n/index.ts';
import { explanation, indicatorName } from '../lib/display.ts';
import { valueParts } from '../lib/formatValue.ts';
import { PeerStrip } from './PeerStrip.tsx';
import { PositionBadge } from './PositionBadge.tsx';
import { SourceLine } from './SourceLine.tsx';

export interface TileData {
  meta: IndicatorMeta;
  records: DataRecord[];
  /** The series used for the peer comparison when it is not the tile's own (e.g. PPP for taka). */
  compare?: { meta: IndicatorMeta; records: DataRecord[]; medians?: MedianRecord[] };
  medians?: MedianRecord[];
}

interface Props extends TileData {
  lang: Lang;
  countries: CountriesFile;
  since: number;
  wide?: boolean;
}

export function Tile({ meta, records, compare, medians, lang, countries, since, wide }: Props) {
  const own = latestRecent(records, ['BGD'], 0).get('BGD');
  const cmp = compare ?? (meta.scope === 'compare' ? { meta, records, medians } : undefined);
  const peerIds = countries.default_peers;
  const recent = cmp ? latestRecent(cmp.records, ['BGD', ...peerIds], since) : new Map<string, DataRecord>();
  const peers = peerIds.map((id) => recent.get(id)).filter((r): r is DataRecord => !!r);
  const missing = peerIds.filter((id) => !recent.has(id));
  const bgdCmp = recent.get('BGD');
  const years = new Set([...peers, ...(bgdCmp ? [bgdCmp] : [])].map((r) => r.year));

  const caveats: string[] = [];
  if (/model/i.test(meta.source_series_name)) caveats.push(t(lang, 'caveat.modelled'));
  if (/gross/i.test(meta.source_series_name)) caveats.push(t(lang, 'caveat.gross'));
  if (own?.measured_by === 'consumption') caveats.push(t(lang, 'caveat.consumption'));
  if (own?.measured_by === 'income') caveats.push(t(lang, 'caveat.income'));

  const text = explanation(meta, own, lang);
  const parts = own ? valueParts(own, lang) : null;

  return (
    <article className={`tile${wide ? ' tile--wide' : ''}`} data-figure="">
      <h3 className="tile__name">{indicatorName(meta.id, lang)}</h3>

      {own && own.source_url ? (
        <p className="tile__value display num" data-value="">
          {parts!.number}
          {parts!.unit && <span className="tile__unit"> {parts!.unit}</span>}
        </p>
      ) : (
        <p className="tile__value tile__value--na" data-not-available="">
          {t(lang, 'data.not_available')}
        </p>
      )}

      {caveats.length > 0 && (
        <ul className="tile__caveats">
          {caveats.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      )}

      {text && (
        <p className="tile__explain secondary">
          {text}{' '}
          <a href={meta.definition_url} target="_blank" rel="noopener noreferrer">
            {t(lang, 'explain.official_definition')}
          </a>
        </p>
      )}

      {cmp && (
        <div className="tile__compare">
          {compare && <p className="tile__compare-note muted">{t(lang, 'peers.compared_in_ppp')}</p>}
          <PeerStrip
            lang={lang}
            bangladesh={bgdCmp}
            peers={peers}
            missing={missing}
            since={since}
            median={latestMedian(cmp.medians)}
            direction={cmp.meta.favourable_direction}
            countries={countries}
            size={wide ? 'large' : 'small'}
          />
          {years.size > 1 && <p className="tile__years muted">{t(lang, 'caveat.years_differ')}</p>}
          <PositionBadge lang={lang} direction={cmp.meta.favourable_direction} bangladesh={bgdCmp} peers={peers} countries={countries} />
          {compare && bgdCmp && <SourceLine record={bgdCmp} lang={lang} />}
        </div>
      )}

      {own && <SourceLine record={own} lang={lang} />}
    </article>
  );
}
