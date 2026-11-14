# Hand check of 20 displayed values (M8, section 16)

Checked on 2026-11-14 with `npx tsx scripts/check-values.ts` (fixed seed 20261114, so the same 20 come
up again). Each value was picked at random from the data files the site displays, then fetched again
from the World Bank API for that one country and year. The full result, with the exact request for
each row, is in [crawl/value-check.json](crawl/value-check.json).

- 12 Bangladesh values (any year shown on the over-time charts)
- 4 values for the comparison countries
- 4 "newest value" figures for other countries (Compare and the Sources page)

**Result: 20 of 20 match the source exactly** (to the last published digit; the site rounds only when it displays).

| # | Group | Measure | Series | Country | Year | On the site | At the source | Result |
|---|---|---|---|---|---|---|---|---|
| 1 | Bangladesh | GDP per person, current taka | NY.GDP.PCAP.CN | BGD | 1986 | 6364.46981559181 | 6364.46981559181 | match |
| 2 | Bangladesh | Inflation | FP.CPI.TOTL.ZG | BGD | 1988 | 7.41276595744666 | 7.41276595744666 | match |
| 3 | Bangladesh | Primary completion | SE.PRM.CMPT.ZS | BGD | 2021 | 109.869193724542 | 109.869193724542 | match |
| 4 | Bangladesh | Hospital beds | SH.MED.BEDS.ZS | BGD | 2016 | 0.79 | 0.79 | match |
| 5 | Bangladesh | GDP per person, PPP | NY.GDP.PCAP.PP.CD | BGD | 2000 | 1511.90500583586 | 1511.90500583586 | match |
| 6 | Bangladesh | Physicians | SH.MED.PHYS.ZS | BGD | 2012 | 0.39 | 0.39 | match |
| 7 | Bangladesh | Income share, lowest 20% | SI.DST.FRST.20 | BGD | 2010 | 8.9 | 8.9 | match |
| 8 | Bangladesh | Gini index | SI.POV.GINI | BGD | 2000 | 33.4 | 33.4 | match |
| 9 | Bangladesh | Secondary enrolment (gross) | SE.SEC.ENRR | BGD | 1989 | 19.3137493133545 | 19.3137493133545 | match |
| 10 | Bangladesh | Youth unemployment | SL.UEM.1524.ZS | BGD | 2022 | 10.985 | 10.985 | match |
| 11 | Bangladesh | DPT immunisation | SH.IMM.IDPT | BGD | 1998 | 77 | 77 | match |
| 12 | Bangladesh | GDP per person growth | NY.GDP.PCAP.KD.ZG | BGD | 1968 | 6.313411168743 | 6.313411168743 | match |
| 13 | Comparison country | Hospital beds | SH.MED.BEDS.ZS | KHM | 1960 | 0.746548891067505 | 0.746548891067505 | match |
| 14 | Comparison country | Under-5 deaths | SH.DYN.MORT | IND | 1997 | 102.7 | 102.7 | match |
| 15 | Comparison country | PM2.5 | EN.ATM.PM25.MC.M3 | LKA | 2001 | 32.8129875379596 | 32.8129875379596 | match |
| 16 | Comparison country | DPT immunisation | SH.IMM.IDPT | NPL | 1994 | 54 | 54 | match |
| 17 | Newest value, other country | Inflation | FP.CPI.TOTL.ZG | BLZ | 2025 | 1.06281547952896 | 1.06281547952896 | match |
| 18 | Newest value, other country | GDP per person growth | NY.GDP.PCAP.KD.ZG | TUV | 2025 | 3.28836017215532 | 3.28836017215532 | match |
| 19 | Newest value, other country | PM2.5 | EN.ATM.PM25.MC.M3 | ROU | 2023 | 16.007729806639 | 16.007729806639 | match |
| 20 | Newest value, other country | Hospital beds | SH.MED.BEDS.ZS | BRA | 2021 | 2.52 | 2.52 | match |

## Also checked: the six published world rankings ("Bangladesh at a glance")

These come from report pages and download files, not an API, so they were read off the publisher's own page.

| Ranking | On the site | Publisher's page | Result |
|---|---|---|---|
| World Press Freedom Index 2026 (RSF) | 152 of 180 | [rsf.org](https://rsf.org/en/country/bangladesh): "152/ 180" | match |
| Global Hunger Index 2026 | 84 of 122 | [ranking table](https://www.globalhungerindex.org/ranking.html): Bangladesh 84th, 122 ranked | match |
| Corruption Perceptions Index 2025 | 150 of 182 | [transparency.org](https://www.transparency.org/en/countries/bangladesh): "ranks 150 out of 182 countries" | match |
| SDG Index 2026 (SDSN) | 110 of 169 | [profile page](https://dashboards.sdgindex.org/profiles/bangladesh): "/169" shown, but the rank number loads by script | **please check by eye** |
| Human Development Index (2023 data) | 130 of 193 | [HDR country page](https://hdr.undp.org/data-center/specific-country-data#/countries/BGD) loads by script | **please check by eye** |
| World Happiness Report 2026 | 127 of 147 | [WHR table](https://data.worldhappiness.report/table) loads by script | **please check by eye** |
