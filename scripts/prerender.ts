// Writes one finished HTML file per page (section 13, "No JavaScript"; DECISIONS.md 116).
// Run after `vite build` (the browser files) and `vite build --ssr` (the renderer).
//   dist/en/economy/index.html, dist/bn/indicator/inflation/index.html, …
//   dist/404.html   the "page does not exist" page, for hosts that serve it for unknown addresses
//   dist/index.html sends people without JavaScript to the English homepage
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// The production React build: quicker, and the same HTML the browser build expects.
process.env.NODE_ENV = 'production';
const DIST = resolve('dist');
const SSR = resolve('dist-ssr/entry-server.js');

const { render, routes } = (await import(pathToFileURL(SSR).href)) as {
  render: (url: string) => Promise<string>;
  routes: () => string[];
};

const template = readFileSync(join(DIST, 'index.html'), 'utf8');
if (!template.includes('<div id="root"></div>')) throw new Error('dist/index.html has no empty #root');

const SITE_TITLE = 'Kemon Ache Bangladesh?';
const SITE_TITLE_BN = 'কেমন আছে বাংলাদেশ?';

const decode = (s: string) => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').trim();
const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

function page(url: string, body: string, prerenderedPath: string | null): string {
  const lang = url.startsWith('/bn/') ? 'bn' : 'en';
  const site = lang === 'bn' ? SITE_TITLE_BN : SITE_TITLE;
  const h1 = /<h1[^>]*>([\s\S]*?)<\/h1>/.exec(body)?.[1];
  const heading = h1 ? decode(h1) : '';
  const title = heading && !url.match(/^\/(en|bn)\/$/) ? `${heading} · ${site}` : site;
  const attr = prerenderedPath ? ` data-prerendered="${prerenderedPath}"` : '';
  return template
    .replace('<html lang="en"', `<html lang="${lang}"`)
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(title)}</title>`)
    .replace('<div id="root"></div>', `<div id="root"${attr}>${body}</div>`);
}

function write(file: string, html: string) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
}

let count = 0;
for (const url of routes()) {
  const body = await render(url);
  // Pages whose figures are all in charts (subsections, compare) or that have none: text only without JavaScript.
  const textOnly = /\/(about|how-to-read|sources|compare)$|\/economy\/[a-z-]+$/.test(url);
  if (!body.includes('data-source-line') && !textOnly) {
    throw new Error(`${url}: rendered page has no source line`);
  }
  write(join(DIST, url, 'index.html'), page(url, body, url));
  count++;
}

// Unknown addresses: the 404 page. JavaScript then renders whatever the address really is.
write(join(DIST, '404.html'), page('/en/', await render('/en/this-page-does-not-exist'), null));

// "/": JavaScript picks the reader's language; without it, go to English.
write(
  join(DIST, 'index.html'),
  template.replace('</head>', '    <noscript><meta http-equiv="refresh" content="0; url=/en/" /></noscript>\n  </head>'),
);

console.log(`Pre-rendered ${count} pages and 404.html.`);
