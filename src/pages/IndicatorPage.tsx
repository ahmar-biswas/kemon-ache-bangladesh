// Indicator page: /indicator/<id> (section 10, 12; DECISIONS.md 104). Reached from any tile,
// chart name or table row. The measure's tile, then the M5 views laid out as one page:
// "Compare with other countries", "Bangladesh over time", and "Where does this come from?".
import { Link, useOutletContext, useParams } from 'react-router';
import { Breadcrumbs, type Crumb } from '../components/Breadcrumbs.tsx';
import { CompareView } from '../components/measure/CompareView.tsx';
import { TrendView } from '../components/measure/TrendView.tsx';
import { MeasureTile } from '../components/MeasureTile.tsx';
import { RECORDS, compareIdFor, indicatorMeta, trendIdFor } from '../data/details.ts';
import { LATEST } from '../data/latest.ts';
import { PAGE_MEASURES, path, placeOf } from '../data/site.ts';
import { t, type Lang } from '../i18n/index.ts';
import { indicatorName } from '../lib/display.ts';
import { formatDate } from '../lib/format.ts';
import { SOURCE_KEYS } from '../data/sources.ts';
import { usePageTitle } from './AreaPage.tsx';
import { NotFound } from './NotFound.tsx';

export function IndicatorPage() {
  const lang = useOutletContext<Lang>();
  const { id } = useParams();
  const meta = id && PAGE_MEASURES.includes(id) ? indicatorMeta(id) : undefined;
  usePageTitle(lang, meta ? indicatorName(meta.id, lang) : '');
  if (!meta) return <NotFound />;

  const name = indicatorName(meta.id, lang);
  const place = placeOf(meta.id)!;
  const crumbs: Crumb[] = [{ label: t(lang, place.area.label), to: path.area(lang, place.area.slug) }];
  if (place.group.sub) crumbs.push({ label: t(lang, place.group.label), to: path.sub(lang, place.group.sub) });
  crumbs.push({ label: name });
  const cmpId = compareIdFor(meta);
  const cmp = cmpId ? indicatorMeta(cmpId) : undefined;
  const bgd = RECORDS[meta.id]?.find((r) => r.country === 'BGD');

  return (
    <div className="page indicator-page wrap">
      <Breadcrumbs lang={lang} items={crumbs} />
      <header className="page-head">
        <h1>
          <span className="story__disc" aria-hidden="true" />
          {name}
        </h1>
        <ul className="indicator-page__jump">
          {cmp && (
            <li>
              <a href="#compare">{t(lang, 'measure.compare')}</a>
            </li>
          )}
          <li>
            <a href="#trend">{t(lang, 'measure.trend')}</a>
          </li>
          <li>
            <a href="#where">{t(lang, 'indicator.where')}</a>
          </li>
        </ul>
      </header>

      <div className="indicator-page__tile">
        <MeasureTile lang={lang} id={meta.id} wide />
      </div>

      {cmp && (
        <section id="compare" className="indicator-page__section" aria-labelledby="h-compare">
          <h2 id="h-compare">{t(lang, 'measure.compare')}</h2>
          <hr className="stitch" />
          <CompareView lang={lang} meta={meta} compare={cmp} target={LATEST.indicators[meta.id]?.target ?? null} />
        </section>
      )}

      <section id="trend" className="indicator-page__section" aria-labelledby="h-trend">
        <h2 id="h-trend">{t(lang, 'measure.trend')}</h2>
        <hr className="stitch" />
        <TrendView lang={lang} meta={meta} trend={indicatorMeta(trendIdFor(meta)) ?? meta} />
      </section>

      <section id="where" className="indicator-page__section indicator-page__where" aria-labelledby="h-where">
        <h2 id="h-where">{t(lang, 'indicator.where')}</h2>
        <hr className="stitch" />
        <dl>
          <dt>{t(lang, 'source.label')}</dt>
          <dd>
            {bgd ? (
              <a href={bgd.source_url} target="_blank" rel="noopener noreferrer">
                {t(lang, SOURCE_KEYS[bgd.source_name]!)}
              </a>
            ) : (
              t(lang, "data.not_available")
            )}{' '}
            <span className="muted" data-code="">({meta.code})</span>
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
        </dl>
        <p className="secondary">
          <Link to={path.compare(lang, meta.id)}>{t(lang, 'indicator.open_compare')}</Link>
        </p>
        <p className="secondary">
          <Link to={path.sources(lang, meta.id)}>{t(lang, 'indicator.all_values')}</Link>
        </p>
      </section>
    </div>
  );
}
