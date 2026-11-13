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

## Milestone 2 (in progress, 2026-11-13)

23. **Longer request limits.** Each request may take up to 120 s and is tried up to 4 times (waits 20, 40, 60 s), because the World Bank server took 30–150 s per uncached request on 2026-11-13.
24. **Response cache kept for 7 days (temporary).** So a paused M2 fetch can resume without downloading again. The stored "retrieved" date is still the real download date. Must go back to same day only before the weekly refresh (M9).
25. **One request per series for many countries.** Bangladesh, the 7 default peers and every lower-middle-income country are fetched together (`country/A;B;C/indicator/CODE`). Published data files keep Bangladesh and the peers. The others are used only as inputs to the median.
26. **Peer income groups are read from the World Bank country list, not assumed.** On 2026-11-13, Sri Lanka, Viet Nam and the Philippines are upper-middle income. They stay in the default peer set because the spec names them. Question for Ahmar (see PROGRESS.md).
27. **Lower-middle-income median.** For each year, the median of the countries in the group that have a value for that exact year. Years are never mixed. A year needs at least 10 countries (`MEDIAN_MIN_COUNTRIES`, to confirm with Ahmar). Every median record lists its input countries and values, and is labelled "Calculated by this site". The group uses the current classification for all years.
28. **Favourable direction only from UN SDG targets.** Lower: under-5 mortality (3.2), stunting (2.2), international poverty (1.1). Higher: adult literacy (4.6). All others are "context". Target text is quoted word for word from sdgs.un.org.
29. **Taka series are Bangladesh only.** Other countries' local-currency values are in their own currencies, so cross-country comparison uses GDP per person in PPP international dollars (rule 7).
30. **Placeholder rename.** `{100+value}` in the inflation explanation is stored as `{value_plus_100}`, because placeholders must be plain names.
31. **Series that share an explanation.** Constant-taka GDP uses the GDP-per-person explanation (`explain.gdp_pc_taka`). Girls' and boys' secondary enrolment use `explain.secondary_enrol`. This is set with `explanationId` in `scripts/indicators.ts` and written to `indicators.json` as `explanation_id`.
32. **DATA_AVAILABILITY.md is generated** by `npm run data:availability` from the committed data, so it can be rebuilt after every refresh. "Last 10 years" means the year of the last check minus 10, or later.
33. **Bangla country names** cover Bangladesh, the peers and every lower-middle-income country (all can appear as median inputs). `npm run check:data` fails if one is missing. Ahmar reviewed the names on 2026-11-13 (e.g. PSE is ফিলিস্তিন, CIV is আইভরি কোস্ট). The full list of all countries comes with the "add a country" search (M5).
34. **Warming the World Bank's cache.** When the server is slow, the exact pipeline URLs can be requested in parallel first, so Cloudflare stores the answers and the real (one-by-one) run gets them quickly. It changes no data. It was done by hand for M2. If needed, it can become part of the refresh in M9.
35. **Wider sanity ranges for life expectancy (5–100) and under-5 deaths (0–1,000 per 1,000 births).** The published values for Cambodia in 1975–78 (Khmer Rouge years) are 11–13 years and 519–551, which the old ranges rejected. These ranges only catch broken feeds; real published values are never removed.
36. **Publisher notes are translated by pattern, not one by one.** There are 644 different note texts across the P0 series, but only 9 patterns: uncertainty bounds, 4 kinds of survey basis, survey citations, 2 national-accounts country notes, and "UIS Estimation". Each pattern has one translation with the values filled in. A test checks that the English template gives back the publisher's exact text for every note in the data. A note matching no pattern fails the data check.
37. **Survey citations keep the published report title** after a translated "Source" label. They are names of documents. To confirm with Ahmar (rule 7).
38. **Income or consumption (`measured_by`) comes from the footnote** ("Estimated from unit-record consumption data."). It is never guessed per country. All poverty and poorest-20% records have it. The Philippines and Nepal switch between income and consumption across years, so the tooltip must show it per point.
39. **Nothing dropped in M2.** Thin spots: Cambodia has no poverty or income-share data in WDI, so those charts show 6 peers with a note. Peers' latest survey years differ (e.g. stunting: Pakistan 2018, Sri Lanka 2024), and each country's own year must be shown.
40. **Bangla review of the M2 strings (Ahmar, 2026-11-13).** All accepted, with four changes: stunting is "বয়সের তুলনায় খাটো হওয়া" (not "খর্বতা"); median is "মিডিয়ান" (not "মধ্যমা"); CIV is আইভরি কোস্ট; PSE is ফিলিস্তিন.

## Milestone 3 (2026-11-13)

