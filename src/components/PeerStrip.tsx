// Peer dot strip (8.9, 8.10): one latest value per country on a stitched axis.
// Bangladesh is a filled green dot; peers are open grey dots (shape is a second cue, so colour
// is never the only one). Each dot is a focusable button whose glass tooltip shows the
// country, value and its own data year. A hidden list gives the same to screen readers.
import type { CountriesFile, DataRecord, FavourableDirection, MedianRecord, Target, Unit } from '../data/types.ts';
import { t, type Lang } from '../i18n/index.ts';
import { countryName } from '../lib/display.ts';
import { formatNumber, formatYear } from '../lib/format.ts';
import { formatValue, valueParts } from '../lib/formatValue.ts';
import { isRepeat, listSlots, slotStyle } from '../lib/peerColours.ts';

interface Props {
  lang: Lang;
  bangladesh: DataRecord | undefined;
  peers: DataRecord[];
  /** Peers with no value since `since`: named below the strip, never drawn. */
  missing: string[];
  since: number;
  median?: MedianRecord;
  /** Official numeric goal (data/targets.json), drawn as a dashed "Goal" line. */
  target?: Target;
  direction: FavourableDirection;
  countries: CountriesFile;
  size?: 'large' | 'small';
}

export function PeerStrip({ lang, bangladesh, peers, missing, since, median, target, direction, countries, size = 'small' }: Props) {
  const name = (id: string) => countryName(id, lang, countries);
  const slots = listSlots(countries.default_peers);
  const values = [
    ...peers.map((p) => p.value),
    ...(bangladesh ? [bangladesh.value] : []),
    ...(median ? [median.value] : []),
    ...(target ? [target.value] : []),
  ];

  if (peers.length === 0) {
    return <p className="peer-strip__empty muted">{t(lang, 'peers.none')}</p>;
  }

  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const pad = (hi - lo) * 0.06 || Math.abs(hi) * 0.1 || 1;
  const min = lo - pad;
  const max = hi + pad;
  const x = (v: number) => ((v - min) / (max - min)) * 100;

  const label = (r: DataRecord) =>
    t(lang, 'peers.value_year', { country: name(r.country), value: formatValue(r, lang), year: formatYear(r.year, lang) });

  // Draw Bangladesh last so its dot sits on top.
  const dots = [...peers].sort((a, b) => a.value - b.value);
  const bgdX = bangladesh ? x(bangladesh.value) : 50;
  const align = (pos: number) => (pos < 18 ? 'start' : pos > 82 ? 'end' : 'middle');
  const bgdAlign = align(bgdX);

  return (
    <figure className={`peer-strip peer-strip--${size}`}>
      <ul className="visually-hidden" aria-label={t(lang, 'peers.label')}>
        {bangladesh && <li>{label(bangladesh)}</li>}
        {dots.map((r) => (
          <li key={r.country}>{label(r)}</li>
        ))}
        {median && <li>{`${t(lang, 'median.label_year', { year: formatYear(median.year, lang) })}: ${formatValue(median, lang)}`}</li>}
      </ul>

      <div className="peer-strip__plot" aria-hidden="true">
        {bangladesh && (
          <span className={`peer-strip__bgd-label is-${bgdAlign}`} style={{ left: `${bgdX}%` }}>
            {name(bangladesh.country)}
          </span>
        )}
        <span className="peer-strip__axis" />
        {median && <span className="peer-strip__median" style={{ left: `${x(median.value)}%` }} />}
        {target && (
          <span className="mini__goal peer-strip__goal" style={{ left: `${x(target.value)}%` }}>
            <span className="mini__goal-label">{t(lang, 'goal.label')}</span>
          </span>
        )}
        {dots.map((r) => (
          <button key={r.country} type="button" tabIndex={-1} className={`peer-strip__dot is-${align(x(r.value))}${isRepeat(slots.get(r.country)) ? ' is-repeat' : ''}`} style={{ left: `${x(r.value)}%`, ...slotStyle(slots.get(r.country)) }} aria-label={label(r)}>
            <span className="peer-strip__tip glass" role="tooltip">
              {label(r)}
            </span>
          </button>
        ))}
        {bangladesh && (
          <button type="button" tabIndex={-1} className={`peer-strip__dot is-bgd is-${bgdAlign}`} style={{ left: `${bgdX}%` }} aria-label={label(bangladesh)}>
            <span className="peer-strip__tip glass" role="tooltip">
              {label(bangladesh)}
            </span>
          </button>
        )}
        <span className="peer-strip__end is-min num">{axisLabel(lo, dots[0]!.unit, lang)}</span>
        <span className="peer-strip__end is-max num">{axisLabel(hi, dots[0]!.unit, lang)}</span>
      </div>

      {direction !== 'context' && (
        <p className={`peer-strip__target is-${direction}`}>
          <svg width="18" height="10" viewBox="0 0 18 10" aria-hidden="true" focusable="false">
            <path d={direction === 'lower' ? 'M17 5 H2 M6 1 L2 5 L6 9' : 'M1 5 H16 M12 1 L16 5 L12 9'} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {t(lang, direction === 'lower' ? 'peers.target_lower' : 'peers.target_higher')}
        </p>
      )}

      {median && (
        <figcaption className="peer-strip__legend muted">
          <span className="peer-strip__legend-tick" aria-hidden="true" />
          {t(lang, 'median.label_year', { year: formatYear(median.year, lang) })}
          <span className="peer-strip__calc"> ({t(lang, 'derived.calculated_by_site')})</span>
        </figcaption>
      )}

      {missing.length > 0 && (
        <p className="peer-strip__missing muted">
          {t(lang, 'peers.missing', { year: formatYear(since, lang), countries: missing.map(name).join(lang === 'bn' ? ', ' : ', ') })}
        </p>
      )}
    </figure>
  );
}

/** Axis end labels: short. Units written as words (years, dollars, per 1,000) are named elsewhere on the tile. */
function axisLabel(value: number, unit: Unit, lang: Lang): string {
  if (unit === 'years' || unit === 'per_1000_live_births') return formatNumber(value, lang, 1);
  if (unit === 'intl_dollar_current') return formatNumber(value, lang, 0);
  if (unit !== 'percent' && unit !== 'taka_current' && unit !== 'taka_constant' && unit !== 'usd_current') return valueParts({ value, unit }, lang).number;
  return formatValue({ value, unit }, lang);
}
