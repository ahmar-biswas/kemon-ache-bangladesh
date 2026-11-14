// Accessibility check (M8, section 8.15): runs axe-core (WCAG 2.1 A and AA rules) on every built
// page in both languages, at desktop width (1280 px) and phone width (360 px), in Chrome.
//
//   npm run build && npm run check:a11y
//
// Fails on any violation. Writes docs/crawl/a11y-last-run.txt.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright-core';
import { findChrome, pages, serve } from './crawl.ts';

const require = createRequire(import.meta.url);
const AXE = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const WIDTHS = [1280, 360];

type Hit = { id: string; impact: string; help: string; nodes: string[] };

const { server, origin } = await serve();
const browser = await chromium.launch({ executablePath: findChrome(), headless: true });
const list = pages();
const found = new Map<string, { hit: Hit; pages: Set<string> }>();
let next = 0;
const jobs = list.flatMap((url) => WIDTHS.map((w) => ({ url, w })));

const worker = async () => {
  while (next < jobs.length) {
    const { url, w } = jobs[next++]!;
    const ctx = await browser.newContext({ viewport: { width: w, height: w < 500 ? 780 : 900 } });
    const page = await ctx.newPage();
    try {
      await page.goto(origin + url, { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForSelector('main h1', { timeout: 20000 });
      await page.waitForFunction(() => !document.querySelector('main .loading, .snapshot--loading, .curtain'), null, { timeout: 20000 }).catch(() => {});
      await page.waitForTimeout(1200); // the page-change curtain
      await page.addScriptTag({ content: AXE });
      const hits: Hit[] = await page.evaluate(`(async () => {
        const r = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } });
        return r.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help,
          nodes: v.nodes.slice(0, 3).map((n) => n.target.join(' ') + ' :: ' + (n.failureSummary || '').split('\\n').slice(1, 2).join(' ')) }));
      })()`);
      for (const h of hits) {
        const key = `${h.id}|${h.nodes[0] ?? ''}`;
        if (!found.has(key)) found.set(key, { hit: h, pages: new Set() });
        found.get(key)!.pages.add(`${url} @${w}`);
      }
    } catch (e) {
      const key = `load|${url}`;
      found.set(key, { hit: { id: 'page did not load', impact: 'serious', help: (e as Error).message.split('\n')[0]!, nodes: [] }, pages: new Set([`${url} @${w}`]) });
    } finally {
      await ctx.close();
    }
  }
};
console.log(`axe: ${jobs.length} page views…`);
await Promise.all(Array.from({ length: 4 }, worker));
await browser.close();
server.close();

const lines = [...found.values()]
  .sort((a, b) => b.pages.size - a.pages.size)
  .map(({ hit, pages: ps }) => `[${hit.impact}] ${hit.id}: ${hit.help}\n    ${hit.nodes.join('\n    ')}\n    on ${ps.size} view(s): ${[...ps].slice(0, 4).join(', ')}${ps.size > 4 ? ', …' : ''}`);
mkdirSync(resolve('docs/crawl'), { recursive: true });
writeFileSync(join('docs/crawl', 'a11y-last-run.txt'), `${new Date().toISOString()}\n${jobs.length} page views (${list.length} pages × ${WIDTHS.join(' and ')} px)\n\n${lines.join('\n') || 'No violations.'}\n`);
if (lines.length) {
  console.error(lines.join('\n'));
  console.error(`\n${lines.length} distinct accessibility problems. Full list: docs/crawl/a11y-last-run.txt`);
  process.exit(1);
}
console.log('Accessibility check passed: no WCAG 2.1 AA violations found by axe.');
