## 12. The indicator page (`/indicator/<id>`) in detail

Top to bottom:
1. Breadcrumb, title, language toggle.
2. **Headline**: latest value, year, unit, change line, plain explanation (section 11), "Official definition ↗".
3. **Bangladesh over time**: line chart from the earliest available year. Hover or tap shows year and value. Constant taka for money trends. Gaps are shown as gaps, never joined across missing years with a fake line segment.
4. **Compare with other countries** (the key feature). A control to pick countries (default peer set; presets; search all). Then:
   - 4a. **Over time**: multi-line chart, Bangladesh highlighted, peers in grey with direct end-of-line labels.
   - 4b. **Latest year**: horizontal bar (or dot) chart ranked from highest to lowest among the selected countries, with each country's data year printed beside its bar. Bars start at zero.
   - 4c. **Against income** (only for indicators where this makes sense, such as health and education): scatter of this indicator against GDP per capita PPP (log scale, clearly labelled with a one-line explanation of why log scale is used).
   - Each chart has its own source line beneath it listing all datasets used, with links including the selected countries where supported.
5. **Data table** (View as table) and **Download CSV** with columns: country, year, value, unit, source name, source URL, retrieved date, notes.
6. **How to read this chart** (two short sentences in plain language).
7. **Where does this come from?** box: source name, original source if different, links, retrieved date, data year, notes, and "Calculated by this site" disclosure if anything is derived.

The `/compare` page is the same comparison module with an indicator picker at the top and the ability to stack several indicators.
