// Fetching from the World Bank API (v2) and turning the answer into our record schema.
import type { DataRecord } from '../../src/data/types.ts';
import {
  COUNTRY,
  COUNTRY_ISO2,
  EXPECTED_CURRENCY_UNIT,
  WDI_SOURCE_ID,
  type IndicatorConfig,
} from '../indicators.ts';

import { readCached, writeCached } from './http-cache.ts';

const API = 'https://api.worldbank.org/v2';

/** WDI country metadata for Bangladesh (currency unit, special notes). This endpoint is slow (a minute or more). */
export const COUNTRY_META_URL = `${API}/sources/${WDI_SOURCE_ID}/country/${COUNTRY}/metadata?format=json`;

export interface CountryMeta {
  currencyUnit: string;
  specialNotes: string | null;
}

/** Reads the WDI country metadata answer. Throws if its shape is not as expected. */
export function parseCountryMeta(raw: RawResponse): CountryMeta {
  const r = raw.response as {
    source?: { concept?: { variable?: { id: string; metatype?: { id: string; value: string }[] }[] }[] }[];
  };
  const variable = r?.source?.[0]?.concept?.[0]?.variable?.find((v) => v.id === COUNTRY);
  if (!variable?.metatype) throw new Error(`Country metadata for ${COUNTRY}: unexpected response shape`);
  const get = (id: string) => variable.metatype!.find((m) => m.id === id)?.value ?? null;
  const currencyUnit = get('CurrencyUnit');
  if (!currencyUnit) throw new Error(`Country metadata for ${COUNTRY}: no CurrencyUnit`);
  const notes = get('SpecialNotes');
  return { currencyUnit, specialNotes: notes && notes.trim() !== '' ? notes : null };
}

export const urls = (code: string) => ({
  /** The JSON we fetch: every year for Bangladesh, with footnotes (paging is added by fetchAllPages). */
  data: `${API}/country/${COUNTRY}/indicator/${code}?format=json&footnote=y`,
  /** The indicator's own metadata (name, source organisation). */
  meta: `${API}/indicator/${code}?format=json`,
  /** Shorter API link stored in each record for readers who want the raw numbers. */
  apiForRecord: `${API}/country/${COUNTRY}/indicator/${code}?format=json`,
  /** Human-readable World Bank page for this indicator, filtered to Bangladesh. */
  page: `https://data.worldbank.org/indicator/${code}?locations=${COUNTRY_ISO2}`,
  /** Official definition page. */
  definition: `https://databank.worldbank.org/metadataglossary/world-development-indicators/series/${code}`,
});

/** One cached API answer, saved in data/raw/ so a build can be reproduced. */
export interface RawResponse {
  retrieved_at: string;
  request_url: string;
  response: unknown;
}

/** Hard limits for every request. */
export const REQUEST_TIMEOUT_MS = 60_000;
export const MAX_ATTEMPTS = 3;
/** Wait before retry n is RETRY_WAIT_MS × n (20 s, then 40 s). Tests set KAB_RETRY_WAIT_MS=0. */
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
    const short = url.replace(API, '');
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
      // A timed-out request often keeps running on the World Bank's server and is then
      // stored by Cloudflare, so waiting a while before retrying usually gets a fast copy.
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
 * Fetches every page of a World Bank list. Small pages are used because the API
 * sometimes answers 502 for large requests; each page has its own retries.
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

/** "2026-11-11" style date in Bangladesh time. */
export function todayInDhaka(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka' }).format(now);
}

export interface NormaliseResult {
  records: DataRecord[];
  sourceLastUpdated: string | null;
}

/**
 * Turn the two cached responses into records. Throws (never guesses) if anything
 * about the answer is not what we expect.
 */
export function normalise(
  config: IndicatorConfig,
  metaRaw: RawResponse,
  dataRaw: RawResponse,
  country: CountryMeta,
): NormaliseResult {
  if (config.unit === 'taka_current' && country.currencyUnit !== EXPECTED_CURRENCY_UNIT) {
    throw new Error(
      `${config.code}: World Bank currency unit for ${COUNTRY} is "${country.currencyUnit}", not "${EXPECTED_CURRENCY_UNIT}"`,
    );
  }
  const countryNotes = config.nationalAccounts && country.specialNotes ? [country.specialNotes] : [];
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
  const page = first;

  const u = urls(config.code);
  const records: DataRecord[] = [];
  for (const row of rows) {
    if (row.indicator.id !== config.code || row.countryiso3code !== COUNTRY) {
      throw new Error(`${config.code}: unexpected row ${JSON.stringify(row).slice(0, 200)}`);
    }
    // Missing years stay missing. We never fill them.
    if (row.value === null) continue;
    const year = Number(row.date);
    if (!/^\d{4}$/.test(row.date)) throw new Error(`${config.code}: unexpected date "${row.date}"`);
    records.push({
      indicator_id: config.id,
      country: COUNTRY,
      year,
      value: row.value,
      unit: config.unit,
      source_name: `World Bank, ${meta.source.value}`,
      original_source: meta.sourceOrganization,
      source_url: u.page,
      definition_url: u.definition,
      api_url: u.apiForRecord,
      retrieved_at: dataRaw.retrieved_at,
      notes: [...countryNotes, ...(row.footnote && row.footnote.trim() !== '' ? [row.footnote] : [])],
      measured_by: null,
    });
  }
  records.sort((a, b) => a.year - b.year);
  return { records, sourceLastUpdated: page.lastupdated ?? null };
}
