# Progress

| Milestone | Status | Notes |
|---|---|---|
| M1 Skeleton and data pipeline | done (2026-11-13) | Vite + React + TS. `/en` and `/bn` routing with toggle. Formatting utilities. SourceLine. Fetch/normalise/validate for life expectancy, GDP per person (taka) and inflation. One plain page. CI workflow. 69 tests. |
| M2 All P0 indicators fetched and verified | **in progress, paused 2026-11-13** | Code mostly written; the full fetch has not completed yet (World Bank server very slow). See "Where M2 stopped" below. |
| M3 Design system and design preview | not started | |
| M4 Homepage | not started | |
| M5 Indicator page and compare module | not started | |
| M6 Area and subsection pages | not started | |
| M7 P1 indicators, Sources, About, How to read, states | not started | |
| M8 Quality checks and Bangla review | not started | |
| M9 Launch and scheduled refresh | not started | |

## Where M2 stopped (2026-11-13)

Approved plan: fetch Bangladesh, the 7 default peers and every lower-middle-income (LMC) country in
one request per series; income groups read from the World Bank country list; LMC median "Calculated
by this site"; taka series for Bangladesh only; PPP for comparisons.

### M2 steps (docs/milestones/M2-p0-indicators.md)
| Step | Status |
|---|---|
| 1. Verify P0 codes against the live API | **Partly.** Checked by hand (see table below). The pipeline also checks every series name on each run, so a full successful run completes this step. |
| 2. Fetch Bangladesh + peers, income groups from source, LMC median | **Code written, not run to the end.** `scripts/refresh.ts`, `scripts/lib/worldbank.ts`, `scripts/lib/median.ts`. Country list fetched and cached. The run stopped at the slow "country metadata" request (special notes for BGD + 7 peers), so no indicator data has been fetched by the new pipeline yet. |
| 3. countries.bn.json + BANGLA_REVIEW.md | **Not started** (file has only BGD + the 7 peers from M1; needs the ~47 LMC countries). |
| 4. Explanation texts + definition_url | **Done for translations:** all 32 section-11 explanations added as `explain.<id>` in en.json/bn.json (`{100+value}` renamed `{value_plus_100}`). `definition_url` is generated per indicator into `data/processed/indicators.json` by the refresh (not yet produced). |
| 5. favourable_direction + direction_source_url | **Done in config** (`scripts/indicators.ts`): lower = under-5 mortality (SDG 3.2), stunting (SDG 2.2), poverty_intl (SDG 1.1); higher = literacy (SDG 4.6); all others `context`. Target texts copied from sdgs.un.org on 2026-11-13 and translated (`direction.target.*`, Bangla is a draft). |
| 6. docs/DATA_AVAILABILITY.md | **Not started** (needs the fetched data). |

### Indicators (P0)
"Name verified" = the World Bank's series name was read from the live API on 2026-11-13 and matches `expectedName`.
| ID | Code | Name verified | Bangladesh latest (by hand) | Fetched by new pipeline |
|---|---|---|---|---|
| gdp_pc_taka | NY.GDP.PCAP.CN | yes | 2025 (66 years) | no (M1 Bangladesh-only data still in place) |
| gdp_pc_taka_constant | NY.GDP.PCAP.KN | **no** (API 502) | not checked | no |
| gdp_pc_ppp | NY.GDP.PCAP.PP.CD | yes | not checked (502) | no |
| gdp_pc_growth | NY.GDP.PCAP.KD.ZG | yes | not checked (502) | no |
| inflation | FP.CPI.TOTL.ZG | yes | 2025 (39 years) | no (M1 data in place) |
| youth_unemployment | SL.UEM.1524.ZS | yes | not checked (502) | no |
| poverty_intl | SI.POV.DDAY | yes: "$3.00 a day (2021 PPP)" | 2022 (10 years) | no |
| share_low20 | SI.DST.FRST.20 | yes | 2022 (10 years) | no |
| literacy | SE.ADT.LITR.ZS | yes | 2022 (15 years) | no |
| secondary_enrol | SE.SEC.ENRR | yes | 2024 (40 years) | no |
| secondary_enrol_female | SE.SEC.ENRR.FE | yes | 2024 (39 years) | no |
| secondary_enrol_male | SE.SEC.ENRR.MA | **no** (not reached) | not checked | no |
| life_expectancy | SP.DYN.LE00.IN | yes (M1) | 2024 (M1) | no (M1 data in place) |
| under5_mortality | SH.DYN.MORT | **no** (not reached) | not checked | no |
| stunting | SH.STA.STNT.ZS | **no** (not reached) | not checked | no |
| oop | SH.XPD.OOPC.CH.ZS | **no** (not reached) | not checked | no |

