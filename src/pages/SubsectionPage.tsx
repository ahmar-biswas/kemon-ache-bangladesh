// Economy subsection page: /economy/<sub> (section 10). A longer explanation block, then every
// measure of the subsection with one chart each (Bangladesh and the peers over time), then
// links to the other subsections.
import { Link, useOutletContext, useParams } from 'react-router';
import { Breadcrumbs } from '../components/Breadcrumbs.tsx';
import { PeerTrend } from '../components/measure/PeerTrend.tsx';
import { AreaIcon } from '../components/Motifs.tsx';
import { SUBSECTIONS, path, type SubSlug } from '../data/site.ts';
import { t, type Lang } from '../i18n/index.ts';
import { usePageTitle } from './AreaPage.tsx';
import { NotFound } from './NotFound.tsx';

export function SubsectionPage() {
  const lang = useOutletContext<Lang>();
  const { sub } = useParams();
  const group = sub && sub in SUBSECTIONS ? SUBSECTIONS[sub as SubSlug] : undefined;
  usePageTitle(lang, group ? t(lang, group.label) : '');
  if (!group) return <NotFound />;
  const name = t(lang, group.label);
  const others = Object.values(SUBSECTIONS).filter((g) => g.sub !== group.sub);

  return (
    <div className={`page sub-page sub-page--${group.sub} wrap`}>
      <Breadcrumbs lang={lang} items={[{ label: t(lang, 'area.economy'), to: path.area(lang, 'economy') }, { label: name }]} />
      <header className="page-head">
        <h1>
          {group.icon ? <AreaIcon area={group.icon} /> : <span className="story__disc" aria-hidden="true" />}
          {name}
        </h1>
        <p className="page-head__lede">{t(lang, `sub.${group.sub}.lede` as never)}</p>
        <p className="page-head__intro secondary">{t(lang, `sub.${group.sub}.intro` as never)}</p>
      </header>
      <hr className="stitch stitch--red" />

      {group.measures.length > 0 ? (
        group.measures.map((id) => <PeerTrend key={id} lang={lang} id={id} />)
      ) : (
        <p className="area-group__pending">{t(lang, 'sub.pending')}</p>
      )}

      <nav className="sub-page__others" aria-label={t(lang, 'sub.others')}>
        <h2>{t(lang, 'sub.others')}</h2>
        <ul>
          {others.map((g) => (
            <li key={g.sub}>
              <Link to={path.sub(lang, g.sub)}>{t(lang, g.label)}</Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
