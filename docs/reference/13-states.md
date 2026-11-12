## 13. Page states and edge cases
- **Missing data:** "Data not available" plus last available year if any, plus the source link. Never a zero.
- **Old data:** if the latest year is more than 5 years old, show a small neutral note "Latest published figure is from {year}."
- **Survey indicators** (poverty, inequality, stunting): show every available survey year as separate points; do not draw lines across long gaps without markers.
- **Mixed measurement bases** (income vs spending in inequality data): show the basis in the tooltip and a note under the chart.
- **Slow connection:** show text and tiles first; load charts lazily after.
- **No JavaScript:** navigation and the language toggle still work; core text and tile values are included in the pre-rendered HTML (pre-render the pages at build time).
- **Printing:** a simple print stylesheet that keeps source lines.
