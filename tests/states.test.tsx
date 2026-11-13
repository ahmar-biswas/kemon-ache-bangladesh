// Milestone 7: page states (section 13, 8.13) in both languages, and the /sources index
// (section 10: "every data point's source link, definition link, data year, retrieved date, notes").
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it } from 'vitest';
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { Loading } from '../src/components/Loading.tsx';
import { LastChecked, LoadBoundary, OfflineNotice } from '../src/components/PageStates.tsx';
import { Tile } from '../src/components/Tile.tsx';
import { isOldData } from '../src/data/compare.ts';
import { COUNTRIES, INDICATORS, indicatorMeta } from '../src/data/details.ts';
import { LATEST } from '../src/data/latest.ts';
import { loadSeries, loadTrend, loadWorld } from '../src/data/measure.ts';
import { PAGE_MEASURES } from '../src/data/site.ts';
import { loadMeasureSources } from '../src/data/sourcesIndex.ts';
import type { DataMeta, DataRecord } from '../src/data/types.ts';
import { LANGS, t } from '../src/i18n/index.ts';
import { formatYear } from '../src/lib/format.ts';
import { renderAt } from './site-paths.tsx';

afterEach(cleanup);

const meta = indicatorMeta('inflation')!;
const record = (year: number): DataRecord => ({
  indicator_id: 'inflation',
  country: 'BGD',
  year,
  value: 5,
  unit: 'percent',
  source_name: 'World Bank, World Development Indicators',
  original_source: 'test',
  source_url: 'https://data.worldbank.org/indicator/FP.CPI.TOTL.ZG?locations=BD',
  definition_url: meta.definition_url,
  api_url: 'https://example.org/api',
  retrieved_at: '2026-01-01',
  notes: [],
  measured_by: null,
});

const tile = (lang: (typeof LANGS)[number], records: DataRecord[]) =>
  render(
    <MemoryRouter>
      <Tile lang={lang} meta={meta} records={records} countries={COUNTRIES} since={LATEST.since} />
    </MemoryRouter>,
  );

describe('old data rule', () => {
  it('a figure more than 5 years older than the last check is old', () => {
    expect(isOldData(2020, 2026)).toBe(true);
    expect(isOldData(2021, 2026)).toBe(false);
  });
});

