// Tests for the fetcher: paging, retries, the response cache, and that missing
// values are skipped (never filled in). No real network calls: `fetch` is replaced
// with a fake, and the answers below are made-up test fixtures.
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { INDICATORS } from '../scripts/indicators.ts';
import { MAX_ATTEMPTS, fetchAllPages, fetchJson, normalise, type RawResponse } from '../scripts/lib/worldbank.ts';

const lifeExpectancy = INDICATORS.find((i) => i.id === 'life_expectancy')!;
const BASE = 'https://api.worldbank.org/v2/country/BGD/indicator/SP.DYN.LE00.IN?format=json&footnote=y';

const row = (date: string, value: number | null) => ({
  indicator: { id: 'SP.DYN.LE00.IN' },
  countryiso3code: 'BGD',
  date,
  value,
  footnote: '',
});

/** A fake World Bank with `total` rows split into pages of `perPage`. Records every URL asked for. */
function fakeWorldBank(years: [string, number | null][], perPage: number) {
  const requested: string[] = [];
  const pages = Math.ceil(years.length / perPage);
  const fake = vi.fn(async (url: string) => {
    requested.push(url);
    const page = Number(new URL(url).searchParams.get('page'));
    const slice = years.slice((page - 1) * perPage, page * perPage).map(([d, v]) => row(d, v));
    const body = [{ page, pages, per_page: perPage, total: years.length, lastupdated: '2026-01-01' }, slice];
    return new Response(JSON.stringify(body), { status: 200, headers: { 'cf-cache-status': 'HIT' } });
  });
  return { fake, requested };
}

let cacheDir: string;
beforeEach(() => {
  cacheDir = mkdtempSync(join(tmpdir(), 'kab-cache-'));
  process.env.KAB_HTTP_CACHE_DIR = cacheDir;
});
afterEach(() => {
  vi.unstubAllGlobals();
  rmSync(cacheDir, { recursive: true, force: true });
  delete process.env.KAB_HTTP_CACHE_DIR;
});

// 45 made-up years, newest first like the World Bank, with the newest one empty.
const YEARS: [string, number | null][] = Array.from({ length: 45 }, (_, i) => {
  const year = 2025 - i;
  return [String(year), year === 2025 ? null : 50 + i / 10];
});

describe('fetchAllPages', () => {
  it('reads every page and nothing else', async () => {
    const { fake, requested } = fakeWorldBank(YEARS, 20);
    vi.stubGlobal('fetch', fake);

    const { answers } = await fetchAllPages(BASE, 20);

    expect(answers).toHaveLength(3); // 20 + 20 + 5 rows
    expect(requested.map((u) => new URL(u).searchParams.get('page'))).toEqual(['1', '2', '3']);
    const rows = answers.flatMap((a) => (a as [unknown, unknown[]])[1]);
    expect(rows).toHaveLength(45);
  });

  it('gives every year to normalise, which then checks the pages add up', async () => {
    vi.stubGlobal('fetch', fakeWorldBank(YEARS, 20).fake);
    const { answers, retrievedAt } = await fetchAllPages(BASE, 20);
    const dataRaw: RawResponse = { retrieved_at: retrievedAt, request_url: BASE, response: answers };
    const metaRaw: RawResponse = {
      retrieved_at: retrievedAt,
      request_url: 'x',
      response: [
        { page: 1, pages: 1, total: 1 },
        [{ id: 'SP.DYN.LE00.IN', name: lifeExpectancy.expectedName, source: { id: '2', value: 'World Development Indicators' }, sourceOrganization: 'Test' }],
      ],
    };
    const { records } = normalise(lifeExpectancy, metaRaw, dataRaw, { countries: ['BGD'], iso2: new Map([['BGD', 'BD']]), countryMeta: new Map([['BGD', { currencyUnit: 'Bangladeshi taka', specialNotes: null }]]) });
    // 45 years asked for, 1 of them empty → 44 records, oldest first.
    expect(records).toHaveLength(44);
    expect(records[0]!.year).toBe(1981);
  });
});

describe('missing values are skipped, never filled in', () => {
  it('drops the empty newest year, so the latest year is the last one with a value', async () => {
    vi.stubGlobal('fetch', fakeWorldBank(YEARS, 50).fake);
    const { answers, retrievedAt } = await fetchAllPages(BASE, 50);
    const metaRaw: RawResponse = {
      retrieved_at: retrievedAt,
      request_url: 'x',
      response: [
        { page: 1, pages: 1, total: 1 },
        [{ id: 'SP.DYN.LE00.IN', name: lifeExpectancy.expectedName, source: { id: '2', value: 'World Development Indicators' }, sourceOrganization: 'Test' }],
      ],
    };
    const { records } = normalise(
      lifeExpectancy,
      metaRaw,
      { retrieved_at: retrievedAt, request_url: BASE, response: answers },
      { countries: ['BGD'], iso2: new Map([['BGD', 'BD']]), countryMeta: new Map([['BGD', { currencyUnit: 'Bangladeshi taka', specialNotes: null }]]) },
    );
    expect(records.find((r) => r.year === 2025)).toBeUndefined();
    expect(Math.max(...records.map((r) => r.year))).toBe(2024);
    expect(records.every((r) => typeof r.value === 'number' && Number.isFinite(r.value))).toBe(true);
  });
});

describe('fetchJson', () => {
  it('saves a successful answer and does not download it again', async () => {
    const { fake } = fakeWorldBank(YEARS, 50);
    vi.stubGlobal('fetch', fake);
    const url = `${BASE}&per_page=50&page=1`;

    const first = await fetchJson(url);
    const second = await fetchJson(url);

    expect(fake).toHaveBeenCalledTimes(1);
    expect(first.fromCache).toBe(false);
    expect(second.fromCache).toBe(true);
    expect(second.response).toEqual(first.response);
  });

  it(`gives up after ${MAX_ATTEMPTS} attempts and saves nothing`, async () => {
    const fake = vi.fn(async () => new Response('Bad Gateway', { status: 502, statusText: 'Bad Gateway' }));
    vi.stubGlobal('fetch', fake);

    await expect(fetchJson(`${BASE}&per_page=50&page=1`)).rejects.toThrow(/after 3 attempts.*HTTP 502/);
    expect(fake).toHaveBeenCalledTimes(MAX_ATTEMPTS);
    expect(readdirSync(cacheDir)).toEqual([]);
  });

  it('retries and succeeds when a later attempt works', async () => {
    let calls = 0;
    const ok = fakeWorldBank(YEARS, 50).fake;
    vi.stubGlobal('fetch', async (url: string) => (++calls === 1 ? new Response('', { status: 502 }) : ok(url)));
    const result = await fetchJson(`${BASE}&per_page=50&page=1`);
    expect(calls).toBe(2);
    expect(result.fromCache).toBe(false);
  });
});
