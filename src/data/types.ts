// The shape of one data point (docs/reference/05-data-layer.md, section 5.2).
// Shared by the fetch scripts and the website.

/** Units we know how to display. Each one maps to exactly one formatter in src/lib/formatValue.ts. */
export type Unit = 'years' | 'taka_current' | 'percent';

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
