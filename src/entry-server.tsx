// Build-time rendering (section 13, "No JavaScript"; DECISIONS.md 116). scripts/prerender.ts
// renders every page in both languages to plain HTML with this, so the text, the tile values,
// the source lines, the menu and the language switch are there before (or without) JavaScript.
// React's prerender waits for the lazy pages to load, so each page's own content is included.
import { StrictMode } from 'react';
import { prerender } from 'react-dom/static';
import { StaticRouter } from 'react-router';
import { App, preloadPage } from './App.tsx';
import { AREA_PAGES, PAGE_MEASURES, SUBSECTIONS, path } from './data/site.ts';
import { LANGS } from './i18n/index.ts';
import { BASE } from './lib/base.ts';

/** Every page address the site has, in both languages. */
export function routes(): string[] {
  return LANGS.flatMap((lang) => [
    path.home(lang),
    ...AREA_PAGES.map((a) => path.area(lang, a.slug)),
    ...Object.values(SUBSECTIONS).map((s) => path.sub(lang, s.sub)),
    ...PAGE_MEASURES.map((id) => path.indicator(lang, id)),
    path.compare(lang),
    path.sources(lang),
    path.about(lang),
    path.howToRead(lang),
  ]);
}

export async function render(url: string): Promise<string> {
  // Load the page's code first. Otherwise React writes the page as a hidden block plus a script that
  // swaps it in, with the loading line in its place: readers without JavaScript saw only the
  // loading line, and everyone saw the page jump when it was swapped (M8, DECISIONS 136).
  await preloadPage(url);
  const { prelude } = await prerender(
    <StrictMode>
      <StaticRouter location={BASE + url} basename={BASE || undefined}>
        <App />
      </StaticRouter>
    </StrictMode>,
  );
  return new Response(prelude).text();
}
