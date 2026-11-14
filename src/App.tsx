import { lazy, Suspense, useState, type ComponentType } from 'react';
import { Navigate, Route, Routes, useParams } from 'react-router';
import { Layout } from './components/Layout.tsx';
import { Loading } from './components/Loading.tsx';
import { isLang } from './i18n/index.ts';
import { initialLang } from './lib/langPref.ts';
import { Home } from './pages/Home.tsx';
import { NotFound } from './pages/NotFound.tsx';
import { LoadBoundary } from './components/PageStates.tsx';

/**
 * A page loaded only when visited, so its data stays out of the first page load (R10).
 * `preload()` fetches it ahead: main.tsx does this for the page being opened before React takes
 * over the pre-rendered HTML. Without it, React swapped the page for the loading line while the
 * code arrived, and the footer jumped up the screen and back (M8, Lighthouse layout shift).
 */
function lazyPage<P extends object>(load: () => Promise<ComponentType<P>>) {
  let loaded: ComponentType<P> | null = null;
  const preload = () => load().then((c) => { loaded = c; });
  const Lazy = lazy(() => load().then((c) => { loaded = c; return { default: c }; }));
  const Page = (props: P) => {
    const C = loaded;
    return C ? <C {...props} /> : <Lazy {...props} />;
  };
  return Object.assign(Page, { preload, isLoaded: () => loaded !== null });
}

const AreaPage = lazyPage(() => import('./pages/AreaPage.tsx').then((m) => m.AreaPage));
const SubsectionPage = lazyPage(() => import('./pages/SubsectionPage.tsx').then((m) => m.SubsectionPage));
const IndicatorPage = lazyPage(() => import('./pages/IndicatorPage.tsx').then((m) => m.IndicatorPage));
const ComparePage = lazyPage(() => import('./pages/ComparePage.tsx').then((m) => m.ComparePage));
const SourcesPage = lazyPage(() => import('./pages/SourcesPage.tsx').then((m) => m.SourcesPage));
const AboutPage = lazyPage(() => import('./pages/AboutPage.tsx').then((m) => m.AboutPage));
const HowToReadPage = lazyPage(() => import('./pages/AboutPage.tsx').then((m) => m.HowToReadPage));
const DesignPreview = lazyPage(() => import('./pages/DesignPreview.tsx').then((m) => m.DesignPreview));

/** Loads the code of the page at this address, if it is one of the pages above. */
export function preloadPage(pathname: string): Promise<void> {
  const rest = pathname.replace(/^\/(en|bn)\/?/, '').replace(/\/+$/, '');
  const page =
    /^(economy|education|health)$/.test(rest) ? AreaPage
    : /^economy\/[^/]+$/.test(rest) ? SubsectionPage
    : /^indicator\/[^/]+$/.test(rest) ? IndicatorPage
    : rest === 'compare' ? ComparePage
    : rest === 'sources' ? SourcesPage
    : rest === 'about' ? AboutPage
    : rest === 'how-to-read' ? HowToReadPage
    : rest === 'design-preview' ? DesignPreview
    : null;
  return page ? page.preload() : Promise.resolve();
}

/** "/" → "/bn/" or "/en/" (saved choice, then browser language, then English). */
function RootRedirect() {
  return <Navigate to={`/${initialLang()}/`} replace />;
}

/**
 * A page whose code may still be loading. If it is already loaded (always at build time, and in the
 * browser for the page that was opened, see main.tsx), it is drawn directly, with no Suspense
 * boundary: React writes a boundary's content at build time as a hidden block plus a swap script,
 * which showed only the loading line without JavaScript and made the page jump (DECISIONS 136).
 * Decided once per visit to the page, so the boundary never appears or vanishes mid-visit.
 */
function LazyPage({ page, children }: { page: { isLoaded: () => boolean }; children: React.ReactNode }) {
  const { lang } = useParams();
  const [ready] = useState(page.isLoaded);
  if (!isLang(lang)) return null;
  return (
    <LoadBoundary lang={lang}>
      {ready ? children : <Suspense fallback={<div className="wrap"><Loading lang={lang} /></div>}>{children}</Suspense>}
    </LoadBoundary>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/:lang" element={<Layout />}>
        <Route index element={<Home />} />
        {(['economy', 'education', 'health'] as const).map((slug) => (
          <Route key={slug} path={slug} element={<LazyPage page={AreaPage}><AreaPage slug={slug} /></LazyPage>} />
        ))}
        <Route path="economy/:sub" element={<LazyPage page={SubsectionPage}><SubsectionPage /></LazyPage>} />
        <Route path="indicator/:id" element={<LazyPage page={IndicatorPage}><IndicatorPage /></LazyPage>} />
        <Route path="compare" element={<LazyPage page={ComparePage}><ComparePage /></LazyPage>} />
        <Route path="sources" element={<LazyPage page={SourcesPage}><SourcesPage /></LazyPage>} />
        <Route path="about" element={<LazyPage page={AboutPage}><AboutPage /></LazyPage>} />
        <Route path="how-to-read" element={<LazyPage page={HowToReadPage}><HowToReadPage /></LazyPage>} />
        <Route
          path="design-preview"
          element={
            <LazyPage page={DesignPreview}>
              <DesignPreview />
            </LazyPage>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}
