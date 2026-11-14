// @vitest-environment node
// Milestone 7, "No JavaScript" (section 13; DECISIONS.md 116): the build-time renderer gives
// each page its text, tile values with source lines, the menu as real links, and the language
// switch as a real link to the same page in the other language.
import { describe, expect, it } from 'vitest';
import { render, routes } from '../src/entry-server.tsx';
import { LANGS, t } from '../src/i18n/index.ts';

const other = { en: 'bn', bn: 'en' } as const;

describe('pre-rendered pages', () => {
  it('cover every page in both languages', () => {
    const all = routes();
    for (const lang of LANGS) {
      for (const p of ['/', '/economy', '/economy/poverty-and-inequality', '/indicator/inflation', '/sources', '/about', '/how-to-read']) {
        expect(all, p).toContain(`/${lang}${p}`);
      }
    }
    expect(new Set(all).size).toBe(all.length);
  });

  describe.each(LANGS)('%s', (lang) => {
    it.each(['/', '/economy', '/indicator/inflation'])('%s has its text, values with sources, menu and language link', async (p) => {
      const html = await render(`/${lang}${p}`);
      expect(html).toMatch(/<h1[\s>]/);
      expect(html).toContain('data-value');
      expect(html).toContain('data-source-line');
      expect(html).toContain(`href="/${lang}/sources"`);
      expect(html).toContain(`href="/${lang}/about"`);
      // The flag switch links to this page in the other language.
      expect(html).toContain(`href="/${other[lang]}${p === '/' ? '/' : p}"`);
      expect(html).not.toMatch(/\{\w+\}/);
    });

    it('/about is complete text', async () => {
      const html = await render(`/${lang}/about`);
      expect(html).toContain(t(lang, 'about.rules.h').replace(/"/g, '&quot;'));
    });

    // DECISIONS 136: the page's content is in place, not a hidden block swapped in by a script
    // (without JavaScript that showed only the loading line, and the page jumped when swapped).
    it.each(['/economy', '/economy/poverty-and-inequality', '/indicator/stunting', '/compare', '/sources', '/about'])('%s has no hidden or pending block', async (p) => {
      const html = await render(`/${lang}${p}`);
      expect(html).not.toContain('<!--$?-->');
      expect(html).not.toMatch(/<div hidden id="S:/);
      expect(html).not.toMatch(/<main[^>]*>\s*<div class="wrap"><div class="loading"/);
    });
  });
});
