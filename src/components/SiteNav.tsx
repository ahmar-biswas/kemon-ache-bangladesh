// Header menu (section 10; DECISIONS.md 101): Home · Economy · Education · Health · Compare.
// Sources and About join in M7. Wide screens: a quiet row of links in the header. Phones: a
// menu button that opens a full-width list under the header. Real links, so the menu also
// works before JavaScript has run (the list is simply shown open without it).
import { useEffect, useId, useState } from 'react';
import { NavLink, useLocation } from 'react-router';
import { path } from '../data/site.ts';
import { t, type Lang, type MessageKey } from '../i18n/index.ts';

const ITEMS: { key: MessageKey; to: (lang: Lang) => string; end?: boolean }[] = [
  { key: 'nav.home', to: path.home, end: true },
  { key: 'area.economy', to: (l) => path.area(l, 'economy') },
  { key: 'area.education', to: (l) => path.area(l, 'education') },
  { key: 'area.health', to: (l) => path.area(l, 'health') },
  { key: 'nav.compare', to: (l) => path.compare(l) },
];

function Links({ lang, onPick }: { lang: Lang; onPick?: () => void }) {
  return (
    <ul>
      {ITEMS.map((item) => (
        <li key={item.key}>
          <NavLink to={item.to(lang)} end={item.end} onClick={onPick}>
            {t(lang, item.key)}
          </NavLink>
        </li>
      ))}
    </ul>
  );
}

export function SiteNav({ lang }: { lang: Lang }) {
  return (
    <nav className="site-nav" aria-label={t(lang, 'nav.label')}>
      <Links lang={lang} />
    </nav>
  );
}

export function MobileMenu({ lang }: { lang: Lang }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const { pathname } = useLocation();
  // A new page closes the menu.
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button type="button" className="menu-button" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}>
        <svg width="20" height="14" viewBox="0 0 20 14" aria-hidden="true" focusable="false">
          {open ? (
            <path d="M4 1 L16 13 M16 1 L4 13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          ) : (
            <path d="M1 2 H19 M1 7 H19 M1 12 H19" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          )}
        </svg>
        <span className="menu-button__text">{t(lang, open ? 'nav.close_menu' : 'nav.menu')}</span>
      </button>
      <nav id={id} className={`mobile-menu${open ? ' is-open' : ''}`} aria-label={t(lang, 'nav.label')} hidden={!open}>
        <Links lang={lang} onPick={() => setOpen(false)} />
      </nav>
    </>
  );
}
