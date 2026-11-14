// Published ranks from organisations other than the World Bank (DECISIONS.md 63, 66).
// Each rank is shown exactly as published, with how many countries were ranked.
// File addresses contain the edition year; when a new edition comes out, update the URL
// here (the refresh keeps working on the old edition until then).
import { createHash } from 'node:crypto';
import type { CountryInfo, DataRecord } from '../../src/data/types.ts';
import readXlsx from 'read-excel-file/node';
import { readCached, writeCached } from './http-cache.ts';
import { REQUEST_TIMEOUT_MS, MAX_ATTEMPTS, todayInDhaka } from './worldbank.ts';

export interface ExternalSource {
  id: string;
  url: string;
  /** Publisher and edition, e.g. "UNDP, Human Development Report 2025". */
  source_name: string;
  /** Human-readable page for Bangladesh (or the edition), for the source line. */
  page_url: string;
  definition_url: string;
  licence: string;
  kind: 'csv' | 'xlsx';
}

export const EXTERNAL: ExternalSource[] = [
  {
    id: 'hdi_rank',
    url: 'https://hdr.undp.org/sites/default/files/2025_HDR/HDR25_Composite_indices_complete_time_series.csv',
    source_name: 'UNDP, Human Development Report 2025',
    page_url: 'https://hdr.undp.org/data-center/specific-country-data#/countries/BGD',
    definition_url: 'https://hdr.undp.org/data-center/human-development-index#/indicies/HDI',
    licence: 'CC BY 3.0 IGO',
    kind: 'csv',
  },
  {
    id: 'cpi_rank',
    url: 'https://images.transparencycdn.org/images/CPI2025_Results.xlsx',
    source_name: 'Transparency International, Corruption Perceptions Index 2025',
    page_url: 'https://www.transparency.org/en/cpi/2025',
    definition_url: 'https://www.transparency.org/en/news/how-cpi-scores-are-calculated',
    licence: 'CC BY-ND 4.0',
    kind: 'xlsx',
  },
  {
    id: 'whr_rank',
    url: 'https://files.worldhappiness.report/WHR26_Data_Figure_2.1.xlsx',
    source_name: 'World Happiness Report 2026 (Wellbeing Research Centre, University of Oxford)',
    page_url: 'https://worldhappiness.report/ed/2026/',
    definition_url: 'https://worldhappiness.report/faq/',
    licence: 'No licence stated; shown with the report\'s suggested citation (DECISIONS.md 66)',
    kind: 'xlsx',
  },
  // Added at Ahmar's request (2026-11-14; DECISIONS.md 124): three more published world rankings
  // for "Bangladesh at a glance", in place of GDP, GDP per person and life expectancy, which are
  // already on the homepage tiles.
  {
    id: 'sdg_rank',
    url: 'https://dashboards.sdgindex.org/static/downloads/database_2026.xlsx',
    source_name: 'SDSN, Sustainable Development Report 2026 (SDG Index)',
    page_url: 'https://dashboards.sdgindex.org/profiles/bangladesh',
    definition_url: 'https://dashboards.sdgindex.org/chapters',
    licence: 'CC BY-NC-ND 4.0 (stated in the file)',
    kind: 'xlsx',
  },
  {
    id: 'rsf_rank',
    url: 'https://rsf.org/sites/default/files/import_classement/2026.csv',
    source_name: 'Reporters Without Borders, World Press Freedom Index 2026',
    page_url: 'https://rsf.org/en/country/bangladesh',
    definition_url: 'https://rsf.org/en/methodology-used-compiling-world-press-freedom-index-2026',
    licence: 'No licence stated in the file; shown with credit to RSF (DECISIONS.md 124)',
    kind: 'csv',
  },
  {
    id: 'ghi_rank',
    url: 'https://www.globalhungerindex.org/xlsx/2026.xlsx',
    source_name: 'Global Hunger Index 2026 (Welthungerhilfe, Concern Worldwide, IFHV)',
    page_url: 'https://www.globalhungerindex.org/bangladesh.html',
    definition_url: 'https://www.globalhungerindex.org/methodology.html',
    licence: 'No licence stated in the file; shown with credit to the publishers (DECISIONS.md 124)',
    kind: 'xlsx',
  },
];

