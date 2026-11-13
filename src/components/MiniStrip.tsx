// Compact comparison strip for the dashboard (8.9, 8.10, Ahmar's M4 brief).
// Bangladesh: filled green dot. Peers: open grey circles. The country picked in the slicer:
// filled with chart series 2 (jute gold), named, and gently enlarged (an animated transition,
// still under reduced motion). Median of lower-middle-income countries: thin tick. Official goal
// (if one exists): dashed line marked "Goal". For published ranks the axis runs 1 … out of.
import type { LatestPoint, Target, Unit } from '../data/types.ts';
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
  median?: { year: number; value: number } | null;
  target?: Target | null;
  /** For ranks: the number of countries ranked, so the axis is 1 … outOf. */
  outOf?: number;
  /** Shown between the end labels when the strip is in a different unit (e.g. PPP dollars). */
  unitNote?: string;
  /** Show the lowest and highest values under the strip (off in the tightest rows). */
  showEnds?: boolean;
}

export function MiniStrip({ lang, unit, points, names, selected, median, target, outOf, unitNote, showEnds = true }: Props) {
  if (points.length === 0) return null;
  const isRank = unit === 'rank' && !!outOf;
  const vals = [...points.map((p) => p.value), ...(median ? [median.value] : []), ...(target ? [target.value] : [])];
  let min = isRank ? 1 : Math.min(...vals);
  let max = isRank ? outOf! : Math.max(...vals);
  if (!isRank) {
    const pad = (max - min) * 0.08 || Math.abs(max) * 0.1 || 1;
    min -= pad;
    max += pad;
  }
  const x = (v: number) => ((v - min) / (max - min)) * 100;
  const fmt = (v: number) => formatValue({ value: v, unit }, lang);
  const label = (p: LatestPoint) =>
    t(lang, 'peers.value_year', { country: countryLabel(p.country, lang, names), value: fmt(p.value), year: formatYear(p.year, lang) });
  const edge = (pos: number) => (pos < 15 ? ' is-start' : pos > 85 ? ' is-end' : '');

  // Bangladesh last (on top); the selected peer just under it.
  const order = [...points].sort((a, b) => rankOf(a) - rankOf(b));
  function rankOf(p: LatestPoint) {
    return p.country === 'BGD' ? 2 : p.country === selected ? 1 : 0;
  }
  const sel = points.find((p) => p.country === selected);

  return (
    <div className="mini">
      <ul className="visually-hidden">
        {points.map((p) => (
          <li key={p.country}>{label(p)}</li>
        ))}
      </ul>
      <div className="mini__plot" aria-hidden="true">
        <span className="mini__axis" />
        {median && <span className="mini__median" style={{ left: `${x(median.value)}%` }} />}
        {target && (
          <span className={`mini__goal${edge(x(target.value))}`} style={{ left: `${x(target.value)}%` }}>
            <span className="mini__goal-label" title={t(lang, target.label_key as never, { value: fmt(target.value) })}>
              {t(lang, 'goal.short', { value: goalValue(target.value, unit, lang) })}
            </span>
          </span>
        )}
        {order.map((p) => {
          const cls = p.country === 'BGD' ? ' is-bgd' : p.country === selected ? ' is-selected' : '';
          return (
            <span key={p.country} className={`mini__dot${cls}${edge(x(p.value))}`} style={{ left: `${x(p.value)}%` }} title={label(p)}>
              <span className="mini__tip glass">{label(p)}</span>
            </span>
          );
        })}
        {sel && (
          <span key={sel.country} className={`mini__sel-label${edge(x(sel.value))}`} style={{ left: `${x(sel.value)}%` }}>
            {countryLabel(sel.country, lang, names)} {isRank ? formatNumber(sel.value, lang, 0) : shortEnd(sel.value, unit, lang)}
          </span>
        )}
      </div>
      {showEnds ? (
        <div className="mini__ends" aria-hidden="true">
          <span>{isRank ? formatNumber(1, lang, 0) : shortEnd(Math.min(...points.map((p) => p.value)), unit, lang)}</span>
          {unitNote && <span className="mini__unit-note">{unitNote}</span>}
          <span>{isRank ? formatNumber(outOf!, lang, 0) : shortEnd(Math.max(...points.map((p) => p.value)), unit, lang)}</span>
        </div>
      ) : (
        unitNote && <p className="mini__unit-note mini__unit-note--alone">{unitNote}</p>
      )}
    </div>
  );
}

/** End labels stay short: number only for units written as words. */
function shortEnd(v: number, unit: Unit, lang: Lang) {
  if (unit === 'percent' || unit === 'taka_current' || unit === 'taka_constant') return formatValue({ value: v, unit }, lang);
  if (unit === 'intl_dollar_current') return formatLargeWords(v, lang, 1);
  return formatNumber(v, lang, 1);
}

/** Goal numbers are round (25, 100%, 5): no forced decimals. */
function goalValue(v: number, unit: Unit, lang: Lang) {
  const d = Number.isInteger(v) ? 0 : 1;
  return unit === 'percent' ? `${formatNumber(v, lang, d)}%` : formatNumber(v, lang, d);
}
