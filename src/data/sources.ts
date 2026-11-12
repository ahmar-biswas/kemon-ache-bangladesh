// Maps a record's `source_name` (stored in English, as published) to the
// translation key used to show it in either language.
import type { MessageKey } from '../i18n/index.ts';

export const SOURCE_KEYS: Record<string, MessageKey> = {
  'World Bank, World Development Indicators': 'source.name.wb_wdi',
};
