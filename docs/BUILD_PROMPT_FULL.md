# BUILD PROMPT: "Kemon Ache Bangladesh?" (কেমন আছে বাংলাদেশ?) — Version 1, revision 2 (with full design system)

> **What changed in revision 2:** Section 8 is now a complete visual design system (palette tokens, typography, textured background, liquid glass, the flag switch, Bangladeshi motifs, chart rules, and a design finish gate). Rule R5, the performance rule R10, the homepage notes (9.0), the tile anatomy (9.2) and the acceptance checklist (16) were updated to match. Everything else is unchanged.

You are an expert full-stack developer, data engineer, and bilingual (English/Bangla) information designer. Build Version 1 of the website described below. Read the whole document before writing any code. Where this document gives a rule, follow it exactly. Where it says "builder's call," decide sensibly and record the decision in `DECISIONS.md`. Where something here is marked **VERIFY**, check it against the live source at build time and drop or fix it if it does not hold. Never guess a data fact.

---

## 1. Purpose and what success means

Bangladesh has no easy way for an ordinary person to see the overall state of well-being of the country. GDP counts only production. The HDI covers health and education through a few narrow measures. Public data is mostly locked in English research papers and official tables that an average Bangladeshi cannot easily read.

This site shows the most important measures of well-being in Bangladesh, using only real published data, explained in simple language, in English and Bangla, and compared with similar countries.

**Success** = a visitor finds something about their country that they did not know before and thinks twice about what they assumed. A school or university student can use the comparisons to learn how economists look at a country.

**Audience** = an average Bangladeshi adult or student, most likely on a phone with limited data. Not economists.

**Tone** = serious, calm, plain, respectful. No jokes, no slang, no hype, no emojis, no political commentary. This is not a subject to be taken lightly.

---

## 2. Hard rules (non-negotiable; build must fail CI if broken where checkable)

**R1. Source under everything.** Every data point, chart, table, tile, and every sentence that states a figure has a visible source line directly beneath it. The source line contains: source name, a **direct hyperlink** to the exact dataset/indicator page the value came from, the **data year**, and the **date retrieved**. A footer-only or "Sources" page-only citation is not enough. The `/sources` page is an additional, complete index, not a substitute.

**R2. No source, no display.** If a value has no `source_url`, it must not render. CI must fail if any rendered value lacks one.

**R3. Real data only.** Never invent, estimate, interpolate, extrapolate, smooth, forecast, back-fill, or fill a gap. If a value is missing, show "Data not available" (বাংলা: "তথ্য পাওয়া যায়নি") and, if one exists, the last year for which data is available.

**R4. Derived numbers are allowed only if they are simple arithmetic on published values** (a difference, a percentage change, a rank among selected countries, a median of selected countries). Every derived number is labelled "Calculated by this site" with the formula and the inputs, and the inputs' sources are linked. No models, weights, indices, scores, or composite numbers of any kind. **There is no single "well-being score" anywhere on the site.**

**R5. Neutral language.** Never use words like good, bad, better, worse, alarming, impressive, failing, success, crisis. Use "higher than", "lower than", "up from", "down from". Do not state or imply causes. Do not use red/green (or any colour) to signal good/bad: the brand green and red are identity colours only. Where an official target direction exists, "ahead of" and "behind" comparisons are allowed through the position badge defined in section 8.10, never through colour or judgement words.

**R6. Explanations are definitions only.** The plain-language explanation under each measure says what the number means (see section 11). It makes no claims, judgments, or predictions, and links to the official definition page of that measure (e.g., the World Bank metadata tab).

**R7. Bilingual, complete.** Every user-visible string exists in English and Bangla. A language toggle is visible on every page. CI fails if any key lacks a Bangla value. In Bangla mode, numbers use Bangla numerals and Bangladeshi grouping (see section 6).

**R8. Show the caveats the source gives.** If a source says a figure is modelled, survey-based, measured by income vs spending, or for a different year than other countries, the page shows that note next to the figure.

**R9. No hard-coded data in the front-end.** All numbers come from the generated JSON data files, never typed into components or translation files. (Definitions in section 11 use placeholders like `{value}`, filled from data.)

**R10. Mobile-first and light.** Design for a 360 px wide phone on a slow connection first. Initial page load budget: under 300 KB of JavaScript (gzipped) and under 1 MB total on the homepage, excluding fonts that are subset. No autoplay, no heavy animation, no tracking scripts, no cookies banner needed (do not add analytics in v1). The textured background, glass effects and contour animation in section 8 must degrade gracefully (opaque paper surfaces, no blur, no animation) on low-end phones, `Save-Data`, `prefers-reduced-data`, `prefers-reduced-motion` and `prefers-reduced-transparency`.

---

## 3. Scope of Version 1

**In scope**
- Three areas: **Economy** (including a major **Poverty and inequality** subsection), **Education**, **Health**.
- A dashboard homepage with headline tiles and comparison views.
- Click-through paths from the homepage to area pages to indicator pages.
- Country comparison on every indicator that has cross-country data.
- English/Bangla toggle.
- Automated data refresh.

**Out of scope for v1 (do not build, do not stub in the UI)**
- Crime, Environment, government budget treemaps, district or division level breakdowns, user accounts, comments, forecasts, any score or index, any data from social media or news.

(Phase 2 candidates, for later only: Environment, Crime if reliable data is published, budget treemap, district data.)

---

## 4. Technical decisions (builder's calls already made; change only with a written reason in `DECISIONS.md`)

- **Static site.** Vite + React + TypeScript. Pre-built JSON data files committed to the repository. No server and no database. Hosted free on GitHub Pages or Cloudflare Pages.
- **Automatic updates.** GitHub Actions on a schedule (see section 5.4) runs fetch scripts, validates, commits changed JSON, and redeploys.
- **Charts.** Observable Plot (or Visx if there is a good reason). Keep chart code in one `charts/` module. Must render crisp on phones and support Bangla numerals and labels.
- **Fonts and visual design.** Follow section 8 exactly (Tiro Bangla / Newsreader for headings, Anek Bangla / Atkinson Hyperlegible Next for body; subset and self-host).
- **Routing.** URL-based language: `/en/...` and `/bn/...`. The toggle swaps the prefix and keeps the user on the same page. Remember the last choice with `localStorage` inside try/catch. First visit: Bangla if the browser language starts with `bn`, otherwise English.
- **Accessibility.** WCAG 2.1 AA: contrast, keyboard navigation, visible focus, proper headings, `lang` attributes switching per language, every chart has an adjacent "View as table" and "Download CSV" of exactly the numbers shown.
- **Tests.** Unit tests for data validation and number/date formatting in both languages. A script that crawls every page in both languages and fails on: missing source line, missing translation, untranslated placeholder, broken link, value shown without data year.

---

## 5. Data layer

### 5.1 Principle
One small, uniform record per country, indicator, and year, with full provenance. Cross-country comparison uses the same source and definition for every country (mainly the World Bank, with WHO/UNESCO/UNICEF figures as republished there). Bangladesh-only "latest" figures from Bangladesh Bank or BBS may be added only if a stable, machine-readable or clearly published official file exists. Otherwise leave them out of v1.

