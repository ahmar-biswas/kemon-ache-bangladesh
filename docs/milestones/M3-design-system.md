# Milestone 3: Design system and design preview

## Read only these
- `docs/reference/08-design-system.md`
- `docs/reference/02-hard-rules.md`
- `docs/reference/07-language-writing.md`

## Skills
frontend-design, dataviz (run its palette validator on the six chart colours against the final surface colour).

## Steps
1. Create tokens.css exactly from the tokens in 8.2. Self-host and subset the four font families (8.3); use fallbacks if any is unavailable and record it in DECISIONS.md.
2. Build the layered background (8.4): hue wash, generated delta contour SVG (seeded script), paper grain, jamdani band. Include the Save-Data and reduced-data fallbacks.
3. Build the glass utilities with all fallbacks (8.5) and the flag switch component (8.6) as a real pair of links. Use it for the language toggle.
4. Build the Tile and PeerStrip components (open grey peers, filled green Bangladesh, stitch axis, position badge from 8.10), the ChartFrame, SourceLine styling, the rickshaw-wheel loader and the 404 page.
5. Build a `/design-preview` page in both languages using real P0 data from M2.
6. Capture screenshots at 360, 768 and 1280 px in both languages and fix clipping, overlap and awkward Bangla wrapping. Run the palette validator and the contrast checks.

## Done when
- /design-preview looks right in both languages at all three sizes.
- Validator and contrast tests pass.
- The user has reviewed and approved the look before M4 starts.

## Then
Run tests, update docs/PROGRESS.md, commit, and stop. Report: what was built, three things for the user to check by eye, anything unresolved.
