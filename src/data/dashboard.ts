// What the homepage shows, and where (DECISIONS.md 61, 80–84). Only indicator ids here:
// every number comes from data/processed/latest.json (rule R9).
import type { AreaId } from '../components/Motifs.tsx';
import type { MessageKey } from '../i18n/index.ts';

export interface AreaConfig {
  /** Icon to draw, and the area's id. */
  icon: AreaId;
  /** Heading key. */
  label: MessageKey;
  /** The one headline measure on the first screen (Ahmar, M4 review 2). */
  headline: string;
  /** Everything else for this area, shown in the Details view. */
  more: string[];
}

export const AREAS: AreaConfig[] = [
  { icon: 'economy', label: 'area.economy', headline: 'gdp_pc_taka', more: ['gdp_pc_growth', 'inflation', 'youth_unemployment', 'electricity'] },
  { icon: 'poverty', label: 'area.equality', headline: 'poverty_intl', more: ['share_low20'] },
  { icon: 'health', label: 'area.health', headline: 'life_expectancy', more: ['under5_mortality', 'stunting', 'oop', 'safe_water', 'pm25'] },
  { icon: 'education', label: 'area.education', headline: 'literacy', more: ['secondary_enrol', 'secondary_enrol_female', 'secondary_enrol_male'] },
];

/** "Bangladesh at a glance": the six measures Ahmar kept (M4 review 2). */
export const GLANCE: string[] = ['gdp_total_taka', 'gdp_pc_taka', 'life_expectancy', 'hdi_rank', 'whr_rank', 'cpi_rank'];
