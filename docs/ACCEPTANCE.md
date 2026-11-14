# Acceptance checklist and design finish gate (M8)

Walked on 2026-11-14 against `docs/reference/16-acceptance.md` and section 8.15 of
`docs/reference/08-design-system.md`. **Pass** means checked, with the evidence named. **Open** means not met
yet, with the reason.

The evidence files are in `docs/crawl/` (the last run of each check) and `docs/screenshots/`.

## How to repeat the checks

```bash
npm run check            # types, translations, data, 992 unit tests (CI)
npm run build
npm run check:crawl      # every page in both languages (CI)
npm run check:a11y       # axe, WCAG 2.1 AA, every page at 1280 and 360 px (about 10 minutes)
npm run check:keyboard   # Tab walk, 10 pages at 1280 and 360 px
npm run check:lighthouse # phone profile, 6 pages
npx tsx scripts/screenshots.ts   # docs/screenshots/
npx tsx scripts/check-values.ts  # the 20-value hand check (docs/VALUE_CHECK.md)
npm run check:crawl -- --external   # outside links, slow (World Bank rate limits)
```

## Section 16: acceptance checklist

| # | Item | Result | Evidence |
|---|---|---|---|
| 1 | No value without a visible, working, direct source link beneath it, a data year and a retrieved date | **Pass** | Crawl: 830 values on 98 pages, each inside a figure whose source line has an `https` link, a data year and a retrieved date; charts and tables too. Also `tests/sources.test.tsx` in CI. Outside links: see "Outside links" below. |
| 2 | No estimated, interpolated or invented number; derived numbers labelled and reproducible | **Pass** | 20 of 20 random values match the World Bank API exactly (docs/VALUE_CHECK.md). Derived numbers (median, ranks, shares, 2025-price line) carry "Calculated by this site" with formula and inputs (tests in CI). Note: lines join published values across missing years, with every published dot kept and a note (DECISIONS 122, Ahmar's choice); no value is drawn where none was published. |
| 3 | No composite score or index | **Pass** | The site makes none. Published indices by others (SDG Index, HDI, Global Hunger Index, press freedom, happiness, corruption) are shown as their publishers' ranks, with source (DECISIONS 124). |
| 4 | Every page in English and Bangla; toggle everywhere; Bangla numerals; lakh/crore | **Pass** | Crawl: both languages of every page, no English words or digits on Bangla pages, no Bangla on English pages, no unfilled placeholders, `<html lang>` correct; toggle in the header of every page (keyboard walk); grouping tests in `tests/format.test.ts`. |
| 5 | Taka for domestic money; international dollars for cross-country money, said so | **Pass** | GDP per person in taka on tiles, compared in PPP dollars with "Compared in international dollars" (screenshots home-*); M2/M6 tests. |
| 6 | Homepage: 12 headline tiles with peer strips, comparison section, three area cards (section 9) | **Pass, changed by decision** | Ahmar redesigned the homepage in M4 (DECISIONS 80–85): four area tiles with one headline each and peer strips, the country slicer as the comparison, "Bangladesh at a glance", and the other measures under "The full picture". Not the literal section 9 layout. |
| 7 | Every click path in section 10 works; Poverty & inequality prominent under Economy | **Pass** | Crawl: no broken links inside the site (all 98 pages, every link and #anchor). `tests/navigation.test.tsx`. Poverty and inequality is the first, large card on /economy (screenshot economy-*). |
| 8 | Every indicator has a plain explanation in both languages with an official definition link | **Pass** | 43 shown measures have an `explain.*` text in both languages (CI translation check) and a `definition_url`; three companion series (constant taka, girls', boys' enrolment) are explained on their main measure. |
| 9 | Every indicator page offers Bangladesh trend, peer comparison over time, latest-year comparison, table and CSV | **Open** | Measure pages have Bangladesh over time, the latest-year comparison (up to 10 countries), Chart/Table and CSV on each. **Peers over time** is drawn only on the four Economy subsection pages, not on each measure page. Question for Ahmar: add the same peers-over-time chart to every measure page (between "Compare" and "Over time")? |
| 10 | Neutral language, checked by search for banned words in both languages | **Pass** | Crawl searches every page for 37 English and 22 Bangla judgement words (list in `scripts/crawl.ts`); none found. Allowed on purpose: publisher notes quoted word for word (R8) and the About sentence that states the rule (DECISIONS 130). |
| 11 | Scheduled refresh runs, validates, never publishes unvalidated data; "Last checked" and "Latest data year" visible | **Open (M9)** | The refresh workflow is M9. "Last checked" is in the footer of every page (with a note if the last check failed); the data year sits beside every figure and in every source line. |
| 12 | Mobile performance budget met; accessibility checks pass | **Pass** | Lighthouse, phone profile: homepage JS 153 KB gzipped (budget 300), 249 KB in total without fonts (budget 1 MB); accessibility 100 on all 6 pages; axe finds no WCAG 2.1 AA violation on any of 196 page views; keyboard walk passes. |
| 13 | Design follows section 8 | **Pass** | Token test (no raw hex in components) in CI; fonts Newsreader, Atkinson Hyperlegible Next, Anek Bangla, Tiro Bangla; layered background; glass fallbacks checked (below); flag switch on language and Chart/Table; no uppercase labels, gradient text or banned fonts (searched). |
| 14 | No colour signals good or bad; position badges only with a sourced direction | **Pass** | Badges come only from `favourable_direction` higher/lower with a `direction_source_url`; others show the "depends on the situation" note (tests in CI). Forced-colours fix keeps the filled/open cue (DECISIONS 134). |
| 15 | Categorical palette passes the palette validator against the final surface | **Pass** | docs/palette-validation.md (M3): all checks pass on `--muslin`; paat gets relief through labels and the table view. Not re-run in CI: the validator script has no licence notice (open question carried from M3). |
| 16 | Design finish gate 8.15 fully ticked, with screenshots at 360, 768, 1280 in both languages | **Pass** | See below. 42 page screenshots + tooltip + 6 fallbacks in docs/screenshots/. |
| 17 | 20 randomly chosen values verified against their source pages | **Pass** | docs/VALUE_CHECK.md: 20 of 20 match. Also 3 of 6 published rankings matched on the publishers' pages; 3 pages load their numbers by script, listed for Ahmar to check by eye. |

## Section 8.15: design finish gate

| Item | Result | Evidence |
|---|---|---|
| Screenshots at 360, 768 and 1280 px in both languages; fix clipping, overlap, awkward Bangla wrapping, unreadable numerals | **Pass** | 7 pages × 2 languages × 3 widths (docs/screenshots/). No page scrolls sideways at any width (checked by the script). Fixed in M8: pages were written at build time as a hidden block plus a swap script, so without JavaScript only the loading line showed and pages jumped on load (DECISIONS 136); charts were briefly wider than a phone screen (137); the over-time tooltip ran off the left edge on phones and squeezed into a thin column at the right end on desktop; event markers overlapped on phones (DECISIONS 134, 135). |
| None of the banned patterns | **Pass** | Searched the styles for uppercase labels, gradient text and banned fonts: none. Screenshots show no glow orbs, purple gradients, numbering, emoji icons or three-column feature grid; tiles are not identical grey-shadow cards (area washes, muslin threads). |
| Squint test: only Bangladesh green, the red disc and chart data are saturated | **Pass** | Screenshots home-*, measure-*: the saturated colours are the green values and dots, the red discs (flag switch, headings) and the peer colours inside charts. |
| Glass fallbacks tested (backdrop-filter off, reduced transparency, forced colours, Save-Data) | **Pass** | docs/screenshots/fallback-*.jpg: each renders opaque paper surfaces, readable text, working controls; Save-Data sets the `save-data` class (no curtain, no contour draw-in). Forced colours: Bangladesh stays a filled mark (fixed in M8). |
| Accessibility: keyboard walk, screen reader on tiles and charts, contrast in CI, Lighthouse ≥ 95 | **Pass, one part partly** | Keyboard walk passes (every control reachable, visible focus, skip link first; slicer arrows, chart crosshair arrows and Chart/Table checked by hand). Contrast tests in CI. Lighthouse accessibility 100 on all 6 pages. Screen reader: checked through the accessibility tree (axe, roles and labels on tiles, charts as `role="img"` with a label, table view, live regions); **not yet tried with a real screen reader (NVDA/TalkBack)**. |
| Performance: homepage within budget with glass, grain and contours; degrades on low-end | **Pass** | Lighthouse phone profile (slow 4G, 4× slower CPU): performance 94 (English homepage), 92 (Bangla homepage), 79–96 on other pages; LCP 1.4–1.9 s; layout shift 0–0.001 except /bn/sources (0.18, see open issue 7). Low-end behaviour: the `lite` and `save-data` classes switch off glass, curtain and contour draw-in (fallback screenshots). |

## Outside links

All 225 distinct outside links were tried (`npm run check:crawl -- --external`; full list in
`docs/crawl/external-links.json`).

- **Every link outside the World Bank data site answers normally** (UN, WHO, UNDP, RSF, GHI, Transparency, SDSN, World Happiness, the World Bank API, Databank and data help desk: 103 links, all 200).
- **data.worldbank.org** (122 links, the "exact dataset page" links): on the first run most answered 429 "too many requests" or 5xx, because the checker asked too fast; the checker now asks one at a time with pauses. The slow re-run was stopped after 150 of 225 links (over an hour, mostly waiting on the World Bank rate limit). Checking these links is left for M9, where the hosted site can run it as a scheduled job. (The indicator codes in these links are the same ones the API answered for in the 20-value check.)

## Found and fixed during M8 (beyond the checklist)

- **No-JavaScript pages were empty** (section 13, since M7): every page except the homepage showed only the loading line without JavaScript, because the page body was written as a hidden block. Now the HTML holds the page itself; a test guards it (DECISIONS 136).
- **Layout shift** on measure pages and /sources (0.3–0.9 on a phone) from that hidden block and from charts drawn too wide for one frame: now 0.000 on 9 pages with phone emulation (DECISIONS 136, 137).

## Open issues (carried to Ahmar or M9)

1. **Peers over time on every measure page** (item 9): needs Ahmar's yes; the chart already exists (Economy subsections).
2. **Scheduled refresh** (item 11): M9.
3. **Event markers on phones** (DECISIONS 135): stacked lanes accepted by Ahmar after checking on a phone (2026-11-14).
4. **Bangla review**: done (Ahmar, 2026-11-14): four changes applied, everything else accepted.
5. **Three rankings to check by eye** (SDG Index, HDI, happiness): checked by Ahmar (2026-11-14).
6. **Real screen reader pass** (NVDA on Windows, TalkBack on a phone): not done.
7. **Bangla font swap on text-heavy Bangla pages** (/bn/sources: layout shift 0.18, first visit only): the long Bangla paragraphs are drawn in the phone's own Bangla font first and re-wrap when Anek Bangla arrives. Same decision as the open "Bangla font size" question: preload the Bangla body font on /bn pages, drop Anek Bangla 600, or subset the fonts.
8. **Lighthouse best practices 81** on this PC only: the Kaspersky antivirus injects a script over plain http into every page. Not a site problem; re-check on the hosted site in M9.