### 5.2 Record schema (per data point)

```json
{
  "indicator_id": "life_expectancy",
  "country": "BGD",
  "year": 2023,
  "value": 74.7,
  "unit": "years",
  "source_name": "World Bank, World Development Indicators",
  "original_source": "UN Population Division (as listed by the World Bank)",
  "source_url": "https://data.worldbank.org/indicator/SP.DYN.LE00.IN?locations=BD",
  "definition_url": "https://databank.worldbank.org/metadataglossary/world-development-indicators/series/SP.DYN.LE00.IN",
  "api_url": "https://api.worldbank.org/v2/country/BGD/indicator/SP.DYN.LE00.IN?format=json",
  "retrieved_at": "2026-11-13",
  "notes": ["modelled estimate"],
  "measured_by": null
}
```

(The numbers above are placeholders to show the shape only. Never copy them into the site.)

- `source_url` must open a human-readable page for that exact indicator. For multi-country charts, the link must include all countries shown where the source supports it (e.g., `?locations=BD-IN-PK-LK-NP`).
- Keep `original_source` and `notes` exactly as the publisher states them.

### 5.3 Indicator list and sources

All codes are World Bank World Development Indicators (WDI) unless stated. **VERIFY** each code, unit, latest year, and Bangladesh availability against the live API at build time. If an indicator has no usable Bangladesh data or fewer than three peer countries with data in the last ten years, drop it from v1 and list it in `DROPPED_INDICATORS.md` with the reason.

**Priority P0 = the 12 homepage headline indicators (build first).**

| ID | Area | Indicator | Candidate code | Priority |
|---|---|---|---|---|
| gdp_pc_taka | Economy | GDP per capita in taka (current taka for the latest figure; constant taka for trends) | NY.GDP.PCAP.CN, NY.GDP.PCAP.KN | P0 |
| gdp_pc_ppp | Economy | GDP per capita, PPP, international dollars (comparison only) | NY.GDP.PCAP.PP.CD | P0 |
| gdp_pc_growth | Economy | GDP per capita growth, annual % | NY.GDP.PCAP.KD.ZG | P0 |
| gdp_growth | Economy | GDP growth, annual % | NY.GDP.MKTP.KD.ZG | P1 |
| inflation | Economy | Inflation, consumer prices, annual % | FP.CPI.TOTL.ZG | P0 |
| youth_unemployment | Economy | Unemployment, youth (ages 15–24), modelled ILO estimate | SL.UEM.1524.ZS | P0 |
| unemployment | Economy | Unemployment, total, modelled ILO estimate | SL.UEM.TOTL.ZS | P1 |
| female_lfp | Economy | Labour force participation, female (15+), modelled ILO estimate | SL.TLF.CACT.FE.ZS | P1 |
| remittances_gdp | Economy | Personal remittances received, % of GDP | BX.TRF.PWKR.DT.GD.ZS | P1 |
| reserves_months | Economy | Total reserves in months of imports | FI.RES.TOTL.MO | P1 |
| reserves_usd | Economy | Total reserves (incl. gold), US dollars, as published | FI.RES.TOTL.CD | P1 |
| exchange_rate | Economy | Official exchange rate, taka per US dollar (period average) | PA.NUS.FCRF | P1 |
| poverty_intl | Poverty & inequality | Share of people below the World Bank international poverty line (read the current line and PPP year from the metadata; do not assume) | SI.POV.DDAY | P0 |
| poverty_lmic | Poverty & inequality | Share below the lower-middle-income poverty line (read the line from metadata) | SI.POV.LMIC | P1 |
| poverty_national | Poverty & inequality | Share below the national poverty line | SI.POV.NAHC | P1 (Bangladesh trend only; not comparable across countries) |
| gini | Poverty & inequality | Gini index | SI.POV.GINI | P1 |
| share_low20 | Poverty & inequality | Income/consumption share held by the lowest 20% | SI.DST.FRST.20 | P0 |
| share_top10 | Poverty & inequality | Income/consumption share held by the highest 10% | SI.DST.10TH.10 | P1 |
| literacy | Education | Adult literacy rate, 15+ | SE.ADT.LITR.ZS | P0 |
| secondary_enrol | Education | School enrolment, secondary, gross % (also female and male: SE.SEC.ENRR.FE, SE.SEC.ENRR.MA) | SE.SEC.ENRR | P0 |
| primary_completion | Education | Primary completion rate | SE.PRM.CMPT.ZS | P1 |
| pupil_teacher | Education | Pupil–teacher ratio, primary | SE.PRM.ENRL.TC.ZS | P1 |
| edu_spend | Education | Government expenditure on education, % of GDP | SE.XPD.TOTL.GD.ZS | P1 |
| life_expectancy | Health | Life expectancy at birth | SP.DYN.LE00.IN | P0 |
| under5_mortality | Health | Mortality rate, under-5, per 1,000 live births | SH.DYN.MORT | P0 |
| maternal_mortality | Health | Maternal mortality ratio, per 100,000 live births (modelled) | SH.STA.MMRT | P1 |
| stunting | Health | Stunting, children under 5, % | SH.STA.STNT.ZS | P0 |
| dpt | Health | Immunisation, DPT, % of children ages 12–23 months | SH.IMM.IDPT | P1 |
| physicians | Health | Physicians per 1,000 people | SH.MED.PHYS.ZS | P1 |
| beds | Health | Hospital beds per 1,000 people | SH.MED.BEDS.ZS | P1 |
| oop | Health | Out-of-pocket spending, % of current health expenditure | SH.XPD.OOPC.CH.ZS | P0 |
| health_spend_gdp | Health | Current health expenditure, % of GDP | SH.XPD.CHEX.GD.ZS | P1 |

The 12 P0 homepage tiles are: GDP per capita (taka), GDP per capita growth, inflation, youth unemployment, poverty (international line), income share of the poorest 20%, adult literacy, secondary enrolment, life expectancy, under-5 mortality, child stunting, out-of-pocket health spending. Note that `gdp_pc_ppp` is P0 as a supporting series for comparisons.

### 5.4 Refresh and automation
- GitHub Actions workflow `refresh-data.yml`: runs weekly (World Bank data changes only a few times a year, so weekly is enough). Also allow manual trigger.
- Steps: fetch, normalise to the schema, validate, diff, commit only if values changed, rebuild, deploy.
- **Validation (fail the run, keep the last good data, and show nothing new):** unit changed, value outside plausible range for the indicator, year went backwards, missing `source_url`, indicator code returned an error, more than 20% of records changed unexpectedly (flag for human review instead of auto-publishing).
- **Never fabricate on failure.** If a fetch fails, keep the previous data and update only a visible "Last checked: <date>" notice. Show "Latest data year" separately from "Last checked" so the reader is not misled about freshness.
- Cache API responses in the repo so builds are reproducible.

