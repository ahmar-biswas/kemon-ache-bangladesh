// Which indicators the pipeline fetches, and the checks applied to each.
// Codes verified against the live World Bank API on 2026-11-13.
//
// `expectedName` is the World Bank's own series name, which contains the unit
// (e.g. "(current LCU)"). If the World Bank ever changes it, validation fails so a
// person can look before anything is published.
//
// `plausibleRange` is a sanity check only (catches a broken feed, e.g. a value in
// the wrong unit). It is never shown on the site and never used to change a value.
import type { Unit } from '../src/data/types.ts';

export interface IndicatorConfig {
  id: string;
  code: string;
  unit: Unit;
  expectedName: string;
  plausibleRange: [min: number, max: number];
  /**
   * True for national accounts series (GDP and its parts). The World Bank's country
   * metadata has a "SpecialNotes" text about national accounts for Bangladesh
   * (fiscal year basis); it is attached to these records word for word.
   */
  nationalAccounts: boolean;
}

/** The World Bank's "CurrencyUnit" for Bangladesh. Local-currency (LCU) series are only shown as taka if this matches. */
export const EXPECTED_CURRENCY_UNIT = 'Bangladeshi taka';

export const COUNTRY = 'BGD';
/** The World Bank uses two-letter codes in its website links. */
export const COUNTRY_ISO2 = 'BD';
/** World Bank source id 2 = World Development Indicators. */
export const WDI_SOURCE_ID = '2';

export const INDICATORS: IndicatorConfig[] = [
  {
    id: 'life_expectancy',
    code: 'SP.DYN.LE00.IN',
    unit: 'years',
    expectedName: 'Life expectancy at birth, total (years)',
    plausibleRange: [20, 100],
    nationalAccounts: false,
  },
  {
    id: 'gdp_pc_taka',
    code: 'NY.GDP.PCAP.CN',
    unit: 'taka_current',
    expectedName: 'GDP per capita (current LCU)',
    plausibleRange: [1, 100_000_000],
    nationalAccounts: true,
  },
  {
    id: 'inflation',
    code: 'FP.CPI.TOTL.ZG',
    unit: 'percent',
    expectedName: 'Inflation, consumer prices (annual %)',
    plausibleRange: [-50, 200],
    nationalAccounts: false,
  },
];
