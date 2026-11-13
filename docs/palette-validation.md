# Palette validation

Run on 2026-11-13 with the dataviz skill's `validate_palette.js` (light mode), on the six chart colours in their fixed order (8.2).

## On the chart surface `--muslin` (#FBFBF6)

```

Palette (light, surface #FBFBF6, categorical): 6 slots
  [PASS] Lightness band         all 6 inside L 0.43–0.77
  [PASS] Chroma floor           all 6 >= 0.1
  [PASS] CVD separation         worst adjacent #6B4FA0↔#B5446E ΔE 9.4 (protan) · tritan 18.6
  [PASS] Normal-vision floor    worst adjacent #6B4FA0↔#B5446E ΔE 15.7 (normal)
  [WARN] Contrast vs surface    below 3:1 — relief required (visible labels or table view): [["#C9831A",3]]

  → ALL CHECKS PASS  (CVD in the 6–8 floor band is legal ONLY with secondary encoding: direct labels, gaps, or texture)
  scope: categorical palettes only. For a lone status/text color check text contrast with this script's apca() or contrast(); for a sequential ramp, lightness monotonicity.

```

## On the page `--chal` (#F6F6EF)

```

Palette (light, surface #F6F6EF, categorical): 6 slots
  [PASS] Lightness band         all 6 inside L 0.43–0.77
  [PASS] Chroma floor           all 6 >= 0.1
  [PASS] CVD separation         worst adjacent #6B4FA0↔#B5446E ΔE 9.4 (protan) · tritan 18.6
  [PASS] Normal-vision floor    worst adjacent #6B4FA0↔#B5446E ΔE 15.7 (normal)
  [WARN] Contrast vs surface    below 3:1 — relief required (visible labels or table view): [["#C9831A",2.87]]

  → ALL CHECKS PASS  (CVD in the 6–8 floor band is legal ONLY with secondary encoding: direct labels, gaps, or texture)
  scope: categorical palettes only. For a lone status/text color check text contrast with this script's apca() or contrast(); for a sequential ramp, lightness monotonicity.

```

## First three, all pairs (8.2 says these also pass the stricter check)

```

Palette (light, surface #FBFBF6, categorical): 3 slots
  [PASS] Lightness band         all 3 inside L 0.43–0.77
  [PASS] Chroma floor           all 3 >= 0.1
  [PASS] CVD separation         worst all-pairs #C9831A↔#007A5A ΔE 12.2 (protan) · tritan 3.2
  [PASS] Normal-vision floor    worst all-pairs #2B6CB0↔#007A5A ΔE 15.8 (normal)
  [WARN] Contrast vs surface    below 3:1 — relief required (visible labels or table view): [["#C9831A",3]]

  → ALL CHECKS PASS  (CVD in the 6–8 floor band is legal ONLY with secondary encoding: direct labels, gaps, or texture)
  scope: categorical palettes only. For a lone status/text color check text contrast with this script's apca() or contrast(); for a sequential ramp, lightness monotonicity.

```

Result: all checks pass. One WARN: `--paat` (#C9831A) is at 3:1 against the surface. The relief the validator asks for is required on every chart by 8.9 (direct labels, a Chart | Table view). `tests/design-tokens.test.ts` re-checks the contrast in CI.
