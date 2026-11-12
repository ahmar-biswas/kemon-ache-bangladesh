## 5. Data layer

### 5.1 Principle
One small, uniform record per country, indicator, and year, with full provenance. Cross-country comparison uses the same source and definition for every country (mainly the World Bank, with WHO/UNESCO/UNICEF figures as republished there). Bangladesh-only "latest" figures from Bangladesh Bank or BBS may be added only if a stable, machine-readable or clearly published official file exists. Otherwise leave them out of v1.

### 5.2 Record schema (per data point)

```json
{
  "indicator_id": "life_expectancy",
  "country": "BGD",
  "year": 2023,
  "value": 74.7,
  "unit": "years",
  "source_name": "World Bank, World Development Indicators",
  "original_source": "UN Population Division (as listed by the World Bank)",
  "source_url": "https://data.worldbank.org/indicator/SP.DYN.LE00.IN?locations=BD",
  "definition_url": "https://databank.worldbank.org/metadataglossary/world-development-indicators/series/SP.DYN.LE00.IN",
  "api_url": "https://api.worldbank.org/v2/country/BGD/indicator/SP.DYN.LE00.IN?format=json",
  "retrieved_at": "2026-11-13",
  "notes": ["modelled estimate"],
  "measured_by": null
}
```

(The numbers above are placeholders to show the shape only. Never copy them into the site.)

- `source_url` must open a human-readable page for that exact indicator. For multi-country charts, the link must include all countries shown where the source supports it (e.g., `?locations=BD-IN-PK-LK-NP`).
- Keep `original_source` and `notes` exactly as the publisher states them.

### 5.3 Indicator list and sources

All codes are World Bank World Development Indicators (WDI) unless stated. **VERIFY** each code, unit, latest year, and Bangladesh availability against the live API at build time. If an indicator has no usable Bangladesh data or fewer than three peer countries with data in the last ten years, drop it from v1 and list it in `DROPPED_INDICATORS.md` with the reason.

**Priority P0 = the 12 homepage headline indicators (build first).**

