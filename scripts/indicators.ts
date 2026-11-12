// Which indicators the pipeline fetches, and the checks applied to each.
// Codes and series names verified against the live World Bank API (see DECISIONS.md).
//
// `expectedName` is the World Bank's own series name, which contains the unit
// (e.g. "(current LCU)"). If the World Bank ever changes it, validation fails so a
// person can look before anything is published.
//
// `plausibleRange` is a sanity check only (catches a broken feed, e.g. a value in
// the wrong unit). It is never shown on the site and never used to change a value.
// It applies to Bangladesh and the default peers. Median inputs only need to be numbers.
import type { Area, FavourableDirection, Unit } from '../src/data/types.ts';

export interface IndicatorConfig {
  id: string;
  code: string;
  area: Area;
  priority: 'P0' | 'P1';
  unit: Unit;
  expectedName: string;
  plausibleRange: [min: number, max: number];
  /**
   * True for national accounts series (GDP and its parts). Each country's WDI
   * "SpecialNotes" text about national accounts (e.g. fiscal year basis) is attached
   * to these records word for word.
   */
  nationalAccounts: boolean;
  /** "bangladesh" for local-currency series: other countries' values are in their own currencies. */
  scope: 'compare' | 'bangladesh';
  favourable_direction: FavourableDirection;
  /** Required for "higher"/"lower": the page stating the official target. */
  direction_source_url: string | null;
  /** The target, word for word from direction_source_url. */
  direction_source_text: string | null;
  /**
   * Values read from the series name, for the explanation text. Each one is a regular
   * expression whose first group is the value; if the name stops matching, the refresh fails.
   */
  paramsFromName?: Record<string, RegExp>;
}

/** The World Bank's "CurrencyUnit" for Bangladesh. Local-currency (LCU) series are only shown as taka if this matches. */
export const EXPECTED_CURRENCY_UNIT = 'Bangladeshi taka';

export const COUNTRY = 'BGD';
/** The World Bank uses two-letter codes in its website links. */
export const COUNTRY_ISO2 = 'BD';
/** World Bank source id 2 = World Development Indicators. */
export const WDI_SOURCE_ID = '2';

/**
 * The default peer countries named in docs/reference/05-data-layer.md, section 5.5.
 * Their income groups are NOT assumed: they are read from the World Bank country list
 * at every refresh and stored in data/processed/countries.json.
 */
export const DEFAULT_PEERS = ['IND', 'PAK', 'LKA', 'NPL', 'VNM', 'PHL', 'KHM'] as const;

/** World Bank income group used for the median reference line. */
export const MEDIAN_GROUP = 'LMC';

// Official targets (UN Sustainable Development Goals). Texts copied word for word
// from the goal pages on 2026-11-13.
const SDG = {
  poverty: {
    url: 'https://sdgs.un.org/goals/goal1',
    text: 'Target 1.1: By 2030, eradicate extreme poverty for all people everywhere, currently measured as people living on less than $1.25 a day',
  },
  stunting: {
    url: 'https://sdgs.un.org/goals/goal2',
    text: 'Target 2.2: By 2030, end all forms of malnutrition, including achieving, by 2025, the internationally agreed targets on stunting and wasting in children under 5 years of age, and address the nutritional needs of adolescent girls, pregnant and lactating women and older persons',
  },
  under5: {
    url: 'https://sdgs.un.org/goals/goal3',
    text: 'Target 3.2: By 2030, end preventable deaths of newborns and children under 5 years of age, with all countries aiming to reduce neonatal mortality to at least as low as 12 per 1,000 live births and under-5 mortality to at least as low as 25 per 1,000 live births',
  },
  literacy: {
    url: 'https://sdgs.un.org/goals/goal4',
    text: 'Target 4.6: By 2030, ensure that all youth and a substantial proportion of adults, both men and women, achieve literacy and numeracy',
  },
};

const context = { favourable_direction: 'context', direction_source_url: null, direction_source_text: null } as const;
const target = (dir: 'higher' | 'lower', t: { url: string; text: string }) =>
  ({ favourable_direction: dir, direction_source_url: t.url, direction_source_text: t.text }) as const;

