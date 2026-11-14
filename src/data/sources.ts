// Maps a record's `source_name` (stored in English, as published) to the
// translation key used to show it in either language.
import type { MessageKey } from '../i18n/index.ts';

export const SOURCE_KEYS: Record<string, MessageKey> = {
  'World Bank, World Development Indicators': 'source.name.wb_wdi',
  'UNDP, Human Development Report 2025': 'source.name.undp_hdr2025',
  'Transparency International, Corruption Perceptions Index 2025': 'source.name.ti_cpi2025',
  'World Happiness Report 2026 (Wellbeing Research Centre, University of Oxford)': 'source.name.whr2026',
  'SDSN, Sustainable Development Report 2026 (SDG Index)': 'source.name.sdsn_sdr2026',
  'Reporters Without Borders, World Press Freedom Index 2026': 'source.name.rsf2026',
  'Global Hunger Index 2026 (Welthungerhilfe, Concern Worldwide, IFHV)': 'source.name.ghi2026',
};

/** Short names for the one-line source lines on the dashboard (full name on hover). */
export const SOURCE_SHORT_KEYS: Record<string, MessageKey> = {
  'World Bank, World Development Indicators': 'source.short.wb_wdi',
  'UNDP, Human Development Report 2025': 'source.short.undp_hdr2025',
  'Transparency International, Corruption Perceptions Index 2025': 'source.short.ti_cpi2025',
  'World Happiness Report 2026 (Wellbeing Research Centre, University of Oxford)': 'source.short.whr2026',
  'SDSN, Sustainable Development Report 2026 (SDG Index)': 'source.short.sdsn_sdr2026',
  'Reporters Without Borders, World Press Freedom Index 2026': 'source.short.rsf2026',
  'Global Hunger Index 2026 (Welthungerhilfe, Concern Worldwide, IFHV)': 'source.short.ghi2026',
};
