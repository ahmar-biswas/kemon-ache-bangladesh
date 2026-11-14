// Lighthouse (M8, section 8.15): phone profile (Lighthouse's default mobile device and slow 4G)
// on a few pages in both languages, served from dist/ like the host will serve them.
//
//   npm run build && npm run check:lighthouse
//
// Fails if accessibility is under 95 or the homepage loads 300 KB or more of JavaScript (gzipped)
// or 1 MB or more in total without fonts (rule R10). Writes docs/crawl/lighthouse.json.
import { writeFileSync, mkdirSync } from 'node:fs';
import * as chromeLauncher from 'chrome-launcher';
import lighthouse from 'lighthouse';
import { findChrome, serve } from './crawl.ts';

const PAGES = process.argv.slice(2).length ? process.argv.slice(2) : ['/en/', '/bn/', '/en/economy', '/bn/indicator/gdp_pc_taka', '/en/indicator/stunting', '/bn/sources'];

const { server, origin } = await serve();
const chrome = await chromeLauncher.launch({ chromePath: findChrome(), chromeFlags: ['--headless=new', '--no-first-run'] });
const out: Record<string, unknown>[] = [];
let failed = false;
// The first run in a fresh browser is slow for reasons that are not the page's (it starts cold):
// one warm-up run, not counted.
await lighthouse(origin + PAGES[0], { port: chrome.port, output: 'json', logLevel: 'error' });
for (const path of PAGES) {
  const r = await lighthouse(origin + path, { port: chrome.port, output: 'json', logLevel: 'error' });
  const lhr = r!.lhr;
  const items = (lhr.audits['network-requests']?.details as { items?: { resourceType?: string; transferSize?: number; url: string }[] })?.items ?? [];
  const kb = (type?: string, not?: string) =>
    Math.round(items.filter((i) => (!type || i.resourceType === type) && (!not || i.resourceType !== not)).reduce((s, i) => s + (i.transferSize ?? 0), 0) / 102.4) / 10;
  const row = {
    page: path,
    performance: Math.round((lhr.categories.performance?.score ?? 0) * 100),
    accessibility: Math.round((lhr.categories.accessibility?.score ?? 0) * 100),
    best_practices: Math.round((lhr.categories['best-practices']?.score ?? 0) * 100),
    seo: Math.round((lhr.categories.seo?.score ?? 0) * 100),
    lcp_s: Math.round((lhr.audits['largest-contentful-paint']?.numericValue ?? 0) / 100) / 10,
    cls: Math.round((lhr.audits['cumulative-layout-shift']?.numericValue ?? 0) * 1000) / 1000,
    tbt_ms: Math.round(lhr.audits['total-blocking-time']?.numericValue ?? 0),
    js_kb: kb('Script'),
    fonts_kb: kb('Font'),
    total_without_fonts_kb: kb(undefined, 'Font'),
    failing_a11y: Object.values(lhr.audits)
      .filter((a) => a.score !== null && a.score < 1 && (lhr.categories.accessibility?.auditRefs ?? []).some((ref) => ref.id === a.id && ref.weight > 0))
      .map((a) => a.id),
  };
  out.push(row);
  console.log(JSON.stringify(row));
  if (row.accessibility < 95) failed = true;
  if ((path === '/en/' || path === '/bn/') && (row.js_kb >= 300 || row.total_without_fonts_kb >= 1024)) failed = true;
}
chrome.kill();
server.close();
mkdirSync('docs/crawl', { recursive: true });
writeFileSync('docs/crawl/lighthouse.json', JSON.stringify({ checked_at: new Date().toISOString(), profile: 'Lighthouse default mobile (slow 4G, 4x CPU slowdown)', pages: out }, null, 1));
if (failed) {
  console.error('Lighthouse: accessibility under 95, or the homepage is over the R10 budget.');
  process.exit(1);
}
