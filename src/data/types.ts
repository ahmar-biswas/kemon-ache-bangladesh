// The shape of the generated data (docs/reference/05-data-layer.md, section 5.2).
// Shared by the fetch scripts and the website.

/** Units we know how to display. Each one maps to exactly one formatter in src/lib/formatValue.ts. */
export type Unit =
  | 'years'
  | 'taka_current'
  | 'taka_constant'
  | 'intl_dollar_current'
  | 'percent'
  | 'per_1000_live_births'
  /** Micrograms per cubic metre (PM2.5). */
  | 'ug_m3'
  /** A published rank: 1 = first. Comes with out_of. */
  | 'rank';

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
  /** For unit "rank" only: how many countries the publisher ranked that year. */
  out_of?: number;
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

export type Area = 'economy' | 'poverty' | 'education' | 'health' | 'overall';

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
  /** Series used for cross-country comparison when this one is local-currency; else null. */
  compare_id: string | null;
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

/**
 * An official numeric goal for one indicator (data/targets.json), drawn as a goal line.
 * Only goals whose source states the number (or "universal" = 100%) are allowed.
 */
export interface Target {
  indicator_id: string;
  value: number;
  unit: Unit;
  /** Year the goal is set for, if the source gives one. */
  by_year: number | null;
  /** e.g. "UN Sustainable Development Goals, target 3.2". */
  source_name: string;
  source_url: string;
  /** The goal, word for word from source_url. */
  source_text: string;
  /** Translation key for the short goal label, e.g. "target.short.sdg_3_2". */
  label_key: string;
}

/**
 * Bangladesh's global rank on one indicator.
 * kind "published": the publisher's own rank. kind "calculated": counted by this site
 * among all countries with a value for the same year, 1 = highest value.
 */
export interface RankSummary {
  indicator_id: string;
  kind: 'published' | 'calculated';
  year: number;
  rank: number;
  out_of: number;
  /** For calculated ranks: the order used. */
  order: 'highest_first' | null;
  source_name: string;
  source_url: string;
  retrieved_at: string;
}

/** A calculated rank with every input, so it can be checked (data/processed/ranks/<id>.json). */
export interface RankDetail extends RankSummary {
  kind: 'calculated';
  values: { country: string; value: number; rank: number }[];
}

/** One country's latest value, trimmed for the homepage. */
export interface LatestPoint {
  country: string;
  year: number;
  value: number;
}

/** Everything the homepage shows for one indicator (data/processed/latest.json). */
export interface LatestIndicator {
  id: string;
  unit: Unit;
  favourable_direction: FavourableDirection;
  /** Bangladesh's newest record, in full (source line, notes, caveats). */
  bangladesh: DataRecord | null;
  /** Comparison series id when it differs (e.g. PPP for taka), else null. */
  compare_id: string | null;
  /** Bangladesh and peers in the comparison series, latest year since the 10-year cut-off. */
  points: LatestPoint[];
  /** Source of the comparison series' Bangladesh value (for its own source line). */
  compare_bangladesh: DataRecord | null;
  median: { year: number; value: number; n: number } | null;
  target: Target | null;
  rank: RankSummary | null;
}

export interface LatestFile {
  last_checked: string;
  since: number;
  default_peers: string[];
  /** English names of Bangladesh and the peers, as the World Bank writes them. */
  names: Record<string, string>;
  indicators: Record<string, LatestIndicator>;
}
