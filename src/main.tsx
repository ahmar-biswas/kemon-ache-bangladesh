import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { App } from './App.tsx';
import './styles/tokens.css';
import './styles/base.css';
import './styles/background.css';
import './styles/glass.css';
import './styles/components.css';
import './styles/dashboard.css';
import './styles/measure.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
