// Milestone 6 (section 10; DECISIONS.md 101–105): every path in the navigation map works in
// both languages, every page below Home has breadcrumbs, the header menu reaches every page,
// and Poverty and inequality comes first on /economy.
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { App } from '../src/App.tsx';
import { RECORDS, indicatorMeta } from '../src/data/details.ts';
import { AREAS } from '../src/data/dashboard.ts';
import { AREA_PAGES, HOME_AREA_PATH, PAGE_MEASURES, SUBSECTIONS } from '../src/data/site.ts';
import { LANGS } from '../src/i18n/index.ts';
import { SITE_PATHS, renderAt } from './site-paths.tsx';

afterEach(cleanup);


describe('site map', () => {
  it('every listed measure has a description and data', () => {
    for (const id of PAGE_MEASURES) {
      expect(indicatorMeta(id), id).toBeDefined();
      expect(RECORDS[id]?.length, id).toBeGreaterThan(0);
    }
  });
  it('each measure appears once', () => {
    expect(new Set(PAGE_MEASURES).size).toBe(PAGE_MEASURES.length);
  });
  it('Poverty and inequality is the first Economy group', () => {
    expect(AREA_PAGES.find((a) => a.slug === 'economy')!.groups[0]!.sub).toBe('poverty-and-inequality');
  });
});

describe.each(LANGS)('navigation in %s', (lang) => {
  it.each(SITE_PATHS)('%s works, with breadcrumbs', async (p) => {
    const { container } = await renderAt(`/${lang}${p}`);
    expect(container.querySelector('.not-found'), 'page not found').toBeNull();
    const crumbs = container.querySelectorAll('.breadcrumbs li');
    expect(crumbs.length).toBeGreaterThanOrEqual(2);
    expect(crumbs[0]!.querySelector('a')?.getAttribute('href')).toBe(`/${lang}/`);
    expect(crumbs[crumbs.length - 1]!.getAttribute('aria-current')).toBe('page');
    for (const a of container.querySelectorAll('.breadcrumbs a')) expect(a.getAttribute('href')).toMatch(new RegExp(`^/${lang}/`));
  });

  it('the header menu (wide and phone) links to every main page in this language', async () => {
    const { container } = await renderAt(`/${lang}/`);
    for (const nav of container.querySelectorAll('.site-nav, .mobile-menu')) {
      const hrefs = [...nav.querySelectorAll('a')].map((a) => a.getAttribute('href'));
      expect(hrefs).toEqual([`/${lang}/`, `/${lang}/economy`, `/${lang}/education`, `/${lang}/health`, `/${lang}/compare`]);
    }
  });

  it('each homepage area card links to its area page', async () => {
    const { container } = await renderAt(`/${lang}/`);
    const links = [...container.querySelectorAll('.story__page')].map((a) => a.getAttribute('href'));
    expect(links).toEqual(AREAS.map((a) => `/${lang}/${HOME_AREA_PATH[a.icon]}`));
  });

  it('area pages link every tile to its indicator page, and Economy shows Poverty first, as the large card', async () => {
    const { container } = await renderAt(`/${lang}/economy`);
    const groups = container.querySelectorAll('.area-group');
    expect(groups[0]!.classList.contains('area-group--feature')).toBe(true);
    expect(groups[0]!.querySelector('.area-group__open')?.getAttribute('href')).toBe(`/${lang}/economy/poverty-and-inequality`);
    for (const a of container.querySelectorAll('.tile__name a')) expect(a.getAttribute('href')).toMatch(new RegExp(`^/${lang}/indicator/`));
    // The section with no data yet says so plainly, and never "Data not available" (DECISIONS.md 102).
    expect(container.querySelectorAll('.area-group__pending')).toHaveLength(1);
  });

  it('a subsection page draws one chart per measure, each named with a link to its page', async () => {
    const { container } = await renderAt(`/${lang}/economy/growth-and-prices`);
    const names = [...container.querySelectorAll('.sub-measure__name a')].map((a) => a.getAttribute('href'));
    expect(names).toEqual(SUBSECTIONS['growth-and-prices'].measures.map((id) => `/${lang}/indicator/${id}`));
    expect(container.querySelectorAll('.sub-measure svg[role="img"]').length).toBe(names.length);
  });

  it('an unknown indicator or subsection is a 404', async () => {
    for (const p of ['/indicator/no_such_measure', '/economy/no-such-part']) {
      const { container } = render(
        <MemoryRouter initialEntries={[`/${lang}${p}`]}>
          <App />
        </MemoryRouter>,
      );
      await waitFor(() => expect(container.querySelector('.not-found')).not.toBeNull(), { timeout: 8000 });
      cleanup();
    }
  });
});
