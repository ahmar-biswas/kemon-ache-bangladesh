import { useEffect } from 'react';
import { Navigate, Outlet, useParams } from 'react-router';
import metaJson from '../../data/processed/meta.json';
import type { DataMeta } from '../data/types.ts';
import { isLang, t } from '../i18n/index.ts';
import { Link } from 'react-router';
import { path } from '../data/site.ts';
import { Backdrop } from './Backdrop.tsx';
import { LastChecked, OfflineNotice } from './PageStates.tsx';
import { PageCurtain } from './PageCurtain.tsx';
import { LanguageToggle } from './LanguageToggle.tsx';
import { MobileMenu, SiteNav } from './SiteNav.tsx';
import { Jamdani } from './Motifs.tsx';
import { Wordmark } from './Wordmark.tsx';

const META = metaJson as DataMeta;

/** Wraps every page under /en/... and /bn/...: background, sticky header, footer. */
export function Layout() {
  const { lang } = useParams();

  useEffect(() => {
    if (!isLang(lang)) return;
    document.documentElement.lang = lang;
  }, [lang]);

  if (!isLang(lang)) return <Navigate to="/" replace />;

  return (
    <div className="site" lang={lang}>
      <Backdrop />
      <a className="skip-link" href="#content">
        {t(lang, 'nav.skip')}
      </a>
      <header className="site-header glass">
        <div className="wrap site-header__row">
          <Wordmark lang={lang} />
          <SiteNav lang={lang} />
          <LanguageToggle lang={lang} />
          <MobileMenu lang={lang} />
        </div>
        <Jamdani />
      </header>
      <OfflineNotice lang={lang} />
      <p className="no-js-note state-banner">{t(lang, 'state.no_js')}</p>
      <main id="content" tabIndex={-1}>
        <Outlet context={lang} />
      </main>
      <footer className="site-footer">
        <Jamdani />
        <div className="wrap site-footer__body">
          <p>{t(lang, 'site.tagline')}</p>
          <p className="secondary">{t(lang, 'footer.data_from')}</p>
          <LastChecked lang={lang} meta={META} />
          <ul className="site-footer__links">
            <li>
              <Link to={path.sources(lang)}>{t(lang, 'nav.sources')}</Link>
            </li>
            <li>
              <Link to={path.about(lang)}>{t(lang, 'nav.about')}</Link>
            </li>
            <li>
              <Link to={path.howToRead(lang)}>{t(lang, 'nav.how_to_read')}</Link>
            </li>
          </ul>
        </div>
      </footer>
      <PageCurtain />
    </div>
  );
}