/** One published rank for one country and year. */
export interface RankRow {
  country: string;
  year: number;
  rank: number;
  out_of: number;
}

/** The saved copy of a source (data/raw/external/<id>.json): every country's rank, plus where and when. */
export interface ExternalRaw {
  url: string;
  retrieved_at: string;
  sha256: string;
  licence: string;
  rows: RankRow[];
}

/** Download a file (with the same limits as the World Bank fetches). Cached like JSON answers. */
async function fetchFile(url: string): Promise<{ bytes: Buffer; retrievedAt: string }> {
  const today = todayInDhaka();
  const cached = readCached(url, today);
  if (cached) return { bytes: Buffer.from(cached.response as string, 'base64'), retrievedAt: cached.retrieved_at };
  let last: unknown;
  for (let i = 1; i <= MAX_ATTEMPTS; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const bytes = Buffer.from(await res.arrayBuffer());
      writeCached(url, today, bytes.toString('base64'));
      return { bytes, retrievedAt: today };
    } catch (err) {
      last = err;
      if (i < MAX_ATTEMPTS) await new Promise((r) => setTimeout(r, 5_000 * i));
    }
  }
  throw new Error(`Download failed: ${url}: ${last instanceof Error ? last.message : String(last)}`);
}

/** Minimal CSV reader for the UNDP file (quoted fields allowed). */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i]!;
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.length > 1);
}

const need = (cond: unknown, msg: string) => {
  if (!cond) throw new Error(msg);
};

/** UNDP: column hdi_rank_<year>; rows by ISO3. Only real countries (ISO3 in the World Bank list). */
function parseHdi(bytes: Buffer, valid: Set<string>): RankRow[] {
  const [head, ...rows] = parseCsv(bytes.toString('utf8').replace(/^﻿/, ''));
  need(head, 'HDI: empty file');
  const rankCol = head!.findIndex((h) => /^hdi_rank_\d{4}$/.test(h));
  need(rankCol >= 0 && head![0] === 'iso3', `HDI: unexpected columns ${head!.slice(0, 6).join(',')}`);
  const year = Number(head![rankCol]!.slice(-4));
  // "Out of" = every country UNDP ranked (aggregates have no rank); kept rows = World Bank countries.
  const ranked = rows.filter((r) => /^\d+$/.test(r[rankCol] ?? ''));
  return ranked
    .filter((r) => valid.has(r[0]!))
    .map((r) => ({ country: r[0]!, year, rank: Number(r[rankCol]), out_of: ranked.length }));
}

/** Transparency International: sheet "CPI<year>", header row with "ISO3" and "Rank". */
async function parseCpi(bytes: Buffer, valid: Set<string>): Promise<RankRow[]> {
  const sheets = (await readXlsx(bytes)) as unknown as { sheet: string; data: unknown[][] }[];
  const sheet = sheets.find((s) => /^CPI\d{4}$/.test(s.sheet));
  need(sheet, 'CPI: no CPI<year> sheet');
  const year = Number(sheet!.sheet.slice(3));
  const h = sheet!.data.findIndex((r) => r.includes('ISO3') && r.includes('Rank'));
  need(h >= 0, 'CPI: header row with ISO3 and Rank not found');
  const iso = sheet!.data[h]!.indexOf('ISO3');
  const rk = sheet!.data[h]!.indexOf('Rank');
  const body = sheet!.data.slice(h + 1).filter((r) => typeof r[iso] === 'string' && typeof r[rk] === 'number');
  const outOf = body.length; // every country and territory TI ranked that year
  return body.filter((r) => valid.has(r[iso] as string)).map((r) => ({ country: r[iso] as string, year, rank: r[rk] as number, out_of: outOf }));
}

