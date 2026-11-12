# Milestone 2: All P0 indicators fetched and verified

## Read only these
- `docs/reference/02-hard-rules.md`
- `docs/reference/05-data-layer.md`
- `docs/reference/11-explanations.md`

## Skills
None needed.

## Steps
1. For every P0 indicator in 05-data-layer.md, verify the code, unit, latest year and Bangladesh availability against the live source. Fix or drop failures (DROPPED_INDICATORS.md).
2. Fetch Bangladesh plus the default peer countries. Read each country’s income group from the source metadata; do not hard-code it. Build the lower-middle-income median reference with its country list.
3. Create countries.bn.json (Bangla country names) and mark any unsure names in BANGLA_REVIEW.md.
4. Create the explanation texts from 11-explanations.md as translation entries with placeholders, and the `definition_url` for each indicator.
5. For each indicator add `favourable_direction` (higher, lower or context) with a `direction_source_url`. Use higher or lower only where an official target supports it; otherwise `context`.
6. Produce `docs/DATA_AVAILABILITY.md`: a table of every P0 indicator, how many peers have data in the last 10 years, latest year for Bangladesh, and any caveats.

## Done when
- All kept P0 indicators have validated JSON with provenance.
- DATA_AVAILABILITY.md exists and any dropped indicators are explained.
- Tell the user which P0 tiles will have thin peer data.

## Then
Run tests, update docs/PROGRESS.md, commit, and stop. Report: what was built, three things for the user to check by eye, anything unresolved.