describe.each(LANGS)('states in %s', (lang) => {
  it('loading: the rickshaw wheel and a line of text, announced politely', () => {
    const { container } = render(<Loading lang={lang} />);
    expect(container.querySelector('[role="status"] .rickshaw-wheel, [role="status"] svg')).not.toBeNull();
    expect(container.textContent).toBe(t(lang, 'state.loading'));
  });

  it('old data: a neutral note gives the year', () => {
    const lastYear = LATEST.since + 10;
    const { container } = tile(lang, [record(lastYear - 8)]);
    expect(container.querySelector('[data-old-data]')?.textContent).toBe(t(lang, 'state.old_data', { year: formatYear(lastYear - 8, lang) }));
    cleanup();
    expect(tile(lang, [record(lastYear - 1)]).container.querySelector('[data-old-data]')).toBeNull();
  });

  it('data not available: the words, the source page link, never a zero', () => {
    const { container } = tile(lang, []);
    expect(container.querySelector('[data-not-available]')?.textContent).toBe(t(lang, 'data.not_available'));
    expect(container.querySelector('.state-note a')?.getAttribute('href')).toMatch(/^https:\/\//);
    expect(container.querySelector('[data-value]')).toBeNull();
  });

  it('failed refresh: "Last checked" stays, with a note', () => {
    const base: DataMeta = { last_checked: '2026-11-13', last_check_ok: true, last_updated: '2026-11-13', source_last_updated: {} };
    const ok = render(<LastChecked lang={lang} meta={base} />).container;
    expect(ok.querySelector('.last-checked')).not.toBeNull();
    expect(ok.querySelector('[data-refresh-failed]')).toBeNull();
    cleanup();
    const failed = render(<LastChecked lang={lang} meta={{ ...base, last_check_ok: false }} />).container;
    expect(failed.querySelector('.last-checked')).not.toBeNull();
    expect(failed.querySelector('[data-refresh-failed]')?.textContent).toBe(t(lang, 'state.refresh_failed'));
  });

  it('offline: a notice appears when the connection drops and goes when it returns', () => {
    const { container } = render(<OfflineNotice lang={lang} />);
    expect(container.querySelector('[data-offline]')).toBeNull();
    const online = Object.getOwnPropertyDescriptor(Navigator.prototype, 'onLine')!;
    try {
      Object.defineProperty(Navigator.prototype, 'onLine', { configurable: true, get: () => false });
      act(() => void window.dispatchEvent(new Event('offline')));
      expect(container.querySelector('[data-offline]')?.textContent).toBe(t(lang, 'state.offline'));
    } finally {
      Object.defineProperty(Navigator.prototype, 'onLine', online);
    }
    act(() => void window.dispatchEvent(new Event('online')));
    expect(container.querySelector('[data-offline]')).toBeNull();
  });

  it('a page part that fails to load offers to try again', () => {
    const Broken = () => {
      throw new Error('chunk failed');
    };
    const quiet = console.error;
    console.error = () => {};
    try {
      const { container } = render(
        <LoadBoundary lang={lang}>
          <Broken />
        </LoadBoundary>,
      );
      expect(container.querySelector('[data-load-failed]')?.textContent).toContain(t(lang, 'state.load_failed'));
      expect(container.querySelector('button')?.textContent).toBe(t(lang, 'state.try_again'));
    } finally {
      console.error = quiet;
    }
  });

  it('404: says what happened and links home', async () => {
    const { container } = await renderAt(`/${lang}/no-such-page`);
    expect(container.querySelector('.not-found h1')?.textContent).toBe(t(lang, 'notfound.title'));
    expect(container.querySelector('.not-found a')?.getAttribute('href')).toBe(`/${lang}/`);
  });

  it('/sources has a section for every measure on the site, with source and definition links', async () => {
    const { container } = await renderAt(`/${lang}/sources`);
    for (const m of INDICATORS) {
      const section = container.querySelector(`#m-${m.id}`);
      expect(section, m.id).not.toBeNull();
      const links = [...section!.querySelectorAll('.sources-measure__about a')].map((a) => a.getAttribute('href'));
      expect(links, m.id).toContain(m.definition_url);
      expect(links.some((h) => h?.startsWith('https://')), m.id).toBe(true);
    }
    for (const id of PAGE_MEASURES) expect(container.querySelector(`#m-${id}`), id).not.toBeNull();
  });

  it('/sources: opening a section lists its values, years, notes and source links', async () => {
    const { container } = await renderAt(`/${lang}/sources`);
    const section = container.querySelector<HTMLDetailsElement>('#m-poverty_intl')!;
    section.open = true;
    fireEvent(section, new Event('toggle'));
    await waitFor(() => expect(section.querySelectorAll('.sources-table tbody tr').length).toBeGreaterThan(10), { timeout: 8000 });
    for (const a of section.querySelectorAll('.sources-table tbody a')) expect(a.getAttribute('href')).toMatch(/^https:\/\//);
    expect(section.textContent).not.toMatch(/\{\w+\}/);
    if (lang === 'bn') {
      const text = [...section.querySelectorAll('.sources-table td:not(.sources-table__notes)')].map((td) => td.textContent).join(' ');
      expect(text).not.toMatch(/[0-9]/);
    }
  });
});

describe('/sources lists every value the site shows', () => {
  it.each(INDICATORS.map((m) => m.id))('%s', async (id) => {
    const m = indicatorMeta(id)!;
    const s = await loadMeasureSources(m, COUNTRIES.default_peers);
    const key = (r: { country: string; year: number; value: number }) => `${r.country} ${r.year} ${r.value}`;
    const listed = new Set([...s.bangladesh, ...s.peers].map(key));
    const shown: DataRecord[] = [...((await loadTrend(id)) ?? []), ...((await loadSeries(id)) ?? [])].filter(
      (r) => r.country === 'BGD' || COUNTRIES.default_peers.includes(r.country),
    );
    for (const r of shown) expect(listed.has(key(r)), `${id}: ${key(r)}`).toBe(true);
    const world = await loadWorld(id);
    expect(s.world?.rows.length ?? 0).toBe(world?.rows.length ?? 0);
    for (const r of [...s.bangladesh, ...s.peers, ...(s.world?.rows ?? [])]) expect(r.source_url).toMatch(/^https:\/\//);
  });
});

describe('print stylesheet', () => {
  it('keeps source lines and hides only controls', () => {
    const css = readFileSync('src/styles/components.css', 'utf8');
    const print = css.slice(css.indexOf('/* ---------- Print'));
    expect(print).toContain('@media print');
    const hidden = /@media print \{\s*([^{]+)\{\s*display: none/.exec(print)![1]!;
    expect(hidden).not.toMatch(/source-line|last-checked/);
    expect(print).toMatch(/\.source-line[^{]*\{[^}]*display: block/);
  });
});
