// Milestone 5 views, rendered with the real data in both languages: every value has a full
// source line (R1), Bangla shows no English digits (R7), and nothing is left unfilled.
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, waitFor } from '@testing-library/react';
import { CompareView } from '../src/components/measure/CompareView.tsx';
import { TrendView } from '../src/components/measure/TrendView.tsx';
import { compareIdFor, indicatorMeta, trendIdFor, INDICATORS } from '../src/data/details.ts';
import { LANGS, t } from '../src/i18n/index.ts';
import { approvedEvents } from '../src/data/measure.ts';

afterEach(cleanup);

/** The measures in "The full picture" with their own world and trend files. */
const MEASURES = INDICATORS.filter((m) => m.unit !== 'rank' && m.unit !== 'taka_constant').map((m) => m.id);

function checkSources(container: HTMLElement) {
  const values = container.querySelectorAll('[data-value]');
  expect(values.length).toBeGreaterThan(0);
  for (const value of values) {
    const figure = value.closest('[data-figure]');
    expect(figure).not.toBeNull();
    const line = figure!.querySelector('[data-source-line]');
    expect(line, `no source line for "${value.textContent}"`).not.toBeNull();
    expect(line!.querySelector('a')?.getAttribute('href')).toMatch(/^https:\/\/\S+$/);
    expect(line!.querySelector('[data-source-year]')?.textContent).toBeTruthy();
    expect(line!.querySelector('[data-source-retrieved]')?.textContent).toBeTruthy();
  }
}

describe.each(LANGS)('measure views in %s', (lang) => {
  it.each(MEASURES)('%s: compare view', async (id) => {
    const meta = indicatorMeta(id)!;
    const cmpId = compareIdFor(meta);
    if (!cmpId) return;
    const { container } = render(<CompareView lang={lang} meta={meta} compare={indicatorMeta(cmpId)!} target={null} />);
    await waitFor(() => expect(container.querySelector('.measure__frame')).not.toBeNull(), { timeout: 5000 });
    checkSources(container);
    const link = container.querySelector('.measure__frame [data-source-line] a')!.getAttribute('href')!;
    // Every country shown is in the link (in ranked order), Bangladesh included.
    const codes = /locations=([A-Z0-9-]+)$/.exec(link)![1]!.split('-');
    expect(codes).toContain('BD');
    expect(codes).toHaveLength(container.querySelectorAll('.ranked__row').length);
    expect(container.textContent).not.toMatch(/\{\w+\}/);
    if (lang === 'bn') {
      // Survey titles are shown as published, in English (DECISIONS.md, M2): leave them out.
      const clone = container.cloneNode(true) as HTMLElement;
      for (const el of clone.querySelectorAll('.ranked__tip-note')) if (el.textContent!.includes(t('bn', 'note.source_citation', { citation: '' }).trim())) el.remove();
      expect(clone.textContent!.replace(/PA\.NUS\.ATLS|\((CY|FY)\)/g, '')).not.toMatch(/[0-9]/);
    }
  });

  it.each(MEASURES)('%s: over-time view', async (id) => {
    const meta = indicatorMeta(id)!;
    const { container } = render(<TrendView lang={lang} meta={meta} trend={indicatorMeta(trendIdFor(meta))!} />);
    await waitFor(() => expect(container.querySelector('.measure__frame, .measure__na')).not.toBeNull(), { timeout: 5000 });
    checkSources(container);
    expect(container.textContent).not.toMatch(/\{\w+\}/);
    // Approved events inside the chart's years get a marker, each with its date in the label.
    if (id === 'life_expectancy') expect(container.querySelectorAll('.event').length).toBeGreaterThan(10);
    for (const mark of container.querySelectorAll('.event__mark')) expect(mark.getAttribute('aria-label')).toMatch(/:/);
    expect(container.querySelectorAll('.event').length).toBeLessThanOrEqual(approvedEvents().length);
  });
});
