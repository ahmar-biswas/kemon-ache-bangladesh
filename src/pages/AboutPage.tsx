// /about and /how-to-read (section 10; DECISIONS.md 115). Plain text only: no figures, so no
// source lines are needed (R1 applies to figures). Every sentence is a translation key (R7).
import { Link, useOutletContext } from 'react-router';
import { Breadcrumbs } from '../components/Breadcrumbs.tsx';
import { path } from '../data/site.ts';
import { t, type Lang, type MessageKey } from '../i18n/index.ts';
import { usePageTitle } from './AreaPage.tsx';

interface Block {
  heading: MessageKey;
  paragraphs: MessageKey[];
}

const ABOUT: Block[] = [
  { heading: 'about.what.h', paragraphs: ['about.what.p1', 'about.what.p2'] },
  { heading: 'about.rules.h', paragraphs: ['about.rules.p1', 'about.rules.p2', 'about.rules.p3', 'about.rules.p4', 'about.rules.p5'] },
  { heading: 'about.data.h', paragraphs: ['about.data.p1', 'about.data.p2', 'about.data.p3'] },
  { heading: 'about.lang.h', paragraphs: ['about.lang.p1'] },
];

const HOW: Block[] = [
  { heading: 'how.tile.h', paragraphs: ['how.tile.p1', 'how.tile.p2'] },
  { heading: 'how.years.h', paragraphs: ['how.years.p1', 'how.years.p2'] },
  { heading: 'how.peers.h', paragraphs: ['how.peers.p1', 'how.peers.p2'] },
  { heading: 'how.badge.h', paragraphs: ['how.badge.p1'] },
  { heading: 'how.calc.h', paragraphs: ['how.calc.p1'] },
  { heading: 'how.missing.h', paragraphs: ['how.missing.p1', 'how.missing.p2'] },
  { heading: 'how.caveats.h', paragraphs: ['how.caveats.p1'] },
  { heading: 'how.charts.h', paragraphs: ['how.charts.p1'] },
  { heading: 'how.money.h', paragraphs: ['how.money.p1'] },
  { heading: 'how.lang.h', paragraphs: ['how.lang.p1'] },
];

function TextPage({ title, lede, blocks, links }: { title: MessageKey; lede: MessageKey; blocks: Block[]; links: { to: string; key: MessageKey }[] }) {
  const lang = useOutletContext<Lang>();
  usePageTitle(lang, t(lang, title));
  return (
    <div className="page text-page wrap">
      <Breadcrumbs lang={lang} items={[{ label: t(lang, title) }]} />
      <header className="page-head">
        <h1>
          <span className="story__disc" aria-hidden="true" />
          {t(lang, title)}
        </h1>
        <p className="page-head__lede">{t(lang, lede)}</p>
      </header>
      <hr className="stitch stitch--red" />
      {blocks.map((b) => (
        <section key={b.heading} className="text-page__block">
          <h2>{t(lang, b.heading)}</h2>
          {b.paragraphs.map((p) => (
            <p key={p}>{t(lang, p)}</p>
          ))}
        </section>
      ))}
      <ul className="text-page__links">
        {links.map((l) => (
          <li key={l.key}>
            <Link to={l.to}>{t(lang, l.key)}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AboutPage() {
  const lang = useOutletContext<Lang>();
  return (
    <TextPage
      title="nav.about"
      lede="about.lede"
      blocks={ABOUT}
      links={[
        { to: path.howToRead(lang), key: 'nav.how_to_read' },
        { to: path.sources(lang), key: 'nav.sources' },
      ]}
    />
  );
}

export function HowToReadPage() {
  const lang = useOutletContext<Lang>();
  return (
    <TextPage
      title="nav.how_to_read"
      lede="how.lede"
      blocks={HOW}
      links={[
        { to: path.sources(lang), key: 'nav.sources' },
        { to: path.about(lang), key: 'nav.about' },
      ]}
    />
  );
}
