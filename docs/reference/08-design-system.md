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
