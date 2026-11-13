// The homepage: one-screen dashboard (Ahmar's M4 brief; DECISIONS.md 61–67).
//   - "Compare with" slicer: highlights one peer in every chart.
//   - Four area tiles (Economy, Equality, Health, Education), each with a status count, the
//     measures used, compact rows and a Summary | Details switch.
//   - Side list: ten well-being measures, each with a comparison strip and the global rank.
// Every figure has its source line directly under it (R1). Data: latest.json only (R10).
import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { useOutletContext } from 'react-router';
import { AreaTile } from '../components/AreaTile.tsx';
import { CompareProvider, useCompare } from '../components/CompareContext.tsx';
import { CountrySlicer } from '../components/CountrySlicer.tsx';
import { Loading } from '../components/Loading.tsx';
import { MetricRow } from '../components/MetricRow.tsx';
import { AREAS, SIDE } from '../data/dashboard.ts';
import { LATEST } from '../data/latest.ts';
import { t, type Lang } from '../i18n/index.ts';
import { useFirstVisitDrawIn } from '../lib/drawIn.ts';
import { useMediaQuery } from '../lib/useMediaQuery.ts';
import { createPortal } from 'react-dom';

// Loaded only when a Details switch is turned on (it needs the full data files).
const DetailsPanel = lazy(() => import('../components/DetailsPanel.tsx').then((m) => ({ default: m.DetailsPanel })));

function Dashboard({ lang }: { lang: Lang }) {
  const { selected } = useCompare();
  const [openArea, setOpenArea] = useState<string | null>(null);
  const close = useCallback(() => setOpenArea(null), []);
  const open = AREAS.find((a) => a.icon === openArea);
  const wide = useMediaQuery('(min-width: 1200px)');
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  useEffect(() => setSlot(document.getElementById('header-slot')), []);
  const headerSlot = wide ? slot : null;

  return (
    <div className="dash">
      <h1 className="visually-hidden">{t(lang, 'home.h1')}</h1>
      {/* Wide screens: the slicer sits in the header bar (saves a row). Smaller: its own bar. */}
      {headerSlot ? (
        createPortal(<CountrySlicer lang={lang} peers={LATEST.default_peers} names={LATEST.names} />, headerSlot)
      ) : (
        <div className="dash__bar">
          <CountrySlicer lang={lang} peers={LATEST.default_peers} names={LATEST.names} />
        </div>
      )}

      <div className="dash__areas">
        {AREAS.map((area) => (
          <AreaTile
            key={area.icon}
            lang={lang}
            area={area}
            latest={LATEST}
            selected={selected}
            open={openArea === area.icon}
            onToggle={(o) => setOpenArea(o ? area.icon : null)}
          />
        ))}
        {open && (
          <Suspense fallback={<div className="details glass"><Loading lang={lang} /></div>}>
            <DetailsPanel lang={lang} area={open} latest={LATEST} onClose={close} />
          </Suspense>
        )}
      </div>

      <aside className="dash__side" aria-labelledby="side-title">
        <h2 id="side-title" className="side__title">
          {t(lang, 'side.title')}
        </h2>
        <div className="side__grid">
          {SIDE.map((id) => {
            const d = LATEST.indicators[id];
            return d ? <MetricRow key={id} lang={lang} data={d} names={LATEST.names} selected={selected} variant="side" /> : null;
          })}
        </div>
      </aside>
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
