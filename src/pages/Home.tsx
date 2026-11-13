// The homepage (Ahmar's M4 brief, review 2; DECISIONS.md 61–67, 80–86).
//   1. A short question and one plain line, then the "Compare with" slicer.
//   2. Four area tiles, each telling one headline measure. Clicking a tile grows it into its
//      Details view (a shared-element transition: anticipation on press, a soft overshoot as it
//      grows, the rest of the page dimmed, rows arriving one after another; closing is quicker).
//   3. Below the fold: Bangladesh at a glance, six cards with a world-position bar each.
// Every figure has its source line directly under it (R1). Data: latest.json only (R10);
// the Details code and full data load on demand (preloaded on hover or focus).
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useOutletContext } from 'react-router';
import { AreaStory } from '../components/AreaStory.tsx';
import { CompareProvider, useCompare } from '../components/CompareContext.tsx';
import { CountrySlicer } from '../components/CountrySlicer.tsx';
import { GlanceCard } from '../components/GlanceCard.tsx';
import { Loading } from '../components/Loading.tsx';
import { AlponaField } from '../components/Motifs.tsx';
import { AREAS, GLANCE } from '../data/dashboard.ts';
import { LATEST } from '../data/latest.ts';
import { t, type Lang } from '../i18n/index.ts';
import { useFirstVisitDrawIn } from '../lib/drawIn.ts';

const loadDetails = () => import('../components/DetailsPanel.tsx');
const DetailsPanel = lazy(() => loadDetails().then((m) => ({ default: m.DetailsPanel })));
let prefetched = false;
const prefetchDetails = () => {
  if (prefetched) return;
  prefetched = true;
  void loadDetails();
};

type ViewTransitionDoc = Document & { startViewTransition?: (cb: () => void) => { finished: Promise<void> } };
const GROW = 'area-grow';

function Dashboard({ lang }: { lang: Lang }) {
  const { selected } = useCompare();
  const [openArea, setOpenArea] = useState<string | null>(null);
  const tileRefs = useRef<Record<string, HTMLElement | null>>({});
  const open = AREAS.find((a) => a.icon === openArea);

  /** Open or close with the grow transition where the browser supports it. */
  const change = useCallback((next: string | null, from?: HTMLElement) => {
    const doc = document as ViewTransitionDoc;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (!doc.startViewTransition || reduce) {
      setOpenArea(next);
      return;
    }
    const root = document.documentElement;
    if (next) {
      // Old picture: the tile carries the name. New picture: the panel does.
      if (from) from.style.viewTransitionName = GROW;
      root.dataset.vt = 'open';
      const vt = doc.startViewTransition(() => {
        flushSync(() => setOpenArea(next));
        if (from) from.style.viewTransitionName = '';
      });
      void vt.finished.finally(() => delete root.dataset.vt);
    } else {
      const tile = openArea ? (tileRefs.current[openArea]?.querySelector<HTMLElement>('.story') ?? null) : null;
      root.dataset.vt = 'close';
      const vt = doc.startViewTransition(() => {
        flushSync(() => setOpenArea(null));
        if (tile) tile.style.viewTransitionName = GROW;
      });
      void vt.finished.finally(() => {
        if (tile) tile.style.viewTransitionName = '';
        delete root.dataset.vt;
        tile?.querySelector<HTMLElement>('.flag-switch__option')?.focus({ preventScroll: true });
      });
    }
  }, [openArea]);
  const close = useCallback(() => change(null), [change]);

  return (
    <div className={`home${open ? ' has-open' : ''}`}>
      <section className="home-hero wrap" aria-labelledby="home-title">
        <AlponaField className="home-hero__alpona" />
        <h1 id="home-title" className="home-hero__title">
          {t(lang, 'home.title')}
        </h1>
        <p className="home-hero__lede">{t(lang, 'home.lede')}</p>
        <CountrySlicer lang={lang} peers={LATEST.default_peers} names={LATEST.names} />
      </section>

      <section className="home-areas wrap" aria-label={t(lang, 'home.title')}>
        <div className="home-areas__grid">
          {AREAS.map((area) => (
            <div key={area.icon} ref={(el) => { tileRefs.current[area.icon] = el; }} className="home-areas__cell">
              <AreaStory
                lang={lang}
                area={area}
                latest={LATEST}
                selected={selected}
                open={openArea === area.icon}
                onOpen={(el) => change(area.icon, el)}
                onPrefetch={prefetchDetails}
              />
            </div>
          ))}
        </div>
        {open && (
          <Suspense fallback={<div className="details glass" style={{ viewTransitionName: GROW }}><Loading lang={lang} /></div>}>
            <DetailsPanel lang={lang} area={open} latest={LATEST} onClose={close} />
          </Suspense>
        )}
      </section>

      <section className="home-glance wrap" aria-labelledby="glance-title">
        <h2 id="glance-title" className="home-glance__title">
          {t(lang, 'side.title')}
        </h2>
        <hr className="stitch stitch--red" />
        <p className="home-glance__lede">{t(lang, 'glance.lede')}</p>
        <div className="home-glance__grid">
          {GLANCE.map((id) => {
            const d = LATEST.indicators[id];
            return d ? <GlanceCard key={id} lang={lang} data={d} /> : null;
          })}
        </div>
      </section>
    </div>
  );
}

export function Home() {
  const lang = useOutletContext<Lang>();
  useFirstVisitDrawIn();
  useEffect(() => {
    document.documentElement.classList.add('is-home');
    return () => document.documentElement.classList.remove('is-home');
  }, []);
  return (
    <CompareProvider peers={LATEST.default_peers}>
      <Dashboard lang={lang} />
    </CompareProvider>
  );
}
