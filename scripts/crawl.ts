// Site crawl (M8, section 16): opens every built page in both languages in a real browser
// (the Chrome or Edge already on this computer, driven by playwright-core) and fails on:
//   - a value, chart or table without a full source line (source link, data year, retrieved date)  R1, R2
//   - a missing translation: English words or digits on a Bangla page, Bangla on an English page,
//     an unfilled {placeholder} or a raw translation key                                          R7
//   - a broken link inside the site (a page or #anchor that does not exist)
//   - a banned judgement word, in English or Bangla                                               R5
//
//   npm run build && npm run check:crawl          site pages, internal links (used in CI)
//   npm run check:crawl -- --external              also tries every outside link once (slow; not in CI,
//                                                   because the World Bank server is sometimes down)
//
// Text the site shows as published by the source (rule R8 notes, survey titles, text marked lang="en")
// is left out of the language and wording checks; see ALLOWED below.
import { createServer, type Server } from 'node:http';
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import { chromium, type Browser } from 'playwright-core';

const DIST = resolve(process.env.CRAWL_DIST ?? 'dist');
const EXTERNAL = process.argv.includes('--external');
const REPORT_DIR = resolve('docs/crawl');

// ---------- Banned judgement words (R5, 16-acceptance). Whole words, any case. ----------
export const BANNED_EN = [
  'good', 'bad', 'better', 'worse', 'best', 'worst', 'alarming', 'impressive', 'failing', 'failure', 'fail', 'failed',
  'success', 'successful', 'crisis', 'crises', 'excellent', 'terrible', 'poor performance', 'improve', 'improved',
  'improvement', 'deteriorate', 'deteriorated', 'deterioration', 'shocking', 'disappointing', 'remarkable', 'outstanding',
  'lagging', 'laggard', 'champion', 'dismal', 'worrying', 'concerning', 'encouraging', 'promising',
];
export const BANNED_BN = [
  'ভালো', 'ভাল', 'খারাপ', 'সংকট', 'সঙ্কট', 'সফল', 'সাফল্য', 'ব্যর্থ', 'উদ্বেগজনক', 'চমৎকার', 'ভয়াবহ', 'শোচনীয়',
  'অবনতি', 'উন্নতি', 'দুর্দান্ত', 'নাজুক', 'সেরা', 'নিকৃষ্ট', 'হতাশাজনক', 'আশাব্যঞ্জক', 'চিন্তাজনক', 'উৎসাহব্যঞ্জক',
];

// ---------- Allowed: text that is not the site's own judgement ----------
// 1. Publisher notes (R8) and the About page sentence that states the rule itself.
const en = JSON.parse(readFileSync('src/i18n/en.json', 'utf8')) as Record<string, string>;
const bn = JSON.parse(readFileSync('src/i18n/bn.json', 'utf8')) as Record<string, string>;
const quotedKeys = (k: string) => k.startsWith('note.') || k === 'about.rules.p4';
const toPattern = (s: string) =>
  s.replace(/[.*+?^$()|[\]\\]/g, '\\$&').replace(/\\?\{\w+\\?\}|\{\w+\}/g, '[^]{0,80}?');
const ALLOWED_TEXT = [...Object.entries(en), ...Object.entries(bn)]
  .filter(([k]) => quotedKeys(k))
  .map(([, v]) => toPattern(v));

// 2. Latin-script words that are correct on a Bangla page: abbreviations and codes the site shows
//    as published (DECISIONS.md), the site's own English name, and the CSV file type.
const LATIN_OK_ON_BN = new Set([
  'US', 'CSV', 'PPP', 'SDG', 'UIS', 'WDI', 'PIP', 'API', 'ILO', 'WHO', 'UN', 'UNESCO', 'UNICEF', 'IMF', 'GDP', 'HDI',
  'CY', 'FY', 'PM', 'BBS', 'HIES', 'DHS', 'MICS', 'RSF', 'GHI', 'SDSN', 'UNDP', 'CPI', 'TI', 'IHME', 'JME', 'ID',
]);

