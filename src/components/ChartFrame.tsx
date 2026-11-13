// The frame every chart sits in (8.8, 8.9): paper panel, title, a "Chart | Table" flag switch,
// a CSV download, and the source line for all countries shown. The chart itself is passed in;
// real line and dot charts come in Milestone 5.
import { useState, type ReactNode } from 'react';
import type { CountriesFile, DataRecord } from '../data/types.ts';
import { t, type Lang } from '../i18n/index.ts';
import { countryName } from '../lib/display.ts';
import { formatYear } from '../lib/format.ts';
import { formatValue } from '../lib/formatValue.ts';
import { FlagSwitch } from './FlagSwitch.tsx';
import { SourceLine } from './SourceLine.tsx';

interface Props {
  lang: Lang;
  title: string;
  /** One row per country (the values the chart shows). Bangladesh first. */
  rows: DataRecord[];
  countries: CountriesFile;
  /** World Bank code, for the multi-country source link and the file name. */
  code: string;
  children: ReactNode;
}

/** World Bank page for this indicator showing every country in the chart (section 5.2). */
function multiCountryUrl(code: string, rows: DataRecord[], countries: CountriesFile) {
  const iso2 = rows.map((r) => countries.countries.find((c) => c.id === r.country)?.iso2).filter(Boolean);
  return `https://data.worldbank.org/indicator/${code}?locations=${iso2.join('-')}`;
}

function csv(rows: DataRecord[]): string {
  const esc = (s: string | number | null) => `"${String(s ?? '').replace(/"/g, '""')}"`;
  const head = ['country', 'year', 'value', 'unit', 'source_name', 'source_url', 'retrieved_at', 'notes'];
  const body = rows.map((r) => [r.country, r.year, r.value, r.unit, r.source_name, r.source_url, r.retrieved_at, r.notes.join(' | ')].map(esc).join(','));
  return [head.join(','), ...body].join('\n');
}

export function ChartFrame({ lang, title, rows, countries, code, children }: Props) {
  const [view, setView] = useState<0 | 1>(0);
  const bgd = rows.find((r) => r.country === 'BGD');

  const download = () => {
    const blob = new Blob([csv(rows)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${code}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="chart-frame" data-figure="">
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
          <button type="button" className="text-button" onClick={download}>
            {t(lang, 'chart.download_csv')}
          </button>
        </div>
      </div>

      {view === 0 ? (
        <div className="chart-frame__chart">{children}</div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">{t(lang, 'table.country')}</th>
                <th scope="col">{t(lang, 'table.value')}</th>
                <th scope="col">{t(lang, 'table.year')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.country} className={r.country === 'BGD' ? 'is-bgd' : undefined}>
                  <th scope="row" data-label={t(lang, 'table.country')}>{countryName(r.country, lang, countries)}</th>
                  <td data-label={t(lang, 'table.value')} className="num">{formatValue(r, lang)}</td>
                  <td data-label={t(lang, 'table.year')} className="num">{formatYear(r.year, lang)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {bgd && <SourceLine record={{ ...bgd, source_url: multiCountryUrl(code, rows, countries) }} lang={lang} />}
    </section>
  );
}
