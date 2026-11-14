// /sources (section 10; DECISIONS.md 114): a complete index of every value the site shows.
// One folding section per measure. Its source, definition and download links are in the page
// from the start (also without JavaScript); the tables load only when a section is opened,
// so the page stays light (R10).
import { useEffect, useRef, useState } from 'react';
import { Link, useOutletContext } from 'react-router';
import { Breadcrumbs } from '../components/Breadcrumbs.tsx';
import { Loading } from '../components/Loading.tsx';
import { COUNTRIES, INDICATORS, RECORDS } from '../data/details.ts';
import { matchNote } from '../data/notes.ts';
import { AREA_PAGES, PAGE_MEASURES, path } from '../data/site.ts';
import { SOURCE_KEYS } from '../data/sources.ts';
import { loadMeasureSources, sourcesCsv, type MeasureSources, type SourceRow } from '../data/sourcesIndex.ts';
import type { IndicatorMeta } from '../data/types.ts';
import { t, type Lang, type MessageKey } from '../i18n/index.ts';
import { countryName, indicatorName } from '../lib/display.ts';
import { downloadCsv } from '../lib/download.ts';
import { formatDate, formatNumber, formatYear } from '../lib/format.ts';
import { formatValue } from '../lib/formatValue.ts';
import { noteText } from '../lib/noteText.ts';
import { aboveFormula, abovePct } from '../lib/rankShare.ts';
import { usePageTitle } from './AreaPage.tsx';

/** Sections in reading order: each area's measures as on the area pages, then everything else in the data. */
function sections(): { label: MessageKey; ids: string[] }[] {
  const listed = new Set<string>();
  const out = AREA_PAGES.map((a) => {
    const ids = a.groups.flatMap((g) => g.measures).filter((id) => !listed.has(id) && listed.add(id));
    return { label: a.label, ids };
  });
  // Supporting series (PPP dollars, constant taka, whole-economy GDP) and the published rankings.
  out.push({ label: 'sources.other', ids: INDICATORS.map((m) => m.id).filter((id) => !listed.has(id)) });
  return out;
}

function Note({ note, lang }: { note: string; lang: Lang }) {
  // A note with no translated pattern is shown as published, marked as English (R8; never half-translated).
  if (lang === 'bn' && !matchNote(note)) return <span lang="en">{note}</span>;
  return <>{noteText(note, lang)}</>;
}

