// Source check (hard rules R1, R2, R7): renders every page in both languages and fails
// if any shown value lacks a source line with a real link, data year and retrieved date.
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { Figure } from '../src/components/Figure.tsx';
import type { DataRecord } from '../src/data/types.ts';
import { LANGS } from '../src/i18n/index.ts';
import { SITE_PATHS, renderAt } from './site-paths.tsx';

afterEach(cleanup);

/** Every page in the site. Add new routes here as they are built. */
/** Pages with no figures, checked for language and placeholders only. (/sources shows figures only in folded sections, tested in states.test.tsx.) */
const TEXT_ONLY_PAGES = ['/no-such-page', '/sources', '/about', '/how-to-read'];
const PAGES = ['/', '/design-preview', ...SITE_PATHS.filter((p) => !TEXT_ONLY_PAGES.includes(p))];


describe.each(LANGS)('pages in %s', (lang) => {
  it.each(PAGES)('%s: every value has a full source line', async (page) => {
    const { container } = await renderAt(`/${lang}${page}`);
    const values = container.querySelectorAll('[data-value]');
    expect(values.length).toBeGreaterThan(0);

    for (const value of values) {
      const figure = value.closest('[data-figure]');
      expect(figure, 'value outside a figure').not.toBeNull();
      const line = figure!.querySelector('[data-source-line]');
      expect(line, `no source line for "${value.textContent}"`).not.toBeNull();
      const link = line!.querySelector('a');
      expect(link?.getAttribute('href')).toMatch(/^https:\/\/\S+$/);
      expect(link?.textContent?.trim()).not.toBe('');
      expect(line!.querySelector('[data-source-year]')?.textContent).toBeTruthy();
      expect(line!.querySelector('[data-source-retrieved]')?.textContent).toBeTruthy();
    }
    // The design preview renders every specimen at once; its first, cold render can pass 5 s.
  }, 30000);

  it.each([...PAGES, ...TEXT_ONLY_PAGES])('%s: no unfilled {placeholders}', async (page) => {
    const { container } = await renderAt(`/${lang}${page}`);
    expect(container.textContent).not.toMatch(/\{\w+\}/);
  });
});

/**
 * Text with English digits, leaving out what is shown as published on purpose: series codes,
 * text marked lang="en" (the publisher's own source description), and the publisher terms
 * the M5 views already allow (PA.NUS.ATLS, CY/FY; survey titles after the Source label).
 */
function englishDigits(container: HTMLElement): string {
  const clone = container.cloneNode(true) as HTMLElement;
  for (const el of clone.querySelectorAll('[lang="en"]:not(.site), [data-code]')) el.remove();
  // Survey titles are shown as published, after a translated label (DECISIONS.md, M2).
  for (const el of clone.querySelectorAll('.ranked__tip-note, .measure__caveat, .data-table__notes, .line-chart__tip-note')) if (el.textContent!.includes('উৎস (প্রকাশিত শিরোনাম অনুযায়ী)')) el.remove();
  return (clone.textContent!.replace(/PA.NUS.ATLS|((CY|FY))/g, '').match(/.{0,30}[0-9].{0,30}/g) ?? []).join(' | ');
}

describe('Bangla pages', () => {
  it.each([...PAGES, ...TEXT_ONLY_PAGES])('%s: shows no English digits', async (page) => {
    const { container } = await renderAt(`/bn${page}`);
    expect(englishDigits(container)).toBe('');
  });
});

const sample: DataRecord = {
  indicator_id: 'inflation',
  country: 'BGD',
  year: 2020,
  value: 5,
  unit: 'percent',
  source_name: 'World Bank, World Development Indicators',
  original_source: 'test',
  source_url: 'https://data.worldbank.org/indicator/FP.CPI.TOTL.ZG?locations=BD',
  definition_url: 'https://example.org/definition',
  api_url: 'https://example.org/api',
  retrieved_at: '2026-01-01',
  notes: [],
  measured_by: null,
};

describe('Figure', () => {
  it('renders nothing when the source link is missing (no source, no display)', () => {
    const { container } = render(<Figure label="X" record={{ ...sample, source_url: '' }} lang="en" />);
    expect(container.innerHTML).toBe('');
  });
  it('says "Data not available" when there is no value', () => {
    const en = render(<Figure label="X" record={undefined} lang="en" />);
    expect(en.container.textContent).toContain('Data not available');
    cleanup();
    const bn = render(<Figure label="X" record={undefined} lang="bn" />);
    expect(bn.container.textContent).toContain('তথ্য পাওয়া যায়নি');
  });
});
