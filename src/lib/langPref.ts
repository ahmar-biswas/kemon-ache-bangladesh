// Remembers the reader's language choice. Storage can be blocked (private mode,
// strict settings), so every access is wrapped and failure just means "no memory".
import { isLang, type Lang } from '../i18n/index.ts';

const KEY = 'kab.lang';

export function loadLangChoice(): Lang | null {
  try {
    const v = window.localStorage.getItem(KEY);
    return isLang(v) ? v : null;
  } catch {
    return null;
  }
}

export function saveLangChoice(lang: Lang): void {
  try {
    window.localStorage.setItem(KEY, lang);
  } catch {
    /* storage unavailable: nothing to do */
  }
}

/** Last choice if any; otherwise Bangla when the browser language starts with "bn"; otherwise English. */
export function initialLang(browserLanguages: readonly string[] = navigator.languages ?? [navigator.language]): Lang {
  const saved = loadLangChoice();
  if (saved) return saved;
  return browserLanguages.some((l) => l.toLowerCase().startsWith('bn')) ? 'bn' : 'en';
}

/** Same page in the other language: swaps the /en or /bn prefix. */
export function switchLangPath(pathname: string, to: Lang): string {
  const rest = pathname.replace(/^\/(en|bn)(?=\/|$)/, '');
  return `/${to}${rest === '' ? '/' : rest}`;
}
