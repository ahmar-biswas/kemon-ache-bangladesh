// A measure's own view inside "The full picture" (DECISIONS.md 87): "Compare with other
// countries" or "Bangladesh over time". It opens in the same full-width space with the same
// sideways animation, from the measure's tile, and has a Back button. Escape goes back.
import { useEffect, useRef } from 'react';
import { compareIdFor, indicatorMeta, trendIdFor } from '../../data/details.ts';
import type { IndicatorMeta, Target } from '../../data/types.ts';
import { t, type Lang } from '../../i18n/index.ts';
import { indicatorName } from '../../lib/display.ts';
import { useSideways, type Origin } from '../../lib/useSideways.ts';
import { CompareView } from './CompareView.tsx';
import { TrendView } from './TrendView.tsx';

export type MeasureMode = 'compare' | 'trend';

interface Props {
  lang: Lang;
  meta: IndicatorMeta;
  mode: MeasureMode;
  target: Target | null;
  origin: Origin | null;
  onClose: () => void;
}

export function MeasureView({ lang, meta, mode, target, origin, onClose }: Props) {
  const ref = useRef<HTMLElement>(null);
  const requestClose = useSideways(ref, origin, onClose);
  // Narrow screens: the view takes the place of "The full picture", so bring its top into sight.
  useEffect(() => {
    if (!(window.matchMedia?.('(min-width: 900px)').matches ?? false)) ref.current?.scrollIntoView?.({ block: 'start' });
  }, []);
  const cmpId = compareIdFor(meta);
  const compare = cmpId ? indicatorMeta(cmpId) : undefined;
  const trend = indicatorMeta(trendIdFor(meta)) ?? meta;
  const headingId = `measure-${meta.id}-${mode}`;

  return (
    <section ref={ref} tabIndex={-1} className={`details measure measure--${mode}`} aria-labelledby={headingId}>
      <header className="details__head">
        <h2 id={headingId}>
          <span className="story__disc" aria-hidden="true" />
          {indicatorName(meta.id, lang)}
          <span className="details__kicker">{t(lang, mode === 'compare' ? 'measure.compare' : 'measure.trend')}</span>
        </h2>
        <button type="button" className="story__open details__close" onClick={requestClose}>
          <svg width="16" height="10" viewBox="0 0 16 10" aria-hidden="true" focusable="false">
            <path d="M15 5 H2 M6 1 L2 5 L6 9" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {t(lang, 'measure.back')}
        </button>
      </header>
      {mode === 'compare' && compare ? (
        <CompareView lang={lang} meta={meta} compare={compare} target={target} />
      ) : mode === 'compare' ? (
        <p className="measure__na" data-not-available="">
          {t(lang, 'data.not_available')}
        </p>
      ) : (
        <TrendView lang={lang} meta={meta} trend={trend} />
      )}
    </section>
  );
}
