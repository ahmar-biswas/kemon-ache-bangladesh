// Source check (hard rules R1, R2, R7): renders every page in both languages and fails
// if any shown value lacks a source line with a real link, data year and retrieved date.
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { App } from '../src/App.tsx';
import { Figure } from '../src/components/Figure.tsx';
import type { DataRecord } from '../src/data/types.ts';
import { LANGS } from '../src/i18n/index.ts';

afterEach(cleanup);

/** Every page in the site. Add new routes here as they are built. */
const PAGES = ['/'];

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe.each(LANGS)('pages in %s', (lang) => {
  it.each(PAGES)('%s: every value has a full source line', (page) => {
    const { container } = renderAt(`/${lang}${page}`);
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
  });

  it.each(PAGES)('%s: no unfilled {placeholders}', (page) => {
    const { container } = renderAt(`/${lang}${page}`);
    expect(container.textContent).not.toMatch(/\{\w+\}/);
  });
});

describe('Bangla pages', () => {
  it.each(PAGES)('%s: shows no English digits', (page) => {
    const { container } = renderAt(`/bn${page}`);
    expect(container.textContent).not.toMatch(/[0-9]/);
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
