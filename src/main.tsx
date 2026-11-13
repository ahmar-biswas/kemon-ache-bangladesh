import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { App } from './App.tsx';
import './styles/tokens.css';
import './styles/base.css';
import './styles/background.css';
import './styles/glass.css';
import './styles/components.css';
import './styles/dashboard.css';
import './styles/measure.css';
import './styles/pages.css';

const root = document.getElementById('root')!;
const app = (
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
// Pages are pre-rendered at build time (scripts/prerender.ts). When the HTML is for exactly
// this address, React takes it over in place; otherwise (404 page, a ?m= choice) it draws anew.
const trim = (p: string) => p.replace(/\/+$/, '');
const pre = root.dataset.prerendered;
if (pre && trim(pre) === trim(location.pathname) && !location.search) hydrateRoot(root, app);
else createRoot(root).render(app);
