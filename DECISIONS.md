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
60. **Ahmar's M3 review, first round (2026-11-13):**
    - "জীবিত" is removed from every "per 1,000 (live) births" phrase in Bangla, including the under-5 and maternal explanations and the Bangla version of SDG target 3.2.
    - The money switch reads "Taka | Dollars" / "টাকা | ডলার". Elsewhere the unit stays "international dollars", because PPP dollars are not US dollars (rule 7). This is to confirm with Ahmar.
    - Source lines are now smaller than explanations: 12.5 px in English and 13 px in Bangla, below the spec's 14 px floor, at Ahmar's request.
    - The background is rougher, at Ahmar's request. This changes 8.4 and 8.7:
      - a 6.3 KB muslin-fibre texture over the grain (16% multiply)
      - faint uneven threads across the page (CSS)
      - a faint alpona lotus and vine in two corners
      - two faint jamdani lines across the page

      All of it is hidden for data savers, reduced data, forced colours and low-end phones.
61. **Homepage redesign agreed with Ahmar (2026-11-13). It replaces the spec's homepage layout (8.8 hero and tile groups, and section 9).**
    - **One screen, no scrolling, on a 1366 × 768 laptop.**
    - **Four collapsible area tiles:** Economy, Equality (Poverty and inequality), Health, Education. Each tile has:
      - its comparison strips (peers and goal lines)
      - a status line
      - a short subtitle naming the measures used
      - a switch that opens the details
    - **A side list of 10 well-being metrics,** each with a small comparison visual.
    - **Source lines stay under every figure** (rule R1), in small text.
62. **Status = facts plus a count, never a verdict.**
    - Each metric shows the distance to its goal (e.g. "30.5 now; goal 25 by 2030") and the peer position badge.
    - An area tile may show a plain count with its list, e.g. "Ahead of peers on 1 of 3 measures with an official goal".
    - No colour meaning, no score, no "on track" (that would need a forecast, rule R3).
63. **Published ranks are allowed in the side list** (Ahmar). Examples: World Happiness Report rank, Transparency International Corruption Perceptions Index rank, UNDP Human Development Index rank.
    - They are shown exactly as the publisher gives them, with the source, the year and the number of countries ranked.
    - This relaxes the no-index rule for indices that other organisations publish. The site still never computes a score of its own.
    - Each source's licence and data file is checked before use. Any that fail go to DROPPED_INDICATORS.md.
64. **Goal lines on bars may use targets from other official bodies** (WHO, World Bank), not only the UN SDG text. Each is labelled with its own source and checked first. No number is invented: a measure with no stated numeric target shows the direction arrow only.
65. **The Social Progress Index is dropped** (2026-11-13): its data download is behind "Premium Access" on socialprogress.org, so it can't be refreshed automatically and reuse isn't clearly allowed. Ahmar chose **safe drinking water** (SH.H2O.SMDW.ZS, goal 100% from SDG 6.1) for the 10th side metric. Logged in DROPPED_INDICATORS.md.
66. **The side-list sources checked so far (2026-11-13):**
    - **UNDP HDI:** CSV file, licence CC BY 3.0 IGO; Bangladesh is ranked 130th (2023).
    - **Transparency International CPI 2025:** xlsx file with ISO3 codes, licence CC BY-ND 4.0, so values are shown unchanged; Bangladesh scores 24 and ranks 150th of 182.
    - **World Happiness Report 2026 (Figure 2.1 data):** a free xlsx file. No licence is stated, so it is shown with the report's suggested citation; this is flagged for Ahmar. Bangladesh ranks 127th (life evaluation 4.319, 2023–2025 average).

    The xlsx files are read with `read-excel-file`, a build-time dev dependency only.
