// Colours for comparison countries (Ahmar, 2026-11-14; DECISIONS.md 123). Bangladesh keeps the
// brand chart green. Every other country shown gets the next of the five other approved chart
// colours (8.2 series order). A country keeps its colour while it stays picked. From the sixth
// country on, colours repeat and the mark changes (dashed line, filled dot) so two countries
// never look the same. Colours tell countries apart only; they never mean good or bad (R5).
import type { CSSProperties } from 'react';

const PALETTE = ['--series-2', '--series-3', '--series-4', '--series-5', '--series-6'] as const;

/** Slot number → a style that sets the country's colour (read by the chart CSS as --peer). */
export function slotStyle(slot: number | undefined): CSSProperties {
  if (slot === undefined || slot < 0) return {};
  return { ['--peer' as string]: `var(${PALETTE[slot % PALETTE.length]})` } as CSSProperties;
}

/** True when the slot reuses a colour, so the mark must change shape. */
export const isRepeat = (slot: number | undefined) => slot !== undefined && slot >= PALETTE.length;

/** Fixed slots in list order (the default peers on tiles, strips and subsection charts). */
export function listSlots(ids: readonly string[]): Map<string, number> {
  return new Map(ids.filter((id) => id !== 'BGD').map((id, i) => [id, i]));
}

/**
 * Slots for a list the reader changes: countries still picked keep their slot; a newly picked
 * country takes the lowest free one.
 */
export function keepSlots(previous: Map<string, number>, picked: readonly string[]): Map<string, number> {
  const next = new Map<string, number>();
  for (const id of picked) if (id !== 'BGD' && previous.has(id)) next.set(id, previous.get(id)!);
  const used = new Set(next.values());
  for (const id of picked) {
    if (id === 'BGD' || next.has(id)) continue;
    let slot = 0;
    while (used.has(slot)) slot++;
    next.set(id, slot);
    used.add(slot);
  }
  return next;
}
