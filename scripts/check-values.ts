// Hand check of displayed values (M8 step 3, section 16): picks 20 values the site shows, with a
// fixed seed so the same 20 come up again, and fetches each World Bank value again from the
// World Bank API (the source the site links to). Ranking values (SDG, press freedom, hunger,
// HDI, happiness, corruption) come from report pages and files, not an API: they are listed
// for checking by eye against the linked page.
//
//   npx tsx scripts/check-values.ts            writes docs/crawl/value-check.json
//
// Picks: 12 Bangladesh values (any year shown on the over-time charts), 4 comparison-country
// values, and 4 "newest value" figures for other countries (Compare and the Sources page).
// The six Bangladesh rankings are always added for the eye check (they are few).
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';

const SEED = 20261114;
function rng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (Math.imul(s ^ (s >>> 15), 1 | s) + 0x6d2b79f5) >>> 0) / 2 ** 32);
}
const rand = rng(SEED);
const pick = <T>(xs: T[]) => xs[Math.floor(rand() * xs.length)]!;

type Rec = { indicator_id: string; country: string; year: number; value: number; source_name?: string; source_url: string; api_url?: string; out_of?: number };
const WDI = 'World Bank, World Development Indicators';
const series: Rec[] = [];
const ranks: Rec[] = [];
for (const f of readdirSync('data/processed')) {
  if (!f.endsWith('.json')) continue;
  const d = JSON.parse(readFileSync(`data/processed/${f}`, 'utf8'));
  if (!Array.isArray(d)) continue;
  for (const r of d as Rec[]) {
    if (typeof r.value !== 'number') continue;
    if (r.source_name === WDI) series.push(r);
    else if (r.country === 'BGD' && r.indicator_id.endsWith('_rank')) ranks.push(r);
  }
}
const world: (Rec & { code: string })[] = [];
for (const f of readdirSync('data/processed/world')) {
  const d = JSON.parse(readFileSync(`data/processed/world/${f}`, 'utf8')) as { indicator_id: string; code: string; rows: Rec[] };
  for (const r of d.rows) if (typeof r.value === 'number' && r.country !== 'BGD') world.push({ ...r, indicator_id: d.indicator_id, code: d.code });
}

const codeOf = (r: Rec) => /indicator\/([A-Z0-9._]+)/.exec(r.source_url)?.[1] ?? (r as { code?: string }).code;
const chosen: (Rec & { group: string })[] = [];
const seen = new Set<string>();
const take = (from: Rec[], n: number, group: string) => {
  while (chosen.filter((c) => c.group === group).length < n) {
    const r = pick(from);
    const k = `${r.indicator_id}|${r.country}|${r.year}`;
    // One value per measure in each group, so the 20 cover many measures.
    if (seen.has(k) || chosen.some((c) => c.group === group && c.indicator_id === r.indicator_id)) continue;
    seen.add(k);
    chosen.push({ ...r, group });
  }
};
take(series.filter((r) => r.country === 'BGD'), 12, 'Bangladesh');
take(series.filter((r) => r.country !== 'BGD'), 4, 'Comparison country');
take(world, 4, 'Newest value, other country');

const results = [];
for (const c of chosen) {
  const code = codeOf(c)!;
  const url = `https://api.worldbank.org/v2/country/${c.country}/indicator/${code}?date=${c.year}&format=json`;
  let published: number | null = null;
  let status = '';
  for (let attempt = 0; attempt < 4 && !status; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(120000) });
      if (res.status >= 500) continue;
      const body = (await res.json()) as [unknown, { value: number | null }[] | null];
      published = body[1]?.[0]?.value ?? null;
      status = published === null ? 'not in the API' : Math.abs(published - c.value) < 1e-9 * Math.max(1, Math.abs(published)) ? 'match' : 'MISMATCH';
    } catch (e) {
      status = '';
      if (attempt === 3) status = `error: ${(e as Error).message}`;
    }
  }
  if (!status) status = 'error: server did not answer';
  results.push({ group: c.group, indicator: c.indicator_id, code, country: c.country, year: c.year, site_value: c.value, published, status, check_url: url, page_url: c.source_url });
  console.log(`${status.padEnd(8)} ${c.indicator_id} ${c.country} ${c.year}: site ${c.value}, source ${published}`);
}
const eye = ranks.map((r) => ({ group: 'Ranking (check by eye)', indicator: r.indicator_id, country: r.country, year: r.year, site_value: r.value, out_of: r.out_of, page_url: r.source_url }));
mkdirSync('docs/crawl', { recursive: true });
writeFileSync('docs/crawl/value-check.json', JSON.stringify({ seed: SEED, checked_at: new Date().toISOString(), results, eye }, null, 1));
