// Fetching from the World Bank API (v2) and turning the answer into our record schema.
import type { CountryInfo, DataRecord } from '../../src/data/types.ts';
import { COUNTRY, EXPECTED_CURRENCY_UNIT, WDI_SOURCE_ID, type IndicatorConfig } from '../indicators.ts';

import { readCached, writeCached } from './http-cache.ts';

const API = 'https://api.worldbank.org/v2';

/** Every country and aggregate the World Bank lists, with region and income group. Fast. */
export const COUNTRY_LIST_URL = `${API}/country?format=json&per_page=400`;
/** Human-readable page explaining the income classification. */
export const CLASSIFICATION_URL =
  'https://datahelpdesk.worldbank.org/knowledgebase/articles/906519-world-bank-country-and-lending-groups';

/** WDI country metadata (currency unit, special notes) for the given countries. This endpoint is slow. */
export const countryMetaUrl = (countries: readonly string[]) =>
  `${API}/sources/${WDI_SOURCE_ID}/country/${countries.join(';')}/metadata?format=json`;

export interface CountryMeta {
  currencyUnit: string | null;
  specialNotes: string | null;
}

/** Reads the WDI country metadata answer. Throws if its shape is not as expected or a country is missing. */
export function parseCountryMeta(raw: RawResponse, expected: readonly string[]): Map<string, CountryMeta> {
  const r = raw.response as {
    source?: { concept?: { variable?: { id: string; metatype?: { id: string; value: string }[] }[] }[] }[];
  };
  const variables = r?.source?.[0]?.concept?.[0]?.variable;
  if (!Array.isArray(variables)) throw new Error('Country metadata: unexpected response shape');
  const out = new Map<string, CountryMeta>();
  for (const v of variables) {
    if (!v.metatype) continue;
    const get = (id: string) => {
      const value = v.metatype!.find((m) => m.id === id)?.value;
      return value && value.trim() !== '' ? value : null;
    };
    out.set(v.id, { currencyUnit: get('CurrencyUnit'), specialNotes: get('SpecialNotes') });
  }
  for (const id of expected) if (!out.has(id)) throw new Error(`Country metadata: no entry for ${id}`);
  if (!out.get(COUNTRY)?.currencyUnit) throw new Error(`Country metadata for ${COUNTRY}: no CurrencyUnit`);
  return out;
}

interface WbCountry {
  id: string;
  iso2Code: string;
  name: string;
  region: { id: string; value: string };
  incomeLevel: { id: string; value: string };
}

/** Real countries only (aggregates such as "South Asia" have region "NA"). */
export function parseCountryList(raw: RawResponse): CountryInfo[] {
  const [page, rows] = unwrap<WbCountry>(raw.response, 'country list');
  if (rows.length !== page.total) throw new Error(`country list: got ${rows.length} rows; World Bank says ${page.total}`);
  const countries = rows
    .filter((c) => c.region.id !== 'NA')
    .map((c) => ({
      id: c.id,
      iso2: c.iso2Code,
      name: c.name,
      region: c.region.value.trim(),
      income_group: c.incomeLevel.id,
      income_group_name: c.incomeLevel.value.trim(),
    }));
  for (const c of countries) {
    if (!/^[A-Z]{3}$/.test(c.id) || !/^[A-Z0-9]{2}$/.test(c.iso2)) throw new Error(`country list: odd codes ${c.id}/${c.iso2}`);
  }
  if (countries.length < 150) throw new Error(`country list: only ${countries.length} countries; expected about 217`);
  return countries.sort((a, b) => a.id.localeCompare(b.id));
}

