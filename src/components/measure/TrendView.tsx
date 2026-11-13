// "Bangladesh over time" for one measure (section 12, 3; DECISIONS.md 87, 88): the line
// chart (or table), the event switches (only once the events list is approved), CSV, how to
// read it, and the source line (R1). Money is shown in constant taka, re-expressed in the
// prices of the latest year so its last point matches the tile (DECISIONS.md 106).
import { useEffect, useMemo, useState } from 'react';
import { COUNTRIES } from '../../data/details.ts';
import { approvedEvents, loadTrend } from '../../data/measure.ts';
import { matchNote } from '../../data/notes.ts';
import { rebaseToLatestPrices, rebasedCsv, type Rebased } from '../../data/rebase.ts';
import { segments, toCsv } from '../../data/picker.ts';
import type { DataRecord, EventKind, IndicatorMeta } from '../../data/types.ts';
import { t, type Lang } from '../../i18n/index.ts';
import { countryName, indicatorName } from '../../lib/display.ts';
import { downloadCsv } from '../../lib/download.ts';
import { formatNumber, formatYear } from '../../lib/format.ts';
import { formatValue } from '../../lib/formatValue.ts';
import { noteText } from '../../lib/noteText.ts';
import { FlagSwitch } from '../FlagSwitch.tsx';
import { Loading } from '../Loading.tsx';
import { SourceLine } from '../SourceLine.tsx';
import { LineChart } from './LineChart.tsx';

interface Props {
  lang: Lang;
  /** The measure the reader opened. */
  meta: IndicatorMeta;
  /** The series drawn (the same, or constant taka for a current-taka measure). */
  trend: IndicatorMeta;
}

