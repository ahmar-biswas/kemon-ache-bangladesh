// The homepage (Ahmar's M4 brief, review 2; DECISIONS.md 61–67, 80–86).
//   1. A short question and one plain line, then the "Compare with" slicer.
//   2. Four area tiles, each telling one headline measure. Clicking a tile grows it into its
//      Details view (a shared-element transition: anticipation on press, a soft overshoot as it
//      grows, the rest of the page dimmed, rows arriving one after another; closing is quicker).
//   3. Below the fold: Bangladesh at a glance, six cards with a world-position bar each.
// Every figure has its source line directly under it (R1). Data: latest.json only (R10);
// the Details code and full data load on demand (preloaded on hover or focus).
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
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

/** Where the clicked tile sits inside the four-tile area: the panel starts clipped to it. */
export interface Origin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

function Dashboard({ lang }: { lang: Lang }) {
  const { selected } = useCompare();
  const [openArea, setOpenArea] = useState<string | null>(null);
  const [origin, setOrigin] = useState<Origin | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const tileRefs = useRef<Record<string, HTMLElement | null>>({});
  const open = AREAS.find((a) => a.icon === openArea);

  const openFrom = useCallback((id: string, tile: HTMLElement) => {
    const grid = gridRef.current?.getBoundingClientRect();
    const r = tile.getBoundingClientRect();
    setOrigin(grid ? { top: r.top - grid.top, right: grid.right - r.right, bottom: grid.bottom - r.bottom, left: r.left - grid.left } : null);
    setOpenArea(id);
  }, []);
  const close = useCallback(() => {
    const id = openArea;
    setOpenArea(null);
    // Back to the tile the reader came from.
    if (id) requestAnimationFrame(() => tileRefs.current[id]?.querySelector<HTMLElement>('.story__open')?.focus({ preventScroll: true }));
  }, [openArea]);

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
        <div className="home-areas__stage">
          <div className="home-areas__grid" ref={gridRef}>
            {AREAS.map((area) => (
              <div key={area.icon} ref={(el) => { tileRefs.current[area.icon] = el; }} className="home-areas__cell">
                <AreaStory
                  lang={lang}
                  area={area}
                  latest={LATEST}
                  selected={selected}
                  open={openArea === area.icon}
                  onOpen={(el) => openFrom(area.icon, el)}
                  onPrefetch={prefetchDetails}
                />
              </div>
            ))}
          </div>
          {open && (
            <Suspense
              fallback={
                // While the code loads (first open only), stay in the tile's place, so the
                // sideways opening still starts from the tile.
                <div
                  className="details"
                  style={origin ? { clipPath: `inset(${origin.top}px ${origin.right}px ${origin.bottom}px ${origin.left}px round 14px)` } : undefined}
                >
                  <Loading lang={lang} />
                </div>
              }
            >
              <DetailsPanel key={open.icon} lang={lang} area={open} latest={LATEST} origin={origin} onClose={close} />
            </Suspense>
          )}
        </div>
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
