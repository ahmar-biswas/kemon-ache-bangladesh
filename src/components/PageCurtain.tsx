// Page change curtain (Ahmar, 2026-11-14; DECISIONS.md 125): when the reader goes to another page
// or switches language, a sheet of muslin paper slides up over the screen (about 0.2 s), the
// rickshaw wheel turns while the new page gets ready (at least about 0.15 s), and the sheet lifts
// off the top (about 0.2 s). Switching language also changes the name shown on the sheet.
//
// Only a new address starts it: links to the same page with a different #part or ?choice (The full
// picture, Chart/Table, countries, /sources sections) do not. Back/forward buttons, new tabs and
// modified clicks are left alone. With reduced motion, data saver or a low-end phone, there is no
// curtain at all (R10).
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { t, type Lang } from '../i18n/index.ts';
import { Jamdani, RickshawWheel } from './Motifs.tsx';

type Phase = 'idle' | 'covering' | 'holding' | 'revealing';

const COVER_MS = 200;
const HOLD_MIN_MS = 150;
const HOLD_MAX_MS = 4000;
const REVEAL_MS = 220;

const langOf = (path: string): Lang => (path.startsWith('/bn') ? 'bn' : 'en');

function curtainAllowed(): boolean {
  const root = document.documentElement;
  if (root.classList.contains('save-data') || root.classList.contains('lite')) return false;
  return !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/** The new page is ready when its own heading has replaced the old page's and no page is still loading. */
function pageReady(oldHeading: Element | null, oldText: string): boolean {
  const main = document.querySelector('main');
  const h1 = main?.querySelector('h1');
  // A language switch keeps the same heading element and changes its text.
  if (!main || !h1 || (h1 === oldHeading && h1.textContent === oldText)) return false;
  return !main.querySelector(':scope > .wrap > .loading');
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function PageCurtain() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [phase, setPhase] = useState<Phase>('idle');
  const [names, setNames] = useState<{ from: Lang; to: Lang } | null>(null);
  const busy = useRef(false);
  const here = useRef(pathname);
  here.current = pathname;

  useEffect(() => {
    async function run(to: string) {
      busy.current = true;
      const from = langOf(here.current);
      setNames({ from, to: langOf(to) });
      setPhase('covering');
      await wait(COVER_MS);
      setPhase('holding');
      const start = performance.now();
      const oldHeading = document.querySelector('main h1');
      const oldText = oldHeading?.textContent ?? '';
      navigate(to);
      window.scrollTo(0, 0);
      await wait(HOLD_MIN_MS);
      while (!pageReady(oldHeading, oldText) && performance.now() - start < HOLD_MAX_MS) await wait(40);
      setPhase('revealing');
      await wait(REVEAL_MS);
      setPhase('idle');
      busy.current = false;
    }

    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.('a');
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      // Same page, another #part or ?choice: no curtain (only a new page or language starts it).
      if (url.pathname.replace(/\/+$/, '') === here.current.replace(/\/+$/, '')) return;
      if (!curtainAllowed()) return;
      e.preventDefault();
      if (busy.current) return;
      void run(url.pathname + url.search + url.hash);
    }

    // Capture phase: runs before the router's own link handler, which then sees the click handled.
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [navigate]);

  const switching = names && names.from !== names.to;
  // While the sheet covers the screen, the name changes to the new language.
  const shown = names ? (phase === 'covering' ? names.from : names.to) : null;

  return (
    <div className={`curtain is-${phase}`} aria-hidden="true">
      <Jamdani />
      <div className="curtain__centre">
        <RickshawWheel size={44} />
        {shown && (
          <p key={shown} className={`curtain__name${switching ? ' is-switch' : ''}`} lang={shown}>
            {t(shown, 'site.title')}
          </p>
        )}
      </div>
    </div>
  );
}
