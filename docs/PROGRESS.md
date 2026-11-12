# Progress

| Milestone | Status | Notes |
|---|---|---|
| M1 Skeleton and data pipeline | done (2026-11-13) | Vite + React + TS. `/en` and `/bn` routing with toggle. Formatting utilities. SourceLine. Fetch/normalise/validate for life expectancy, GDP per person (taka) and inflation. One plain page. CI workflow. 69 tests. |
| M2 All P0 indicators fetched and verified | not started | |
| M3 Design system and design preview | not started | |
| M4 Homepage | not started | |
| M5 Indicator page and compare module | not started | |
| M6 Area and subsection pages | not started | |
| M7 P1 indicators, Sources, About, How to read, states | not started | |
| M8 Quality checks and Bangla review | not started | |
| M9 Launch and scheduled refresh | not started | |

## Open items carried forward
- **World Bank server is slow for requests Cloudflare has no copy of** (DECISIONS.md 17–21). Retries and the cache handle it, but a refresh may sometimes need a second run. Watch this in M2, which fetches many more series and peer countries.
- **Publisher notes for other countries/series (rule R8):** M1 attaches the Bangladesh "SpecialNotes" text to national accounts series. M2 must check which other caveats (modelled estimates, survey type, income vs consumption) the API gives, and where.
- **Pre-rendering:** pages need JavaScript to render. Static HTML per page (so the toggle and content work without JS) is still to do, by M9.
- **Data size:** the page currently bundles every year of every series (90 KB gzipped JS in total). The M4 homepage should load only what it shows.
- **Hosting** (GitHub Pages or Cloudflare Pages) and `refresh-data.yml` are for M9.

## Open questions for Ahmar
- Bangla strings in BANGLA_REVIEW.md (10 items).
