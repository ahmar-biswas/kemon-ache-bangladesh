# Milestone 8: Quality checks and Bangla review

## Read only these
- `docs/reference/16-acceptance.md`
- `docs/reference/08-design-system.md`
- `docs/reference/13-states.md`
- `docs/reference/02-hard-rules.md`

## Skills
design:accessibility-review, data:validate-data.

## Steps
1. Write the crawl script that visits every page in both languages and fails on: missing source line, missing translation, broken link, value without year, banned judgement words.
2. Run the accessibility review and fix issues; run the keyboard-only walkthrough; check Lighthouse scores.
3. Pick 20 displayed values at random and check each against its original source page. Report the table of results.
4. Generate BANGLA_REVIEW.md as a clean list of every Bangla string with its English, for the owner to review. Apply the owner’s corrections.
5. Walk the 8.15 design finish gate and the 16-acceptance.md checklist; report each item as pass or fail.

## Done when
- Every item in 16-acceptance.md passes or is listed as an open issue with a reason.
- The owner has reviewed the Bangla strings.

## Then
Run tests, update docs/PROGRESS.md, commit, and stop. Report: what was built, three things for the user to check by eye, anything unresolved.