### 5.5 Peer countries
- **Default peer set (builder: VERIFY income-group classification via the World Bank country metadata API; do not hard-code the group):** India, Pakistan, Sri Lanka, Nepal, Vietnam, the Philippines, Cambodia. Plus a reference line for **"median of lower-middle-income countries"**, computed from the World Bank income classification and flagged as "Calculated by this site" with the list of included countries.
- The reader can add or remove countries from a searchable list of all countries that have data, and can switch to preset groups: "South Asia", "Similar income level", "Neighbours".
- The rule for the default peer set is shown on the page ("Why these countries?") with a link to the classification source.
- For any peer with no data for an indicator in the last 10 years, omit it from that chart and say so below the chart.
- Always show each country's own data year in tooltips and in the table. Never silently compare different years.

---

## 6. Currency, numbers, dates

**Taka first for domestic money values; international dollars only for cross-country comparison.**

- Where the World Bank publishes a **local-currency (taka)** series, show taka. The site never converts dollars to taka itself, because that would be a calculated number with an unstated assumption about the exchange rate.
- **Current taka vs constant taka:** the latest "how much" figure may use current taka. Any chart that shows change over many years must use constant (inflation-adjusted) taka, labelled clearly, because current taka rises over time partly because of price rises.
- **Cross-country comparison** of money values uses **international dollars (PPP)**, because comparing taka with rupees or pesos is meaningless. Label: "Compared in international dollars, which adjust for the fact that things cost different amounts in different countries."
- If a source publishes a money figure **only in US dollars** (e.g., total reserves), show it in US dollars as published and label it. Do not convert.
- Taka format: `৳` symbol. Use the **lakh/crore** grouping in both languages for taka amounts (e.g., 2,73,000 in English mode; ২,৭৩,০০০ in Bangla mode), and the word forms "lakh" and "crore" (লাখ, কোটি) for large amounts. US dollar and international dollar amounts use standard thousands grouping with million/billion in English and the Bangla equivalents (মিলিয়ন, বিলিয়ন) in Bangla mode.
- Bangla mode uses Bangla numerals (০১২৩৪৫৬৭৮৯) everywhere, including charts, tooltips, tables, and years. Use `Intl.NumberFormat('bn-BD', { numberingSystem: 'beng' })` or an equivalent tested approach. Percent signs and decimal separators must be correct in each language.
- Dates: "13 November 2026" / "১৩ নভেম্বর ২০২৬". Always show years as four digits.

---

## 7. Language toggle and writing rules

- Toggle in the top-right of the header on every page: `English | বাংলা`. The active language is visibly selected. It is a real link (`/en/...` ↔ `/bn/...`), works without JavaScript for navigation, and keeps the same page, scroll position of the top, and chart settings (selected countries) where possible.
- Reading level: aim for about class 8. Short sentences. Explain a term the first time it appears on a page, with an "(?)" info link to its definition.
- Bangla: use clear, standard Bangla (সাধু ভাষা is not wanted; use চলিত). Avoid unnecessary English loanwords where a common Bangla word exists, but keep widely used terms (জিডিপি, টাকা, ডলার). The Bangla text in this document is a **first draft written for review by a native speaker**. Flag any Bangla string the builder is unsure of in `BANGLA_REVIEW.md` rather than guessing.
- Country names in Bangla: use the standard Bangla names (e.g., ভারত, পাকিস্তান, শ্রীলঙ্কা, নেপাল, ভিয়েতনাম, ফিলিপাইন, কম্বোডিয়া). Maintain a `countries.bn.json` and flag unsure ones.
- Snapshot sentences (the one-line summaries) are produced from **fixed templates filled with real values**, in both languages. Examples of template shapes: "{indicator} was {value} in {year}, {up from/down from/the same as} {old_value} in {old_year}." and "{value} in {year}, {higher than/lower than} {n} of {m} comparison countries with data." Choose the direction word by comparing the two numbers. No adjectives, no judgement.

---

## 8. Visual design system

**Read this section as binding as the data rules.** The goal is a site that feels designed for Bangladesh and for this subject, and that could not be mistaken for a generic dashboard template. If any choice below conflicts with a library's defaults, the choices below win.

### 8.1 Concept: rice paper, river and thread

A calm, printed-paper surface with a thin layer of glass over it, drawn from things that belong to Bangladesh: the river delta, kantha stitching, jamdani weaving, jute, and the flag. The mood is quiet, premium and trustworthy, like a well-made national almanac, not a startup landing page.

**Spend boldness in two places only; keep everything else quiet:**
1. **The river-delta background** (8.4), which gives every page its character.
2. **The flag switch** (8.6): a red disc sliding on a green glass track. It is the language toggle and the site's signature control.

Everything else (type, cards, charts) stays disciplined so these two stand out. After building, apply the "remove one accessory" test: take off one decorative element that does not carry meaning.

### 8.2 Colour tokens (light theme only in v1; dark mode is out of scope)

Define these as CSS custom properties in `tokens.css`. Never use raw hex in components. Token names are Bengali-flavoured on purpose; use them as written.

| Token | Value | Role |
|---|---|---|
| `--chal` (rice white) | `#F6F6EF` | Page base, a cream-white with a faint green cast |
| `--muslin` | `#FBFBF6` | Raised paper surfaces (tiles, tables) |
| `--kali` (ink) | `#16211C` | Primary text (green-black, never pure black) |
| `--kali-2` | `#46524B` | Secondary text |
| `--kali-3` | `#5C6862` | Muted text (must keep 4.5:1 on `--chal`) |
| `--sutaa` (thread) | `rgba(22,33,28,.14)` | Hairlines, stitch lines, recessive grid |
| `--dhan` (flag green) | `#006A4E` | Brand, links, headings accents, focus ring |
| `--dhan-chart` | `#007A5A` | Bangladesh in charts (validated, slightly more chromatic) |
| `--dhan-tint` | `#E1EEE7` | Selected and hover fills |
| `--dhan-glow` | `rgba(0,106,78,.12)` | Background hue wash, glass tint |
| `--lal` (flag red) | `#F42A41` | The red disc only, and the background hue wash. Decorative and identity use only |
| `--lal-deep` | `#C2182B` | The rare red text or icon (4.5:1 on `--chal`) |
| `--lal-glow` | `rgba(244,42,65,.10)` | Background hue wash |
| `--paat` (jute gold) | `#C9831A` | Chart series 2 |
| `--padma` (river blue) | `#2B6CB0` | Chart series 3 |
| `--rickshaw` (rose) | `#B5446E` | Chart series 4 |
| `--nil` (indigo) | `#6B4FA0` | Chart series 5 |
| `--sindoor` | `#D2542A` | Chart series 6 |
| `--peer-grey` | `#9AA39D` | Non-highlighted comparison countries |

