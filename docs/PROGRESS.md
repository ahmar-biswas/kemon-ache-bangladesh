# Progress

| Milestone | Status | Notes |
|---|---|---|
| M1 Skeleton and data pipeline | done (2026-11-13) | Vite + React + TS. `/en` and `/bn` routing with toggle. Formatting utilities. SourceLine. Fetch/normalise/validate for life expectancy, GDP per person (taka) and inflation. One plain page. CI workflow. 69 tests. |
| M2 All P0 indicators fetched and verified | done (2026-11-13) | 16 P0 series (12 tiles + PPP, constant taka, girls/boys enrolment) for Bangladesh and 7 peers; LMIC median with inputs; income groups from the World Bank list; income/consumption from footnotes; notes translated by pattern; all 32 explanations; SDG-based directions. None dropped. docs/DATA_AVAILABILITY.md. 138 tests. |
| M3 Design system and design preview | done (2026-11-13; approved by Ahmar with changes: Bangla wording, Dollars label, smaller sources, rougher paper background) | Tokens, self-hosted fonts, layered background (seeded delta SVG, grain, jamdani), glass with all fallbacks, flag switch (language toggle, Chart/Table), wordmark, area icons, Tile, PeerStrip, PositionBadge, ChartFrame (table view, CSV), rickshaw loader, 404. /en/design-preview and /bn/design-preview with real P0 data. Checked at 360, 768 and 1280 px in both languages. Contrast and token tests in CI; palette validator run (docs/palette-validation.md). 215 tests. |
| M4 Homepage | done (2026-11-13; approved by Ahmar: "looks beautiful") | Calm, scrolling homepage (DECISIONS 80–85): question heading, country slicer (click, drag, keys), four area tiles with one headline each, goal-facing strips and position ring (subtle better/worse, no colour), tile grows into Details (view transition, staged), Bangladesh at a glance (6 cards with world-position bars), area colours and subtle red decoration. All four tiles on the first screen at 1366 × 657 (EN and BN). Homepage JS 122 KB gz. 244 tests. |
| M5 Indicator page and compare module | done (2026-11-14; approved by Ahmar: events list, buttons inside tiles, wash under the over-time line) | Two views per measure in "The full picture" (DECISIONS 87–98): **Compare with other countries** (picker with default, SAARC, BIMSTEC and similar-income presets, search over all 217 countries, up to 10 plus Bangladesh, greyed-out reasons; ranked dots or bars from zero; data year per country; goal and median lines; "3rd of 6 shown"; Chart/Table; CSV; source link with every country shown) and **Bangladesh over time** (line from the first year, gaps kept, constant taka, crosshair tooltip and arrow keys, 16 approved event markers: elections with the winning party, and shocks, each with its source). Notes for every country (R8). Per-measure data files; "The full picture" now loads about 20 KB of data instead of 366 KB. Homepage JS 127.6 KB gz. 349 tests. |
| M6 Area and subsection pages | not started | |
| M7 P1 indicators, Sources, About, How to read, states | not started | |
| M8 Quality checks and Bangla review | not started | |
| M9 Launch and scheduled refresh | not started | |

## Open items carried forward
- **World Bank server is slow for requests Cloudflare has no copy of** (DECISIONS.md 17–21, 23, 34). In M2 each 50-country request took 100–150 s uncached; warming the cache in parallel first worked. Decide in M9 whether the refresh does this itself.
- **Response cache is set to 7 days** (DECISIONS 24): set back to same day before the weekly refresh (M9).
- **Publisher notes (rule R8):** done in M2 for the P0 series (pattern translations in src/data/notes.ts). New series in M7 may bring new patterns; the data check will say so.
- **Pre-rendering:** pages need JavaScript to render. Static HTML per page (so the toggle and content work without JS) is still to do, by M9.
- **Data size:** the page bundles every year of every country for the series it imports (113 KB gzipped JS in total after M2). The M4 homepage should load only what it shows (e.g. latest values only).
- **Hosting** (GitHub Pages or Cloudflare Pages) and `refresh-data.yml` are for M9.

## Open questions for Ahmar
- **Countries greyed out for an untranslated source note** (DECISIONS 92): about 40 for the GDP-based measures, about 9 for poverty. OK to translate the remaining note patterns in M7/M8?
- **167 new Bangla country names** (BANGLA_REVIEW.md, Milestone 5).
- **M4 review:** check the homepage at laptop and phone size, and try the slicer and the Details switches.
- **World Happiness Report licence:** the data file has no licence statement; it is shown with the report's suggested citation. OK, or ask the Wellbeing Research Centre?
- **Tile textures:** Ahmar to send reference textures; tiles currently use faint muslin threads and an area watermark.
- **M3 look:** please review /en/design-preview and /bn/design-preview at phone and desktop width and approve (or list changes) before M4.
- **Bangla font size:** a Bangla page downloads about 235 KB of fonts, over the ~150 KB target (English: about 148 KB). Options: (a) accept it (fonts are cached after the first visit); (b) drop Anek Bangla 600, using size and Tiro headings for emphasis (saves 55 KB, about 180 KB); (c) build-time subsetting of the Bangla fonts to the characters the site uses (needs a new tool; saving uncertain because Bangla joined letters must be kept).
- **Peer grey contrast:** --peer-grey is about 2.5:1 on paper (WCAG wants 3:1 for meaningful graphics). Keep as specified, or darken slightly?
- **Palette validator in CI:** copy the dataviz validator script into the repository (it has no licence notice), or keep running it by hand?
- Bangla strings in BANGLA_REVIEW.md: the 10 from M1 are still open (the M2 ones were reviewed on 2026-11-13).
- **Peers:** Sri Lanka, Viet Nam and the Philippines are now upper-middle income (World Bank list, 2026-11-13). Keep them as default peers (the spec names them), or change the set / the "Why these countries?" wording?
- **Median minimum:** a year gets an LMIC median only if at least 10 countries have a value for that year. OK? (Poverty and literacy medians exist for 17 years; stunting for 18.)
- **Survey citations in notes** (about 110, mostly stunting): the report title is shown as published (in English) after a translated "Source" label, instead of translating each title. OK under rule 7?
- **Favourable directions** (DECISIONS 28): only poverty, stunting, under-5 deaths (lower) and literacy (higher) have one. Youth unemployment could use SDG 8.5 if you want.
