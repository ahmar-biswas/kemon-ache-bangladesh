// Tiny translation helper. All user-visible strings live in en.json / bn.json.
// We use our own ~30 lines instead of an i18n library to keep the phone download small.
import en from './en.json';
import bn from './bn.json';

export type Lang = 'en' | 'bn';
export const LANGS: readonly Lang[] = ['en', 'bn'];

export type MessageKey = keyof typeof en;

const messages: Record<Lang, Record<string, string>> = { en, bn };

export function isLang(value: unknown): value is Lang {
  return value === 'en' || value === 'bn';
}

/**
 * Look up a string and fill its {placeholders}.
 * Throws if a key or a placeholder value is missing, so mistakes fail loudly in tests
 * instead of showing "{value}" to a reader.
 */
export function t(lang: Lang, key: MessageKey, params: Record<string, string> = {}): string {
  const template = messages[lang][key];
  if (template === undefined) {
    throw new Error(`Missing translation: ${lang}:${key}`);
  }
  return template.replace(/\{(\w+)\}/g, (_, name: string) => {
    const value = params[name];
    if (value === undefined) {
      throw new Error(`Missing value for {${name}} in ${lang}:${key}`);
    }
    return value;
  });
}

/** Keys of the form "a.b.c" that exist in en.json; used where a key is built from data (e.g. indicator ids). */
export function hasKey(key: string): key is MessageKey {
  return Object.prototype.hasOwnProperty.call(en, key);
}