**Rules**
- **Green and red are identity, never meaning.** Bangladesh is always green. The red disc is decoration and the language toggle. Neither colour is ever used to say a number is good or bad (see 8.10).
- The six chart colours were checked with the data-visualisation palette validator in light mode (lightness band, chroma floor, colour-blind separation, normal-vision separation, contrast on the surface): all passed, and the first three also pass the stricter all-pairs check. **The builder must re-run the validator** (`validate_palette.js`) against the final surface colour and fix any failure before shipping. Assign series colours in this fixed order and never cycle or invent a seventh.
- Text contrast 4.5:1 minimum (3:1 for large text and chart marks). Add a CI contrast test for every text-on-surface pair.
- If more than six countries are shown, draw the extra ones in `--peer-grey` with direct labels, and highlight in colour only the countries the reader selects (at most five plus Bangladesh).

### 8.3 Typography

Type carries the personality. Bangla is the primary design language, not a translation of an English layout.

| Role | Bangla | English |
|---|---|---|
| Display and headings | **Tiro Bangla** (calligraphic serif) | **Newsreader** (display optical size) |
| Body, UI, tables, labels | **Anek Bangla** | **Atkinson Hyperlegible Next** |
| Fallbacks | Noto Serif Bengali / Noto Sans Bengali | Georgia / system sans-serif |

**VERIFY** all four families are on Google Fonts under an open licence, then **self-host subsets** (Bengali + Latin + digits only), `font-display: swap`, variable fonts where available, total initial font payload under about 150 KB. If a family fails, use the fallback and record it in `DECISIONS.md`.

Rules
- Scale (ratio about 1.25): 14 / 16 / 18 / 22 / 28 / 36 / 48 / 64 px. Headline sizes use `clamp()`.
- **Bangla is set larger and looser:** body at least 17 px with line-height 1.7; headings line-height 1.35 or more (Bangla vowel marks collide when tight). English body 16–17 px, line-height 1.55.
- Line length: at most 68 characters in English and 58 in Bangla. Everything is **left-aligned**; no centred paragraphs and no justified text.
- **Never letter-space Bangla** (it breaks conjuncts). Never use faux italics or faux bold on Bangla; use real weights.
- No all-caps labels, no eyebrow labels above headings, no single accented word inside a headline, no monospace face for small data labels, no "→" appended to links, no middle-dot meta strings. Section structure is shown with real headings and stitch dividers.
- Large tile values use the display face with tabular lining figures. In Bangla mode, check that Bangla numerals in the display face are legible at 44 px and 64 px; fall back to the Noto face if not.
- Use `font-feature-settings: "tnum"` for numerals in tables and charts.

### 8.4 The background: layers from back to front

The background is never a flat colour. Build it as one fixed layer behind the page (a fixed pseudo-element, not `background-attachment: fixed`, which is slow on phones).

1. **Base:** `--chal`.
2. **Hue wash:** two very large, blurred radial gradients: `--dhan-glow` from the top-left and `--lal-glow` from the bottom-right. At most 14% opacity. The page must still read as cream-white with a breath of green and red, not as a gradient background.
3. **River-delta contour field:** about 40 hairline curves (0.6 px, `rgba(0,106,78,.08)`) that flow from the top and branch like the Ganges–Brahmaputra–Meghna delta toward the bottom-right. It is **abstract**: no country outline, no map labels, no place names. Generate the SVG once in the build script (seeded, so it is reproducible), keep it under 25 KB, and inline it. Hide it when `prefers-reduced-data` or `Save-Data` is set.
4. **Paper grain:** a small tiling noise texture (a pre-rendered WebP or PNG under 8 KB, not a live SVG filter), at about 3.5% opacity with `mix-blend-mode: multiply`. This is what makes the surface feel like paper instead of a screen.
5. **Jamdani weave:** a faint geometric diamond-and-dot motif at about 4% opacity, used **only** in the header band, the footer and empty states. Never behind charts or long text.

No stock photos, no illustrations of people, no flag waving, no Bangladesh map silhouette, no mascots.

### 8.5 Liquid glass: where, and how much

Glass is the premium layer, so use it deliberately.

**Always glass:** the sticky header, the switches (8.6), the comparison control bar (country picker), and tooltips.
**Paper by default, glass as an enhancement:** the tiles and cards. They are opaque `--muslin` paper with a kantha stitch inset (8.7). On capable desktop devices only (`@media (hover: hover) and (min-width: 900px)`, and not `prefers-reduced-transparency`, `prefers-reduced-data` or `Save-Data`), upgrade tiles to light glass over the background. Phones always get the paper version. Do not blur more than about six surfaces on screen at once.

Starting recipe (tune by eye; keep text contrast above 4.5:1 against the *worst* background it can sit on):

```css
.glass {
  background: linear-gradient(135deg, rgba(255,255,255,.72), rgba(255,255,255,.46));
  backdrop-filter: blur(16px) saturate(150%);
  -webkit-backdrop-filter: blur(16px) saturate(150%);
  border: 1px solid rgba(255,255,255,.7);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.9),          /* top highlight */
    inset 0 -1px 0 rgba(0,106,78,.10),           /* green-tinted bottom edge */
    0 1px 2px rgba(22,33,28,.06),
    0 14px 32px -14px rgba(0,106,78,.24);        /* green-tinted, not grey, shadow */
}
.glass::before { /* specular highlight */
  content: ""; position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
  background: radial-gradient(120% 80% at 8% 0%, rgba(255,255,255,.65), transparent 55%);
}
@supports not (backdrop-filter: blur(1px)) {
  .glass { background: var(--muslin); }
}
@media (prefers-reduced-transparency: reduce), (forced-colors: active) {
  .glass { background: var(--muslin); backdrop-filter: none; border-color: var(--sutaa); }
}
```

- On the language switch thumb only, optionally add an SVG `feDisplacementMap` lens effect for a liquid refraction look (Chromium only, progressive enhancement; plain glass elsewhere).
- Anything that is not the signature (tiles, tables, charts) must not look like frosted-glass SaaS cards: **vary radii by role** (6 px chips, 14 px tiles, 28 px hero glass, full pill for switches), and never use one identical grey shadow on every card.

### 8.6 The flag switch (signature control)

A pill-shaped glass track tinted green (`--dhan-glow` to a slightly stronger green), with a **red disc thumb** (`--lal`, with a soft highlight and a faint red glow) that slides between two labels. It is the flag in miniature.

- The language toggle reads `English | বাংলা`. It is a pair of real links (`/en/…`, `/bn/…`) styled as one control, so it works without JavaScript. The selected label is in `--kali` at heavier weight.
- Reuse the same component for other two-way choices: `Taka | International dollars`, `Chart | Table`.
- Minimum 44 px tall, whole control is tappable, keyboard operable (arrow keys switch, Enter confirms), 3 px `--dhan` focus ring with 2 px offset, `aria-label` in the active language.
- Motion: the disc slides in 220 ms with a gentle spring. With `prefers-reduced-motion` it simply jumps.
- The disc and the track are the **only** places the strong flag red and a saturated green sit together. Keep them there.

### 8.7 Bangladeshi motifs: where, and how restrained

Use each only where it is described. Nothing kitsch.

