import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useParams } from 'react-router';
import { Layout } from './components/Layout.tsx';
import { Loading } from './components/Loading.tsx';
import { isLang } from './i18n/index.ts';
import { initialLang } from './lib/langPref.ts';
import { Home } from './pages/Home.tsx';
import { NotFound } from './pages/NotFound.tsx';

// Loaded only when visited, so its data stays out of the first page load (R10).
const DesignPreview = lazy(() => import('./pages/DesignPreview.tsx').then((m) => ({ default: m.DesignPreview })));

/** "/" → "/bn/" or "/en/" (saved choice, then browser language, then English). */
function RootRedirect() {
  return <Navigate to={`/${initialLang()}/`} replace />;
}

function LazyPage({ children }: { children: React.ReactNode }) {
  const { lang } = useParams();
  return <Suspense fallback={<div className="wrap">{isLang(lang) && <Loading lang={lang} />}</div>}>{children}</Suspense>;
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/:lang" element={<Layout />}>
        <Route index element={<Home />} />
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