export const urls = (code: string) => ({
  /** The JSON we fetch: every year for the given countries, with footnotes (paging is added by fetchAllPages). */
  data: (countries: readonly string[]) => `${API}/country/${countries.join(';')}/indicator/${code}?format=json&footnote=y`,
  /** Every country and aggregate, recent years only (for global ranks). */
  allRecent: (from: number, to: number) => `${API}/country/all/indicator/${code}?format=json&date=${from}:${to}`,
  /** The indicator's own metadata (name, source organisation). */
  meta: `${API}/indicator/${code}?format=json`,
  /** Shorter API link stored in each record for readers who want the raw numbers. */
  apiForRecord: (iso3: string) => `${API}/country/${iso3}/indicator/${code}?format=json`,
  /** Human-readable World Bank page for this indicator, showing the given countries (two-letter codes). */
  page: (iso2s: readonly string[]) => `https://data.worldbank.org/indicator/${code}?locations=${iso2s.join('-')}`,
  /** Official definition page. */
  definition: `https://databank.worldbank.org/metadataglossary/world-development-indicators/series/${code}`,
});

/** One cached API answer, saved in data/raw/ so a build can be reproduced. */
export interface RawResponse {
  retrieved_at: string;
  request_url: string;
  response: unknown;
}

/**
 * Hard limits for every request. The World Bank's own server can take over a minute for
 * a request Cloudflare has no copy of (DECISIONS.md 17, 23). A request that times out
 * usually finishes on their side and is then stored by Cloudflare, so a retry is fast.
 */
export const REQUEST_TIMEOUT_MS = Number(process.env.KAB_TIMEOUT_MS ?? 120_000);
export const MAX_ATTEMPTS = 4;
/** Wait before retry n is RETRY_WAIT_MS × n (20 s, 40 s, 60 s). Tests set KAB_RETRY_WAIT_MS=0. */
const RETRY_WAIT_MS = Number(process.env.KAB_RETRY_WAIT_MS ?? 20_000);

const log = (msg: string) => {
  if (process.env.KAB_QUIET !== '1') console.log(msg);
};

export interface Fetched {
  response: unknown;
  /** Date (Bangladesh time) the answer was actually downloaded. */
  retrievedAt: string;
  fromCache: boolean;
}

/**
 * GET a JSON answer. A successful answer is saved in the response cache and reused
 * instead of downloading again on the same day (see scripts/lib/http-cache.ts).
 * Failed answers are never saved. At most MAX_ATTEMPTS tries of REQUEST_TIMEOUT_MS each.
 */