67. **Global rank under every data point** (Ahmar, 2026-11-13):
    - **Published indices (HDI, WHR, CPI):** the publisher's own rank and the number of countries ranked.
    - **All other measures:** a rank "Calculated by this site". It counts only countries (not regional aggregates) that have a value for the same year, says which way it is ordered ("1 = highest value"), and keeps the full ranked list one click away. These ranks describe position, not well-being; there is no good/bad wording.
    - **Data needed:** recent years for every country. These are fetched for the last 10 years only, to keep `data/raw` small.

## Milestone 4 (2026-11-13)

68. **"দাপ্তরিক" replaced by "অফিশিয়াল" everywhere** (Ahmar).
69. **Goal lines that were checked and kept** (`data/targets.json`, validated in CI):
    - under-5 deaths: 25 per 1,000 by 2030 (SDG 3.2)
    - safe water: 100% by 2030 (SDG 6.1, "for all")
    - electricity: 100% by 2030 (SDG 7.1, "universal access")
    - PM2.5: 5 µg/m³ (WHO Air Quality Guidelines 2021, as quoted in WHO's 2022 release)

    **Not used:** the World Bank's "3% extreme poverty by 2030" goal. It was set on the old $1.25 / $1.90 lines and for the whole world, so drawing it on the $3.00-line country chart would mislead. Stunting, literacy and the others have no stated number, so they keep the direction arrow only.
70. **Five new World Bank series for the side list:**
    - NY.GDP.MKTP.CN (GDP in taka, Bangladesh only)
    - NY.GDP.MKTP.PP.CD (GDP, PPP; used for comparison)
    - EG.ELC.ACCS.ZS (electricity access)
    - SH.H2O.SMDW.ZS (safe water)
    - EN.ATM.PM25.MC.M3 (PM2.5)

    Each series name was checked against the live API on 2026-11-13.
71. **Published ranks** (UNDP HDI, TI CPI, WHR) are read from the publishers' own files and kept in `data/raw/external/<id>.json`, which holds every country's rank, the file's SHA-256, the licence and the retrieval date. The number of countries ranked is the publisher's own count. The file addresses contain the edition year, so they must be updated when a new edition comes out (`scripts/lib/external.ts`).
72. **Global ranks** use a compact copy of every country's World Bank values for the last 10 years (`data/raw/<CODE>.all.json`: request, date and every non-empty value). The full API answer for all countries would be very large. No rank is shown when fewer than 20 countries have a value for that year (`MIN_RANKED`).
73. **The homepage loads only `data/processed/latest.json`:** newest values for Bangladesh and the peers, the median, the goal and the rank for every indicator, about 72 KB. Homepage JavaScript is 119.6 KB gzipped. The Details panel loads the full data only when opened (366 KB gzipped). Milestone 5 should split it per indicator.
74. **One-screen layout, measured at 1366 × 657** (the inside of a browser on a 1366 × 768 laptop) in both languages:
    - The country slicer moves into the header on wide screens.
    - The area tiles are a 2 × 2 grid, each showing **2 headline measures**. The others are in Details; the status count and the subtitle cover all of them.
    - The side list is one column of 10.
    - Each data point is three columns: [name and value] [strip] [rank and position], with a compact one-line source underneath.
    - Short names are used in rows; full names show on hover and in Details.
    - Content ends at about 640 px in English and 629 px in Bangla, inside the 658 px window. The footer sits below the fold.
75. **Compact source line:** "Source: World Bank (WDI), 2025 data, retrieved 13 Nov 2026". It has the same three parts as the full line (R1), with a short source name (full name on hover) and a short date. When a row shows two series from the same source, year and date (taka plus PPP), one line carries both links.
76. **The status count** (area tile) counts measures with an official goal direction where Bangladesh is ahead of more peers than it is behind, out of all such measures in the area. Its formula is one click away. It is a count, not a score.
77. **The country slicer:** a radio group with a glass thumb. You can click a chip, drag from the chosen chip (a 4 px threshold, so clicks stay clicks), or use the arrow keys and Home/End. The choice is stored in the address (`?vs=IND`), so it survives a language switch. The chosen country shows in chart series colour 2 (jute gold), named with its value, across every strip. Animations use a soft ease-out (420–520 ms) and switch off under reduced motion.
78. **Contour draw-in** (8.11) happens once per browser on the first homepage visit. It is skipped for reduced motion, Save-Data and low-end phones.
79. **Font and line-height exceptions on the dashboard** (Ahmar's one-screen request, against 8.3's minimums):
    - row text is 10.5–13 px
    - Bangla compact rows use line-height 1.2–1.35 on single-line labels only
    - the PM2.5 unit is written "µg/m³" in Bangla too

    Full-size text is used in Details and on every other page.
80. **Homepage redesign, second review (Ahmar, 2026-11-13).** The one-screen rule is dropped: the page scrolls, and the four area tiles must show on the first screen.
    - **Hero:** the question "How is Bangladesh doing?", one plain line, and the country slicer underneath.
    - **Four area tiles, one headline measure each:** Economy shows GDP per person, Equality the poverty line, Health life expectancy, Education adult literacy. They sit 4 across from 1200 px wide, 2 × 2 on tablets, and stacked on phones.
    - **Everything else goes to Details:**
      - Economy: growth, inflation, youth unemployment, electricity.
      - Equality: the poorest fifth's share.
      - Health: under-five deaths, stunting, out-of-pocket spending, safe water, PM2.5.
      - Education: secondary enrolment total, girls and boys.
    - **"Bangladesh at a glance"** sits below the fold: 6 cards (GDP, GDP per person, life expectancy, HDI, World Happiness and CPI ranks), each with a world-position bar (rank 1 … last, Bangladesh marked).
    - **Normal text sizes are back:** headline numbers 36–56 px, sentences 15–16 px, source lines 12 px.
81. **Better / worse indicator, subtle and rule-safe (8.10: position and shape, never colour):**
    - **Goal-facing strip:** where an official goal gives a direction, the strip is turned so the goal always points right, and the track deepens gently toward that end. Bangladesh's green dot further right than most dots means "ahead of most neighbours", the same way for every measure.
    - **The ring:** a small ring fills 1, 2 or 3 quarters by the share of neighbours Bangladesh is ahead of, with the words "Ahead of / Behind n of m peers".
    - **Without an official goal** (GDP per person, life expectancy) the strip is a plain "lower … higher" line, and no ahead/behind is shown. Ahmar chose to keep those headlines.
82. **Tile grows into Details:** a shared-element view transition (CSS `view-transition-name`), applying the brief's animation principles:
    - anticipation: the tile dips slightly while pressed
    - follow-through: a soft overshoot as it grows, 480 ms
    - closing is quicker and plain (300 ms)
    - staging: the rest of the page dims while Details is open
    - secondary action: the measures in Details rise in one after another
    - the whole tile is the hit area (Fitts's law), except its links and switch
    - Doherty threshold: the Details code preloads on hover or focus

    Browsers without view transitions get a scale-up instead; reduced motion gets no animation. Escape closes Details and focus returns to the tile.
83. **Area colours (identity only, never meaning):** Economy jute gold, Equality rickshaw rose, Health river blue, Education flag green. Each tile shows its colour as a top edge, a faint corner wash and a large, very faint watermark icon. Tiles carry faint muslin threads; numbers sit on clear paper. To be revisited when Ahmar sends reference textures.
84. **Subtle red (identity and decoration only):**
    - a small red disc beside each area name
    - a red-thread kantha stitch under section headings
    - a faint red alpona flourish in the hero
    - a warmer red side to the background wash (13%, inside the spec's 14% limit)

    The hue-wash token itself is unchanged (it is in the spec table), so a separate `--lal-wash` token carries the warmer value.
85. **Removed:** the dense dashboard components (AreaTile, MetricRow, MiniStrip) and the header slicer slot. The side list is replaced by "at a glance".
86. **Ahmar's third review (2026-11-13):**
    - **One button per tile, "The full picture"** (Bangla "পুরো ছবিটা", the everyday idiom rather than a word-for-word translation; on the review list). It replaces the Summary | Details switch. The open view's heading reads "Economy — The full picture" and has a "Back to the summary" button.
    - **Sideways opening.** The view opens from the clicked tile and widens sideways only (its clip animates; top and bottom stay fixed) until it fills the width of the four tiles. Economy grows right, Education left, the middle two both ways. It takes 640 ms on a soft ease-out, and closing shrinks it back into the tile in 420 ms. While the code loads on first use, the placeholder stays in the tile's place. On narrow screens (stacked tiles) it slides in from the side instead. Reduced motion: no animation. Escape closes it.
    - **No coloured ribbon on top of the tiles.** It is replaced by a very soft green shadow that lifts each tile slightly off the page (`--tile-lift`, deeper on hover or focus). Area colours stay as the corner wash, icon and watermark.

## Milestone 5 (agreed with Ahmar, 2026-11-13; built 2026-11-14)

87. **Two views for every measure in "The full picture":** "Compare with other countries" and "Bangladesh over time". Each opens in the same full-width space with the same sideways animation, and has a Back button.
    - **Compare with other countries.**
      - **Picker:** any country with a value in the last 10 years, chosen by search or by the spec's presets (South Asia, Similar income, Neighbours). Up to 10 countries plus Bangladesh. Countries without recent data are greyed out, with a reason.
      - **Chart form ("mixed", Ahmar's choice):** ranked dots where zero is not meaningful (life expectancy, literacy, enrolment); ranked bars from zero where it is (percent shares, amounts, deaths per 1,000).
      - **Styling:** Bangladesh is green, and the chosen countries are neutral grey with direct labels (8.2: no more than 5 colours plus Bangladesh). Each country's data year is printed beside it.
      - **Extras:** the goal and median lines; "Bangladesh is 3rd of the 6 shown" (calculated by this site); rows re-sort smoothly; Chart | Table; CSV; a source line linking all selected countries.
    - **Bangladesh over time.**
      - **Chart:** a line chart from the earliest year. Gaps stay gaps (section 12); constant taka for money.
      - **Event markers:** hollow circles for elections and government changes, small diamonds for global and national shocks. Each kind can be switched off; tooltips give the date, label and source.
      - **Fixed note under the chart:** "Events are shown for context. The chart does not say any event caused a change." (Rule R5.)
88. **Events list (`data/events.json`):** each event has its exact date, a neutral factual label in English and Bangla, its kind, and an authoritative source (Bangladesh Election Commission, UN, WHO, IMF, World Bank, official records). Example label: "July–August 2024 mass uprising; interim government takes office (8 Aug 2024)". **Ahmar must approve the whole list before any marker is shown.** Until then, the chart shows none.
89. **M5 data:** the refresh builds a small "every country's latest value (last 10 years)" file per measure from the data already fetched (`data/raw/<CODE>.all.json`), with a source link per country. Each measure's full data loads only when its view opens, which fixes the 364 KB "full picture" download. Bangla names are drafted for all ~215 countries and listed in BANGLA_REVIEW.md. The separate `/indicator/<id>` and `/compare` pages from section 12 are left for later unless Ahmar asks.

### Milestone 5, built (2026-11-14)

90. **Preset groups (Ahmar's choices, approved 2026-11-13 in the M5 planning session):**
    - **South Asia = the eight SAARC Member States** (Afghanistan, Bangladesh, Bhutan, India, Maldives, Nepal, Pakistan, Sri Lanka), as listed on saarc-sec.org (checked 2026-11-14). The World Bank's own "South Asia" region no longer includes Afghanistan or Pakistan, so it was not used.
    - **Neighbours = the seven BIMSTEC Member States** (Bangladesh, Bhutan, India, Myanmar, Nepal, Sri Lanka, Thailand), as listed on bimstec.org/member-states (checked 2026-11-14). Each preset links to its source.
    - **Similar income** = countries in Bangladesh's World Bank income group (read from the country list). If more than 10 have data, the 10 whose GDP per person (PPP) is nearest to Bangladesh's are kept: a difference of two published values, labelled "Calculated by this site" with a link to the PPP data.
    - **Default countries** = the seven default peers, with a "Why these countries?" note. Its wording no longer claims they share an income level (three are now upper-middle income).
91. **Publisher notes for every country (R8):** the "every country" request now asks for footnotes (`&footnote=y`), and each country's WDI special notes are read from one fast request (`/sources/2/country/all/metadata`). The refresh checks that both agree with the per-country answers for Bangladesh and the peers.
92. **A value whose note can't yet be shown in Bangla is not offered** (R7, R8). The country stays in the picker, greyed out, with the reason. Three new note patterns were added (fiscal year end, accounts in US dollars, EMU euro conversion). About 40 countries are still unavailable for the three GDP-based measures (country notes on currency history, borders and so on), and about 9 for poverty and the poorest fifth (newer PIP wordings such as "PPP is partially imputed"). These can be translated in M7/M8.
93. **New data files (built from answers already downloaded):** `data/processed/world/<id>.json` (every real country's newest value since the 10-year cut-off, with notes and a per-country source link); `data/processed/trend/<id>.json` (Bangladesh's full history); `data/processed/details.json` (newest records and medians only, for "The full picture": the data it loads drops from about 366 KB to about 20 KB gzipped). `npm run check:data` checks all of them against the main data files.
94. **The ranking rule is shared:** one `rankHighestFirst` (equal values share a rank, 1 = highest value) serves the global rank and the "Bangladesh is 3rd of the 6 shown" line.
95. **Over time:** money is drawn in constant taka (the measure's own current-taka value stays on its tile). Years with no value break the line; a year with no neighbour is a lone dot. A note that every year carries (such as the fiscal-year basis) is said once under the chart, not in every row.
96. **Bar charts start at zero** (and allow negative values, e.g. growth). Dot charts (life expectancy, literacy, enrolment) don't start at zero, and their "How to read" sentence says so.
97. **Events:** the marker code, switches, tooltips and fixed note are built and tested, but `data/events.json` is empty and `"approved": false`, so no marker shows. The candidate list is in docs/EVENTS_REVIEW.md. Each date must be confirmed on its source page before it goes in the file, and then Ahmar approves the whole list.
98. **Bangla names for all 217 countries** are in `src/i18n/countries.bn.json` (167 new, listed in BANGLA_REVIEW.md). The data check now requires a Bangla name for every country in the World Bank list.
99. **Events list approved by Ahmar (2026-11-14):** 16 events, each date checked at its source on 2026-11-14 (docs/EVENTS_REVIEW.md). Ahmar removed the WHO pandemic declaration, asked for each election label to say who won, and counts the 11 January 2007 emergency as a change of government. Wording for elections: "<n>th parliamentary election: <party> wins the most seats" (a fact from IPU Parline, no judgement). Election sources are IPU Parline, not the Election Commission site, because IPU gives each election's date and results on a stable page. For the 1991 cyclone, BMD (29 April) and a UN situation report (30 April) disagree; BMD's date is used, and the disagreement is recorded.
100. **Ahmar's M5 review (2026-11-14):**
    - **The two view buttons sit inside each measure's tile,** top right beside its name. On narrow tiles they wrap under the name.
    - **A soft wash under the "over time" line:** the line's green (`--dhan-chart`, 24% opacity) starts right at the line and fades to nothing at the bottom of the chart. Each run of consecutive years gets its own area, so a gap in the data stays a gap. The fade is a mask made of one slice per pair of years, so it starts at the line everywhere; in a mask the slices replace each other rather than adding up, so no seams show. The wash is decoration in the brand colour and carries no meaning (8.9, R5).
