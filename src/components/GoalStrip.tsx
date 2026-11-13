// The headline strip in each area tile (Ahmar, M4 review 2; spec 8.10 "position and shape,
// not colour"). Bangladesh is the filled green dot; neighbours are open circles.
//
// Where an official goal gives a direction, the strip is turned so the goal always points
// RIGHT, and the track deepens gently toward that end. So "further right than most dots" always
// means "ahead of most neighbours", for every measure, without any red or green. A small ring
// beside it fills by the share of neighbours Bangladesh is ahead of (1, 2 or 3 quarters).
// Without an official goal the strip is a plain lower-to-higher line and says nothing more.
import type { FavourableDirection, LatestPoint, Target, Unit } from '../data/types.ts';
import { position } from '../data/compare.ts';
import { t, type Lang } from '../i18n/index.ts';
import { countryLabel } from '../lib/names.ts';
import { formatLargeWords, formatNumber, formatYear } from '../lib/format.ts';
import { formatValue } from '../lib/formatValue.ts';

interface Props {
  lang: Lang;
  unit: Unit;
  points: LatestPoint[];
  names: Record<string, string>;
  selected: string | null;
  direction: FavourableDirection;
  median?: { year: number; value: number } | null;
  target?: Target | null;
}

export function GoalStrip({ lang, unit, points, names, selected, direction, median, target }: Props) {
  if (points.length === 0) return null;
  const vals = [...points.map((p) => p.value), ...(median ? [median.value] : []), ...(target ? [target.value] : [])];
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  const pad = (hi - lo) * 0.08 || Math.abs(hi) * 0.1 || 1;
  const min = lo - pad;
  const max = hi + pad;
  // "lower is the goal" → flip, so the goal end is always on the right.
  const flip = direction === 'lower';
  const x = (v: number) => {
    const p = ((v - min) / (max - min)) * 100;
    return flip ? 100 - p : p;
  };
  const fmt = (v: number) => formatValue({ value: v, unit }, lang);
  const sh = (v: number) => short(v, unit, lang);
  const name = (c: string) => countryLabel(c, lang, names);
  const label = (p: LatestPoint) => t(lang, 'peers.value_year', { country: name(p.country), value: fmt(p.value), year: formatYear(p.year, lang) });
  const edge = (pos: number) => (pos < 14 ? ' is-start' : pos > 86 ? ' is-end' : '');

  const bgd = points.find((p) => p.country === 'BGD');
  const peers = points.filter((p) => p.country !== 'BGD');
  const sel = points.find((p) => p.country === selected);
  const pos = position<LatestPoint>(direction, bgd, peers);
  const directed = direction !== 'context';
  const order = [...points].sort((a, b) => weight(a) - weight(b));
  function weight(p: LatestPoint) {
    return p.country === 'BGD' ? 2 : p.country === selected ? 1 : 0;
  }
  const ends = flip ? [hi, lo] : [lo, hi];

  return (
    <figure className={`goal-strip${directed ? ' is-directed' : ''}`}>
      <ul className="visually-hidden">
        {points.map((p) => (
          <li key={p.country}>{label(p)}</li>
        ))}
      </ul>
      <div className="goal-strip__plot" aria-hidden="true">
        <span className="goal-strip__track" />
        {median && <span className="goal-strip__median" style={{ left: `${x(median.value)}%` }} />}
        {target && (
          <span className={`goal-strip__goal${edge(x(target.value))}`} style={{ left: `${x(target.value)}%` }}>
            <span>{t(lang, 'goal.short', { value: sh(target.value) })}</span>
          </span>
        )}
        {order.map((p) => {
          const cls = p.country === 'BGD' ? ' is-bgd' : p.country === selected ? ' is-selected' : '';
          return (
            <span key={p.country} className={`goal-strip__dot${cls}${edge(x(p.value))}`} style={{ left: `${x(p.value)}%` }} title={label(p)}>
              <span className="goal-strip__tip glass">{label(p)}</span>
            </span>
          );
        })}
        {bgd && (
          <span className={`goal-strip__name is-bgd${edge(x(bgd.value))}`} style={{ left: `${x(bgd.value)}%` }}>
            {name('BGD')}
          </span>
        )}
        {sel && (
          <span key={sel.country} className={`goal-strip__name is-selected${edge(x(sel.value))}`} style={{ left: `${x(sel.value)}%` }}>
            {name(sel.country)} {sh(sel.value)}
          </span>
        )}
      </div>
      <figcaption className="goal-strip__ends">
        <span>{directed ? sh(ends[0]!) : `${t(lang, 'strip.lower')} ${sh(ends[0]!)}`}</span>
        {directed ? (
          <span className="goal-strip__toward">
            {sh(ends[1]!)}{' '}
            <svg width="16" height="8" viewBox="0 0 16 8" aria-hidden="true" focusable="false">
              <path d="M1 4 H14 M10 1 L14 4 L10 7" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>{' '}
            {t(lang, 'strip.toward_goal')}
          </span>
        ) : (
          <span>{`${t(lang, 'strip.higher')} ${sh(ends[1]!)}`}</span>
        )}
      </figcaption>
      {pos && (
        <p className="goal-strip__pos">
          <Ring quarters={pos.quarters} />
          {pos.kind === 'ahead'
            ? t(lang, 'badge.ahead_short', { n: formatNumber(pos.ahead.length, lang, 0), m: formatNumber(pos.m, lang, 0) })
            : pos.kind === 'behind'
              ? t(lang, 'badge.behind_short', { n: formatNumber(pos.behind.length, lang, 0), m: formatNumber(pos.m, lang, 0) })
              : t(lang, 'badge.level_short')}
        </p>
      )}
    </figure>
  );
}

/** A ring with 1, 2 or 3 quarters filled: how much of the neighbourhood Bangladesh is ahead of. */
function Ring({ quarters }: { quarters: 1 | 2 | 3 }) {
  const r = 7;
  const c = 2 * Math.PI * r;
  return (
    <svg className="goal-strip__ring" width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
      <circle cx="9" cy="9" r={r} fill="none" stroke="currentColor" strokeOpacity=".2" strokeWidth="2.5" />
      <circle className="goal-strip__ring-fill" cx="9" cy="9" r={r} fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray={`${(c * quarters) / 4} ${c}`} transform="rotate(-90 9 9)" />
    </svg>
  );
}

/** Short values for labels on the strip: the unit is already shown in the tile's headline. */
function short(v: number, unit: Unit, lang: Lang): string {
  if (unit === 'percent' || unit === 'taka_current' || unit === 'taka_constant') return formatValue({ value: v, unit }, lang);
  if (unit === 'intl_dollar_current' || unit === 'usd_current') return formatLargeWords(v, lang, 1);
  return formatNumber(v, lang, 1);
}