type Problem = { page: string; kind: string; detail: string };
const problems: Problem[] = [];
const externalLinks = new Map<string, Set<string>>();

// ---------- A tiny static server for dist/, like the host will be (folder → index.html) ----------
const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.webp': 'image/webp',
  '.ico': 'image/x-icon', '.txt': 'text/plain', '.csv': 'text/csv',
};
function fileFor(urlPath: string): string | null {
  const clean = decodeURIComponent(urlPath.split(/[?#]/)[0]!);
  const p = join(DIST, clean);
  if (!p.startsWith(DIST)) return null;
  if (existsSync(p) && statSync(p).isFile()) return p;
  if (existsSync(join(p, 'index.html'))) return join(p, 'index.html');
  return null;
}
export function serve(): Promise<{ server: Server; origin: string }> {
  const server = createServer((req, res) => {
    const file = fileFor(req.url ?? '/');
    const type = TYPES[extname(file ?? '404.html')] ?? 'application/octet-stream';
    let body = readFileSync(file ?? join(DIST, '404.html'));
    // Compress text like the host will (GitHub Pages and Cloudflare Pages both gzip), so sizes are real.
    const gzip = /text|javascript|json|svg/.test(type) && /gzip/.test(String(req.headers['accept-encoding'] ?? ''));
    if (gzip) body = gzipSync(body);
    res.writeHead(file ? 200 : 404, { 'content-type': type, ...(gzip ? { 'content-encoding': 'gzip' } : {}), 'cache-control': 'max-age=3600' });
    res.end(body);
  });
  return new Promise((ok) => server.listen(0, '127.0.0.1', () => {
    const a = server.address();
    ok({ server, origin: `http://127.0.0.1:${typeof a === 'object' && a ? a.port : 0}` });
  }));
}

export function pages(): string[] {
  const out: string[] = [];
  const walk = (dir: string, url: string) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) walk(p, `${url}${name}/`);
      else if (name === 'index.html') out.push(url);
    }
  };
  for (const lang of ['en', 'bn']) walk(join(DIST, lang), `/${lang}/`);
  // Pre-rendered URLs have no trailing slash except the homepage.
  return [...out.map((u) => (u === '/en/' || u === '/bn/' ? u : u.replace(/\/$/, ''))), '/en/no-such-page', '/bn/no-such-page'];
}

export function findChrome(): string {
  const candidates = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ].filter(Boolean) as string[];
  const found = candidates.find((c) => existsSync(c));
  if (!found) throw new Error('No Chrome or Edge found. Set CHROME_PATH to a Chromium-based browser.');
  return found;
}

/** What the page script returns. Runs inside the browser. */
type PageReport = { figures: string[]; text: string; attrs: string[]; links: string[]; ids: string[]; lang: string; values: number };

