# Decisions

Every choice that the spec left open, with the reason. Newest at the bottom.

## Milestone 1 (2026-11-13)

1. **npm as the package manager.** It comes with Node, so there is nothing extra to install.
2. **Library versions.** We use whatever npm installed on 2026-11-13: React 19, React Router 8, Vite 8, Vitest 5, TypeScript 7. Exact versions are locked in `package-lock.json`.
3. **Our own small translation helper (`src/i18n/index.ts`) instead of an i18n library.** We only need lookup plus `{placeholder}` filling, and a library would add download weight on phones (rule R10).
4. **Number formatting method.** Digits are formatted with `Intl.NumberFormat` in English, then 0–9 are swapped for Bangla digits:
   - `en-IN` is used for taka (lakh/crore grouping).
   - `en-US` is used for other numbers and dollars (standard grouping).
   This gives the same grouping in both languages on every browser, and it is one of the "equivalent tested approaches" allowed by section 6. Tests in `tests/format.test.ts` pin the exact output.
5. **Display decimals.** Shown values are rounded; the stored value is kept exactly as published. Display only, set in `src/lib/formatValue.ts`:
   - Life expectancy: 1 decimal.
   - Inflation: 1 decimal.
   - GDP per person in taka: whole taka.
6. **Dollar format.** Dollars use the `US$` prefix, e.g. "US$21.4 billion" / "US$২১.৪ বিলিয়ন". The Bangla form is flagged in BANGLA_REVIEW.md.
7. **"Retrieved" date uses Bangladesh time (Asia/Dhaka)**, because the readers are in Bangladesh.
8. **The refresh is all or nothing** (see also 18–20 for limits, paging and the cache). If any indicator fails any check, no data file changes. Only `meta.json` records the failed check (`last_check_ok: false`), following section 5.4.
9. **Unchanged data keeps its original retrieved date.** If a refresh finds no changed values, the data files are left untouched, so the repository only gets a commit when a value really changes. "Last checked" in `meta.json` still shows the newest check.
10. **Unit check.** The World Bank API's `unit` field is empty for these series. So we store the World Bank's full series name, which contains the unit (e.g. "(current LCU)"), in `scripts/indicators.ts`. Validation fails if the name changes.
11. **Taka check.** "LCU" (local currency unit) series are only shown as taka if the World Bank's country metadata still says `CurrencyUnit = "Bangladeshi taka"`. Verified on 2026-11-13.
12. **Country caveat on GDP (rule R8).** The World Bank's Bangladesh metadata has a "SpecialNotes" text saying national accounts data are fiscal-year based (year ending 30 June).
    - It is attached word for word to national accounts series (GDP per person in M1).
    - Each publisher note is translated through `src/data/notes.ts`. The data check fails if a note text has no translation, so a changed note can't slip through untranslated.
13. **Plausible ranges** in `scripts/indicators.ts` are sanity checks only: they catch a broken feed and never change or hide a value.
    - Life expectancy: 20–100.
    - Inflation: −50 to 200.
    - GDP per person: 1 to 10 crore taka.
14. **Source names in Bangla.** Records store the source name in English, as published. `src/data/sources.ts` maps it to a translation key, and the data check fails if a source has no mapping.
15. **The source check runs as a test** (`tests/sources.test.tsx`). It renders every page in both languages in a simulated browser and checks each value for:
    - a source link starting with `https://`
    - a data year
    - a retrieved date
    
    It also fails on English digits in Bangla mode and on unfilled `{placeholders}`. The full crawler of the built site (broken links etc.) comes in M8.
17. **Why World Bank requests were timing out (diagnosed 2026-11-13).** One small request was timed three ways: curl.exe, Node, and Node forced to IPv4. All three took under 1 second. Then the exact failing request was timed the same three ways:
    - With `footnote=y`, after it had been fetched once: 0.14 s, marked `CF-Cache-Status: HIT`.
    - The same request without `footnote=y`, never fetched before: timed out at 60 s in curl and in Node alike.

    **Cause:** the API sits behind Cloudflare. Requests Cloudflare has a copy of answer at once (this is why the browser looked instant). Requests it has no copy of go to the World Bank's own server, which was taking over 60 s or returning 502. Our connection, Node and IPv4/IPv6 were not the problem: this computer has no IPv6 route at all, and Node already used IPv4.
18. **Fetch limits.** Each request has a hard limit of 60 seconds and at most 3 attempts. Between attempts we wait 20 s, then 40 s. A request that timed out often keeps running on the World Bank's server and then gets stored by Cloudflare, so the retry is usually instant. We saw this happen with inflation pages 3 and 4.
19. **Paged fetching.** Each series is fetched in pages of 20 years, each page with its own retries.
    - `normalise` checks that every page arrived and that the rows add up to the World Bank's stated total, so no year can be lost silently.
    - All pages of a series are stored together in `data/raw/<CODE>.BGD.data.json`.
20. **Response cache (`data/.http-cache/`, not committed).** Every successful answer is saved, so a rerun never downloads it again.
    - A cached answer is reused only on the day it was downloaded (Bangladesh time). The weekly refresh must see new data, and the "Retrieved" date must be the real download date.
    - Failed answers are never saved.
    - The committed, reproducible copy of the data stays in `data/raw/`.
21. **Inflation (FP.CPI.TOTL.ZG) is kept in Milestone 1.** It failed several times with:
    - `HTTP 502`
    - `timed out after 60s`, on `.../FP.CPI.TOTL.ZG?format=json&footnote=y&per_page=20&page=2` and later on pages 3 and 4
    
    After the fixes in 18–20 it fetched fully: 39 records, 1987–2025. It stays a watch item for M2: if the World Bank server is slow again, a refresh may need a second run. Nothing is ever filled in to get around a failed fetch.
22. **Toggle without JavaScript.** The toggle uses real `<a href>` links, but the site is still a client-side app, so pages need JavaScript to render. Pre-rendering static HTML for each page is planned for later (see PROGRESS.md open items).
