# Kemon Ache Bangladesh? (কেমন আছে বাংলাদেশ?)

A bilingual (English/Bangla) well-being dashboard for Bangladesh. Economy (with Poverty and inequality), Education, Health. Real published data only, plain language, every figure linked to its source, compared with similar countries. Static site, automatic data refresh through GitHub Actions. The owner (Ahmar) is a student and this is a first large build: explain decisions in plain words and ask when unsure.

## Rules that are always on (full text: docs/reference/02-hard-rules.md)
1. **Source under everything.** Every value, chart and figure-bearing sentence shows source name, a direct hyperlink to the exact dataset page, data year and retrieved date directly beneath it. No source = do not render. CI must fail on a missing source.
2. **Real data only.** Never invent, estimate, interpolate, smooth, forecast or fill gaps. Missing = "Data not available" / "তথ্য পাওয়া যায়নি".
3. **Derived numbers** are simple arithmetic only, labelled "Calculated by this site", with formula and inputs linked. **No scores, indices or composites.**
4. **Neutral language.** No good/bad/better/worse. "Ahead of / behind" only through the position badge for indicators with a sourced favourable direction (docs/reference/08-design-system.md, 8.10). Never signal good/bad with colour.
5. **Explanations are definitions only** and link to the official definition.
6. **Bilingual everywhere.** Every string in English and Bangla; toggle on every page; Bangla numerals and lakh/crore grouping in Bangla mode; CI fails on a missing Bangla string. Bangla text is a draft until Ahmar reviews it: list unsure strings in BANGLA_REVIEW.md.
7. **Taka** for domestic money where a taka series is published (never convert dollars ourselves); international dollars (PPP) for cross-country comparison; dollar-only series shown in dollars as published.
8. **No hard-coded data** in components or translation files. Numbers come from the generated JSON.
9. **Mobile-first and light.** 360 px phone first; homepage JS under about 300 KB gzipped; glass, grain and animation must degrade gracefully.
10. **Design is binding.** Follow docs/reference/08-design-system.md: tokens only (no raw hex in components), the specified fonts, layered background, glass only where specified, the red-disc-on-green flag switch, Bangladeshi motifs only where described, light theme only.

## Core design tokens (rest in 08-design-system.md)
chal #F6F6EF (page) · muslin #FBFBF6 (paper) · kali #16211C (ink) · dhan #006A4E (flag green) · dhan-chart #007A5A · lal #F42A41 (flag red: the disc and background wash only) · chart series order: dhan-chart, paat #C9831A, padma #2B6CB0, rickshaw #B5446E, nil #6B4FA0, sindoor #D2542A · peers #9AA39D.

## How to work
- Work on **one milestone at a time**. The user will name it. Read `docs/milestones/<that file>` and **only** the reference files it lists. Do not read the whole of docs/BUILD_PROMPT_FULL.md.
- Start in plan mode: propose a short plan and wait for approval before editing files.
- Never guess a data fact. Verify every indicator code against the live source; drop failures into DROPPED_INDICATORS.md with the reason.
- If a rule would be broken to achieve something, stop and ask. Record every decision in DECISIONS.md.
- When a milestone is done: run tests, update docs/PROGRESS.md, commit with a clear message, then stop and tell the user (a) what was built, (b) three things to check by eye, (c) anything unresolved.

## Skills (use when available; if a skill is missing, follow the reference file instead)
M3 and M4: frontend-design, dataviz (run its palette validator). M5: dataviz. M8: design:accessibility-review, data:validate-data.

## Commands
dev: `npm run dev` · test: `npm test` (all CI checks: `npm run check`) · fetch data: `npm run data:refresh` (country metadata step is slow, minutes; World Bank API sometimes returns 502, retries built in) · build: `npm run build`
On this PC, Node/Git were installed after the shell started: prefix PowerShell commands with `$env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User');` if `node` is not found.

## Files
docs/PROGRESS.md (status) · docs/milestones/ (M1–M9) · docs/reference/ (numbered spec sections) · docs/BUILD_PROMPT_FULL.md (complete original, for reference only)