async function inspect(browser: Browser, origin: string, url: string) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  // tsx keeps function names with a __name() helper; give the page one so evaluate() runs.
  await page.addInitScript('window.__name = (f) => f');
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('requestfailed', (q) => errors.push(`request failed: ${q.url().slice(0, 120)} (${q.failure()?.errorText})`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  try {
    await page.goto(origin + url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForSelector('main h1', { timeout: 20000 });
    await page.waitForFunction(() => !document.querySelector('main .loading, .snapshot--loading'), null, { timeout: 20000 });
    // Let the page-change curtain finish so it is not read as page text.
    await page.waitForTimeout(300);

    const r: PageReport = await page.evaluate(() => {
      const figures: string[] = [];
      const label = (el: Element) => (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 60);
      // R1/R2: every value, chart and table sits in a figure with a complete source line.
      const things = document.querySelectorAll('main [data-value], main svg[role="img"], main table');
      for (const el of things) {
        const fig = el.closest('[data-figure]');
        if (!fig) { figures.push(`not in a figure: ${el.tagName.toLowerCase()} "${label(el)}"`); continue; }
        const lines = fig.querySelectorAll('[data-source-line]');
        if (!lines.length) { figures.push(`no source line: "${label(fig)}"`); continue; }
        for (const line of lines) {
          const a = line.querySelector('a');
          if (!a || !/^https:\/\/\S+$/.test(a.getAttribute('href') ?? '') || !a.textContent?.trim()) figures.push(`source line without a working link: "${label(line)}"`);
          if (!line.querySelector('[data-source-year]')?.textContent?.trim()) figures.push(`value without a data year: "${label(fig)}"`);
          if (!line.querySelector('[data-source-retrieved]')?.textContent?.trim()) figures.push(`no retrieved date: "${label(fig)}"`);
        }
      }
      // Visible text, with other-language parts marked by lang="…" left out by the caller.
      const clone = document.body.cloneNode(true) as HTMLElement;
      for (const el of clone.querySelectorAll('script, style, noscript, template, [hidden], [aria-hidden="true"] title')) el.remove();
      const pageLang = document.documentElement.lang;
      for (const el of clone.querySelectorAll('[lang]')) if (el.getAttribute('lang') !== pageLang) el.replaceWith(' ');
      for (const el of clone.querySelectorAll('[data-code]')) el.replaceWith(' ');
      const blocks: string[] = [];
      const walker = document.createTreeWalker(clone, NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode(); n; n = walker.nextNode()) blocks.push(n.textContent ?? '');
      const attrs: string[] = [];
      for (const el of document.querySelectorAll('[aria-label], [title], [alt], [placeholder], [aria-description]')) {
        if (el.closest('[lang]')?.getAttribute('lang') !== pageLang || el.closest('[data-code]')) continue;
        for (const a of ['aria-label', 'title', 'alt', 'placeholder', 'aria-description']) {
          const v = el.getAttribute(a);
          if (v) attrs.push(v);
        }
      }
      return {
        figures,
        text: blocks.join(' ').replace(/\s+/g, ' '),
        attrs,
        links: [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')!),
        ids: [...document.querySelectorAll('[id]')].map((e) => e.id),
        lang: pageLang,
        values: document.querySelectorAll('main [data-value]').length,
      };
    });
    return { r, errors };
  } finally {
    await ctx.close();
  }
}

function stripAllowed(text: string): string {
  // Survey titles are shown as published (in English) after a translated label (DECISIONS, M2).
  let t = text.replace(/উৎস \(প্রকাশিত শিরোনাম অনুযায়ী\): [^ঀ-৿]*/g, ' ');
  for (const p of ALLOWED_TEXT) t = t.replace(new RegExp(p, 'g'), ' ');
  return t;
}

function checkText(url: string, lang: string, text: string, attrs: string[]) {
  const add = (kind: string, detail: string) => problems.push({ page: url, kind, detail });
  const all = [text, ...attrs];
  for (const s of all) {
    const ph = s.match(/\{\w+\}/);
    if (ph) add('translation', `unfilled placeholder ${ph[0]} in "${s.slice(0, 80)}"`);
    const key = s.match(/\b(?:home|site|source|indicator|note|unit|explain|nav|chart|area|badge|peers|caveat|money|derived|median|direction|about|how|compare|states?|trend|glance)\.[a-z0-9_]+(?:\.[a-z0-9_]+)*\b/);
    if (key) add('translation', `raw translation key "${key[0]}"`);
  }
  const own = all.map(stripAllowed);
  const around = (s: string, i: number, len: number) => s.slice(Math.max(0, i - 30), i + len + 30).trim();
  if (lang === 'bn') {
    for (const s of own) {
      // A run of Latin-script words is one problem, unless every word is an allowed abbreviation.
      for (const m of s.matchAll(/[A-Za-z][\w'’.,:;()[\]/–-]*(?:\s+[A-Za-z0-9][\w'’.,:;()[\]/–-]*)*/g)) {
        const words = m[0].match(/[A-Za-z]+/g) ?? [];
        if (words.every((w) => w.length < 2 || LATIN_OK_ON_BN.has(w))) continue;
        add('translation', `English on a Bangla page: "${around(s, m.index!, m[0].length)}"`);
      }
      // English digits (R7). PM2.5 is the pollutant's name.
      for (const m of s.replace(/PM\s?2\.5/g, 'PM').matchAll(/[0-9][0-9.,]*/g)) {
        add('translation', `English digits on a Bangla page: "${around(s, m.index!, m[0].length)}"`);
      }
    }
  } else {
    for (const s of own) {
      // ৳ (U+09F3) is the taka sign, used in English too.
      for (const m of s.matchAll(/[ঀ-৲৴-৿]+/g)) {
        add('translation', `Bangla on an English page without lang="bn": "${around(s, m.index!, m[0].length)}"`);
      }
    }
  }
  // R5: banned words, both lists on every page (a quoted English word on a Bangla page counts too).
  for (const s of own) {
    for (const w of BANNED_EN) {
      for (const m of s.matchAll(new RegExp(`\\b${w}\\b`, 'gi'))) add('wording', `"${w}": "…${around(s, m.index!, w.length)}…"`);
    }
    for (const w of BANNED_BN) {
      for (let i = s.indexOf(w); i >= 0; i = s.indexOf(w, i + 1)) add('wording', `"${w}": "…${around(s, i, w.length)}…"`);
    }
  }
}

function checkLinks(url: string, links: string[], ids: string[], idsByPage: Map<string, string[]>) {
  for (const href of links) {
    if (/^(mailto|tel|blob|data|javascript):/.test(href)) continue;
    if (/^https?:\/\//.test(href) && !href.startsWith('http://127.0.0.1')) {
      if (!externalLinks.has(href)) externalLinks.set(href, new Set());
      externalLinks.get(href)!.add(url);
      continue;
    }
    const target = new URL(href, `http://site${url}`);
    const [path, hash] = [target.pathname, target.hash.slice(1)];
    if (path !== new URL(`http://site${url}`).pathname) {
      // The 404 page's language switch keeps the unknown address, on purpose.
      if (/no-such-page/.test(path) && url.includes('no-such-page')) continue;
      if (!fileFor(path) || /no-such-page/.test(path)) problems.push({ page: url, kind: 'link', detail: `broken link to ${href}` });
      else if (hash) {
        const other = idsByPage.get(path.replace(/\/$/, '') || path);
        if (other && !other.includes(decodeURIComponent(hash))) problems.push({ page: url, kind: 'link', detail: `link to missing anchor ${href}` });
      }
    } else if (hash && !ids.includes(decodeURIComponent(hash))) {
      problems.push({ page: url, kind: 'link', detail: `link to missing anchor #${hash}` });
    }
  }
}

async function checkExternal() {
  const results: { url: string; status: string; pages: string[] }[] = [];
  const total = externalLinks.size;
  const wait = (ms: number) => new Promise((ok) => setTimeout(ok, ms));
  // One queue per server, one request at a time, a pause between requests: the World Bank
  // site answers 429 (too many requests) to anything faster.
  const byHost = new Map<string, string[]>();
  for (const url of externalLinks.keys()) {
    const host = new URL(url).host;
    byHost.set(host, [...(byHost.get(host) ?? []), url]);
  }
  const queue = async (urls: string[]) => {
    for (const url of urls) {
      let status = '';
      for (let attempt = 0; attempt < 4; attempt++) {
        try {
          const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(120000), headers: { 'user-agent': 'Mozilla/5.0 (site link check)' } });
          status = String(res.status);
          await res.body?.cancel();
          if (res.status === 429) { await wait(30000); continue; }
          if (res.status < 500) break;
        } catch (e) {
          status = `error: ${(e as Error).message}`;
        }
        await wait(5000 * (attempt + 1));
      }
      results.push({ url, status, pages: [...externalLinks.get(url)!].slice(0, 3) });
      if (results.length % 25 === 0) console.log(`  outside links: ${results.length}/${total}`);
      await wait(1500);
    }
  };
  await Promise.all([...byHost.values()].map(queue));
  return results;
}

