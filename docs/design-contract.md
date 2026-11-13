# Design contract (Milestone 3)

A one-page summary of what the interface must do, written before building (anti-ui-slop step).
The binding detail is in `docs/reference/08-design-system.md`; where this page and that one differ, that one wins.

## Who and what
- **Reader:** a person in Bangladesh, often on a 360 px phone and a slow connection, reading in Bangla or English. Students, journalists, curious citizens. Reading level about class 8.
- **Main task:** see one published figure about Bangladesh, understand what it means, see where it sits among similar countries, and check where it came from.
- **The one thing that matters most on a tile:** the value, with its year and source directly under it. Everything else supports that.

## Reading order on a tile
1. Indicator name (plain words).
2. The value, large, in the display face, with the data year.
3. The peer strip: Bangladesh (filled green dot) among the peers (open grey dots) on a stitched axis.
4. Position badge, only where an official target direction exists; otherwise the neutral "depends on the situation" note.
5. Source line: source name (link), data year, retrieved date. Never hidden or collapsed.

## Direction
A quiet printed almanac on rice paper. Boldness is spent in two places only: the river-delta background and the flag switch (red disc on green glass). Type, tiles and charts stay disciplined. Familiar controls stay familiar: links look like links, the switch is two real links.

## States that must exist
Loading (rickshaw wheel, static under reduced motion), data not available, empty peer strip (no peer data in 10 years), 404, keyboard focus on every control. Failed refresh and offline are shown by "Last checked" (already in M1) and are styled here.

## Responsive structure
- 360 px: one column, paper tiles, peer strips full width, 44 px tap targets, header = wordmark + flag switch.
- 768 px: two tile columns.
- 1100 px and up: 12 columns, first tile in a group spans two, glass on tiles (hover-capable devices only), stitch inset.

## Not allowed (from 8.15)
Purple gradients, glow orbs, identical cards with one grey shadow, all-caps or eyebrow labels, emoji, stock illustrations, centred paragraphs, Inter/Roboto/Space Grotesk, three-column feature grids, 01/02/03 numbering, counting-up numbers, gradient text, colour meaning good or bad.
