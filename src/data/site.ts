// The site map (section 10; DECISIONS.md 101–105). Only indicator ids and page paths here:
// every number comes from the generated data files (rule R9).
//
// Measures that are fetched in M7 (exchange rate, reserves, Gini …) are not listed yet. A
// listed id with no data file would be a bug, and a test checks it.
import type { AreaId } from '../components/Motifs.tsx';
import type { MessageKey } from '../i18n/index.ts';

export type AreaSlug = 'economy' | 'education' | 'health';
export type SubSlug = 'growth-and-prices' | 'jobs' | 'money-and-reserves' | 'poverty-and-inequality';

export interface Group {
  /** Heading key. */
  label: MessageKey;
  /** Economy subsection with its own page (section 10), or null for a plain group. */
  sub: SubSlug | null;
  icon?: AreaId;
  measures: string[];
}

export interface AreaPage {
  slug: AreaSlug;
  icon: AreaId;
  label: MessageKey;
  /** Measures told in the snapshot sentences at the top of the page. */
  snapshot: string[];
  groups: Group[];
}

export const SUBSECTIONS: Record<SubSlug, Group & { sub: SubSlug }> = {
  // Poverty and inequality first: it tells the most about well-being (section 10, 8.8).
  'poverty-and-inequality': { label: 'area.poverty', sub: 'poverty-and-inequality', icon: 'poverty', measures: ['poverty_intl', 'share_low20'] },
  'growth-and-prices': { label: 'sub.growth-and-prices', sub: 'growth-and-prices', measures: ['gdp_pc_taka', 'gdp_pc_growth', 'inflation'] },
  jobs: { label: 'sub.jobs', sub: 'jobs', measures: ['youth_unemployment'] },
  // Remittances and reserves are P1 measures, added in M7 (DECISIONS.md 102).
  'money-and-reserves': { label: 'sub.money-and-reserves', sub: 'money-and-reserves', measures: [] },
};

export const AREA_PAGES: AreaPage[] = [
  {
    slug: 'economy',
    icon: 'economy',
    label: 'area.economy',
    snapshot: ['gdp_pc_taka', 'inflation', 'poverty_intl'],
    groups: Object.values(SUBSECTIONS),
  },
  {
    slug: 'education',
    icon: 'education',
    label: 'area.education',
    snapshot: ['literacy', 'secondary_enrol'],
    groups: [{ label: 'area.education', sub: null, measures: ['literacy', 'secondary_enrol', 'secondary_enrol_female', 'secondary_enrol_male'] }],
  },
  {
    slug: 'health',
    icon: 'health',
    label: 'area.health',
    snapshot: ['life_expectancy', 'under5_mortality'],
    groups: [
      { label: 'area.health', sub: null, measures: ['life_expectancy', 'under5_mortality', 'stunting', 'oop'] },
      // Not in the navigation map; placed here by Ahmar (DECISIONS.md 103).
      { label: 'group.living_conditions', sub: null, measures: ['electricity', 'safe_water', 'pm25'] },
    ],
  },
];

export const areaPage = (slug: string | undefined) => AREA_PAGES.find((a) => a.slug === slug);

/** Every measure with its own page (/indicator/<id>): the ones listed on the area pages. */
export const PAGE_MEASURES: string[] = AREA_PAGES.flatMap((a) => a.groups.flatMap((g) => g.measures));

/** Where a measure sits in the site map, for breadcrumbs. */
export function placeOf(id: string): { area: AreaPage; group: Group } | null {
  for (const area of AREA_PAGES) for (const group of area.groups) if (group.measures.includes(id)) return { area, group };
  return null;
}

/** Homepage area tile → its page (section 10: "Homepage area card → the area page"). */
export const HOME_AREA_PATH: Record<AreaId, string> = {
  economy: 'economy',
  poverty: 'economy/poverty-and-inequality',
  health: 'health',
  education: 'education',
};

export const path = {
  home: (lang: string) => `/${lang}/`,
  area: (lang: string, slug: AreaSlug) => `/${lang}/${slug}`,
  sub: (lang: string, sub: SubSlug) => `/${lang}/economy/${sub}`,
  indicator: (lang: string, id: string) => `/${lang}/indicator/${id}`,
  compare: (lang: string, id?: string) => `/${lang}/compare${id ? `?m=${id}` : ''}`,
};