/** World Happiness Report: columns Year, Rank, Country name. Names matched to the World Bank list. */
async function parseWhr(bytes: Buffer, countries: CountryInfo[]): Promise<RankRow[]> {
  const [sheet] = (await readXlsx(bytes)) as unknown as { sheet: string; data: unknown[][] }[];
  need(sheet, 'WHR: no sheet');
  const [head, ...rows] = sheet!.data;
  need(head?.[0] === 'Year' && head?.[1] === 'Rank' && head?.[2] === 'Country name', `WHR: unexpected columns ${JSON.stringify(head?.slice(0, 3))}`);
  const year = Math.max(...rows.map((r) => r[0] as number));
  const latest = rows.filter((r) => r[0] === year && typeof r[1] === 'number');
  const byName = new Map(countries.map((c) => [c.name, c.id]));
  return latest
    .map((r) => ({ id: byName.get(r[2] as string), rank: r[1] as number }))
    .filter((r): r is { id: string; rank: number } => !!r.id)
    .map((r) => ({ country: r.id, year, rank: r.rank, out_of: latest.length }));
}

/** SDSN: sheet "SDR<year> Data", columns "Country Code ISO3" and "<year> SDG Index Rank". */
async function parseSdr(bytes: Buffer, valid: Set<string>): Promise<RankRow[]> {
  const sheets = (await readXlsx(bytes)) as unknown as { sheet: string; data: unknown[][] }[];
  const sheet = sheets.find((s) => /^SDR\d{4} Data$/.test(s.sheet));
  need(sheet, 'SDR: no "SDR<year> Data" sheet');
  const head = sheet!.data[0]!.map(String);
  const iso = head.indexOf('Country Code ISO3');
  const rk = head.findIndex((h) => /^\d{4} SDG Index Rank$/.test(h));
  need(iso >= 0 && rk >= 0, `SDR: unexpected columns ${head.slice(0, 5).join(',')}`);
  const year = Number(head[rk]!.slice(0, 4));
  const ranked = sheet!.data.slice(1).filter((r) => typeof r[rk] === 'number' && typeof r[iso] === 'string');
  return ranked.filter((r) => valid.has(r[iso] as string)).map((r) => ({ country: r[iso] as string, year, rank: r[rk] as number, out_of: ranked.length }));
}

/** RSF: semicolon-separated, columns ISO, Rank and "Year (N)". */
function parseRsf(bytes: Buffer, valid: Set<string>): RankRow[] {
  const lines = bytes
    .toString('latin1')
    .split(/\r?\n/)
    .filter(Boolean)
    .map((l) => l.split(';'));
  const [head, ...rows] = lines;
  need(head, 'RSF: empty file');
  const iso = head!.indexOf('ISO');
  const rk = head!.indexOf('Rank');
  const yr = head!.indexOf('Year (N)');
  need(iso >= 0 && rk >= 0 && yr >= 0, `RSF: unexpected columns ${head!.slice(0, 4).join(',')}`);
  const ranked = rows.filter((r) => /^\d+$/.test(r[rk] ?? '') && /^[A-Z]{3}$/.test(r[iso] ?? ''));
  return ranked.filter((r) => valid.has(r[iso]!)).map((r) => ({ country: r[iso]!, year: Number(r[yr]), rank: Number(r[rk]), out_of: ranked.length }));
}

/** GHI names that differ from the World Bank's. */
const GHI_NAMES: Record<string, string> = {
  Vietnam: 'VNM',
  'Moldova (Rep. of)': 'MDA',
  'Iran (Islamic Republic of)': 'IRN',
  Kyrgyzstan: 'KGZ',
  'Venezuela (Boliv. Rep. of)': 'VEN',
  Egypt: 'EGY',
  'Trinidad & Tobago': 'TTO',
  'Bolivia (Plurinat. State of)': 'BOL',
  Gambia: 'GMB',
  "Côte d'Ivoire": 'CIV',
  'Tanzania (United Rep. of)': 'TZA',
  'Congo (Republic of)': 'COG',
  'Dem. Rep. of the Congo': 'COD',
  Somalia: 'SOM',
};

/**
 * Global Hunger Index: sheet "GHI Ranking <year>", columns Rank, Country. Countries with very
 * low hunger share one collective rank (e.g. "ranked 1-24") and get no single rank here; they
 * still count in "out of".
 */
