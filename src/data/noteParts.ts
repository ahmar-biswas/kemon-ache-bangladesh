// Sentences that World Bank notes are built from (DECISIONS.md 118). Many country notes join
// a few standard sentences in different orders (fiscal year, alternative conversion factor,
// euro conversion, survey basis), so a note that matches no whole pattern in notes.ts is
// matched sentence by sentence against these. Each sentence has one translation key, whose
// English text gives back the publisher's exact words (tests/notes.test.ts checks every note).
//
// The regular expressions here have no ^ or $: they are matched at a position in the note.
// Kinds: number (Bangla digits), text (shown as published; a 4-digit year gets Bangla digits),
// digits (shown as published, every digit in Bangla), month (translated).
import type { MessageKey } from '../i18n/index.ts';

export type ParamKind = 'number' | 'text' | 'month' | 'digits';

export interface NotePart {
  re: RegExp;
  key: MessageKey;
  params: Record<string, ParamKind>;
}

const M = '(?<month>[A-Z][a-z]+)';
const D = '(?<day>\\d{1,2})';
const p = (source: string, key: string, params: Record<string, ParamKind> = {}): NotePart => ({
  re: new RegExp(source, 'y'),
  key: key as MessageKey,
  params,
});
/** A sentence with no values in it, escaped for use in a regular expression. */
const fixed = (text: string, key: string) => p(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), key);