No indicator has been dropped yet.

### Findings so far
- **Income groups (from the World Bank country list, 2026-11-13):** Bangladesh, India, Pakistan, Nepal and Cambodia are lower-middle income. **Sri Lanka, Viet Nam and the Philippines are upper-middle income.** They stay in the default peer set because the spec names them, but Ahmar should decide whether "Similar income level" and the "Why these countries?" text need changing.
- 47 countries are classed lower-middle income (the median group).

### Problems / open
- **World Bank API very slow today:** single requests took 30–150 s, many HTTP 502s; a 3-country request timed out at 90 s twice; the bulk CSV download took 55 s. The multi-country "country metadata" request (`/sources/2/country/BGD;IND;…/metadata`) did not finish before the run was stopped. If it keeps failing, fall back to one request per country, or read SpecialNotes from the bulk-download country metadata file.
- **Response cache temporarily keeps answers for 7 days** (`scripts/lib/http-cache.ts`, `CACHE_MAX_AGE_DAYS`), so a rerun on return re-uses what was fetched. Set back to same-day before M9. The cache folder `data/.http-cache/` is git-ignored: it is on this PC only. It has 18 answers: the M1 answers plus the new country list. The hand checks above were done with a separate script and are not in the cache.
- **Tests not yet updated** for the multi-country pipeline: `tests/pipeline.test.ts` (old `normalise`/`parseCountryMeta` signatures; does not typecheck), `tests/data-files.test.ts` (new raw file names `<CODE>.data.json`), and one `tests/fetch.test.ts` case that expects 3 attempts (now 4). `npm run check` fails until this is done.
- **Front end not yet updated:** `src/data/index.ts` still imports the 3 M1 files; it must not bundle all peers' data (budget, rule R10).
- **Not yet decided / still to do:** publisher footnotes of peer countries will need Bangla translations (`src/data/notes.ts`); count them after the fetch. Income vs consumption (`measured_by`) for poverty/share_low20: check footnotes after the fetch; if the API does not say, ask Ahmar (the Poverty and Inequality Platform API gives `welfare_type`). The median needs at least 10 countries in a year (`MEDIAN_MIN_COUNTRIES`); confirm with Ahmar once the counts are known.
- `data/raw/` still holds the M1 Bangladesh-only files; the new pipeline will write `<CODE>.data.json` / `<CODE>.meta.json`, `countries.list.json`, `countries.meta.json`. Delete the old `*.BGD.*` files once the new run succeeds.

### To resume
1. `npm run data:refresh` (run in the background; rerun if it fails, cached answers are reused).
2. Fix the tests above, update `src/data/index.ts`, then steps 3 and 6, then `npm run check`.

## Open items carried forward
- **World Bank server is slow for requests Cloudflare has no copy of** (DECISIONS.md 17–21). Retries and the cache handle it, but a refresh may sometimes need a second run. Watch this in M2, which fetches many more series and peer countries.
- **Publisher notes for other countries/series (rule R8):** M1 attaches the Bangladesh "SpecialNotes" text to national accounts series. M2 must check which other caveats (modelled estimates, survey type, income vs consumption) the API gives, and where.
- **Pre-rendering:** pages need JavaScript to render. Static HTML per page (so the toggle and content work without JS) is still to do, by M9.
- **Data size:** the page currently bundles every year of every series (90 KB gzipped JS in total). The M4 homepage should load only what it shows.
- **Hosting** (GitHub Pages or Cloudflare Pages) and `refresh-data.yml` are for M9.

## Open questions for Ahmar
- Bangla strings in BANGLA_REVIEW.md (10 items).