- **Logo:** the wordmark "কেমন আছে বাংলাদেশ?" in Tiro Bangla; the dot of the question mark is the red disc. English wordmark "Kemon Ache Bangladesh?" in Newsreader, same red-dot question mark. Favicon: a red disc on a green circle.
- **Kantha running stitch:** section dividers are a running-stitch line (`stroke-dasharray: 6 5`, round caps, `--sutaa`). Tiles on desktop get a stitch line inset 6 px inside the edge. The axis of every peer dot strip is a stitch line.
- **Delta contours:** the background (8.4).
- **Jamdani weave band:** header, footer, empty states (8.4).
- **Alpona line ornament:** thin line corner ornaments on the About page and the 404 page only.
- **Rickshaw wheel loader:** a 12-spoke wheel drawn in 1.5 px lines that turns slowly while data loads. Static under reduced motion.
- **Area icons:** a custom set of simple line icons, 24 px, 1.5 px stroke, round caps, one consistent style: Economy (a taka sign ৳ drawn as a line glyph), Education (an open book with a pen), Health (a heart with a pulse line), Poverty and inequality (two unequal stacks). No emoji anywhere. Decorative icons are hidden from screen readers.

### 8.8 Layout principles (anti-template)

- Content width up to 1240 px; 12 columns on desktop, single column on phones. Layouts are **asymmetric and left-aligned**.
- **Hero:** the question itself is the hero: "কেমন আছে বাংলাদেশ?" / "How is Bangladesh doing?" set very large in the display face (`clamp(40px, 7vw, 72px)`), left side (7 columns), with one plain sentence below it. On the right (5 columns), a small glass "How to read a tile" panel that shows a real tile at small size with its parts labelled. Not a big number with a gradient. Hero height is at most 40% of the viewport on phones so the first tiles appear immediately.
- **Tiles are not identical.** In each group (Economy, Poverty and inequality, Education, Health) the first tile spans two columns and carries the larger peer strip; the rest span one. Poverty and inequality gets the most generous space because it says the most about well-being.
- Group headings are plain sentence-case headings followed by a stitch divider. No numbering (the content is not a sequence), no eyebrows.
- Charts sit on `--muslin` paper with generous padding; the background shows through only around them.
- Spacing scale 4/8/12/16/24/32/48/72/112. Keep a strong vertical rhythm; whitespace is part of the premium feel.

### 8.9 Charts (follow the data-visualisation rules)

- Choose the chart form by the data's job: trend over time = line; one latest value across countries = dot strip or horizontal bar; two measures = scatter. Never dual axes. A single headline number is a tile, not a chart.
- **Marks:** 2 px lines (Bangladesh 3 px), markers at least 8 px, bars rounded 4 px at the data end and anchored on the baseline, 2 px surface-coloured gap between touching fills, 2 px surface ring around overlapping dots. Bangladesh is a **filled** circle; other countries are **open** circles (a second cue so colour is never the only cue).
- Gridlines and axes recessive (`--sutaa`). **Direct labels** at line ends. A legend is present whenever there are two or more series; a single series needs none. Never print a number on every point.
- Text stays in ink colours, never in a series colour.
- Hover layer by default: a crosshair and tooltip on lines; per-mark tooltip on dots and bars. Hit targets at least 24 px, bigger than the mark. Tooltips are glass and show country, value, year, and measurement note.
- Bar charts start at zero. Log scales are labelled and explained in one plain sentence.
- Every chart has a "Chart | Table" switch (8.6) and a CSV download.
- Light theme only in v1. Re-run the palette validator in CI.

### 8.10 Showing "better or worse" without red and green

Some readers will want to know whether a position is favourable. Do it with **position and shape**, not colour, and only where an official direction exists.

1. **Favourable direction metadata.** Each indicator record has `favourable_direction`: `higher`, `lower` or `context`, plus a `direction_source_url`. Use `higher` or `lower` **only** when an official target or definition supports it (for example a UN Sustainable Development Goal target or a WHO target). If there is no such source (inflation, exchange rate, remittances, reserves, GDP level), the value is `context` and no position badge is shown.
2. **Peer ladder.** On a dot strip, a small labelled arrow at the axis end shows the direction the official target points ("Target direction: lower"). The reader sees at a glance where Bangladesh's filled dot sits relative to the open dots in that direction.
3. **Position badge** (a small glass capsule on tiles and indicator pages): a quarter, half or three-quarter filled ring glyph, plus words: "Ahead of 5 of 7 comparison countries" / "Level with the middle" / "Behind 5 of 7 comparison countries". The count is **calculated by this site** from the real values, with the formula and country list one click away. Different years are shown, never hidden.
4. **Context-only measures** carry a short neutral note: "Whether higher or lower is preferable depends on the situation."
5. Direction of change over time is shown by a neutral arrow and words ("up from…"). With a sourced favourable direction, an optional second phrase may say whether the change moved "toward" or "away from" the target direction.
6. No red/green, no thumbs up/down, no traffic lights, no emoji, no "good/bad" words.

### 8.11 Motion

- **One orchestrated moment:** on the first visit to the homepage, the river-delta contour lines draw in over about 1.6 seconds, once, then everything is static. Skip it on slow devices and under `prefers-reduced-motion`.
- Otherwise motion only answers an action: the flag switch, a tooltip, a tab opening, a chart updating after a country is added.
- No fade-and-slide on every section, no hover lift on every card, no counting-up numbers, no parallax.

### 8.12 Writing in the interface

- Sentence case. Plain verbs. Active voice. Name actions exactly: "Add a country", "View as table", "Download CSV", "Switch to Bangla".
- One name per thing everywhere ("Source" is always "Source"; "Data year" is always "Data year").
- Errors and empty states explain what happened and what to do next, in the interface's own voice, without apologising or joking. Example: "No data for Nepal in the last 10 years. Try another country."
- Bangla uses **চলিত** and the respectful **আপনি** form. No stiff bureaucratic phrasing where a common word exists.
- Never use marketing language ("empowering", "revolutionary", "journey").

### 8.13 States every screen must have
Loading (the rickshaw wheel and a calm placeholder, no shimmer circus), empty, "data not available", failed refresh ("Last checked" still visible), offline, 404 (alpona ornament, a link home), and keyboard focus on every control.

### 8.14 Responsive behaviour
- 360 px phone: single column; the header holds the wordmark, the flag switch and a menu button; blur is reduced to `blur(10px)`; tiles are paper; peer strips go full width; tap targets at least 44 px; tables stack into labelled rows.
- 768 px: two columns for tiles.
- 1100 px and up: the full 12-column layout, glass enhancements, stitch inset borders.
- Charts reflow rather than shrink: on narrow screens show Bangladesh plus the selected countries with direct labels and move the legend below.

