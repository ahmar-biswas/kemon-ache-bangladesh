## 10. Navigation map and click paths (v1)

Header menu on all pages: **Home · Economy · Education · Health · Compare · Sources · About**, plus the language toggle. On mobile: a menu button opening a full-width list. Breadcrumbs on every page below Home.

```
Home
├── Economy  (/economy)
│   ├── Prices & growth      (/economy/growth-and-prices)
│   │     GDP per person (taka) · GDP per person growth · GDP growth · Inflation · Exchange rate
│   ├── Jobs                 (/economy/jobs)
│   │     Youth unemployment · Unemployment · Women in the labour force
│   ├── Money from abroad & reserves (/economy/money-and-reserves)
│   │     Remittances (% of GDP) · Reserves (months of imports) · Reserves (US dollars)
│   └── Poverty & inequality (/economy/poverty-and-inequality)   ← MAJOR subsection
│         Poverty (international line) · Poverty (lower-middle-income line) ·
│         Poverty (national line, Bangladesh only) · Gini index ·
│         Income share of poorest 20% · Income share of richest 10%
├── Education (/education)
│     Adult literacy · Secondary enrolment (all, girls, boys) · Primary completion ·
│     Students per teacher · Education spending (% of GDP)
├── Health (/health)
│     Life expectancy · Under-5 deaths · Mothers' deaths · Child stunting ·
│     Child vaccination (DPT) · Doctors · Hospital beds ·
│     Out-of-pocket health spending · Health spending (% of GDP)
├── Compare (/compare)
│     Pick any indicator + any countries; see all comparison charts at once
├── Indicator page (/indicator/<id>)   reached from any tile, row, or chart
├── Sources (/sources)   complete table of every data point's source link, definition link,
│                        data year, retrieved date, and notes
└── About (/about)  and  How to read this site (/how-to-read)
```

**Click behaviour**
- Homepage tile → that indicator's page.
- Homepage area card → the area page.
- Area page: a short snapshot (template sentences), a grid of every indicator in that area with the same tile anatomy as the homepage (value, plain line, peer dot strip, source), grouped by the sub-pages above. Economy's area page puts the **Poverty & inequality** subsection first or equally prominent, as a large card at the top, because it tells the most about well-being.
- Subsection page: a longer explanation block, all indicators in that subsection, one chart per indicator (Bangladesh trend + peers), source lines.
- Every chart's series label and every table row is clickable to the indicator page.
- Every indicator page has "Compare with other countries", "View as table", "Download CSV", "Where does this come from?" controls.
