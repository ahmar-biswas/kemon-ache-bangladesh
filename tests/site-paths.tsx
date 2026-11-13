// Every page in the navigation map (section 10), shared by the page tests.
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { expect } from 'vitest';
import { App } from '../src/App.tsx';
import { PAGE_MEASURES, SUBSECTIONS } from '../src/data/site.ts';

export const SITE_PATHS = [
  '/economy',
  '/education',
  '/health',
  ...Object.keys(SUBSECTIONS).map((s) => `/economy/${s}`),
  '/compare',
  '/sources',
  '/about',
  '/how-to-read',
  ...PAGE_MEASURES.map((id) => `/indicator/${id}`),
];

/** Renders a page and waits until it and its lazily loaded data have arrived. */
export async function renderAt(path: string) {
  const result = render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
  await waitFor(() => expect(result.container.querySelector('main h1')).not.toBeNull(), { timeout: 8000 });
  // (The design preview shows the loader on purpose, as a specimen.)
  if (!path.includes('design-preview')) {
    await waitFor(() => expect(result.container.querySelector('main .loading, .snapshot--loading')).toBeNull(), { timeout: 8000 });
  }
  return result;
}
