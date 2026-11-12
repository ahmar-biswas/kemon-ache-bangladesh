# Kemon Ache Bangladesh? (কেমন আছে বাংলাদেশ?)

A bilingual (English/Bangla) dashboard of published figures on Bangladesh: economy,
poverty and inequality, education and health. Every figure is shown with its source.

## Getting started

You need Node.js (version 22 or newer) and Git.

```bash
npm install
```

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Starts the site on your computer. Open the address it prints, e.g. http://localhost:5173 |
| `npm test` | Runs all tests, including the source check (every shown value has a source line). |
| `npm run check` | Runs everything CI runs: type check, translation check, data check, tests. |
| `npm run check:i18n` | Fails if any English string has no Bangla translation. |
| `npm run check:data` | Fails if any data record lacks a source or fails validation. |
| `npm run data:refresh` | Fetches the latest data from the World Bank, validates it and updates `data/`. The country metadata step can take a few minutes. |
| `npm run build` | Builds the site into `dist/`. |

## Where things are

- `src/`: the website (React + TypeScript).
- `src/i18n/`: all text in English (`en.json`) and Bangla (`bn.json`).
- `scripts/`: data fetching and the checks.
- `data/raw/`: cached World Bank answers.
- `data/processed/`: the clean data the site reads.
- `docs/`: the specification and milestones.
- `DECISIONS.md`: why things are done the way they are.
- `DATA_DICTIONARY.md`: what each data field means.
- `BANGLA_REVIEW.md`: Bangla strings waiting for review.
- `DROPPED_INDICATORS.md`: indicators left out, and why.
