// The logo (8.7): the site name in the display face; the dot of the question mark is the red disc.
import { Link } from 'react-router';
import { t, type Lang } from '../i18n/index.ts';

export function Wordmark({ lang }: { lang: Lang }) {
  const title = t(lang, 'site.title');
  // The name ends in "?"; draw that last character ourselves so its dot can be the red disc.
  const words = title.replace(/\?$/, '');
  // The last word stays with its question mark when the name wraps onto two lines (phones).
  const cut = words.lastIndexOf(' ');
  const head = words.slice(0, cut + 1);
  const last = words.slice(cut + 1);
  return (
    <Link to={`/${lang}/`} className="wordmark" lang={lang} aria-label={title}>
      <span aria-hidden="true">
        {head}
        <span className="wordmark__last">
          {last}
          <svg className="wordmark__q" viewBox="0 0 10 18" aria-hidden="true" focusable="false">
          <path d="M1.6 5 C1.6 2.4 3.3 1 5.2 1 C7.3 1 8.6 2.4 8.6 4.3 C8.6 6.6 6.2 7.4 5.4 9.2 C5.1 9.9 5.1 10.6 5.1 11.6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <circle className="wordmark__dot" cx="5.1" cy="15.4" r="1.9" />
        </svg>
        </span>
      </span>
    </Link>
  );
}
