# Data dictionary

## Files

| Path | What it holds |
|---|---|
| `data/raw/<CODE>.data.json` | The World Bank API answer for one indicator: every year for Bangladesh, the default peers and every lower-middle-income country (Bangladesh only for taka series), with the date and URL it was fetched from. |
| `data/raw/<CODE>.meta.json` | The World Bank's metadata for that indicator (name, source organisation). |
| `data/raw/countries.list.json` | The World Bank country list (region and income group for every country). |
| `data/raw/countries.meta.json` | WDI country metadata for Bangladesh and the default peers (currency unit, special notes). |
| `data/processed/<id>.json` | Records (below) for one indicator: Bangladesh and the 7 default peers (Bangladesh only for taka series), sorted by country then year. |
| `data/processed/median/<id>.json` | The "median of lower-middle-income countries" per year, calculated by this site (below). |
| `data/processed/indicators.json` | One description per indicator: area, unit, World Bank series name, definition link, explanation key, favourable direction and its official source, values read from the series name (e.g. the poverty line). |
| `data/processed/countries.json` | Every country with its World Bank region and income group, the default peer list, and where the classification came from. |
| `data/raw/<CODE>.all.json` | Compact copy of every country's values for the last 10 years (request URL, date, every non-empty value): the inputs to the global ranks. |
| `data/raw/external/<id>.json` | A published-rank source (UNDP HDI, TI CPI, WHR): every country's rank and how many were ranked, the file's address, SHA-256, licence and retrieval date. |
| `data/processed/ranks/<id>.json` | Bangladesh's global rank on one series, calculated by this site, with every country's value and rank for that year (1 = highest value). |
| `data/processed/latest.json` | Everything the homepage shows, and nothing more: newest values for Bangladesh and the peers, the median, the goal and the rank for each indicator, and the peers' English names. |
| `data/targets.json` | Hand-checked official numeric goals (UN SDG targets, WHO guideline), each with its source and exact wording. Checked by `npm run check:data`. |
| `data/processed/meta.json` | When the data was last checked, whether that check passed, when values last changed, and the World Bank's own "last updated" date per series. |

## Record fields

| Field | Meaning |
|---|---|
| `indicator_id` | Our id, e.g. `inflation`. |
| `country` | ISO3 code, e.g. `BGD`. |
| `year` | The year the value is for (four digits). |
| `value` | The value exactly as published (not rounded). |
| `unit` | `years`, `taka_current`, `taka_constant`, `intl_dollar_current`, `percent`, `per_1000_live_births`, `ug_m3` (PM2.5) or `rank` (published ranks). |
| `out_of` | Only for unit `rank`: how many countries the publisher ranked that year. |
| `source_name` | Publisher and dataset, e.g. "World Bank, World Development Indicators". |
| `original_source` | The organisation the World Bank credits, word for word. |
| `source_url` | Human-readable page for this exact indicator, filtered to this record's country. Required: without it the value is not shown. Charts build a link with every country shown. |
| `definition_url` | Official definition page. |
| `api_url` | The API address for this country's raw numbers. |
| `retrieved_at` | Date (Bangladesh time) the value was fetched. |
| `notes` | Caveats from the publisher, word for word (country special notes for national accounts series, plus the footnote for that year). Translated by pattern in `src/data/notes.ts`. |
| `measured_by` | `income` or `consumption`, read from the publisher's footnote ("Estimated from … consumption data."); `null` when the source does not say. |

Missing years are simply absent. Nothing is ever filled in.

## Median record fields (`data/processed/median/<id>.json`)

| Field | Meaning |
|---|---|
| `year`, `value`, `unit` | The median for that year. |
| `calculated_by_site` | Always `true`: label it "Calculated by this site". |
| `formula` | `median`: the middle value (or the average of the two middle values) of the inputs. |
| `inputs` | Every country and value used. Only countries in the group with a value for that exact year. At least 10 (`MEDIAN_MIN_COUNTRIES`). |
| `inputs_source_url` | World Bank page showing all input countries. |
| `group`, `classification_url`, `classification_retrieved_at` | The income group (`LMC`) and where and when the classification was read. The current classification is used for all years. |

## Indicators (P0)

See `scripts/indicators.ts` (codes, names, ranges, directions) and `docs/DATA_AVAILABILITY.md` (coverage).
