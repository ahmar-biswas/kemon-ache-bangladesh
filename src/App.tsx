import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useParams } from 'react-router';
import { Layout } from './components/Layout.tsx';
import { Loading } from './components/Loading.tsx';
import { isLang } from './i18n/index.ts';
import { initialLang } from './lib/langPref.ts';
import { Home } from './pages/Home.tsx';
import { NotFound } from './pages/NotFound.tsx';
import { LoadBoundary } from './components/PageStates.tsx';

// Loaded only when visited, so its data stays out of the first page load (R10).
const AreaPage = lazy(() => import('./pages/AreaPage.tsx').then((m) => ({ default: m.AreaPage })));
const SubsectionPage = lazy(() => import('./pages/SubsectionPage.tsx').then((m) => ({ default: m.SubsectionPage })));
const IndicatorPage = lazy(() => import('./pages/IndicatorPage.tsx').then((m) => ({ default: m.IndicatorPage })));
const ComparePage = lazy(() => import('./pages/ComparePage.tsx').then((m) => ({ default: m.ComparePage })));
const SourcesPage = lazy(() => import('./pages/SourcesPage.tsx').then((m) => ({ default: m.SourcesPage })));
const AboutPage = lazy(() => import('./pages/AboutPage.tsx').then((m) => ({ default: m.AboutPage })));
const HowToReadPage = lazy(() => import('./pages/AboutPage.tsx').then((m) => ({ default: m.HowToReadPage })));
const DesignPreview = lazy(() => import('./pages/DesignPreview.tsx').then((m) => ({ default: m.DesignPreview })));

/** "/" → "/bn/" or "/en/" (saved choice, then browser language, then English). */
function RootRedirect() {
  return <Navigate to={`/${initialLang()}/`} replace />;
}

function LazyPage({ children }: { children: React.ReactNode }) {
  const { lang } = useParams();
  if (!isLang(lang)) return null;
  return (
    <LoadBoundary lang={lang}>
      <Suspense fallback={<div className="wrap"><Loading lang={lang} /></div>}>{children}</Suspense>
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
          <Route key={slug} path={slug} element={<LazyPage><AreaPage slug={slug} /></LazyPage>} />
        ))}
        <Route path="economy/:sub" element={<LazyPage><SubsectionPage /></LazyPage>} />
        <Route path="indicator/:id" element={<LazyPage><IndicatorPage /></LazyPage>} />
        <Route path="compare" element={<LazyPage><ComparePage /></LazyPage>} />
        <Route path="sources" element={<LazyPage><SourcesPage /></LazyPage>} />
        <Route path="about" element={<LazyPage><AboutPage /></LazyPage>} />
        <Route path="how-to-read" element={<LazyPage><HowToReadPage /></LazyPage>} />
        <Route
          path="design-preview"
          element={
            <LazyPage>
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
