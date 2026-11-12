# Data dictionary

## Files

| Path | What it holds |
|---|---|
| `data/raw/<CODE>.BGD.data.json` | The World Bank API answer for one indicator (all years, Bangladesh), with the date and URL it was fetched from. |
| `data/raw/<CODE>.BGD.meta.json` | The World Bank's metadata for that indicator (name, source organisation). |
| `data/raw/country.BGD.meta.json` | The World Bank's country metadata for Bangladesh (currency unit, special notes). |
| `data/processed/<id>.json` | A list of records (below) for one indicator, oldest year first. The website reads only these. |
| `data/processed/meta.json` | When the data was last checked, whether that check passed, when values last changed, and the World Bank's own "last updated" date per series. |

## Record fields

| Field | Meaning |
|---|---|
| `indicator_id` | Our id, e.g. `inflation`. |
| `country` | ISO3 code, e.g. `BGD`. |
| `year` | The year the value is for (four digits). |
| `value` | The value exactly as published (not rounded). |
| `unit` | `years`, `taka_current` or `percent`. |
| `source_name` | Publisher and dataset, e.g. "World Bank, World Development Indicators". |
| `original_source` | The organisation the World Bank credits, word for word. |
| `source_url` | Human-readable page for this exact indicator, filtered to Bangladesh. Required: without it the value is not shown. |
| `definition_url` | Official definition page. |
| `api_url` | The API address for the raw numbers. |
| `retrieved_at` | Date (Bangladesh time) the value was fetched. |
| `notes` | Caveats from the publisher, word for word. |
| `measured_by` | `income` or `consumption` for poverty measures; `null` otherwise. |

Missing years are simply absent. Nothing is ever filled in.

## Indicators (Milestone 1)

| id | World Bank code | World Bank name | Unit | Notes |
|---|---|---|---|---|
| `life_expectancy` | SP.DYN.LE00.IN | Life expectancy at birth, total (years) | years | |
| `gdp_pc_taka` | NY.GDP.PCAP.CN | GDP per capita (current LCU) | taka_current | LCU for Bangladesh = Bangladeshi taka (World Bank country metadata). Fiscal-year note attached. |
| `inflation` | FP.CPI.TOTL.ZG | Inflation, consumer prices (annual %) | percent | |
