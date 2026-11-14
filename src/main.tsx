import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { App, preloadPage } from './App.tsx';
import './styles/tokens.css';
import './styles/base.css';
import './styles/background.css';
import './styles/glass.css';
import './styles/components.css';
import './styles/dashboard.css';
import './styles/measure.css';
import './styles/pages.css';

import { BASE, stripBase } from './lib/base.ts';

const root = document.getElementById('root')!;
const app = (
  <StrictMode>
    <BrowserRouter basename={BASE || undefined}>
      <App />
    </BrowserRouter>
  </StrictMode>
);
// Pages are pre-rendered at build time (scripts/prerender.ts). When the HTML is for exactly
// this address, React takes it over in place; otherwise (404 page, a ?m= choice) it draws anew.
const trim = (p: string) => p.replace(/\/+$/, '');
const pre = root.dataset.prerendered;
// The page's own code is fetched first, so React never swaps the pre-rendered page for the
// loading line while it arrives (DECISIONS 136). If the fetch fails, React draws as before.
const here = stripBase(location.pathname);
if (pre && trim(pre) === trim(here) && !location.search) {
  preloadPage(here)
    .catch(() => {})
    .then(() => hydrateRoot(root, app));
} else createRoot(root).render(app);
