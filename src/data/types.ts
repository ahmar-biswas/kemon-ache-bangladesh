// The shape of the generated data (docs/reference/05-data-layer.md, section 5.2).
// Shared by the fetch scripts and the website.

/** Units we know how to display. Each one maps to exactly one formatter in src/lib/formatValue.ts. */
export type Unit =
  | 'years'
  | 'taka_current'
  | 'taka_constant'
  | 'intl_dollar_current'
  | 'percent'
  | 'per_1000_live_births';

export interface DataRecord {
  indicator_id: string;
  /** ISO3 country code, e.g. "BGD". */
  country: string;
  year: number;
  value: number;
  unit: Unit;
  source_name: string;
  /** Exactly as the publisher states it. */
  original_source: string;
  /** Human-readable page for this exact indicator (and countries). Never empty: no source, no display. */
  source_url: string;
  definition_url: string;
  api_url: string;
  /** YYYY-MM-DD, Bangladesh time. */
  retrieved_at: string;
  /** Exactly as the publisher states them. */
  notes: string[];
  /** "income" or "consumption" for poverty/inequality measures; null otherwise. */
  measured_by: string | null;
}

export interface DataMeta {
  /** YYYY-MM-DD of the last refresh attempt (success or failure). */
  last_checked: string;
  /** Whether that attempt passed validation. If false, the data files were left unchanged. */
  last_check_ok: boolean;
  /** YYYY-MM-DD of the last time any value changed. */
  last_updated: string;
  /** The World Bank's own "last updated" date for each series, as reported by its API. */
  source_last_updated: Record<string, string>;
}

export type Area = 'economy' | 'poverty' | 'education' | 'health';

/**
 * Whether a higher or lower value is the direction an official target asks for.
 * "context" = no official target direction, so the site never says "ahead of" or "behind".
 */
export type FavourableDirection = 'higher' | 'lower' | 'context';

/** One indicator's description, generated into data/processed/indicators.json. */
export interface IndicatorMeta {
  id: string;
  /** World Bank series code. */
  code: string;
  area: Area;
  priority: 'P0' | 'P1';
  unit: Unit;
  /** The World Bank's own series name, as published (contains the unit). */
  source_series_name: string;
  definition_url: string;
  /** Translation key suffix of the plain-language explanation: explain.<explanation_id>. */
  explanation_id: string;
  /**
   * "compare": Bangladesh, the default peers and the lower-middle-income median.
   * "bangladesh": Bangladesh only (e.g. local-currency series, which differ by country).
   */
  scope: 'compare' | 'bangladesh';
  favourable_direction: FavourableDirection;
  /** The official target behind "higher"/"lower". Null for "context". */
  direction_source_url: string | null;
  /** The official target, quoted word for word from direction_source_url. Null for "context". */
  direction_source_text: string | null;
  /**
   * Values read from the publisher's own wording, used to fill `{placeholders}` in the
   * explanation text (e.g. the poverty line "$3.00 a day (2021 PPP)").
   */
  params: Record<string, string>;
}

/** One country, as classified by the World Bank (data/processed/countries.json). */
export interface CountryInfo {
  /** ISO3 code. */
  id: string;
  iso2: string;
  /** English name as published by the World Bank. */
  name: string;
  region: string;
  /** World Bank income group code: LIC, LMC, UMC, HIC (or INX = not classified). */
  income_group: string;
  income_group_name: string;
}

export interface CountriesFile {
  source_name: string;
  /** Human-readable page explaining the classification. */
  classification_url: string;
  api_url: string;
  retrieved_at: string;
  /** The default peer countries (section 5.5), in display order. */
  default_peers: string[];
  countries: CountryInfo[];
}

/**
 * The median of lower-middle-income countries for one indicator and year.
 * "Calculated by this site" (rule R4): a plain median of published values.
 */
export interface MedianRecord {
  indicator_id: string;
  year: number;
  value: number;
  unit: Unit;
  calculated_by_site: true;
  /** Plain-language formula, e.g. "median of 31 values". */
  formula: 'median';
  /** The countries and values used, so anyone can redo the sum. */
  inputs: { country: string; value: number }[];
  /** World Bank page showing every input country for this indicator. */
  inputs_source_url: string;
  source_name: string;
  retrieved_at: string;
  /** Income group the countries were picked by, and when the classification was read. */
  group: 'LMC';
  classification_url: string;
  classification_retrieved_at: string;
}