export function TrendView({ lang, meta, trend }: Props) {
  const [points, setPoints] = useState<DataRecord[] | 'missing' | null>(null);
  const [published, setPublished] = useState<DataRecord[]>([]);
  const [rebased, setRebased] = useState<Rebased | null>(null);
  const [view, setView] = useState<0 | 1>(0);
  const [kinds, setKinds] = useState<Record<EventKind, boolean>>({ political: true, shock: true });
  const all = useMemo(() => approvedEvents(), []);

  useEffect(() => {
    let alive = true;
    setPoints(null);
    setRebased(null);
    const constant = trend.id !== meta.id;
    void Promise.all([loadTrend(trend.id), constant ? loadTrend(meta.id) : Promise.resolve(null)]).then(([p, current]) => {
      if (!alive) return;
      if (!p || p.length === 0) return setPoints('missing');
      const r = constant && current ? rebaseToLatestPrices(p, current) : null;
      // A constant series that can't be put in the tile's prices is not shown in other prices.
      if (constant && !r) return setPoints('missing');
      setPublished(p);
      setRebased(r);
      setPoints(r ? r.points : p);
    });
    return () => {
      alive = false;
    };
  }, [trend.id, meta.id]);

  if (points === null) return <Loading lang={lang} />;
  if (points === 'missing') {
    return (
      <p className="measure__na" data-not-available="">
        {t(lang, 'data.not_available')}
      </p>
    );
  }

  const first = points[0]!;
  const last = points[points.length - 1]!;
  const title = rebased
    ? t(lang, 'trend.in_prices_name', { name: t(lang, `indicator.${meta.id}.short` as never), year: formatYear(rebased.year, lang) })
    : indicatorName(trend.id, lang);
  const events = all.filter((e) => kinds[e.kind]);
  const gaps = segments(points).length > 1;
  const range = { from: formatYear(first.year, lang), to: formatYear(last.year, lang) };
  // A note carried by every year (e.g. the fiscal-year basis) is said once, under the chart.
  const shared = last.notes.filter((note) => matchNote(note) && points.every((p) => p.notes.includes(note)));

  return (
    <div className="measure__body">
      {rebased && <p className="measure__note">{t(lang, 'trend.rebased_note', { year: formatYear(rebased.year, lang) })}</p>}

      <section className="chart-frame measure__frame" data-figure="">
        <div className="chart-frame__head">
          <h3>{t(lang, 'trend.chart_title', { name: title, ...range })}</h3>
          <div className="chart-frame__controls">
            <FlagSwitch
              label={t(lang, 'chart.show_as')}
              options={[
                { label: t(lang, 'chart.chart'), onSelect: () => setView(0) },
                { label: t(lang, 'chart.table'), onSelect: () => setView(1) },
              ]}
              selected={view}
            />
            <button
              type="button"
              className="text-button"
              onClick={() =>
                rebased
                  ? downloadCsv(`${trend.code}-bangladesh-${rebased.year}-prices.csv`, rebasedCsv(rebased, published))
                  : downloadCsv(`${trend.code}-bangladesh.csv`, toCsv(points, (id) => countryName(id, lang, COUNTRIES)))
              }
            >
              {t(lang, 'chart.download_csv')}
            </button>
          </div>
        </div>

        <p className="measure__rank">
          <span data-value="">{formatValue(last, lang)}</span> <span className="muted">({formatYear(last.year, lang)})</span>
        </p>

        {all.length > 0 && view === 0 && (
          <fieldset className="measure__events">
            <legend>{t(lang, 'events.show')}</legend>
            {(['political', 'shock'] as const).map((kind) => (
              <label key={kind}>
                <input type="checkbox" checked={kinds[kind]} onChange={() => setKinds((k) => ({ ...k, [kind]: !k[kind] }))} />
                <svg className={`measure__event-key event--${kind}`} width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
                  {kind === 'political' ? <circle cx="6" cy="6" r="4.25" /> : <path d="M6 1 L11 6 L6 11 L1 6 Z" />}
                </svg>
                {t(lang, `events.kind.${kind}`)}
              </label>
            ))}
          </fieldset>
        )}

        {view === 0 ? (
          <LineChart lang={lang} points={points} unit={trend.unit} events={events} label={t(lang, 'trend.chart_title', { name: title, ...range })} />
        ) : (
          <div className="table-wrap table-wrap--tall">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">{t(lang, 'table.year')}</th>
                  <th scope="col">{t(lang, 'table.value')}</th>
                  <th scope="col">{t(lang, 'table.notes')}</th>
                </tr>
              </thead>
              <tbody>
                {[...points].reverse().map((r) => (
                  <tr key={r.year}>
                    <th scope="row" data-label={t(lang, 'table.year')} className="num">{formatYear(r.year, lang)}</th>
                    <td data-label={t(lang, 'table.value')} className="num">{formatValue(r, lang)}</td>
                    <td data-label={t(lang, 'table.notes')} className="data-table__notes">
                      {r.notes.filter((note) => matchNote(note) && !shared.includes(note)).map((note) => noteText(note, lang)).join(' ') || '–'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {events.length > 0 && view === 0 && <p className="measure__caveat">{t(lang, 'events.disclaimer')}</p>}
        {gaps && <p className="measure__caveat muted">{t(lang, 'trend.gaps')}</p>}
        {shared.map((note) => (
          <p key={note} className="measure__caveat muted">
            {t(lang, 'source.notes', { note: noteText(note, lang) })}
          </p>
        ))}
        {rebased ? (
          <>
            <p className="measure__caveat" data-derived="">
              {t(lang, 'derived.calculated_by_site')}:{' '}
              {t(lang, 'trend.rebased_formula', {
                year: formatYear(rebased.year, lang),
                factor: formatNumber(rebased.factor, lang, 3),
                current: formatValue(rebased.current, lang),
                constant: formatValue(rebased.constant, lang),
              })}
            </p>
            <p className="measure__caveat muted">{t(lang, 'trend.input_constant', { name: indicatorName(trend.id, lang) })}</p>
            <SourceLine record={last} lang={lang} />
            <p className="measure__caveat muted">{t(lang, 'trend.input_current', { name: indicatorName(meta.id, lang) })}</p>
            <SourceLine record={rebased.current} lang={lang} />
          </>
        ) : (
          <SourceLine record={last} lang={lang} />
        )}
      </section>

      <section className="measure__read">
        <h3>{t(lang, 'chart.how_to_read')}</h3>
        <p>{t(lang, 'trend.read')}</p>
      </section>
    </div>
  );
}