async function parseGhi(bytes: Buffer, countries: CountryInfo[]): Promise<RankRow[]> {
  const sheets = (await readXlsx(bytes)) as unknown as { sheet: string; data: unknown[][] }[];
  const sheet = sheets.find((s) => /^GHI Ranking \d{4}$/.test(s.sheet.trim()));
  need(sheet, 'GHI: no "GHI Ranking <year>" sheet');
  const year = Number(sheet!.sheet.trim().slice(-4));
  const h = sheet!.data.findIndex((r) => r[2] === 'Country' && /^Rank/.test(String(r[1])));
  need(h >= 0, 'GHI: header row with Rank and Country not found');
  const body = sheet!.data.slice(h + 1).filter((r) => typeof r[2] === 'string' && (r[2] as string).trim() !== '');
  const byName = new Map(countries.map((c) => [c.name, c.id]));
  // Rows marked "*" are countries the GHI could not rank (too little data): not counted.
  const outOf = body.filter((r) => r[1] !== '*').length;
  return body
    .filter((r) => typeof r[1] === 'number')
    .map((r) => {
      const name = (r[2] as string).trim();
      return { id: byName.get(name) ?? GHI_NAMES[name], rank: r[1] as number };
    })
    .filter((r): r is { id: string; rank: number } => !!r.id)
    .map((r) => ({ country: r.id, year, rank: r.rank, out_of: outOf }));
}

export async function fetchExternal(src: ExternalSource, countries: CountryInfo[]): Promise<ExternalRaw> {
  const { bytes, retrievedAt } = await fetchFile(src.url);
  const valid = new Set(countries.map((c) => c.id));
  const parsers: Record<string, () => RankRow[] | Promise<RankRow[]>> = {
    hdi_rank: () => parseHdi(bytes, valid),
    cpi_rank: () => parseCpi(bytes, valid),
    whr_rank: () => parseWhr(bytes, countries),
    sdg_rank: () => parseSdr(bytes, valid),
    rsf_rank: () => parseRsf(bytes, valid),
    ghi_rank: () => parseGhi(bytes, countries),
  };
  need(parsers[src.id], `No parser for ${src.id}`);
  const rows = await parsers[src.id]!();
  return {
    url: src.url,
    retrieved_at: retrievedAt,
    sha256: createHash('sha256').update(bytes).digest('hex'),
    licence: src.licence,
    rows: rows.sort((a, b) => a.country.localeCompare(b.country)),
  };
}

/** Records for Bangladesh and the peers, in the shared record schema (unit "rank"). */
export function rankRecords(src: ExternalSource, raw: ExternalRaw, keep: readonly string[]): DataRecord[] {
  return raw.rows
    .filter((r) => keep.includes(r.country))
    .map((r) => ({
      indicator_id: src.id,
      country: r.country,
      year: r.year,
      value: r.rank,
      unit: 'rank' as const,
      source_name: src.source_name,
      original_source: src.source_name,
      source_url: src.page_url,
      definition_url: src.definition_url,
      api_url: src.url,
      retrieved_at: raw.retrieved_at,
      notes: [],
      measured_by: null,
      out_of: r.out_of,
    }));
}

/** Checks a published-rank file before anything is written. Returns problems (empty = fine). */
export function validateExternal(src: ExternalSource, raw: ExternalRaw, keep: readonly string[]): string[] {
  const p: string[] = [];
  // The GHI ranks only low- and middle-income countries, and gives the lowest-hunger ones a
  // shared rank, so fewer single ranks are expected.
  const min = src.id === 'ghi_rank' ? 80 : 100;
  if (raw.rows.length < min) p.push(`${src.id}: only ${raw.rows.length} countries ranked`);
  for (const id of keep) if (!raw.rows.some((r) => r.country === id)) p.push(`${src.id}: no rank for ${id}`);
  for (const r of raw.rows) {
    if (!Number.isInteger(r.rank) || r.rank < 1 || r.rank > r.out_of) p.push(`${src.id} ${r.country}: rank ${r.rank} of ${r.out_of}`);
  }
  return p;
}