function Rows({ rows, meta, lang, withCountry }: { rows: SourceRow[]; meta: IndicatorMeta; lang: Lang; withCountry: boolean }) {
  return (
    <div className="table-scroll">
      <table className="data-table sources-table">
        <thead>
          <tr>
            {withCountry && <th scope="col">{t(lang, 'table.country')}</th>}
            <th scope="col">{t(lang, 'table.year')}</th>
            <th scope="col">{t(lang, 'table.value')}</th>
            <th scope="col">{t(lang, 'table.notes')}</th>
            <th scope="col">{t(lang, 'source.label')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={`${r.country}-${r.year}`}>
              {withCountry && <th scope="row" data-label={t(lang, 'table.country')}>{countryName(r.country, lang, COUNTRIES)}</th>}
              <td data-label={t(lang, 'table.year')}>{formatYear(r.year, lang)}</td>
              <td data-label={t(lang, 'table.value')} className="num">{formatValue({ value: r.value, unit: meta.unit }, lang)}</td>
              <td data-label={t(lang, 'table.notes')} className="sources-table__notes">
                {r.measured_by && <span className="sources-table__basis">{t(lang, r.measured_by === 'income' ? 'caveat.income' : 'caveat.consumption')}</span>}
                {r.notes.map((n) => (
                  <span key={n} className="sources-table__note">
                    <Note note={n} lang={lang} />
                  </span>
                ))}
              </td>
              <td data-label={t(lang, 'source.label')}>
                <a href={r.source_url} target="_blank" rel="noopener noreferrer">
                  {t(lang, 'sources.open')}
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Tables({ meta, lang }: { meta: IndicatorMeta; lang: Lang }) {
  const [data, setData] = useState<MeasureSources | 'failed' | null>(null);
  const [tries, setTries] = useState(0);
  useEffect(() => {
    let alive = true;
    loadMeasureSources(meta, COUNTRIES.default_peers).then(
      (d) => alive && setData(d),
      () => alive && setData('failed'),
    );
    return () => {
      alive = false;
    };
  }, [meta, tries]);

  if (data === null) return <Loading lang={lang} />;
  if (data === 'failed') {
    return (
      <p className="state-note" role="alert">
        {t(lang, 'state.load_failed')}{' '}
        <button type="button" className="text-button" onClick={() => (setData(null), setTries((n) => n + 1))}>
          {t(lang, 'state.try_again')}
        </button>
      </p>
    );
  }
  const name = (id: string) => countryName(id, lang, COUNTRIES);
  const n = (v: number) => formatNumber(v, lang, 0);
  return (
    <div className="sources-measure__tables">
      <h4>{t(lang, 'sources.bangladesh_years')}</h4>
      {data.bangladesh.length > 0 ? (
        <Rows rows={data.bangladesh} meta={meta} lang={lang} withCountry={false} />
      ) : (
        <p data-not-available="">{t(lang, 'data.not_available')}</p>
      )}

      {data.peers.length > 0 && (
        <>
          <h4>{t(lang, 'sources.peer_years')}</h4>
          <Rows rows={data.peers} meta={meta} lang={lang} withCountry />
        </>
      )}

      {data.world && (
        <>
          <h4>{t(lang, 'sources.world_latest', { year: formatYear(data.world.since, lang) })}</h4>
          <p className="secondary">
            {t(lang, 'sources.world_count', { n: n(data.world.rows.length) })}{' '}
            <a href={data.world.api_url} target="_blank" rel="noopener noreferrer">
              {t(lang, 'indicator.api_link')}
            </a>
          </p>
          <Rows rows={data.world.rows} meta={meta} lang={lang} withCountry />
        </>
      )}

      {(data.medians.length > 0 || data.rank) && (
        <>
          <h4>{t(lang, 'derived.calculated_by_site')}</h4>
          {data.rank && (
            <p>
              {t(lang, 'rank.calculated', { pct: abovePct(data.rank.rank, data.rank.out_of, lang), rank: n(data.rank.rank), n: n(data.rank.out_of), year: formatYear(data.rank.year, lang) })}{' '}
              <span className="secondary">{aboveFormula(data.rank.rank, data.rank.out_of, lang)}</span>{' '}
              <span className="secondary">{t(lang, 'rank.formula', { year: formatYear(data.rank.year, lang) })}</span>{' '}
              <a href={data.rank.source_url} target="_blank" rel="noopener noreferrer">
                {t(lang, 'sources.inputs')}
              </a>
            </p>
          )}
          {data.medians.length > 0 && (
            <div className="table-scroll">
              <table className="data-table sources-table">
                <caption>{t(lang, 'median.label')}</caption>
                <thead>
                  <tr>
                    <th scope="col">{t(lang, 'table.year')}</th>
                    <th scope="col">{t(lang, 'table.value')}</th>
                    <th scope="col">{t(lang, 'sources.formula')}</th>
                    <th scope="col">{t(lang, 'sources.inputs')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.medians.map((m) => (
                    <tr key={m.year}>
                      <td data-label={t(lang, 'table.year')}>{formatYear(m.year, lang)}</td>
                      <td data-label={t(lang, 'table.value')} className="num">{formatValue(m, lang)}</td>
                      <td data-label={t(lang, 'sources.formula')}>{t(lang, 'sources.median_of', { n: n(m.inputs.length) })}</td>
                      <td data-label={t(lang, 'sources.inputs')}>
                        <a href={m.inputs_source_url} target="_blank" rel="noopener noreferrer">
                          {t(lang, 'sources.open')}
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <p>
        <button type="button" className="text-button" onClick={() => downloadCsv(`${meta.code}-all-values.csv`, sourcesCsv(meta, data, name))}>
          {t(lang, 'sources.csv')}
        </button>
      </p>
    </div>
  );
}

function MeasureSection({ meta, lang }: { meta: IndicatorMeta; lang: Lang }) {
  const [open, setOpen] = useState(false);
  const bgd = RECORDS[meta.id]?.find((r) => r.country === 'BGD');
  const anchor = `m-${meta.id}`;
  const ref = useRef<HTMLDetailsElement>(null);
  // Open the section a link points to (e.g. from an indicator page: /sources#m-inflation), or one
  // the reader opened before JavaScript had taken over the pre-rendered page.
  useEffect(() => {
    if (location.hash === `#${anchor}` || ref.current?.open) setOpen(true);
  }, [anchor]);
  return (
    <details ref={ref} id={anchor} className="sources-measure" open={open} onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}>
      <summary>
        <span className="sources-measure__name">{indicatorName(meta.id, lang)}</span>{' '}
        <span className="muted" data-code="">
          {meta.code}
        </span>
      </summary>
      <dl className="sources-measure__about">
        <dt>{t(lang, 'source.label')}</dt>
        <dd>
          {bgd ? (
            <a href={bgd.source_url} target="_blank" rel="noopener noreferrer">
              {t(lang, SOURCE_KEYS[bgd.source_name]!)}
            </a>
          ) : (
            t(lang, 'data.not_available')
          )}
        </dd>
        {bgd?.original_source && (
          <>
            <dt>{t(lang, 'indicator.original')}</dt>
            <dd lang="en">{bgd.original_source.split(/[;,]\s*uri:/)[0]}</dd>
          </>
        )}
        <dt>{t(lang, 'indicator.definition')}</dt>
        <dd>
          <a href={meta.definition_url} target="_blank" rel="noopener noreferrer">
            {t(lang, 'explain.official_definition')}
          </a>
        </dd>
        {bgd && (
          <>
            <dt>{t(lang, 'indicator.api')}</dt>
            <dd>
              <a href={bgd.api_url} target="_blank" rel="noopener noreferrer">
                {t(lang, 'indicator.api_link')}
              </a>
            </dd>
            <dt>{t(lang, 'indicator.retrieved')}</dt>
            <dd>{formatDate(bgd.retrieved_at, lang)}</dd>
          </>
        )}
        {PAGE_MEASURES.includes(meta.id) && (
          <>
            <dt>{t(lang, 'sources.on_site')}</dt>
            <dd>
              <Link to={path.indicator(lang, meta.id)}>{indicatorName(meta.id, lang)}</Link>
            </dd>
          </>
        )}
      </dl>
      {open && <Tables meta={meta} lang={lang} />}
    </details>
  );
}

export function SourcesPage() {
  const lang = useOutletContext<Lang>();
  usePageTitle(lang, t(lang, 'nav.sources'));
  const byId = new Map(INDICATORS.map((m) => [m.id, m]));
  return (
    <div className="page sources-page wrap">
      <Breadcrumbs lang={lang} items={[{ label: t(lang, 'nav.sources') }]} />
      <header className="page-head">
        <h1>
          <span className="story__disc" aria-hidden="true" />
          {t(lang, 'nav.sources')}
        </h1>
        <p className="page-head__lede">{t(lang, 'sources.lede')}</p>
        <p className="page-head__intro secondary">
          {t(lang, 'sources.intro')} <Link to={path.howToRead(lang)}>{t(lang, 'nav.how_to_read')}</Link>
        </p>
      </header>
      <hr className="stitch stitch--red" />
      {sections().map((s) => (
        <section key={s.label} className="sources-group" aria-labelledby={`src-${s.label}`}>
          <h2 id={`src-${s.label}`}>{t(lang, s.label)}</h2>
          {s.ids.map((id) => {
            const meta = byId.get(id);
            return meta ? <MeasureSection key={id} meta={meta} lang={lang} /> : null;
          })}
        </section>
      ))}
    </div>
  );
}
