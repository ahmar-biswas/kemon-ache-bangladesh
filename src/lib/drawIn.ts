// The one orchestrated motion (8.11): on the first visit to the homepage, the river-delta
// contour lines draw in once over about 1.6 s. Skipped under reduced motion, for data savers
// and on low-end phones. "First visit" is remembered in this browser only; if storage is
// blocked, the lines simply appear (never animate twice in one page view).
import { useEffect } from 'react';

const KEY = 'kab-drawn-in';

export function useFirstVisitDrawIn() {
  useEffect(() => {
    const root = document.documentElement;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce || root.classList.contains('save-data') || root.classList.contains('lite')) return;
    let seen = true;
    try {
      seen = localStorage.getItem(KEY) === '1';
      localStorage.setItem(KEY, '1');
    } catch {
      seen = true;
    }
    if (seen) return;
    root.classList.add('draw-in');
    const done = window.setTimeout(() => root.classList.remove('draw-in'), 2200);
    return () => window.clearTimeout(done);
  }, []);
}
