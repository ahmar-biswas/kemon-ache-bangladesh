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

// Four looks to try (DECISIONS.md 126). Pick one by adding ?curtain=stitch (or muslin, alpona,
// sun) to any address; the choice is remembered in this browser only. Default: muslin.
const VARIANTS = ['muslin', 'stitch', 'alpona', 'sun'] as const;
type Variant = (typeof VARIANTS)[number];
const isVariant = (v: unknown): v is Variant => VARIANTS.includes(v as Variant);

function chosenVariant(): Variant {
  try {
    const asked = new URLSearchParams(location.search).get('curtain');
    if (isVariant(asked)) localStorage.setItem('kab-curtain', asked);
    const saved = localStorage.getItem('kab-curtain');
    return isVariant(saved) ? saved : 'muslin';
  } catch {
    return 'muslin';
  }
}

// About half a second in all: cover, a short hold (longer only if the page is still loading), reveal.
const COVER_MS = 200;
const HOLD_MIN_MS = 100;
const HOLD_MAX_MS = 4000;
const REVEAL_MS = 200;

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
  const [variant, setVariant] = useState<Variant>('muslin');
  // Read the ?curtain= choice on the first page too, not only on the first click.
  useEffect(() => setVariant(chosenVariant()), []);
  const busy = useRef(false);
  const here = useRef(pathname);
  here.current = pathname;

  useEffect(() => {
    async function run(to: string) {
      busy.current = true;
      const from = langOf(here.current);
      setVariant(chosenVariant());
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
    <div className={`curtain curtain--${variant} is-${phase}`} aria-hidden="true">
      {variant === 'muslin' && <Jamdani />}
      {variant === 'stitch' && <span className="curtain__stitch" />}
      <div className="curtain__centre">
        {variant === 'muslin' && <RickshawWheel size={44} />}
        {variant === 'alpona' && <Rosette />}
        {variant === 'sun' && <span className="curtain__disc" />}
        {shown && (
          <p key={shown} className={`curtain__name${switching ? ' is-switch' : ''}`} lang={shown}>
            {t(shown, 'site.title')}
          </p>
        )}
      </div>
    </div>
  );
}

/** A small alpona rosette whose lines draw themselves (each path has length 1 for the CSS). */
function Rosette() {
  const petals = Array.from({ length: 8 }, (_, i) => i * 45);
  return (
    <svg className="curtain__rosette" viewBox="-60 -60 120 120" width="96" height="96" aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
        <circle r="10" pathLength={1} />
        <circle r="3" pathLength={1} />
        {petals.map((a) => (
          <path key={a} transform={`rotate(${a})`} d="M0 -14 C10 -26 10 -42 0 -54 C-10 -42 -10 -26 0 -14 Z" pathLength={1} />
        ))}
        <circle r="34" strokeDasharray="0.01 0.04" pathLength={1} className="curtain__rosette-dots" />
      </g>
    </svg>
  );
}
