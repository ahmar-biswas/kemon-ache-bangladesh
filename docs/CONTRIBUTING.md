# Contributing and maintenance

Developer notes for working on Kemon Ache Bangladesh?. The project overview is in the [README](../README.md).

## How it works

1. **Data.** `npm run data:refresh` downloads each measure from the World Bank API (and the six
   published rankings), turns every answer into small records with their source, and checks them
   (unit unchanged, values in a sensible range, no year going backwards, every record has a
   source link, not more than 20% of old values changed). It is all or nothing: if any check
   fails, no data file changes. The World Bank's answers are kept in `data/raw/` and the clean
   data in `data/processed/`, both committed, so any build can be repeated.
2. **Site.** A static site (Vite + React + TypeScript). The numbers come only from
   `data/processed/`; nothing is typed into the pages. `npm run build` also writes a finished HTML
   file for every page in both languages, so the site reads without JavaScript.
3. **Hosting.** GitHub Pages, free. The site lives in a folder named after the repository, so the
   publishing build is run with `BASE_PATH=/kemon-ache-bangladesh/` (see `vite.config.ts`).
4. **Automatic jobs** (`.github/workflows/`):
   - `ci.yml`: on every push, runs every check (types, translations, data, tests, build, a crawl of
     every page in both languages). On `main`, if all pass, it publishes the site.
   - `refresh-data.yml`: every Monday at 03:30 Dhaka time (and by hand from the Actions tab),
     downloads the data again, runs every check, commits and publishes. If anything fails, the last
     good data stays, every page says the latest check could not be completed, and an issue is
     opened. Nothing that failed a check is published.
   - `deploy.yml`: the publishing step the other two use.

Every page shows **"Last checked"** (when the data was last downloaded and checked) in the footer,
and every figure shows its own **data year** under it, so the two are never confused.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Starts the site on your computer. Open the address it prints, e.g. http://localhost:5173 |
| `npm test` | Runs all tests, including the source check (every shown value has a source line). |
| `npm run check` | Type check, translation check, data check, tests. |
| `npm run check:crawl` | After `npm run build`: opens every page in both languages in Chrome and checks source lines, translations, links and wording. |
| `npm run check:a11y`, `check:keyboard`, `check:lighthouse` | Slower checks, run by hand before a big change. |
| `npm run check:i18n` | Fails if any English string has no Bangla translation. |
| `npm run check:data` | Fails if any data record lacks a source or fails validation. |
| `npm run data:refresh` | Downloads the latest data, checks it and updates `data/`. Takes several minutes. |
| `npm run build` | Builds the site into `dist/`. |
| `npm run preview:pages` | Serves `dist/` the way GitHub Pages does. Build first with `BASE_PATH=/kemon-ache-bangladesh/`. |
| `npm run bangla:review` | Writes `BANGLA_REVIEW.md`: every Bangla string next to its English. |

## How to add a measure

Only World Bank (WDI) series are set up. Use a different source only if it has a stable,
machine-readable file (see `docs/reference/05-data-layer.md`).

1. **Check the code on the live API** first, e.g.
   `https://api.worldbank.org/v2/country/BGD/indicator/SH.IMM.MEAS?format=json`. Bangladesh needs
   data, and at least three of the peer countries need data from the last ten years. If not, add it
   to `DROPPED_INDICATORS.md` with the reason and stop.
2. **Add it to `scripts/indicators.ts`**, copying a similar entry: `id` (short, lowercase),
   `code`, `area`, `unit`, `expectedName` (the World Bank's exact series name), a wide
   `plausibleRange`, and `favourable_direction: 'none'` unless a UN goal states one (then give the
   goal's page and its words).
3. **Add the text in both languages**, in `src/i18n/en.json` and `src/i18n/bn.json`:
   `indicator.<id>.name`, `indicator.<id>.short` and `explain.<id>` (a definition only, no
   judgement). `npm run check:i18n` lists anything missing.
4. **Put it on a page**: add the id to the right group in `src/data/site.ts`.
5. Run `npm run data:refresh`, then `npm run check`, `npm run build` and `npm run check:crawl`.
   Fix what they report, and write the decision in `DECISIONS.md`.
6. Commit and push. CI checks everything again and publishes.

## How to update the Bangla text

1. All Bangla is in `src/i18n/bn.json` (the English is in `src/i18n/en.json` under the same key).
   Country names and event labels are listed in `BANGLA_REVIEW.md` with the file they come from.
2. Change the text. Keep anything in curly brackets, like `{date}` or `{year}`, exactly as it is:
   the site puts the number there.
3. Run `npm run check:i18n` and `npm run bangla:review`, and note the change in
   `docs/bangla-review-history.md`.
4. Look at the page with `npm run dev`, then commit and push.

Numbers are never typed in Bangla text: the site formats them (Bangla digits, lakh and crore).

## If a refresh fails

You get an issue titled "Data refresh failed (date)" with a link to the run and the last lines of
what went wrong. The site keeps showing the last good figures, with a note that the latest check
could not be completed. Nothing is urgent.

- **The World Bank server did not answer (timeouts, 502, 429).** Common. Wait a day, then open
  **Actions → Weekly data refresh → Run workflow**. If it passes, close the issue.
- **"more than 20% of existing values changed … Needs a human to review".** The World Bank revised
  a series a lot (it does this when it changes a base year or method). Look at the series on the
  World Bank page linked in the issue, and at its "Last updated" date. If the change is real, run
  the workflow by hand and tick **"I have looked at the issue and allow …"**. Every other check
  still applies.
- **"unit changed", "World Bank name changed", "latest year went backwards", "value outside range".**
  The publisher changed something about the series. Do not force it through: look at the World
  Bank page, decide what to do, and write it in `DECISIONS.md`. Fixing it usually means editing
  the measure's entry in `scripts/indicators.ts`.
- **"note has no translation in src/data/notes.ts".** The World Bank added a new note to a figure.
  Add a Bangla pattern for it in `src/data/notes.ts` (word for word), then run the refresh again.
- **A test or the crawl failed.** Run the same commands on your computer (`npm run data:refresh`,
  then `npm run check`, `npm run build`, `npm run check:crawl`) to see the full message.

## Where things are

- `src/`: the website (React + TypeScript).
- `src/i18n/`: all text in English (`en.json`) and Bangla (`bn.json`).
- `scripts/`: data fetching and the checks.
- `data/raw/`: the World Bank's answers, as downloaded.
- `data/processed/`: the clean data the site reads.
- `.github/workflows/`: CI, the weekly refresh and publishing.
- `docs/`: the specification, milestones and progress.
- `DECISIONS.md`: why things are done the way they are.
- `DATA_DICTIONARY.md`: what each data field means.
- `BANGLA_REVIEW.md`: every Bangla string with its English.
- `DROPPED_INDICATORS.md`: indicators left out, and why.
