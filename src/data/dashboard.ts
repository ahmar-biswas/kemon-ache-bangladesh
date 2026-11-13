// What the homepage dashboard shows, and where (DECISIONS.md 61). Only indicator ids here:
// every number comes from data/processed/latest.json (rule R9).
import type { AreaId } from '../components/Motifs.tsx';
import type { MessageKey } from '../i18n/index.ts';

export interface AreaConfig {
  /** Icon to draw. */
  icon: AreaId;
  /** Heading key. */
  label: MessageKey;
  /** Headline measures shown in the collapsed tile (as many as fit one laptop screen). */
  summary: string[];
  /** More measures of the same area, shown in the Details panel. The status count and the subtitle cover both lists. */
  extra: string[];
}

export const AREAS: AreaConfig[] = [
  { icon: 'economy', label: 'area.economy', summary: ['gdp_pc_taka', 'inflation'], extra: ['gdp_pc_growth', 'youth_unemployment'] },
  { icon: 'poverty', label: 'area.equality', summary: ['poverty_intl', 'share_low20'], extra: [] },
  { icon: 'health', label: 'area.health', summary: ['life_expectancy', 'under5_mortality'], extra: ['stunting', 'oop'] },
  { icon: 'education', label: 'area.education', summary: ['literacy', 'secondary_enrol'], extra: ['secondary_enrol_female', 'secondary_enrol_male'] },
];

/** The ten well-being measures in the side list (Ahmar, M3 review; DECISIONS.md 61, 65). */
export const SIDE: string[] = [
  'gdp_total_taka',
  'gdp_pc_taka',
  'life_expectancy',
  'hdi_rank',
  'whr_rank',
  'cpi_rank',
  'pm25',
  'under5_mortality',
  'electricity',
  'safe_water',
];
