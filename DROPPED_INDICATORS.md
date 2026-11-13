# Dropped indicators

Indicators from the spec that are left out of v1, and why. An indicator is dropped if its
code fails against the live World Bank API, Bangladesh has no usable data, or fewer than
three peer countries have data in the last ten years (section 5.3).

| ID | Code | Checked on | Reason |
|---|---|---|---|
| social_progress_index | Social Progress Index (Social Progress Imperative) | 2026-11-13 | Data download is behind a paid "Premium Access" wall; no free machine-readable file, and reuse terms not stated. Replaced by safe drinking water (SH.H2O.SMDW.ZS) at Ahmar's choice. |

Milestone 1 checked three codes against the live API on 2026-11-13. Milestone 2 checked all 16 P0 series the same day (the refresh fails if a series name differs from scripts/indicators.ts). Every P0 indicator has Bangladesh data and at least 6 of the 7 peers since 2016, so none is dropped. See docs/DATA_AVAILABILITY.md.
