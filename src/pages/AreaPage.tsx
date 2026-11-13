// Area page: /economy, /education, /health (section 10; DECISIONS.md 101–103).
//   breadcrumbs; the area's name and one plain line; the snapshot sentences;
//   the measures as tiles, grouped. On /economy each group is a subsection with its own page,
//   and Poverty and inequality comes first, as a large card (section 10, 8.8).
import { useEffect } from 'react';
import { Link, useOutletContext, useParams } from 'react-router';
import { Breadcrumbs } from '../components/Breadcrumbs.tsx';
import { MeasureTile } from '../components/MeasureTile.tsx';
import { AreaIcon } from '../components/Motifs.tsx';
import { Snapshot } from '../components/Snapshot.tsx';
import { areaPage, path, type Group } from '../data/site.ts';
import { t, type Lang } from '../i18n/index.ts';
import { NotFound } from './NotFound.tsx';

export function usePageTitle(lang: Lang, title: string) {
  useEffect(() => {
    document.title = `${title} · ${t(lang, 'site.title')}`;
  }, [lang, title]);
}

function GroupBlock({ lang, group, feature }: { lang: Lang; group: Group; feature: boolean }) {
  const headingId = `group-${group.sub ?? group.label}`;
  return (
    <section className={`area-group${feature ? ' area-group--feature' : ''}`} aria-labelledby={headingId}>
      <header className="area-group__head">
        <h2 id={headingId}>
          {group.icon && <AreaIcon area={group.icon} />}
          {t(lang, group.label)}
        </h2>
        {group.sub && (
          <Link className="area-group__open" to={path.sub(lang, group.sub)}>
            {t(lang, 'sub.open', { name: t(lang, group.label) })}
          </Link>
        )}
      </header>
      {!feature && <hr className="stitch" />}
      {group.sub && <p className="area-group__lede secondary">{t(lang, `sub.${group.sub}.lede` as never)}</p>}
      {group.measures.length > 0 ? (
        <div className="area-grid">
          {group.measures.map((id, i) => (
            <div key={id} className={`area-grid__cell${i === 0 ? ' is-wide' : ''}`}>
              <MeasureTile lang={lang} id={id} wide={i === 0} href={path.indicator(lang, id)} />
            </div>
          ))}
        </div>
      ) : (
        <p className="area-group__pending">{t(lang, 'sub.pending')}</p>
      )}
    </section>
  );
}

export function AreaPage({ slug }: { slug?: string }) {
  const lang = useOutletContext<Lang>();
  const params = useParams();
  const area = areaPage(slug ?? params.area);
  usePageTitle(lang, area ? t(lang, area.label) : '');
  if (!area) return <NotFound />;
  const name = t(lang, area.label);

  return (
    <div className={`page area-page area-page--${area.slug} wrap`}>
      <Breadcrumbs lang={lang} items={[{ label: name }]} />
      <header className="page-head">
        <h1>
          <span className="story__disc" aria-hidden="true" />
          {name}
        </h1>
        <p className="page-head__lede">{t(lang, `page.${area.slug}.lede` as never)}</p>
      </header>
      <Snapshot lang={lang} ids={area.snapshot} />
      {area.groups.map((g, i) => (
        <GroupBlock key={g.sub ?? g.label} lang={lang} group={g} feature={area.slug === 'economy' && i === 0} />
      ))}
    </div>
  );
}
