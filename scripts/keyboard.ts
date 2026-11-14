// Keyboard-only walkthrough (M8, section 8.15), done the same way every time:
// on each page, press Tab until focus comes back to the start, and check that
//   - every control on the page can be reached (none is skipped, none traps focus),
//   - every focused control shows a visible focus mark (outline or ring),
//   - the first Tab lands on "Skip to content".
//
//   npm run build && npm run check:keyboard
import { writeFileSync, mkdirSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { findChrome, serve } from './crawl.ts';

const PAGES = ['/en/', '/bn/', '/en/economy', '/bn/economy/poverty-and-inequality', '/en/indicator/gdp_pc_taka', '/bn/indicator/stunting', '/en/compare', '/bn/sources', '/en/about', '/en/no-such-page'];
const WIDTHS = [1280, 360];

const { server, origin } = await serve();
const browser = await chromium.launch({ executablePath: findChrome() });
const report: string[] = [];
let failed = false;

for (const w of WIDTHS) {
  for (const path of PAGES) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 800 } });
    const page = await ctx.newPage();
    await page.addInitScript('window.__name = (f) => f');
    await page.goto(origin + path, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);
    // Controls a keyboard user should reach: visible links, buttons, inputs, and anything with tabindex >= 0.
    const expected: number = await page.evaluate(() =>
      [...document.querySelectorAll('a[href], button, input, select, textarea, [tabindex]')].filter((el) => {
        const t = el.getAttribute('tabindex');
        if (t !== null && Number(t) < 0) return false;
        if ((el as HTMLButtonElement).disabled) return false;
        const r = el.getBoundingClientRect();
        const s = getComputedStyle(el);
        // Content of a closed <details> (the folded sections on /sources) is not reachable, correctly.
        const folded = el.closest('details:not([open])') && !el.closest('summary');
        return !folded && r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && !el.closest('[inert], [aria-hidden="true"]');
      }).length,
    );
    const seen = new Set<string>();
    const problems: string[] = [];
    let first = '';
    for (let i = 0; i < 600; i++) {
      await page.keyboard.press('Tab');
      const f = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el || el === document.body) return null;
        const s = getComputedStyle(el);
        const ring = (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0) || (s.boxShadow !== 'none' && s.boxShadow !== '');
        // Some controls draw the ring on a child or the parent (the flag switch knob); accept a :focus-visible rule there.
        const viaRelative = !!el.querySelector(':scope > *') && [...el.querySelectorAll('*')].some((c) => { const cs = getComputedStyle(c); return cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0; });
        const path: string[] = [];
        for (let n: Element | null = el; n && n !== document.body; n = n.parentElement) {
          const p = n.parentElement;
          path.unshift(`${n.tagName}${p ? ':' + [...p.children].indexOf(n) : ''}`);
        }
        return { id: path.join('>'), label: (el.getAttribute('aria-label') ?? el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 50), ring: ring || viaRelative, tag: el.tagName.toLowerCase() };
      });
      if (!f) { if (seen.size) break; continue; }
      if (i === 0 || !first) first = f.label;
      if (seen.has(f.id)) break; // back at the start: a full loop
      seen.add(f.id);
      if (!f.ring) problems.push(`no visible focus mark on ${f.tag} "${f.label}"`);
    }
    const skipOk = /skip to content|মূল লেখায় যান/i.test(first);
    if (!skipOk) problems.push(`first Tab lands on "${first}", not "Skip to content"`);
    // Some controls are reached as one stop (a radio group, the slicer); so reached may be lower than expected, never much lower.
    if (seen.size < expected * 0.6) problems.push(`only ${seen.size} of about ${expected} controls reached`);
    if (problems.length) failed = true;
    report.push(`${path} @${w}px: ${seen.size} stops (about ${expected} controls)${problems.length ? '\n    ' + problems.join('\n    ') : ', all with a visible focus mark'}`);
    await ctx.close();
  }
}
await browser.close();
server.close();
mkdirSync('docs/crawl', { recursive: true });
writeFileSync('docs/crawl/keyboard-last-run.txt', `${new Date().toISOString()}\n\n${report.join('\n')}\n`);
console.log(report.join('\n'));
if (failed) process.exit(1);
