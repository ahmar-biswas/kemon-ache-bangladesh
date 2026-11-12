// Notes from the publisher are stored in data files word for word, in English.
// To show them in Bangla, each exact note text maps to a translation key here.
// If the publisher changes a note's wording, `npm run check:data` fails until a
// person adds the new text and its Bangla translation.
import type { MessageKey } from '../i18n/index.ts';

export const NOTE_KEYS: Record<string, MessageKey> = {
  'The reporting period for national accounts data is designated as either calendar year basis (CY) or fiscal year basis (FY). For this country, it is fiscal year-based (fiscal year-end: June 30). Also, an estimate (PA.NUS.ATLS) of the exchange rate covers the same period and thus differs from the official exchange rate (CY).':
    'note.wb_bgd_national_accounts_fy',
};
