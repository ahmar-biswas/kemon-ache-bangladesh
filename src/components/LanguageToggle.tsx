// "English | বাংলা" toggle. Each option is a real link to the same page in that language.
// Plain for now; the red-disc-on-green switch design comes in Milestone 3.
import { Link, useLocation } from 'react-router';
import { LANGS, t, type Lang } from '../i18n/index.ts';
import { saveLangChoice, switchLangPath } from '../lib/langPref.ts';

export function LanguageToggle({ lang }: { lang: Lang }) {
  const { pathname, search, hash } = useLocation();
  return (
    <nav className="lang-toggle" aria-label={t(lang, 'lang.switch_label')}>
      {LANGS.map((target, i) => (
        <span key={target}>
          {i > 0 && ' | '}
          {target === lang ? (
            <strong aria-current="true" lang={target}>
              {t(lang, `lang.name.${target}`)}
            </strong>
          ) : (
            <Link
              to={`${switchLangPath(pathname, target)}${search}${hash}`}
              lang={target}
              hrefLang={target}
              onClick={() => saveLangChoice(target)}
            >
              {t(lang, `lang.name.${target}`)}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
