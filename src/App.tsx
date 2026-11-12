import { Navigate, Route, Routes } from 'react-router';
import { Layout } from './components/Layout.tsx';
import { initialLang } from './lib/langPref.ts';
import { Home } from './pages/Home.tsx';

/** "/" → "/bn/" or "/en/" (saved choice, then browser language, then English). */
function RootRedirect() {
  return <Navigate to={`/${initialLang()}/`} replace />;
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/:lang" element={<Layout />}>
        <Route index element={<Home />} />
      </Route>
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}
