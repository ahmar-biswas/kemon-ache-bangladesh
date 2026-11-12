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