### 8.15 Design finish gate (the builder must pass this before calling the design done)
- [ ] Screenshots reviewed at 360, 768 and 1280 px in both languages. Fix clipping, overlap, awkward wrapping of long Bangla words and unreadable numerals.
- [ ] None of these appear: purple or blue-violet gradients, glow orbs behind the hero, identical rounded cards with the same grey shadow everywhere, all-caps eyebrow labels, emoji as icons, stock illustrations, centred everything, Inter / Roboto / Space Grotesk, a three-column "features" grid, 01/02/03 numbering, counting-up numbers, gradient text, cream-plus-terracotta palette.
- [ ] A squint test: the only saturated colours on the page are Bangladesh green, the red disc, and chart data.
- [ ] Glass fallbacks tested (backdrop-filter off, reduced transparency, forced colours, Save-Data).
- [ ] Accessibility: keyboard-only walkthrough, screen-reader pass on tiles and charts, contrast tests in CI, Lighthouse accessibility score of 95 or more.
- [ ] Performance: homepage within the budget in R10 with glass, grain and contours enabled on a mid-range phone profile; contours and glass degrade gracefully on a low-end profile.

---

## 9. The homepage in detail

Route: `/en/` and `/bn/`. It must look like a **comprehensive dashboard of the most important measures**, not a page of two or three buttons. A visitor should learn something within five seconds without clicking.

### 9.0 Design notes for the homepage (see section 8 for the full system)
- The hero (band A below) is the question itself in large display type, left-aligned, with a small glass "How to read a tile" panel on the right (8.8). Not a big number with a gradient.
- The page sits on the layered background (8.4): rice-white base, faint green and red hue wash, delta contour lines, paper grain. The delta contours draw in once on the first visit (8.11).
- Tiles are paper cards with a kantha stitch inset (glass on capable desktops only, 8.5). In each group the first tile is two columns wide; the others are one column. Poverty and inequality gets the most space.
- The sticky header is glass and contains the wordmark with the red-dot question mark, the menu, and the flag switch for English | বাংলা (8.6).
- Bangladesh is always the filled green dot; comparison countries are open grey circles (8.9).

