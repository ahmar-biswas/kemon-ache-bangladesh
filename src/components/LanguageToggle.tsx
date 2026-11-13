// "English | বাংলা": the flag switch (8.6) as a pair of real links to the same page in each language.
import { useLocation } from 'react-router';
import { t, type Lang } from '../i18n/index.ts';
import { saveLangChoice, switchLangPath } from '../lib/langPref.ts';
import { FlagSwitch } from './FlagSwitch.tsx';

export function LanguageToggle({ lang }: { lang: Lang }) {
  const { pathname, search, hash } = useLocation();
  const option = (target: Lang) => ({
    label: t(target, `lang.name.${target}`),
    lang: target,
    href: `${switchLangPath(pathname, target)}${search}${hash}`,
    hrefLang: target,
    onSelect: () => saveLangChoice(target),
  });
  return (
    <FlagSwitch
      className="lang-toggle"
      label={t(lang, 'lang.switch_label')}
      options={[option('en'), option('bn')]}
      selected={lang === 'en' ? 0 : 1}
    />
  );
}
