// Ranked latest-year chart (section 12, 4b; DECISIONS.md 87): one row per country, highest
// value first, each with its own data year. Dots where zero is not a meaningful start, bars
// from zero elsewhere. Bangladesh is green and filled; the others are neutral grey (open
// circles as dots), told apart by their direct labels, never by colour alone (8.9).
// Rows glide to their new place when countries are added or removed (FLIP, off for reduced motion).
import { useLayoutEffect, useRef } from 'react';
import { matchNote } from '../../data/notes.ts';
import { niceTicks, tickDecimals } from '../../data/picker.ts';
import type { DataRecord, Target, Unit } from '../../data/types.ts';
import { t, type Lang } from '../../i18n/index.ts';
import { formatNumber, formatYear } from '../../lib/format.ts';
import { formatValue, valueParts } from '../../lib/formatValue.ts';
import { noteText } from '../../lib/noteText.ts';

export type Ranked = DataRecord & { rank: number };

interface Props {
  lang: Lang;
  rows: Ranked[];
  form: 'dots' | 'bars';
  unit: Unit;
  median?: { value: number; year: number } | null;
  target?: Target | null;
  name: (id: string) => string;
}

/** Tick label: the number, with % for percentages. Other units are named in the axis title. */
export function tickLabel(value: number, unit: Unit, decimals: number, lang: Lang): string {
  const n = formatNumber(value, lang, decimals);
  return unit === 'percent' ? `${n}%` : n;
}

/** The unit in words for an axis title, or null when the tick labels already carry it (%). */
export function unitWords(unit: Unit, lang: Lang): string | null {
  if (unit === 'percent') return null;
  if (unit === 'taka_current' || unit === 'taka_constant') return t(lang, 'unit.taka.label');
  return valueParts({ value: 0, unit }, lang).unit;
}

/** Rows keep their DOM order by rank; this animates each from where it was (FLIP). */
function useFlip(ref: React.RefObject<HTMLOListElement | null>, signature: string) {
  const tops = useRef(new Map<string, number>());
  useLayoutEffect(() => {
    const list = ref.current;
    if (!list) return;
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const next = new Map<string, number>();
    for (const el of Array.from(list.children) as HTMLElement[]) {
      const id = el.dataset.country!;
      const top = el.offsetTop;
      next.set(id, top);
      if (still || typeof el.animate !== 'function') continue;
      const before = tops.current.get(id);
      if (before === undefined) {
        if (tops.current.size > 0) el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 360, easing: 'ease-out' });
      } else if (before !== top) {
        el.animate([{ transform: `translateY(${before - top}px)` }, { transform: 'none' }], { duration: 460, easing: 'cubic-bezier(.22, 1, .36, 1)' });
      }
    }
    tops.current = next;
  }, [ref, signature]);
}

export function RankedChart({ lang, rows, form, unit, median, target, name }: Props) {
  const listRef = useRef<HTMLOListElement>(null);
  useFlip(listRef, rows.map((r) => r.country).join(','));

  const values = [...rows.map((r) => r.value), ...(median ? [median.value] : []), ...(target ? [target.value] : [])];
  const lo = form === 'bars' ? Math.min(0, ...values) : Math.min(...values);
  const hi = form === 'bars' ? Math.max(0, ...values) : Math.max(...values);
  const ticks = niceTicks(lo, hi, 5);
  const min = ticks[0]!;
  const max = ticks[ticks.length - 1]!;
  const x = (v: number) => ((v - min) / (max - min)) * 100;
  const decimals = tickDecimals(ticks);
  const words = unitWords(unit, lang);
  const n = (v: number) => formatNumber(v, lang, 0);

  return (
    <div className={`ranked ranked--${form}`}>
      <div className="ranked__plot">
        <div className="ranked__overlay" aria-hidden="true">
          {ticks.map((tick) => (
            <span key={tick} className={`ranked__grid${tick === 0 ? ' is-zero' : ''}`} style={{ left: `${x(tick)}%` }} />
          ))}
          {median && <span className="ranked__median" style={{ left: `${x(median.value)}%` }} />}
          {target && <span className="ranked__goal" style={{ left: `${x(target.value)}%` }} />}
        </div>
        <ol className="ranked__rows" ref={listRef}>
          {rows.map((r) => {
            const bgd = r.country === 'BGD';
            const parts = valueParts(r, lang, true);
            const label = t(lang, 'compare.row_label', {
              rank: n(r.rank),
              country: name(r.country),
              value: formatValue(r, lang),
              year: formatYear(r.year, lang),
            });
            const from = x(Math.min(0, r.value));
            const width = Math.abs(x(r.value) - x(0));
            const notes = r.notes.filter((note) => matchNote(note));
            return (
              <li key={r.country} data-country={r.country} className={`ranked__row${bgd ? ' is-bgd' : ''}`} tabIndex={0} aria-label={label}>
                <span className="ranked__name">
                  <span className="ranked__rank num">{n(r.rank)}</span>
                  {name(r.country)}
                </span>
                <span className="ranked__track" aria-hidden="true">
                  {form === 'bars' ? (
                    <span className={`ranked__bar${r.value < 0 ? ' is-negative' : ''}`} style={{ left: `${from}%`, width: `${width}%` }} />
                  ) : (
                    <span className="ranked__dot" style={{ left: `${x(r.value)}%` }} />
                  )}
                </span>
                <span className="ranked__value num" aria-hidden="true">
                  <span data-value="">{parts.number}</span> <span className="ranked__year">{formatYear(r.year, lang)}</span>
                </span>
                <span className="ranked__tip glass" role="tooltip">
                  <span>
                    <strong>{name(r.country)}</strong>: {formatValue(r, lang)} ({formatYear(r.year, lang)})
                  </span>
                  {r.measured_by && <span className="ranked__tip-note">{t(lang, r.measured_by === 'income' ? 'caveat.income' : 'caveat.consumption')}</span>}
                  {notes.map((note) => (
                    <span key={note} className="ranked__tip-note">
                      {t(lang, 'source.notes', { note: noteText(note, lang) })}
                    </span>
                  ))}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
      <div className="ranked__axis num" aria-hidden="true">
        <div className="ranked__ticks">
          {ticks.map((tick, i) => (
            <span
              key={tick}
              className={[i === 0 ? 'is-first' : i === ticks.length - 1 ? 'is-last' : '', i % 2 === 1 ? 'is-odd' : ''].join(' ').trim() || undefined}
              style={{ left: `${x(tick)}%` }}
            >
              {tickLabel(tick, unit, decimals, lang)}
            </span>
          ))}
        </div>
      </div>
      {words && <p className="ranked__unit muted">{t(lang, 'chart.axis_unit', { unit: words })}</p>}
    </div>
  );
}