### 9.1 Layout (desktop, 12-column grid; on mobile everything stacks in the same order)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ কেমন আছে বাংলাদেশ?  Kemon Ache Bangladesh?   Home Economy Education      │
│                                               Health Compare Sources About│
│                                                         [ English | বাংলা ]│
├──────────────────────────────────────────────────────────────────────────┤
│ A. INTRO BAND                                                             │
│ "How are people in Bangladesh doing? Real published data, in plain words."│
│ Latest data year range: 2019–2024   Last checked: 13 Nov 2026            │
│ [How to read this site]                                                   │
├──────────────────────────────────────────────────────────────────────────┤
│ B. BANGLADESH AT A GLANCE (12 tiles, grouped under 4 labels)              │
│  ECONOMY                                                                  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐     │
│  │GDP per person│ │Growth of GDP │ │ Inflation    │ │Youth jobless │     │
│  │ ৳ X lakh     │ │ per person   │ │ X%  (year)   │ │ X% (year)    │     │
│  │ (year)       │ │ X% (year)    │ │ ▲ up from Y% │ │ ▲ up from Y% │     │
│  │ ▲ up from …  │ │ ▲ …          │ │              │ │              │     │
│  │ plain line   │ │ plain line   │ │ plain line   │ │ plain line   │     │
│  │ · · ●· · ·   │ │ · ●· · · ·   │ │ peer dot strip│ │ peer dot strip│   │
│  │ Source: link │ │ Source: link │ │ Source: link │ │ Source: link │     │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘     │
│  POVERTY & INEQUALITY   (2 tiles)    EDUCATION (2 tiles)                  │
│  HEALTH (4 tiles)                                                         │
├──────────────────────────────────────────────────────────────────────────┤
│ C. HOW BANGLADESH COMPARES                                                │
│  C1. Scatter: income per person (x, PPP, log scale) vs life expectancy (y)│
│      all countries as grey dots, Bangladesh highlighted, peers labelled.  │
│      Caption (template): "Countries with similar income … Bangladesh is   │
│      {higher/lower} than {n} of {m} countries within ±25% of its income." │
│      (Calculated by this site; formula linked.)                           │
│      Source line directly beneath.                                        │
│  C2. Line chart: GDP per capita growth, Bangladesh vs peers, last 20 yrs.│
│      Source line directly beneath.                                        │
│  C3. "Where Bangladesh differs most from similar-income countries":      │
│      a short list of up to 3 headline indicators with the largest gap vs  │
│      the lower-middle-income median, chosen by a fixed, disclosed rule    │
│      (largest absolute percentage difference, only indicators with ≥5    │
│      comparison countries and data within the last 5 years). Each item    │
│      is a mini dot strip + one template sentence + source line + link.    │
├──────────────────────────────────────────────────────────────────────────┤
│ D. EXPLORE BY AREA (3 large cards)                                        │
│  [Economy] snapshot sentence + 3 sparklines   → /economy                  │
│  [Education] snapshot sentence + 3 sparklines → /education                │
│  [Health] snapshot sentence + 3 sparklines    → /health                   │
├──────────────────────────────────────────────────────────────────────────┤
│ E. FOOTER: About · How to read this site · Sources & methods ·            │
│    "Every number on this site links to where it came from." ·             │
│    Last checked date · Contact/feedback link                              │
└──────────────────────────────────────────────────────────────────────────┘
```

### 9.2 Tile anatomy (identical for every indicator tile)
1. Label (plain name, e.g., "Average income per person").
2. Large value with unit and year ("৳ X lakh · 2024").
3. Change line: "up from Y in 2015" (neutral arrow). Hidden if no earlier value 5+ years back; use the earliest available within 15 years and show its year.
4. One-sentence plain explanation (section 11), with placeholders filled from data.
5. Peer dot strip: one dot per country (latest available year within 10 years), Bangladesh as a filled green dot and peers as open grey circles, median of the peer set marked by a thin line, axis drawn as a stitch line. Where an official target direction exists, a small arrow at the axis end shows it and a position badge (8.10) says how many comparison countries Bangladesh is ahead of or behind. Context-only measures show no badge. Hover/tap shows country, value, year.
6. Source line: `Source: World Bank — <indicator name> ↗ · data year 2023 · retrieved 13 Nov 2026`, where the name is a hyperlink to the exact indicator page.
7. Whole tile is clickable (large tap target) and goes to the indicator page. The source link inside the tile is a separate link that opens the original source in a new tab.
8. If data is missing: show "Data not available", the last available year if any, and the source link anyway.

### 9.3 What the homepage must never contain
A single score or ranking of countries by "well-being", a "good/bad" colour, unsourced text, stock photos, auto-playing media, ads, pop-ups.

---

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

---

## 11. Plain-language explanations (shown under every value; definitions only; each links to the official definition)

Placeholders in `{braces}` are filled from data. Bangla lines are a **first draft for native-speaker review**. Each explanation is followed in the UI by "Official definition ↗" (the `definition_url`).

**Important wording rule for GDP per capita:** do not say it is what an average person "earns", and be careful with "produces". Use the sharing framing below.

| ID | English | বাংলা |
|---|---|---|
| gdp_pc_taka | If everything Bangladesh produced in one year were shared equally among every person, each person's share would be {value}. It is not what people actually earn. It shows the size of the economy compared with the number of people. | এক বছরে বাংলাদেশে যা কিছু উৎপাদিত হয়, তা যদি সবার মধ্যে সমানভাবে ভাগ করা হতো, তাহলে প্রত্যেকের ভাগে পড়ত {value}। এটি মানুষের প্রকৃত আয় নয়। জনসংখ্যার তুলনায় অর্থনীতির আকার এতে বোঝা যায়। |
| gdp_pc_ppp | The same measure, in international dollars. These adjust for the fact that the same things cost different amounts in different countries, so countries can be compared fairly. | একই হিসাব, আন্তর্জাতিক ডলারে। এতে দেখা হয় বিভিন্ন দেশে একই জিনিসের দাম আলাদা, তাই দেশগুলোর মধ্যে ন্যায্য তুলনা করা যায়। |
| gdp_growth | How much larger (or smaller) the whole economy became compared with the year before, after removing the effect of price rises. | আগের বছরের তুলনায় গোটা অর্থনীতি কতটা বড় (বা ছোট) হয়েছে, দাম বাড়ার প্রভাব বাদ দিয়ে। |
| gdp_pc_growth | How much each person's share of the economy grew or shrank in a year. It is the growth of the whole economy, adjusted for the change in the number of people. | এক বছরে প্রতিজনের ভাগের অর্থনীতি কতটা বেড়েছে বা কমেছে। জনসংখ্যার পরিবর্তন হিসাব করে গোটা অর্থনীতির প্রবৃদ্ধি। |
| inflation | How much more a typical basket of goods and services costs than a year ago. At {value}%, what cost 100 taka a year ago costs about {100+value} taka now. | এক বছর আগের তুলনায় সাধারণ পণ্য ও সেবার দাম গড়ে কতটা বেড়েছে। {value}% হলে, এক বছর আগে যা ১০০ টাকায় পাওয়া যেত, এখন তার দাম প্রায় {100+value} টাকা। |
| exchange_rate | How many taka are needed to buy one US dollar. | এক মার্কিন ডলার কিনতে কত টাকা লাগে। |
| unemployment | The share of people in the labour force who have no job but are looking for one. People who are not looking for work are not counted. | শ্রমশক্তির মধ্যে যারা কাজ খুঁজছেন কিন্তু পাচ্ছেন না, তাদের অনুপাত। যারা কাজ খুঁজছেন না, তারা এতে ধরা হয় না। |
| youth_unemployment | The same measure, for people aged 15 to 24. | একই হিসাব, তবে ১৫ থেকে ২৪ বছর বয়সীদের জন্য। |
| female_lfp | The share of women aged 15 and older who are working or looking for work. | ১৫ বছর ও তার বেশি বয়সী নারীদের মধ্যে যারা কাজ করছেন বা কাজ খুঁজছেন, তাদের অনুপাত। |
| remittances_gdp | Money sent home by Bangladeshis living abroad, compared with the size of the whole economy. At {value}%, it equals about {value} taka in every 100 taka the country produces. | বিদেশে থাকা বাংলাদেশিদের দেশে পাঠানো অর্থ, গোটা অর্থনীতির আকারের তুলনায়। {value}% মানে দেশে উৎপাদিত প্রতি ১০০ টাকায় প্রায় {value} টাকার সমান। |
| reserves_months | How many months of imports the country's foreign currency reserves could pay for. | দেশের বৈদেশিক মুদ্রার রিজার্ভ দিয়ে কত মাসের আমদানি খরচ মেটানো যায়। |
| reserves_usd | Foreign currency and similar assets held by the central bank, shown in US dollars as published. | কেন্দ্রীয় ব্যাংকের হাতে থাকা বৈদেশিক মুদ্রা ও অনুরূপ সম্পদ, প্রকাশিত অনুযায়ী মার্কিন ডলারে। |
| poverty_intl | The share of people living on less than {line} a day, in prices adjusted for what money can buy in each country, so countries can be compared. | যারা দিনে {line}-এর কম আয়ে বা ব্যয়ে জীবনযাপন করেন, তাদের অনুপাত। প্রতিটি দেশে টাকার ক্রয়ক্ষমতা সমন্বয় করা হয়, যাতে দেশগুলোর মধ্যে তুলনা করা যায়। |
| poverty_lmic | The same idea, using a higher daily line of {line} that the World Bank uses for lower-middle-income countries. | একই ধারণা, তবে বিশ্বব্যাংক নিম্ন-মধ্যম আয়ের দেশগুলোর জন্য যে উচ্চতর দৈনিক রেখা ({line}) ব্যবহার করে, সেটি ধরে। |
| poverty_national | The share of people whose spending is below the poverty line set by Bangladesh itself. Other countries set their own lines, so this is not used to compare countries. | বাংলাদেশের নিজস্ব দারিদ্র্যরেখার নিচে ব্যয় করেন, এমন মানুষের অনুপাত। অন্য দেশগুলো নিজেদের রেখা ঠিক করে, তাই এটি দেশগুলোর মধ্যে তুলনায় ব্যবহার করা হয় না। |
| gini | A number from 0 to 100 showing how unequally income or spending is shared. 0 means everyone has the same. 100 means one person has everything. | ০ থেকে ১০০ এর একটি সংখ্যা, যা আয় বা ব্যয় কতটা অসমভাবে ভাগ হয়েছে তা দেখায়। ০ মানে সবার সমান; ১০০ মানে একজনের কাছেই সব। |
| share_low20 | The share of all income (or spending) that goes to the poorest one-fifth of people. | সবচেয়ে গরিব এক-পঞ্চমাংশ মানুষের হাতে মোট আয়ের (বা ব্যয়ের) কত অংশ যায়। |
| share_top10 | The share of all income (or spending) that goes to the richest one-tenth of people. | সবচেয়ে ধনী এক-দশমাংশ মানুষের হাতে মোট আয়ের (বা ব্যয়ের) কত অংশ যায়। |
| literacy | The share of people aged 15 and older who can read and write, with understanding, a short simple statement about everyday life. | ১৫ বছর ও তার বেশি বয়সীদের মধ্যে যারা দৈনন্দিন জীবনের একটি ছোট সহজ বাক্য বুঝে পড়তে ও লিখতে পারেন, তাদের অনুপাত। |
| secondary_enrol | The number of students in secondary school as a share of children of secondary-school age. It can be above 100% because older or younger students are included. | মাধ্যমিক স্তরের বয়সী শিশুদের সংখ্যার তুলনায় মাধ্যমিক বিদ্যালয়ে মোট শিক্ষার্থীর অনুপাত। এটি ১০০%-এর বেশি হতে পারে, কারণ বয়সে বড় বা ছোট শিক্ষার্থীরাও এতে ধরা হয়। |
| primary_completion | The share of children who reach the last year of primary school, compared with the number of children of the right age. | প্রাথমিক বিদ্যালয়ের শেষ শ্রেণিতে পৌঁছানো শিশুদের অনুপাত, সঠিক বয়সের শিশুদের সংখ্যার তুলনায়। |
| pupil_teacher | The average number of primary school students for each teacher. | প্রাথমিক বিদ্যালয়ে গড়ে প্রতি একজন শিক্ষকের জন্য কতজন শিক্ষার্থী। |
| edu_spend | How much the government spends on education, as a share of the whole economy. | সরকার শিক্ষায় কত খরচ করে, গোটা অর্থনীতির আকারের অনুপাতে। |
| life_expectancy | The average number of years a baby born now would live if today's death rates stayed the same throughout their life. | আজকের মৃত্যুহার সারা জীবন একই থাকলে, এখন জন্মানো একটি শিশু গড়ে কত বছর বাঁচবে। |
| under5_mortality | How many children die before their fifth birthday, for every 1,000 children born alive. | প্রতি ১,০০০ জীবিত জন্মের মধ্যে কতজন শিশু পঞ্চম জন্মদিনের আগে মারা যায়। |
| maternal_mortality | How many women die from causes linked to pregnancy or childbirth, for every 100,000 live births. This is a modelled estimate. | প্রতি ১,০০,০০০ জীবিত জন্মে গর্ভাবস্থা বা প্রসবজনিত কারণে কতজন নারী মারা যান। এটি একটি মডেলভিত্তিক হিসাব। |
| stunting | The share of children under five whose height is too low for their age. It is used worldwide to measure long-term undernutrition. | পাঁচ বছরের কম বয়সী শিশুদের মধ্যে যাদের উচ্চতা বয়সের তুলনায় কম, তাদের অনুপাত। দীর্ঘমেয়াদি অপুষ্টি মাপতে বিশ্বজুড়ে এটি ব্যবহার করা হয়। |
| dpt | The share of one-year-old children who have had all three doses of the DPT vaccine (diphtheria, tetanus and whooping cough). | এক বছর বয়সী শিশুদের মধ্যে যারা ডিপিটি টিকার (ডিপথেরিয়া, ধনুষ্টংকার ও হুপিং কাশি) তিনটি ডোজই পেয়েছে, তাদের অনুপাত। |
| physicians | The number of doctors for every 1,000 people. | প্রতি ১,০০০ মানুষের জন্য চিকিৎসকের সংখ্যা। |
| beds | The number of hospital beds for every 1,000 people. | প্রতি ১,০০০ মানুষের জন্য হাসপাতালের শয্যার সংখ্যা। |
| oop | Of every 100 taka spent on health care, about {value} taka are paid directly by people themselves, not by the government or insurance. | স্বাস্থ্যসেবায় খরচ হওয়া প্রতি ১০০ টাকার মধ্যে প্রায় {value} টাকা মানুষ নিজে সরাসরি দেয়, সরকার বা বিমা নয়। |
| health_spend_gdp | The total spent on health by government, households and others, as a share of the whole economy. | সরকার, পরিবার ও অন্যদের মোট স্বাস্থ্য ব্যয়, গোটা অর্থনীতির আকারের অনুপাতে। |

Extra notes the page must show when the source says so (R8): "modelled estimate", "measured by income" vs "measured by spending/consumption" (differs by country; show each country's basis in the tooltip), "survey year", "gross figure can exceed 100%".

---

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

---

## 13. Page states and edge cases
- **Missing data:** "Data not available" plus last available year if any, plus the source link. Never a zero.
- **Old data:** if the latest year is more than 5 years old, show a small neutral note "Latest published figure is from {year}."
- **Survey indicators** (poverty, inequality, stunting): show every available survey year as separate points; do not draw lines across long gaps without markers.
- **Mixed measurement bases** (income vs spending in inequality data): show the basis in the tooltip and a note under the chart.
- **Slow connection:** show text and tiles first; load charts lazily after.
- **No JavaScript:** navigation and the language toggle still work; core text and tile values are included in the pre-rendered HTML (pre-render the pages at build time).
- **Printing:** a simple print stylesheet that keeps source lines.

---

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

---

## 15. Build order (stop for review after each milestone)

1. **Skeleton + pipeline:** repo, CI, i18n with toggle, formatting for Bangla numerals and lakh/crore, SourceLine component, fetch and validate 3 indicators end to end.
2. **All P0 indicators** fetched, validated, with provenance. Report any that fail VERIFY.
3. **Design system (section 8):** tokens, fonts, layered background, glass and fallbacks, the flag switch, tile, peer dot strip with position badge, chart frame, tables, loader, 404. Review a static design page in both languages before continuing.
4. **Homepage** per section 9, using real P0 data.
5. **Indicator page and compare module** (section 12).
6. **Area and subsection pages**, including Poverty & inequality.
7. **P1 indicators**, Sources page, About, How to read.
8. **QA:** automated crawl (missing source, missing translation, broken link, value without year), accessibility audit, mobile performance budget, native-speaker review of every Bangla string, and a line-by-line check of 20 random values against the original source pages.
9. **Launch** on free hosting with the scheduled refresh enabled.

---

## 16. Acceptance checklist (v1 is done only when all are true)

- [ ] No value appears without a visible, working, direct source hyperlink beneath it, a data year, and a retrieved date.
- [ ] No estimated, interpolated, or invented number exists anywhere. Derived numbers are labelled and reproducible.
- [ ] No composite score or index exists anywhere.
- [ ] Every page works in English and Bangla; toggle visible everywhere; all numbers in Bangla numerals in Bangla mode; lakh/crore grouping correct.
- [ ] Taka is used for domestic money values where a taka series is published; cross-country money comparisons use international dollars and say so.
- [ ] Homepage has the 12 headline tiles with peer strips, the comparison section, and the three area cards, as in section 9.
- [ ] Every click path in section 10 works, and Poverty & inequality is prominent under Economy.
- [ ] Every indicator has a plain-language explanation in both languages with an official definition link.
- [ ] Every indicator page offers Bangladesh trend, peer comparison over time, latest-year comparison, table, and CSV.
- [ ] Language is neutral (no judgement words), checked by search for the banned words list in both languages.
- [ ] Scheduled refresh runs, validates, and never publishes unvalidated data; "Last checked" and "Latest data year" are both visible.
- [ ] Mobile performance budget met; accessibility checks pass.
- [ ] The design follows section 8: tokens used everywhere (no raw hex in components), the specified type families, layered background (hue wash, delta contours, grain), glass only where specified with working fallbacks, the flag switch on every two-way control, and the Bangladeshi motifs only where described.
- [ ] No colour is used to signal good or bad; position badges appear only for indicators with a sourced favourable direction.
- [ ] The categorical chart palette passes the palette validator against the final surface colour.
- [ ] The design finish gate in 8.15 is fully ticked, with screenshots at 360, 768 and 1280 px in both languages.
- [ ] 20 randomly chosen displayed values were verified by hand against their source pages.

---

## 17. Things to ask the product owner instead of guessing
- Any Bangla wording you are unsure of.
- Any indicator whose definition or coverage differs from what is described here.
- Any case where following a rule above would remove an important piece of information (explain the trade-off; do not break the rule silently).
- The site's domain name and hosting account.