async function main() {
  if (!existsSync(join(DIST, 'en', 'index.html'))) throw new Error('No built site. Run `npm run build` first.');
  const { server, origin } = await serve();
  const browser = await chromium.launch({ executablePath: findChrome(), headless: true });
  const list = pages();
  console.log(`Crawling ${list.length} pages…`);
  const reports = new Map<string, PageReport>();
  let next = 0;
  const worker = async () => {
    while (next < list.length) {
      const url = list[next++]!;
      try {
        let { r, errors } = await inspect(browser, origin, url);
        // A network change on this computer (Wi-Fi) is not a site problem: try the page once more.
        if (errors.some((e) => e.includes('ERR_NETWORK_CHANGED'))) ({ r, errors } = await inspect(browser, origin, url));
        reports.set(url, r);
        for (const f of r.figures) problems.push({ page: url, kind: 'source', detail: f });
        for (const e of errors) if (!/404 \(Not Found\)/.test(e) || !url.includes('no-such-page')) problems.push({ page: url, kind: 'script error', detail: e.slice(0, 200) });
        const expected = url.startsWith('/bn') ? 'bn' : 'en';
        if (r.lang !== expected) problems.push({ page: url, kind: 'translation', detail: `<html lang="${r.lang}">, expected "${expected}"` });
        checkText(url, r.lang, r.text, r.attrs);
      } catch (e) {
        problems.push({ page: url, kind: 'load', detail: (e as Error).message.split('\n')[0]! });
      }
    }
  };
  await Promise.all(Array.from({ length: 4 }, worker));
  const idsByPage = new Map([...reports].map(([u, r]) => [u, r.ids]));
  for (const [url, r] of reports) checkLinks(url, r.links, r.ids, idsByPage);
  const values = [...reports.values()].reduce((s, r) => s + r.values, 0);

  mkdirSync(REPORT_DIR, { recursive: true });
  if (EXTERNAL) {
    console.log(`Trying ${externalLinks.size} outside links…`);
    const ext = await checkExternal();
    writeFileSync(join(REPORT_DIR, 'external-links.json'), JSON.stringify(ext.sort((a, b) => a.url.localeCompare(b.url)), null, 1));
    const bad = ext.filter((e) => !/^[23]\d\d$/.test(e.status));
    for (const b of bad) problems.push({ page: b.pages[0]!, kind: 'outside link', detail: `${b.status} ${b.url}` });
  }
  await browser.close();
  server.close();

  // One line per distinct problem (the same text often repeats on many pages).
  const grouped = new Map<string, string[]>();
  for (const p of problems) {
    const k = `[${p.kind}] ${p.detail}`;
    grouped.set(k, [...(grouped.get(k) ?? []), p.page]);
  }
  const lines = [...grouped].map(([k, ps]) => `${k}\n    on ${ps.length} page(s): ${ps.slice(0, 4).join(', ')}${ps.length > 4 ? ', …' : ''}`);
  writeFileSync(join(REPORT_DIR, 'last-run.txt'), `${new Date().toISOString()}\n${list.length} pages, ${values} values, ${externalLinks.size} outside links\n\n${lines.join('\n') || 'No problems.'}\n`);
  console.log(`${list.length} pages, ${values} values checked, ${externalLinks.size} distinct outside links.`);
  if (lines.length) {
    console.error(lines.join('\n'));
    console.error(`\n${grouped.size} distinct problems (${problems.length} in all). Full list: docs/crawl/last-run.txt`);
    process.exit(1);
  }
  console.log('Crawl passed: every value has a full source line; no missing translations, broken links or banned words.');
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/').replace(/^(?=[A-Za-z]:)/, '/')}` || process.argv[1]?.endsWith('crawl.ts')) {
  await main();
}
