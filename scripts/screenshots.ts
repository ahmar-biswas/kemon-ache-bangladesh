// Screenshots for the design finish gate (section 8.15): key pages at 360, 768 and 1280 px in
// both languages (first screen, as JPEG), plus the glass fallbacks (backdrop-filter off,
// reduced transparency, forced colours, data saver) on the homepage.
//
//   npm run build && npx tsx scripts/screenshots.ts        → docs/screenshots/
import { mkdirSync, rmSync } from 'node:fs';
import { chromium, type Page } from 'playwright-core';
import { findChrome, serve } from './crawl.ts';

const OUT = 'docs/screenshots';
const PAGES: [string, string][] = [
  ['home', '/'],
  ['economy', '/economy'],
  ['poverty', '/economy/poverty-and-inequality'],
  ['measure', '/indicator/gdp_pc_taka'],
  ['compare', '/compare'],
  ['sources', '/sources'],
  ['404', '/no-such-page'],
];
const WIDTHS = [360, 768, 1280];

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
const { server, origin } = await serve();
const browser = await chromium.launch({ executablePath: findChrome() });

async function open(w: number, url: string, setup?: (p: Page) => Promise<void>, init?: string) {
  const ctx = await browser.newContext({ viewport: { width: w, height: w < 500 ? 780 : w < 1000 ? 1024 : 800 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.addInitScript('window.__name = (f) => f');
  if (init) await page.addInitScript(init);
  if (setup) await setup(page);
  await page.goto(origin + url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1800); // the homepage contour draw-in and the page curtain
  return { page, ctx };
}

for (const lang of ['en', 'bn']) {
  for (const [name, path] of PAGES) {
    for (const w of WIDTHS) {
      const url = `/${lang}${path === '/' ? '/' : path}`;
      const { page, ctx } = await open(w, url);
      await page.screenshot({ path: `${OUT}/${name}-${lang}-${w}.jpg`, type: 'jpeg', quality: 70 });
      // Horizontal overflow check: nothing may be wider than the screen (8.14).
      const wide = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      if (wide > 1) console.log(`  ${url} @${w}: page is ${wide}px wider than the screen`);
      await ctx.close();
    }
  }
}

// The tooltip on the over-time chart, at the right end (where a long note used to overflow).
for (const w of [360, 1280]) {
  const { page, ctx } = await open(w, '/en/indicator/gdp_pc_taka');
  await page.locator('#trend svg[tabindex="0"]').first().focus();
  await page.keyboard.press('ArrowLeft');
  await page.locator('#trend').first().evaluate((el) => el.scrollIntoView());
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${OUT}/tooltip-en-${w}.jpg`, type: 'jpeg', quality: 70 });
  await ctx.close();
}

// Glass fallbacks on the homepage at 1280 px (where glass is strongest).
const fallbacks: [string, ((p: Page) => Promise<void>) | undefined, string | undefined][] = [
  ['normal', undefined, undefined],
  ['no-backdrop-filter', undefined, `document.addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = '*{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}'; document.head.append(s); });`],
  ['reduced-transparency', async (p) => { const c = await p.context().newCDPSession(p); await c.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }] }); }, undefined],
  ['forced-colors', async (p) => { await p.emulateMedia({ forcedColors: 'active' }); }, undefined],
  ['save-data', undefined, `Object.defineProperty(navigator, 'connection', { value: { saveData: true, effectiveType: '4g', addEventListener() {} } });`],
  ['reduced-motion', async (p) => { await p.emulateMedia({ reducedMotion: 'reduce' }); }, undefined],
];
for (const [name, setup, init] of fallbacks) {
  const { page, ctx } = await open(1280, '/en/', setup, init);
  await page.screenshot({ path: `${OUT}/fallback-${name}.jpg`, type: 'jpeg', quality: 70 });
  const cls = await page.evaluate(() => document.documentElement.className);
  console.log(`fallback ${name}: <html class="${cls}">`);
  await ctx.close();
}

await browser.close();
server.close();
console.log(`Screenshots in ${OUT}/`);
