import { useEffect } from 'react';
import { Navigate, Outlet, useParams } from 'react-router';
import metaJson from '../../data/processed/meta.json';
import type { DataMeta } from '../data/types.ts';
import { isLang, t } from '../i18n/index.ts';
import { formatDate } from '../lib/format.ts';
import { Backdrop } from './Backdrop.tsx';
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
    document.title = t(lang, 'site.title');
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
      <main id="content" tabIndex={-1}>
        <Outlet context={lang} />
      </main>
      <footer className="site-footer">
        <Jamdani />
        <div className="wrap site-footer__body">
          <p>{t(lang, 'site.tagline')}</p>
          <p className="secondary">{t(lang, 'footer.data_from')}</p>
          <p className="muted last-checked">{t(lang, 'home.last_checked', { date: formatDate(META.last_checked, lang) })}</p>
        </div>
      </footer>
    </div>
  );
}