41. **Skills used:** dataviz (palette validator, mark rules), anti-ui-slop (design contract in `docs/design-contract.md`, finish check), ui-ux-pro-max (rule files only: its search tool needs Python, which this PC does not have). The skill named in the milestone file, frontend-design, is not installed, so section 8 was followed directly. Where a skill and section 8 differ, section 8 wins.
42. **Fonts are self-hosted from the npm "Fontsource" packages** (all four families are OFL). Each is split by script with `unicode-range`, so a page downloads only the parts it uses.
    - Newsreader and Atkinson Hyperlegible Next: variable weight axis only. Newsreader's optical-size axis would add about 74 KB.
    - Anek Bangla: fixed weights 400 and 600. The variable file is 156 KB.
    - Tiro Bangla: its only weight, 400. Headings in Bangla are never fake-bolded.
    - Tiro Bangla's Bangla numerals were checked by eye at 44 and 64 px and read clearly, so no Noto fallback is used.
43. **Measured font download (homepage, 2026-11-13):** English page about 148 KB (within the ~150 KB target). **Bangla page about 235 KB (over the target).** The Bangla files are large because Bangla fonts carry many joined letters. Options are in PROGRESS.md for Ahmar.
44. **The taka sign ৳ in English text** comes from Anek Bangla, which is already downloaded for the "বাংলা" switch label. The English fonts have no ৳, and falling back to Tiro would cost 82 KB for one character.
45. **Fonts switch by language through the `lang` attribute** (`[lang|="bn"]`), so a Bangla word inside an English page (and the reverse) gets the right face.
46. **Background:** a fixed `.backdrop` layer: hue wash (`::before`), inline delta SVG, grain (`::after`). Generated by `npm run assets` (seeded): `delta.svg` is 9.5 KB with 40 curves, `grain.png` is 2.0 KB.
47. **Save-Data and very low-end phones** are detected by a three-line script in `index.html`. It sets the classes `save-data` and `lite`, because CSS cannot see Save-Data. Either class turns off contours, grain and blur; so do `prefers-reduced-data`, `prefers-reduced-transparency` and forced colours.
48. **Tiles on desktop are "light glass" without blur.** They use a translucent fill, a glass edge and the green shadow, but no `backdrop-filter`. This keeps blurred surfaces to the header and switches, under the "about six" limit in 8.5. Phones always get paper.
49. **Flag switch:** one component with two modes:
    - links, for the language toggle (works without JavaScript)
    - buttons, for "Chart | Table" and "Taka | International dollars"

    The disc moves 22 px toward the chosen side in 220 ms with a spring, and jumps under reduced motion. The arrow keys move between the two options.
50. **Peer strip is HTML, not SVG**, so labels keep the real fonts and size at any width.
    - Peer dots are click/tap targets (28 px) with glass tooltips showing the country, value and year.
    - Screen readers get a hidden list.
    - Axis ends show the number only; the unit is named on the tile.
    - Peers with no value since 2016 are named under the strip, never drawn.
51. **Position badge** counts are "Calculated by this site" (`src/data/compare.ts`). Each country's latest value since 2016 is used. Equal values count as neither ahead nor behind. "Level with the middle" is used when ahead = behind. The ring shows 3 quarters if Bangladesh is ahead of at least 62.5% of peers, 1 quarter if at most 37.5%, otherwise 2.
52. **GDP per person (taka) is compared in PPP dollars** on its tile: the strip uses `gdp_pc_ppp` and says so ("Compared in international dollars"), with its own source line.
53. **Headline values with word units** (years, per 1,000 live births, international dollars) show the number large and the unit small beside it. Units that are symbols (৳, %) stay attached.
54. **Poverty line:** the pipeline reads the amount (`$3.00`) and the PPP year (`2021`) separately from the series name. The explanation shows "$3.00" in English and "৩.০০ ডলার" in Bangla.
55. **Middle-dot separators removed** from the source line (8.3 forbids middle-dot meta strings). The three parts are laid out with spacing instead.
56. **CI design checks** (`tests/design-tokens.test.ts`):
    - token values are compared with the spec table itself
    - no raw colours in components, pages or stylesheets
    - every text-on-surface pair is at least 4.5:1
    - chart marks are at least 3:1 on paper
57. **The palette validator was run by hand, not in CI.** Its output is saved in `docs/palette-validation.md`. The script has no licence notice, so it was not copied into the repository. To decide with Ahmar.
58. **`--peer-grey` (#9AA39D) is about 2.5:1 on paper,** below the 3:1 that WCAG asks of meaningful graphics. It is kept as specified because peers are also told apart by shape (open circles) and are listed for screen readers and in the table. A slightly darker grey would fix it: to decide with Ahmar.
59. **404 page** shows only the alpona ornaments (no jamdani band): the "remove one accessory" test, and 8.7 lists jamdani only for header, footer and empty states.
