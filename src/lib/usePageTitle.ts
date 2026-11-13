// The browser tab title: "<page> · <site>", or the site name alone for the homepage and 404.
// Set by each page, not by the layout: the layout's effect runs after the page's and would
// overwrite it.
import { useEffect } from 'react';
import { t, type Lang } from '../i18n/index.ts';

export function usePageTitle(lang: Lang, title: string | null) {
  useEffect(() => {
    document.title = title ? `${title} · ${t(lang, 'site.title')}` : t(lang, 'site.title');
  }, [lang, title]);
}
