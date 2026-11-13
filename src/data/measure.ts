// One measure's own data, downloaded only when its view opens (DECISIONS.md 89):
//   world/<id>.json  every country's newest value in the last 10 years;
//   trend/<id>.json  Bangladesh's full history.
import type { DataRecord, EventItem, EventsFile, WorldFile } from './types.ts';
import eventsJson from '../../data/events.json';

const worldFiles = import.meta.glob<WorldFile>('../../data/processed/world/*.json', { import: 'default' });
const trendFiles = import.meta.glob<DataRecord[]>('../../data/processed/trend/*.json', { import: 'default' });

export async function loadWorld(id: string): Promise<WorldFile | null> {
  const load = worldFiles[`../../data/processed/world/${id}.json`];
  return load ? load() : null;
}

export async function loadTrend(id: string): Promise<DataRecord[] | null> {
  const load = trendFiles[`../../data/processed/trend/${id}.json`];
  return load ? load() : null;
}

/**
 * Events for "Bangladesh over time". None are shown until Ahmar has approved the whole list
 * (DECISIONS.md 88): an unapproved file gives an empty list, whatever it contains.
 */
export function approvedEvents(file: EventsFile = eventsJson as EventsFile): EventItem[] {
  return file.approved === true ? file.events : [];
}

// Every year for Bangladesh and the default peers (data/processed/<id>.json), for the
// subsection charts (DECISIONS.md 105). One file per measure, loaded when its chart appears.
const seriesFiles = import.meta.glob<DataRecord[]>(
  ['../../data/processed/*.json', '!**/countries.json', '!**/indicators.json', '!**/meta.json', '!**/latest.json', '!**/details.json'],
  { import: 'default' },
);

export async function loadSeries(id: string): Promise<DataRecord[] | null> {
  const load = seriesFiles[`../../data/processed/${id}.json`];
  return load ? load() : null;
}
