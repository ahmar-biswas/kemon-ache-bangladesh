// Breadcrumbs on every page below Home (section 10). The last item is the current page.
import { Link } from 'react-router';
import { path } from '../data/site.ts';
import { t, type Lang } from '../i18n/index.ts';

export interface Crumb {
  label: string;
  to?: string;
}

export function Breadcrumbs({ lang, items }: { lang: Lang; items: Crumb[] }) {
  const all: Crumb[] = [{ label: t(lang, 'nav.home'), to: path.home(lang) }, ...items];
  return (
    <nav className="breadcrumbs" aria-label={t(lang, 'nav.breadcrumbs')}>
      <ol>
        {all.map((c, i) =>
          i === all.length - 1 || !c.to ? (
            <li key={c.label} aria-current={i === all.length - 1 ? 'page' : undefined}>
              {c.label}
            </li>
          ) : (
            <li key={c.label}>
              <Link to={c.to}>{c.label}</Link>
            </li>
          ),
        )}
      </ol>
    </nav>
  );
}
