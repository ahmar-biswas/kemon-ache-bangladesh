## 4. Technical decisions (builder's calls already made; change only with a written reason in `DECISIONS.md`)

- **Static site.** Vite + React + TypeScript. Pre-built JSON data files committed to the repository. No server and no database. Hosted free on GitHub Pages or Cloudflare Pages.
- **Automatic updates.** GitHub Actions on a schedule (see section 5.4) runs fetch scripts, validates, commits changed JSON, and redeploys.
- **Charts.** Observable Plot (or Visx if there is a good reason). Keep chart code in one `charts/` module. Must render crisp on phones and support Bangla numerals and labels.
- **Fonts and visual design.** Follow section 8 exactly (Tiro Bangla / Newsreader for headings, Anek Bangla / Atkinson Hyperlegible Next for body; subset and self-host).
- **Routing.** URL-based language: `/en/...` and `/bn/...`. The toggle swaps the prefix and keeps the user on the same page. Remember the last choice with `localStorage` inside try/catch. First visit: Bangla if the browser language starts with `bn`, otherwise English.
- **Accessibility.** WCAG 2.1 AA: contrast, keyboard navigation, visible focus, proper headings, `lang` attributes switching per language, every chart has an adjacent "View as table" and "Download CSV" of exactly the numbers shown.
- **Tests.** Unit tests for data validation and number/date formatting in both languages. A script that crawls every page in both languages and fails on: missing source line, missing translation, untranslated placeholder, broken link, value shown without data year.
