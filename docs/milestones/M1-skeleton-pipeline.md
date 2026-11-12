# Milestone 1: Skeleton and data pipeline

## Read only these
- `docs/reference/02-hard-rules.md`
- `docs/reference/04-tech.md`
- `docs/reference/05-data-layer.md`
- `docs/reference/06-currency-numbers.md`
- `docs/reference/07-language-writing.md`
- `docs/reference/14-files.md`

## Skills
None needed.

## Steps
1. Create the Vite + React + TypeScript project with the folder structure in 14-files.md. Add DECISIONS.md, DROPPED_INDICATORS.md, BANGLA_REVIEW.md, DATA_DICTIONARY.md and a README.
2. Set up language routing (`/en/...` and `/bn/...`), a plain language toggle (styling comes in M3), and the i18n files with a CI check that fails on any missing Bangla key.
3. Write number, date and currency formatting utilities: Bangla numerals, lakh/crore grouping for taka, percent and decimal rules, four-digit years. Add unit tests for both languages.
4. Build the SourceLine component (source name, direct link, data year, retrieved date) and a CI check that fails if any rendered value lacks a source URL.
5. Write the fetch, normalise and validate scripts using the record schema in 05-data-layer.md. Fetch just three indicators to prove the pipeline: life expectancy, GDP per capita in taka, and inflation, for Bangladesh only.
6. Render those three values on one plain page in English and Bangla, each with its source line.

## Done when
- Tests pass; the three indicators have full provenance in JSON.
- The page shows all three with working source links in both languages.
- The CI workflow runs tests and the source/translation checks.

## Then
Run tests, update docs/PROGRESS.md, commit, and stop. Report: what was built, three things for the user to check by eye, anything unresolved.
