// Compare page: /compare (section 10; DECISIONS.md 104). Pick any measure, then any countries
// (the M5 compare view and its picker). The chosen measure is kept in the address (?m=id), so
// it survives a language switch and can be shared.
import { useOutletContext, useSearchParams } from 'react-router';
import { Breadcrumbs } from '../components/Breadcrumbs.tsx';
import { CompareView } from '../components/measure/CompareView.tsx';
import { compareIdFor, indicatorMeta } from '../data/details.ts';
import { LATEST } from '../data/latest.ts';
import { AREA_PAGES } from '../data/site.ts';
import { t, type Lang } from '../i18n/index.ts';
import { indicatorName } from '../lib/display.ts';
import { usePageTitle } from './AreaPage.tsx';

/** Measures that can be compared across countries, grouped by area. */
const OPTIONS = AREA_PAGES.map((a) => ({
  area: a,
  ids: [...new Set(a.groups.flatMap((g) => g.measures))].filter((id) => {
    const meta = indicatorMeta(id);
    return meta && compareIdFor(meta);
  }),
}));
const ALL = OPTIONS.flatMap((o) => o.ids);

export function ComparePage() {
  const lang = useOutletContext<Lang>();
  const [params, setParams] = useSearchParams();
  const asked = params.get('m');
  const id = asked && ALL.includes(asked) ? asked : ALL[0]!;
  const meta = indicatorMeta(id)!;
  const cmp = indicatorMeta(compareIdFor(meta)!)!;
  const title = t(lang, 'nav.compare');
  usePageTitle(lang, title);

  return (
    <div className="page compare-page wrap">
      <Breadcrumbs lang={lang} items={[{ label: title }]} />
      <header className="page-head">
        <h1>
          <span className="story__disc" aria-hidden="true" />
          {t(lang, 'comparepage.title')}
        </h1>
        <p className="page-head__lede">{t(lang, 'comparepage.lede')}</p>
      </header>
      <div className="compare-page__pick glass">
        <label htmlFor="compare-measure">{t(lang, 'comparepage.measure')}</label>
        <select
          id="compare-measure"
          value={id}
          onChange={(e) => {
            const next = new URLSearchParams(params);
            next.set('m', e.target.value);
            setParams(next, { replace: true });
          }}
        >
          {OPTIONS.map((o) => (
            <optgroup key={o.area.slug} label={t(lang, o.area.label)}>
              {o.ids.map((m) => (
                <option key={m} value={m}>
                  {indicatorName(m, lang)}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
      <section className="indicator-page__section" aria-label={indicatorName(id, lang)}>
        <CompareView key={id} lang={lang} meta={meta} compare={cmp} target={LATEST.indicators[id]?.target ?? null} />
      </section>
    </div>
  );
}
