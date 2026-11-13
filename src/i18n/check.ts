// Rules for the translation files. Used by scripts/check-i18n.ts (CI) and by tests.

/** Keys whose English and Bangla values are deliberately the same (the language toggle shows each name in its own script). */
export const SAME_IN_BOTH_LANGUAGES = new Set(['lang.name.en', 'lang.name.bn', 'peers.value_year']);

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

export function checkTranslations(
  en: Record<string, unknown>,
  bn: Record<string, unknown>,
): string[] {
  const problems: string[] = [];

  for (const [key, enValue] of Object.entries(en)) {
    const bnValue = bn[key];
    if (typeof enValue !== 'string' || enValue.trim() === '') {
      problems.push(`en.json: "${key}" is empty or not text`);
      continue;
    }
    if (bnValue === undefined) {
      problems.push(`bn.json: missing Bangla for "${key}"`);
      continue;
    }
    if (typeof bnValue !== 'string' || bnValue.trim() === '') {
      problems.push(`bn.json: "${key}" is empty or not text`);
      continue;
    }
    if (bnValue === enValue && !SAME_IN_BOTH_LANGUAGES.has(key)) {
      problems.push(`bn.json: "${key}" is identical to English (looks untranslated)`);
    }
    if (placeholders(enValue).join() !== placeholders(bnValue).join()) {
      problems.push(
        `"${key}": placeholders differ (en: {${placeholders(enValue).join('},{')}} / bn: {${placeholders(bnValue).join('},{')}})`,
      );
    }
  }
  for (const key of Object.keys(bn)) {
    if (!(key in en)) problems.push(`bn.json: "${key}" has no English counterpart`);
  }
  return problems;
}