export const NOTE_PARTS: NotePart[] = [
  // UNESCO Institute for Statistics (pupil–teacher ratio and other education series).
  fixed('National estimate', 'note.p.national_estimate'),
  fixed('UIS estimate', 'note.p.uis_estimate'),

  // Poverty and Inequality Platform, sentence by sentence.
  p('Based on data from (?<survey>[A-Za-z0-9-]+)\\.', 'note.p.pip_based_on', { survey: 'text' }),
  fixed('Estimated from unit-record consumption data.', 'note.p.pip_unit_consumption'),
  fixed('Estimated from imputed unit-record consumption data.', 'note.p.pip_imputed_consumption'),
  fixed('Estimated from unit-record income data.', 'note.p.pip_unit_income'),
  fixed('Urban only.', 'note.p.pip_urban_only'),
  fixed('PPP is partially imputed.', 'note.p.pip_ppp_imputed'),
  p('PPP is extrapolated from (?<year>\\d{4})\\.', 'note.p.pip_ppp_extrapolated', { year: 'text' }),

  // National accounts: fiscal year.
  fixed(
    'The reporting period for national accounts data is designated as either calendar year basis (CY) or fiscal year basis (FY).',
    'note.p.fy_designated',
  ),
  p(`For this country, it is fiscal year-based \\(fiscal year-end: ${M} ${D}\\) for the years (?<year>\\d{4}) and after\\.`, 'note.p.fy_based_from', {
    month: 'month',
    day: 'number',
    year: 'text',
  }),
  p(`For this country, it is fiscal year-based \\(fiscal year-end: ${M} ${D}\\)\\.`, 'note.p.fy_based', { month: 'month', day: 'number' }),
  p('The data from (?<from>\\d{4}) to (?<to>\\d{4}) refer to the calendar year data\\.', 'note.p.cy_years', { from: 'text', to: 'text' }),
  fixed('Also, an estimate (PA.NUS.ATLS) of the exchange rate covers the same period and thus differs from the official exchange rate (CY).', 'note.p.atls_same_period'),
  p(`Fiscal year ends on ${M} ${D}; reporting period for national accounts data: FY\\.`, 'note.p.fy_ends_fy', { month: 'month', day: 'number' }),
  p(`Fiscal year end: ${M} ${D}; reporting period for national accounts data: FY\\.`, 'note.p.fy_end_fy', { month: 'month', day: 'number' }),
  p(`Fiscal year end: ${M} ${D}; reporting period for national accounts data: CY\\.`, 'note.wb_fiscal_year_cy', { month: 'month', day: 'number' }),

  // Alternative conversion factor (PA.NUS.ATLS).
  fixed('The World Bank systematically assesses the appropriateness of official exchange rates as conversion factors.', 'note.p.alt_assess'),
  fixed('In addition, the World Bank systematically assesses the appropriateness of official exchange rates as conversion factors.', 'note.p.alt_assess_in_addition'),
  fixed('Also, the World Bank systematically assesses the appropriateness of official exchange rates as conversion factors.', 'note.p.alt_assess_also'),
  fixed('In this country, multiple or dual exchange rate activity exists and must be accounted for appropriately in underlying statistics.', 'note.p.alt_multiple'),
  fixed(
    'An alternative estimate (“alternative conversion factor” - PA.NUS.ATLS) is thus calculated as a weighted average of the different exchange rates in use in the country.',
    'note.p.alt_weighted',
  ),
  fixed('An alternative estimate (“alternative conversion factor” - PA.NUS.ATLS) is thus calculated by using an inflation-adjustment method.', 'note.p.alt_inflation'),
  fixed('Doing so better reflects economic reality and leads to more accurate cross-country comparisons and country classifications by income level.', 'note.p.alt_better'),
  p('For this country, this applies to the period (?<from>\\d{4})-(?<to>\\d{4})\\.', 'note.p.alt_period', { from: 'text', to: 'text' }),
  p('For this country, this applies to (?<from>\\d{4})-(?<to>\\d{4})\\.', 'note.p.alt_applies', { from: 'text', to: 'text' }),
  fixed('Alternative conversion factors are used in the Atlas methodology and elsewhere in World Development Indicators as single-year conversion factors.', 'note.p.alt_used'),
  fixed(
    'Kindly note that GDP per capita and GNI per capita reported are calculated from the UN WPP data which likely creates discrepancy with the official per capita figures, calculated from the latest population census results.',
    'note.p.per_capita_wpp',
  ),
  fixed(
    'Due to the limitations of the Atlas method in classifying countries experiencing persistent high inflation, this economy remains classified as upper-middle-income.',
    'note.p.atlas_umc',
  ),

  // Euro area.
  fixed('A simple multiplier is used to convert the national currencies of EMU members to euros.', 'note.p.emu_multiplier'),
  p(`The following irrevocable euro conversion rate entered into force on ${M} ${D}, (?<year>\\d{4}): 1 euro = (?<rate>[\\d.]+) (?<currency>[A-Za-z ]+)\\.`, 'note.p.emu_entered', {
    month: 'month',
    day: 'number',
    year: 'text',
    rate: 'number',
    currency: 'text',
  }),
  p(
    `The following irrevocable euro conversion rate was adopted by the EU Council on ${M} ${D}, (?<year>\\d{4}): 1 euro = (?<rate>[\\d.]+) (?<currency>[A-Za-z ]+)\\.`,
    'note.p.emu_adopted',
    { month: 'month', day: 'number', year: 'text', rate: 'number', currency: 'text' },
  ),
  fixed('Please note that historical data are not actual euros and are not comparable or suitable for aggregation across countries.', 'note.p.emu_not_euros'),
  p('Please note that historical data before (?<before>\\d{4}) are not actual euros and are not comparable or suitable for aggregation across countries\\.', 'note.p.emu_not_euros_before', {
    before: 'text',
  }),
  p(
    'GDP data before (?<year>\\d{4}) are calculated by applying backward GDP growth rates of the former Federal Republic of Germany starting from the first official GDP value for the unified Germany \\((?<year2>\\d{4})\\)\\.',
    'note.p.germany_backward',
    { year: 'text', year2: 'text' },
  ),
  p('Based on data from EUROSTAT, the new reference year is (?<year>\\d{4})\\.', 'note.p.eurostat_reference', { year: 'text' }),
  p('National accounts data source from (?<from>\\d{4}) to (?<to>\\d{4}) is Eurostat; prior to (?<before>\\d{4}) is UN\\.', 'note.p.malta_sources', {
    from: 'text',
    to: 'text',
    before: 'text',
  }),

  // Currency changes and rebasing.
  p(
    // The World Bank writes two non-breaking spaces in these two notes ( ); the English
    // template keeps them so it gives back the exact text.
    `Data before (?<before>\\d{4}) were adjusted to reflect the new denomination effective from ${M} ${D}, (?<year>\\d{4}) \\((?<code>[A-Z]+)\\), a decrease of (?<factor>[\\d,]+) times \\((?<rate>[^)]+)\\)`,
    'note.p.new_denomination',
    { before: 'text', month: 'month', day: 'number', year: 'text', code: 'text', factor: 'number', rate: 'digits' },
  ),
  p('National account data were adjusted to reflect the new banknote \\((?<rate>[^)]+)\\)', 'note.p.new_banknote', { rate: 'digits' }),
  p(
    'National accounts data were rebased to reflect the (?<month>[A-Z][a-z]+) (?<day>\\d{1,2}), (?<year>\\d{4}), introduction of the new Zambian kwacha at a rate of (?<old>[\\d,]+) old kwacha = (?<new>[\\d,]+) new kwacha\\.',
    'note.p.zambia_kwacha',
    { month: 'month', day: 'number', year: 'text', old: 'number', new: 'number' },
  ),
  fixed('National Accounts data are reported in Zimbabwe Gold (ZIG).', 'note.p.zimbabwe_gold'),
  p(
    'The national accounts data for Egypt has been updated to reflect local constant prices in the year (?<year>\\d{4}), moving from the previous reference of (?<old>\\d{4})\\.',
    'note.p.egypt_rebased',
    { year: 'text', old: 'text' },
  ),
  p('Authorities revised national accounts from (?<from>\\d{4}) to (?<to>\\d{4})\\.', 'note.p.revised_from_to', { from: 'text', to: 'text' }),

  // Country coverage.
  p(
    'On (?<d1>\\d{1,2}) July (?<y1>\\d{4}) China resumed its exercise of sovereignty over Hong Kong, and on (?<d2>\\d{1,2}) December (?<y2>\\d{4}), China resumed its exercise of sovereignty over Macao\\.',
    'note.p.china_hk_macao',
    { d1: 'number', y1: 'text', d2: 'number', y2: 'text' },
  ),
  p('On (?<day>\\d{1,2}) July (?<year>\\d{4}) China resumed its exercise of sovereignty over Hong Kong\\.', 'note.p.china_hk', { day: 'number', year: 'text' }),
  p('On (?<day>\\d{1,2}) December (?<year>\\d{4}) China resumed its exercise of sovereignty over Macao\\.', 'note.p.china_macao', { day: 'number', year: 'text' }),
  fixed('Unless otherwise noted, data for China do not include data for Hong Kong SAR, China; Macao SAR, China; or Taiwan, China.', 'note.p.china_excludes'),
  fixed('Agriculture value added includes mining and quarrying.', 'note.p.agri_mining'),
  fixed('The source for national accounts data is the Pacific and Virgin Islands Training Initiative.', 'note.p.pvti'),
  p('Data for Indonesia include Timor-Leste through (?<year>\\d{4}) unless otherwise noted\\.', 'note.p.indonesia_timor', { year: 'text' }),
  p(
    'Includes self-governed areas only, which mostly exclude Abkhazia and South Ossetia, but small areas in Abkhazia and South Ossetia are included before (?<y1>\\d{4}) or (?<y2>\\d{4}) because of the changes in self-governed areas\\.',
    'note.p.georgia_areas',
    { y1: 'text', y2: 'text' },
  ),
  p(
    'Classification for years after (?<after>\\d{4}) was adjusted and figures were re-estimated by the World Bank, based on the detailed data published by the Cabinet Office, and are not consistent with data for (?<before>\\d{4}) and before\\.',
    'note.p.cabinet_office',
    { after: 'text', before: 'text' },
  ),
  fixed('Excluding Transnistria.', 'note.p.moldova_transnistria'),
  p("For (?<from>\\d{4})-(?<to>\\d{2}), World Bank estimates using UN World Population Prospects' growth rates of whole Moldova\\.", 'note.p.moldova_estimates', {
    from: 'text',
    to: 'digits',
  }),
  p(`Montenegro declared independence from Serbia and Montenegro on ${M} ${D}, (?<year>\\d{4})\\.`, 'note.p.montenegro_independence', {
    month: 'month',
    day: 'number',
    year: 'text',
  }),
  fixed('Where available, data for each country are shown separately.', 'note.p.shown_separately'),
  p('However, for Serbia, some indicators continue to include data for Montenegro through (?<year>\\d{4})\\.', 'note.p.serbia_includes', { year: 'text' }),
  p(
    'However, for Serbia, some indicators, such as those series for which data appear only for Serbia and not Montenegro--e\\.g\\., aid, environment, external debt, balance of payments, various social indicators excluding population--continue to include data for Montenegro through (?<year>\\d{4})\\.',
    'note.p.serbia_includes_long',
    { year: 'text' },
  ),
  p(
    'Moreover, data from (?<year>\\d{4}) onward for Serbia for most indicators exclude data for Kosovo, (?<year2>\\d{4}) being the year when Kosovo became a territory under international administration pursuant to UN Security Council Resolution (?<res>\\d+) \\((?<year3>\\d{4})\\); any exceptions are noted\\.',
    'note.p.serbia_kosovo',
    { year: 'text', year2: 'text', res: 'number', year3: 'text' },
  ),
  p(`Kosovo became a World Bank member on ${M} ${D}, (?<year>\\d{4}); available data are shown separately for Kosovo\\.`, 'note.p.kosovo_member', {
    month: 'month',
    day: 'number',
    year: 'text',
  }),
  p('In (?<year>\\d{4}), the Statistical Office of Serbia improved the methodology of national accounts data for (?<from>\\d{4}) onward\\.', 'note.p.serbia_methodology', {
    year: 'text',
    from: 'text',
  }),
  fixed('Specifically, the classification of sectors was revised.', 'note.p.sectors_revised'),
  fixed('General Government final consumption expenditure includes Non-Profit Institutions Serving Households final concumption expenditure', 'note.p.uruguay_npish'),
  p('National Accounts data for the period (?<from>\\d{4})–(?<to>\\d{4}) are sourced from the Central Bank of Venezuela\\.', 'note.p.venezuela_bcv', { from: 'text', to: 'text' }),
  p(
    'Estimates for (?<from>\\d{4})–(?<to>\\d{4}) are derived from the IMF World Economic Outlook \\(WEO\\), following methodological consultations with the IMF’s Latin America and the Caribbean \\(LAC\\) and Statistics Departments\\.',
    'note.p.venezuela_weo',
    { from: 'text', to: 'text' },
  ),
  fixed("Final estimates were reviewed by the World Bank Group's Prosperity Vertical.", 'note.p.venezuela_reviewed'),
];
