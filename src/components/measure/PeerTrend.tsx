// One measure on a subsection page (section 10; DECISIONS.md 105): its name (linking to the
// measure's own page), Bangladesh's latest value, the plain explanation with the official
// definition link, then one chart of Bangladesh and the default peers over time, with
// Chart | Table, CSV and the source line (R1).
// A measure published for Bangladesh only (GDP per person in taka) shows "Bangladesh over
// time" instead, in the same prices as its tile (DECISIONS.md 106).
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { COUNTRIES, indicatorMeta, trendIdFor } from '../../data/details.ts';
import { loadSeries } from '../../data/measure.ts';
import { multiCountryUrl, toCsv } from '../../data/picker.ts';
import { path } from '../../data/site.ts';
import type { DataRecord, IndicatorMeta } from '../../data/types.ts';
import { t, type Lang } from '../../i18n/index.ts';
import { countryName, explanation, indicatorName } from '../../lib/display.ts';
import { downloadCsv } from '../../lib/download.ts';
import { formatYear } from '../../lib/format.ts';
import { formatValue } from '../../lib/formatValue.ts';
import { FlagSwitch } from '../FlagSwitch.tsx';
import { Loading } from '../Loading.tsx';
import { SourceLine } from '../SourceLine.tsx';
import { PeerLineChart, type Series } from './PeerLineChart.tsx';
import { TrendView } from './TrendView.tsx';

export function PeerTrend({ lang, id }: { lang: Lang; id: string }) {
  const meta = indicatorMeta(id);
  if (!meta) throw new Error(`Unknown measure ${id}`);
  const name = indicatorName(id, lang);
  const headingId = `m-${id}`;
  return (
    <section className="sub-measure" aria-labelledby={headingId}>
      <h2 id={headingId} className="sub-measure__name">
        <Link to={path.indicator(lang, id)}>{name}</Link>
      </h2>
      {meta.scope === 'compare' ? (
        <PeerChart lang={lang} meta={meta} />
      ) : (
        <>
          <TrendView lang={lang} meta={meta} trend={indicatorMeta(trendIdFor(meta)) ?? meta} />
          {meta.compare_id && (
            <p className="sub-measure__more">
              {t(lang, 'sub.bangladesh_only')}{' '}
              <Link to={`${path.indicator(lang, id)}#compare`}>{t(lang, 'measure.compare')}</Link>
            </p>
          )}
        </>
      )}
    </section>
  );
}

function PeerChart({ lang, meta }: { lang: Lang; meta: IndicatorMeta }) {
  const [records, setRecords] = useState<DataRecord[] | 'missing' | null>(null);
  const [view, setView] = useState<0 | 1>(0);
  useEffect(() => {
    let alive = true;
    void loadSeries(meta.id).then((r) => alive && setRecords(r && r.length ? r : 'missing'));
    return () => {
      alive = false;
    };
  }, [meta.id]);

  if (records === null) return <Loading lang={lang} />;
  if (records === 'missing') {
    return (
      <p className="measure__na" data-not-available="">
        {t(lang, 'data.not_available')}
      </p>
    );
  }

  const ids = ['BGD', ...COUNTRIES.default_peers];
  const name = (id: string) => countryName(id, lang, COUNTRIES);
  const series: Series[] = ids.map((c) => ({ id: c, name: name(c), points: records.filter((r) => r.country === c) }));
  const bgd = series[0]!.points.sort((a, b) => a.year - b.year);
  const last = bgd[bgd.length - 1];
  const all = records.filter((r) => ids.includes(r.country));
  const years = [...new Set(all.map((r) => r.year))].sort((a, b) => b - a);
  const from = years[years.length - 1]!;
  const to = years[0]!;
  const title = t(lang, 'trend.chart_title', { name: indicatorName(meta.id, lang), from: formatYear(from, lang), to: formatYear(to, lang) });
  const text = explanation(meta, last, lang);
  const withData = series.filter((s) => s.points.length > 0);
  const none = series.filter((s) => s.points.length === 0).map((s) => s.name);
  const measuredBy = new Set(all.map((r) => r.measured_by).filter(Boolean));

  return (
    <div className="sub-measure__body" data-figure="">
      {last ? (
        <p className="sub-measure__value">
          <span className="num display" data-value="">
            {formatValue(last, lang)}
          </span>{' '}
          <span className="muted">{t(lang, 'sub.bangladesh_in', { year: formatYear(last.year, lang) })}</span>
        </p>
      ) : (
        <p className="sub-measure__value" data-not-available="">
          {t(lang, 'data.not_available')}
        </p>
      )}
      {text && (
        <p className="sub-measure__explain secondary">
          {text}{' '}
          <a href={meta.definition_url} target="_blank" rel="noopener noreferrer">
            {t(lang, 'explain.official_definition')}
          </a>
        </p>
      )}

      <section className="chart-frame measure__frame">
        <div className="chart-frame__head">
          <h3>{title}</h3>
          <div className="chart-frame__controls">
            <FlagSwitch
              label={t(lang, 'chart.show_as')}
              options={[
                { label: t(lang, 'chart.chart'), onSelect: () => setView(0) },
                { label: t(lang, 'chart.table'), onSelect: () => setView(1) },
              ]}
              selected={view}
            />
            <button type="button" className="text-button" onClick={() => downloadCsv(`${meta.code}-bangladesh-and-peers.csv`, toCsv(all, name))}>
              {t(lang, 'chart.download_csv')}
            </button>
          </div>
        </div>

        {view === 0 ? (
          <PeerLineChart lang={lang} series={series} unit={meta.unit} label={title} />
        ) : (
          <div className="table-wrap table-wrap--tall">
            <table className="data-table data-table--years">
              <thead>
                <tr>
                  <th scope="col">{t(lang, 'table.year')}</th>
                  {withData.map((s) => (
                    <th key={s.id} scope="col">
                      {s.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {years.map((yr) => (
                  <tr key={yr}>
                    <th scope="row" className="num" data-label={t(lang, 'table.year')}>
                      {formatYear(yr, lang)}
                    </th>
                    {withData.map((s) => {
                      const p = s.points.find((r) => r.year === yr);
                      return (
                        <td key={s.id} className="num" data-label={s.name}>
                          {p ? formatValue(p, lang) : '–'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="measure__caveat muted">{t(lang, 'peerchart.read')}</p>
        {measuredBy.size > 1 && <p className="measure__caveat">{t(lang, 'peerchart.measured_by_differs')}</p>}
        {none.length > 0 && <p className="measure__caveat muted">{t(lang, 'peerchart.no_data', { list: none.join(lang === 'bn' ? ', ' : ', ') })}</p>}
        {last && (
          <SourceLine
            record={{ source_name: last.source_name, source_url: multiCountryUrl(meta.code, withData.map((s) => s.id), COUNTRIES.countries), year: last.year, retrieved_at: last.retrieved_at }}
            lang={lang}
          />
        )}
      </section>
    </div>
  );
}