export const INDICATORS: IndicatorConfig[] = [
  // Economy
  {
    id: 'gdp_pc_taka',
    code: 'NY.GDP.PCAP.CN',
    area: 'economy',
    priority: 'P0',
    unit: 'taka_current',
    expectedName: 'GDP per capita (current LCU)',
    plausibleRange: [1, 100_000_000],
    nationalAccounts: true,
    scope: 'bangladesh',
    ...context,
  },
  {
    id: 'gdp_pc_taka_constant',
    code: 'NY.GDP.PCAP.KN',
    area: 'economy',
    priority: 'P0',
    unit: 'taka_constant',
    expectedName: 'GDP per capita (constant LCU)',
    plausibleRange: [1, 100_000_000],
    nationalAccounts: true,
    scope: 'bangladesh',
    ...context,
  },
  {
    id: 'gdp_pc_ppp',
    code: 'NY.GDP.PCAP.PP.CD',
    area: 'economy',
    priority: 'P0',
    unit: 'intl_dollar_current',
    expectedName: 'GDP per capita, PPP (current international $)',
    plausibleRange: [100, 300_000],
    nationalAccounts: true,
    scope: 'compare',
    ...context,
  },
  {
    id: 'gdp_pc_growth',
    code: 'NY.GDP.PCAP.KD.ZG',
    area: 'economy',
    priority: 'P0',
    unit: 'percent',
    expectedName: 'GDP per capita growth (annual %)',
    plausibleRange: [-70, 150],
    nationalAccounts: true,
    scope: 'compare',
    ...context,
  },
  {
    id: 'inflation',
    code: 'FP.CPI.TOTL.ZG',
    area: 'economy',
    priority: 'P0',
    unit: 'percent',
    expectedName: 'Inflation, consumer prices (annual %)',
    plausibleRange: [-50, 200],
    nationalAccounts: false,
    scope: 'compare',
    ...context,
  },
  {
    id: 'youth_unemployment',
    code: 'SL.UEM.1524.ZS',
    area: 'economy',
    priority: 'P0',
    unit: 'percent',
    expectedName: 'Unemployment, youth total (% of total labor force ages 15-24) (modeled ILO estimate)',
    plausibleRange: [0, 100],
    nationalAccounts: false,
    scope: 'compare',
    ...context,
  },
  // Poverty and inequality
  {
    id: 'poverty_intl',
    code: 'SI.POV.DDAY',
    area: 'poverty',
    priority: 'P0',
    unit: 'percent',
    expectedName: 'Poverty headcount ratio at $3.00 a day (2021 PPP) (% of population)',
    plausibleRange: [0, 100],
    nationalAccounts: false,
    scope: 'compare',
    ...target('lower', SDG.poverty),
    // "$3.00 a day (2021 PPP)": the line and its price year, as the World Bank writes them.
    paramsFromName: { line: /^Poverty headcount ratio at (\$[\d.]+ a day \(\d{4} PPP\)) \(% of population\)$/ },
  },
  {
    id: 'share_low20',
    code: 'SI.DST.FRST.20',
    area: 'poverty',
    priority: 'P0',
    unit: 'percent',
    expectedName: 'Income share held by lowest 20%',
    plausibleRange: [0, 100],
    nationalAccounts: false,
    scope: 'compare',
    ...context,
  },
  // Education
  {
    id: 'literacy',
    code: 'SE.ADT.LITR.ZS',
    area: 'education',
    priority: 'P0',
    unit: 'percent',
    expectedName: 'Literacy rate, adult total (% of people ages 15 and above)',
    plausibleRange: [0, 100],
    nationalAccounts: false,
    scope: 'compare',
    ...target('higher', SDG.literacy),
  },
  {
    id: 'secondary_enrol',
    code: 'SE.SEC.ENRR',
    area: 'education',
    priority: 'P0',
    unit: 'percent',
    expectedName: 'School enrollment, secondary (% gross)',
    // Gross enrolment can be above 100% (older or younger students are counted).
    plausibleRange: [0, 200],
    nationalAccounts: false,
    scope: 'compare',
    ...context,
  },
  {
    id: 'secondary_enrol_female',
    code: 'SE.SEC.ENRR.FE',
    area: 'education',
    priority: 'P0',
    unit: 'percent',
    expectedName: 'School enrollment, secondary, female (% gross)',
    plausibleRange: [0, 200],
    nationalAccounts: false,
    scope: 'compare',
    ...context,
  },
  {
    id: 'secondary_enrol_male',
    code: 'SE.SEC.ENRR.MA',
    area: 'education',
    priority: 'P0',
    unit: 'percent',
    expectedName: 'School enrollment, secondary, male (% gross)',
    plausibleRange: [0, 200],
    nationalAccounts: false,
    scope: 'compare',
    ...context,
  },
  // Health
  {
    id: 'life_expectancy',
    code: 'SP.DYN.LE00.IN',
    area: 'health',
    priority: 'P0',
    unit: 'years',
    expectedName: 'Life expectancy at birth, total (years)',
    plausibleRange: [20, 100],
    nationalAccounts: false,
    scope: 'compare',
    ...context,
  },
  {
    id: 'under5_mortality',
    code: 'SH.DYN.MORT',
    area: 'health',
    priority: 'P0',
    unit: 'per_1000_live_births',
    expectedName: 'Mortality rate, under-5 (per 1,000 live births)',
    plausibleRange: [0, 500],
    nationalAccounts: false,
    scope: 'compare',
    ...target('lower', SDG.under5),
  },
  {
    id: 'stunting',
    code: 'SH.STA.STNT.ZS',
    area: 'health',
    priority: 'P0',
    unit: 'percent',
    expectedName: 'Prevalence of stunting, height for age (% of children under 5)',
    plausibleRange: [0, 100],
    nationalAccounts: false,
    scope: 'compare',
    ...target('lower', SDG.stunting),
  },
  {
    id: 'oop',
    code: 'SH.XPD.OOPC.CH.ZS',
    area: 'health',
    priority: 'P0',
    unit: 'percent',
    expectedName: 'Out-of-pocket expenditure (% of current health expenditure)',
    plausibleRange: [0, 100],
    nationalAccounts: false,
    scope: 'compare',
    ...context,
  },
];
