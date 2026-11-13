// 404 (8.13): what happened, what to do next, alpona corner ornaments, a link home.
import { Link, useOutletContext } from 'react-router';
import { t, type Lang } from '../i18n/index.ts';
import { Alpona } from '../components/Motifs.tsx';
import { usePageTitle } from '../lib/usePageTitle.ts';

export function NotFound() {
  const lang = useOutletContext<Lang>();
  usePageTitle(lang, t(lang, 'notfound.title'));
  return (
    <div className="wrap">
      <section className="not-found">
        <Alpona className="not-found__alpona is-tl" />
        <Alpona className="not-found__alpona is-br" />
        <h1>{t(lang, 'notfound.title')}</h1>
        <p className="secondary">{t(lang, 'notfound.body')}</p>
        <p>
          <Link to={`/${lang}/`}>{t(lang, 'notfound.home')}</Link>
        </p>
      </section>
    </div>
  );
}
