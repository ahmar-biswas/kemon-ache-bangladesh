import { useEffect } from 'react';
import { Navigate, Outlet, useParams } from 'react-router';
import { isLang, t } from '../i18n/index.ts';
import { LanguageToggle } from './LanguageToggle.tsx';

/** Wraps every page under /en/... and /bn/...; sets the page language and shows the header. */
export function Layout() {
  const { lang } = useParams();

  useEffect(() => {
    if (!isLang(lang)) return;
    document.documentElement.lang = lang;
    document.title = t(lang, 'site.title');
  }, [lang]);

  if (!isLang(lang)) return <Navigate to="/" replace />;

  return (
    <>
      <header className="site-header">
        <p className="site-title">{t(lang, 'site.title')}</p>
        <LanguageToggle lang={lang} />
      </header>
      <main lang={lang}>
        <Outlet context={lang} />
      </main>
    </>
  );
}