| ID | Area | Indicator | Candidate code | Priority |
|---|---|---|---|---|
| gdp_pc_taka | Economy | GDP per capita in taka (current taka for the latest figure; constant taka for trends) | NY.GDP.PCAP.CN, NY.GDP.PCAP.KN | P0 |
| gdp_pc_ppp | Economy | GDP per capita, PPP, international dollars (comparison only) | NY.GDP.PCAP.PP.CD | P0 |
| gdp_pc_growth | Economy | GDP per capita growth, annual % | NY.GDP.PCAP.KD.ZG | P0 |
| gdp_growth | Economy | GDP growth, annual % | NY.GDP.MKTP.KD.ZG | P1 |
| inflation | Economy | Inflation, consumer prices, annual % | FP.CPI.TOTL.ZG | P0 |
| youth_unemployment | Economy | Unemployment, youth (ages 15–24), modelled ILO estimate | SL.UEM.1524.ZS | P0 |
| unemployment | Economy | Unemployment, total, modelled ILO estimate | SL.UEM.TOTL.ZS | P1 |
| female_lfp | Economy | Labour force participation, female (15+), modelled ILO estimate | SL.TLF.CACT.FE.ZS | P1 |
| remittances_gdp | Economy | Personal remittances received, % of GDP | BX.TRF.PWKR.DT.GD.ZS | P1 |
| reserves_months | Economy | Total reserves in months of imports | FI.RES.TOTL.MO | P1 |
| reserves_usd | Economy | Total reserves (incl. gold), US dollars, as published | FI.RES.TOTL.CD | P1 |
| exchange_rate | Economy | Official exchange rate, taka per US dollar (period average) | PA.NUS.FCRF | P1 |
| poverty_intl | Poverty & inequality | Share of people below the World Bank international poverty line (read the current line and PPP year from the metadata; do not assume) | SI.POV.DDAY | P0 |
| poverty_lmic | Poverty & inequality | Share below the lower-middle-income poverty line (read the line from metadata) | SI.POV.LMIC | P1 |
| poverty_national | Poverty & inequality | Share below the national poverty line | SI.POV.NAHC | P1 (Bangladesh trend only; not comparable across countries) |
| gini | Poverty & inequality | Gini index | SI.POV.GINI | P1 |
| share_low20 | Poverty & inequality | Income/consumption share held by the lowest 20% | SI.DST.FRST.20 | P0 |
| share_top10 | Poverty & inequality | Income/consumption share held by the highest 10% | SI.DST.10TH.10 | P1 |
| literacy | Education | Adult literacy rate, 15+ | SE.ADT.LITR.ZS | P0 |
| secondary_enrol | Education | School enrolment, secondary, gross % (also female and male: SE.SEC.ENRR.FE, SE.SEC.ENRR.MA) | SE.SEC.ENRR | P0 |
| primary_completion | Education | Primary completion rate | SE.PRM.CMPT.ZS | P1 |
| pupil_teacher | Education | Pupil–teacher ratio, primary | SE.PRM.ENRL.TC.ZS | P1 |
| edu_spend | Education | Government expenditure on education, % of GDP | SE.XPD.TOTL.GD.ZS | P1 |
| life_expectancy | Health | Life expectancy at birth | SP.DYN.LE00.IN | P0 |
| under5_mortality | Health | Mortality rate, under-5, per 1,000 live births | SH.DYN.MORT | P0 |
| maternal_mortality | Health | Maternal mortality ratio, per 100,000 live births (modelled) | SH.STA.MMRT | P1 |
| stunting | Health | Stunting, children under 5, % | SH.STA.STNT.ZS | P0 |
| dpt | Health | Immunisation, DPT, % of children ages 12–23 months | SH.IMM.IDPT | P1 |
| physicians | Health | Physicians per 1,000 people | SH.MED.PHYS.ZS | P1 |
| beds | Health | Hospital beds per 1,000 people | SH.MED.BEDS.ZS | P1 |
| oop | Health | Out-of-pocket spending, % of current health expenditure | SH.XPD.OOPC.CH.ZS | P0 |
| health_spend_gdp | Health | Current health expenditure, % of GDP | SH.XPD.CHEX.GD.ZS | P1 |

The 12 P0 homepage tiles are: GDP per capita (taka), GDP per capita growth, inflation, youth unemployment, poverty (international line), income share of the poorest 20%, adult literacy, secondary enrolment, life expectancy, under-5 mortality, child stunting, out-of-pocket health spending. Note that `gdp_pc_ppp` is P0 as a supporting series for comparisons.

### 5.4 Refresh and automation
- GitHub Actions workflow `refresh-data.yml`: runs weekly (World Bank data changes only a few times a year, so weekly is enough). Also allow manual trigger.
- Steps: fetch, normalise to the schema, validate, diff, commit only if values changed, rebuild, deploy.
- **Validation (fail the run, keep the last good data, and show nothing new):** unit changed, value outside plausible range for the indicator, year went backwards, missing `source_url`, indicator code returned an error, more than 20% of records changed unexpectedly (flag for human review instead of auto-publishing).
- **Never fabricate on failure.** If a fetch fails, keep the previous data and update only a visible "Last checked: <date>" notice. Show "Latest data year" separately from "Last checked" so the reader is not misled about freshness.
- Cache API responses in the repo so builds are reproducible.

### 5.5 Peer countries
- **Default peer set (builder: VERIFY income-group classification via the World Bank country metadata API; do not hard-code the group):** India, Pakistan, Sri Lanka, Nepal, Vietnam, the Philippines, Cambodia. Plus a reference line for **"median of lower-middle-income countries"**, computed from the World Bank income classification and flagged as "Calculated by this site" with the list of included countries.
- The reader can add or remove countries from a searchable list of all countries that have data, and can switch to preset groups: "South Asia", "Similar income level", "Neighbours".
- The rule for the default peer set is shown on the page ("Why these countries?") with a link to the classification source.
- For any peer with no data for an indicator in the last 10 years, omit it from that chart and say so below the chart.
- Always show each country's own data year in tooltips and in the table. Never silently compare different years.
