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
