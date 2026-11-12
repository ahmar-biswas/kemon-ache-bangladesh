## 14. Files and structure (suggested)

```
/data/raw/              cached API responses
/data/processed/        normalised JSON per indicator + countries + meta
/scripts/               fetchers, validators, template filler
/src/i18n/en.json, bn.json, countries.bn.json
/src/components/        Tile, PeerStrip, SourceLine, Toggle, ChartFrame, ...
/src/pages/             Home, Area, Subsection, Indicator, Compare, Sources, About, HowToRead
/.github/workflows/     refresh-data.yml, ci.yml
DECISIONS.md  DROPPED_INDICATORS.md  BANGLA_REVIEW.md  DATA_DICTIONARY.md  README.md
```
