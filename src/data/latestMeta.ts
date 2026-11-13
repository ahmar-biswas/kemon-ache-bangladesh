// Indicator descriptions for the homepage (definition links, explanation keys, poverty-line
// params). indicators.json is small, so the homepage can load it without the full data files.
import type { IndicatorMeta } from './types.ts';
import indicatorsJson from '../../data/processed/indicators.json';

const INDICATORS = indicatorsJson as IndicatorMeta[];

export const indicatorMeta = (id: string) => INDICATORS.find((m) => m.id === id);