export async function fetchJson(url: string): Promise<Fetched> {
  const today = todayInDhaka();
  const cached = readCached(url, today);
  if (cached) return { response: cached.response, retrievedAt: cached.retrieved_at, fromCache: true };

  let lastError: unknown;
  for (let i = 1; i <= MAX_ATTEMPTS; i++) {
    const started = Date.now();
    const short = url.replace(API, '').slice(0, 140);
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
      // Cloudflare sits in front of the API. "HIT" = answered from its copy (fast);
      // "MISS"/"EXPIRED" = went through to the World Bank's own server (can be very slow).
      const cdn = res.headers.get('cf-cache-status') ?? '-';
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText} (cdn ${cdn})`.replace(/\s+/g, ' ').trim());
      const response: unknown = await res.json();
      // The World Bank reports some errors as HTTP 200 with a {message} body: do not cache those.
      if (isWbError(response)) throw new Error(`World Bank error: ${JSON.stringify(response).slice(0, 300)}`);
      log(`    ${short}: OK in ${Date.now() - started} ms (cdn ${cdn})`);
      writeCached(url, today, response);
      return { response, retrievedAt: today, fromCache: false };
    } catch (err) {
      lastError = err;
      log(`    ${short}: attempt ${i}/${MAX_ATTEMPTS} failed after ${Date.now() - started} ms: ${errorText(err)}`);
      if (i < MAX_ATTEMPTS) await new Promise((r) => setTimeout(r, RETRY_WAIT_MS * i));
    }
  }
  throw new Error(`Fetch failed after ${MAX_ATTEMPTS} attempts (${REQUEST_TIMEOUT_MS / 1000}s limit each): ${url}: ${errorText(lastError)}`);
}

function isWbError(response: unknown): boolean {
  return Array.isArray(response) && response.length === 1 && typeof response[0] === 'object' && response[0] !== null && 'message' in response[0];
}

function errorText(err: unknown): string {
  if (err instanceof Error) return err.name === 'TimeoutError' ? `timed out after ${REQUEST_TIMEOUT_MS / 1000}s` : err.message;
  return String(err);
}

/**
 * Fetches every page of a World Bank list; each page has its own retries.
 * Returns the list of page answers, unchanged.
 */
export async function fetchAllPages(baseUrl: string, perPage = 20): Promise<{ answers: unknown[]; retrievedAt: string }> {
  const answers: unknown[] = [];
  const dates: string[] = [];
  let pages = 1;
  for (let page = 1; page <= pages; page++) {
    const { response, retrievedAt } = await fetchJson(`${baseUrl}&per_page=${perPage}&page=${page}`);
    const [info] = unwrap<unknown>(response, `page ${page} of ${baseUrl}`);
    pages = info.pages;
    answers.push(response);
    dates.push(retrievedAt);
  }
  // If pages were downloaded on different days, report the earliest date.
  return { answers, retrievedAt: dates.sort()[0]! };
}

interface WbPage {
  page: number;
  pages: number;
  total: number;
  lastupdated?: string;
}
interface WbIndicatorMeta {
  id: string;
  name: string;
  source: { id: string; value: string };
  sourceOrganization: string;
}
interface WbObservation {
  indicator: { id: string };
  countryiso3code: string;
  date: string;
  value: number | null;
  footnote?: string;
}

/** The World Bank returns [ {message: [...]} ] on errors instead of [page, rows]. */
function unwrap<T>(response: unknown, what: string): [WbPage, T[]] {
  if (!Array.isArray(response) || response.length < 2 || !Array.isArray(response[1])) {
    throw new Error(`${what}: unexpected World Bank response: ${JSON.stringify(response).slice(0, 300)}`);
  }
  return [response[0] as WbPage, response[1] as T[]];
}

/**
 * "income" or "consumption", as the publisher's own footnote states it (Poverty and Inequality
 * Platform notes such as "Estimated from unit-record consumption data."). Null if the
 * footnote does not say. Never guessed from the country.
 */
export function measuredBy(footnote: string | undefined): 'income' | 'consumption' | null {
  const m = /Estimated from (?:unit-record|grouped) (consumption|income) data\./.exec(footnote ?? '');
  return m ? (m[1] as 'income' | 'consumption') : null;
}

/** "2026-11-11" style date in Bangladesh time. */
export function todayInDhaka(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka' }).format(now);
}

export interface NormaliseContext {
  /** Countries requested (ISO3). Every row must belong to one of them. */
  countries: readonly string[];
  /** ISO3 → ISO2, for website links. */
  iso2: ReadonlyMap<string, string>;
  /** WDI country metadata for at least Bangladesh and the default peers. */
  countryMeta: ReadonlyMap<string, CountryMeta>;
}

export interface NormaliseResult {
  /** Every published value for every requested country. */
  records: DataRecord[];
  sourceLastUpdated: string | null;
  /** The World Bank's series name, as published. */
  seriesName: string;
  /** Values read from the series name (config.paramsFromName). */
  params: Record<string, string>;
}

/**
 * Turn the two cached responses into records. Throws (never guesses) if anything
 * about the answer is not what we expect.
 */
export function normalise(config: IndicatorConfig, metaRaw: RawResponse, dataRaw: RawResponse, ctx: NormaliseContext): NormaliseResult {
  const bgdCurrency = ctx.countryMeta.get(COUNTRY)?.currencyUnit;
  if ((config.unit === 'taka_current' || config.unit === 'taka_constant') && bgdCurrency !== EXPECTED_CURRENCY_UNIT) {
    throw new Error(`${config.code}: World Bank currency unit for ${COUNTRY} is "${bgdCurrency}", not "${EXPECTED_CURRENCY_UNIT}"`);
  }
  const [, metaRows] = unwrap<WbIndicatorMeta>(metaRaw.response, `${config.code} metadata`);
  const meta = metaRows[0];
  if (!meta || meta.id !== config.code) throw new Error(`${config.code}: metadata missing`);
  if (meta.name !== config.expectedName) {
    throw new Error(
      `${config.code}: World Bank name changed from "${config.expectedName}" to "${meta.name}". ` +
        'The unit or definition may have changed; check before updating scripts/indicators.ts.',
    );
  }
  if (meta.source.id !== WDI_SOURCE_ID) {
    throw new Error(`${config.code}: source is "${meta.source.value}", expected World Development Indicators`);
  }
  const params: Record<string, string> = {};
  for (const [key, re] of Object.entries(config.paramsFromName ?? {})) {
    const m = re.exec(meta.name);
    if (!m?.[1]) throw new Error(`${config.code}: could not read {${key}} from the series name "${meta.name}"`);
    params[key] = m[1];
  }

  // dataRaw.response is a list of page answers (see fetchAllPages). Check that every
  // page is present and the rows add up to the World Bank's stated total.
  if (!Array.isArray(dataRaw.response) || dataRaw.response.length === 0) {
    throw new Error(`${config.code} data: expected a list of page answers`);
  }
  const pages = dataRaw.response.map((p, i) => unwrap<WbObservation>(p, `${config.code} data page ${i + 1}`));
  const first = pages[0]![0];
  const rows = pages.flatMap(([, r]) => r);
  pages.forEach(([p], i) => {
    if (Number(p.page) !== i + 1 || p.pages !== first.pages || p.total !== first.total) {
      throw new Error(`${config.code}: page answers are inconsistent (page ${p.page} of ${p.pages}, total ${p.total})`);
    }
  });
  if (pages.length !== first.pages) throw new Error(`${config.code}: got ${pages.length} of ${first.pages} pages`);
  if (rows.length !== first.total) throw new Error(`${config.code}: got ${rows.length} rows; World Bank says ${first.total}`);

  const wanted = new Set(ctx.countries);
  const u = urls(config.code);
  const records: DataRecord[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    if (row.indicator.id !== config.code || !wanted.has(row.countryiso3code)) {
      throw new Error(`${config.code}: unexpected row ${JSON.stringify(row).slice(0, 200)}`);
    }
    if (!/^\d{4}$/.test(row.date)) throw new Error(`${config.code}: unexpected date "${row.date}"`);
    const key = `${row.countryiso3code}-${row.date}`;
    if (seen.has(key)) throw new Error(`${config.code}: two rows for ${key}`);
    seen.add(key);
    // Missing years stay missing. We never fill them.
    if (row.value === null) continue;
    const iso2 = ctx.iso2.get(row.countryiso3code);
    if (!iso2) throw new Error(`${config.code}: no two-letter code for ${row.countryiso3code}`);
    const special = config.nationalAccounts ? ctx.countryMeta.get(row.countryiso3code)?.specialNotes : null;
    records.push({
      indicator_id: config.id,
      country: row.countryiso3code,
      year: Number(row.date),
      value: row.value,
      unit: config.unit,
      source_name: `World Bank, ${meta.source.value}`,
      original_source: meta.sourceOrganization,
      source_url: u.page([iso2]),
      definition_url: u.definition,
      api_url: u.apiForRecord(row.countryiso3code),
      retrieved_at: dataRaw.retrieved_at,
      notes: [...(special ? [special] : []), ...(row.footnote && row.footnote.trim() !== '' ? [row.footnote] : [])],
      measured_by: measuredBy(row.footnote),
    });
  }
  records.sort((a, b) => a.country.localeCompare(b.country) || a.year - b.year);
  return { records, sourceLastUpdated: first.lastupdated ?? null, seriesName: meta.name, params };
}
