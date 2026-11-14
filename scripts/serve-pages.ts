// Serves dist/ the way GitHub Pages does, inside the site's folder (M9, DECISIONS 140), to try a
// deploy build on this computer before it goes live:
//   BASE_PATH=/kemon-ache-bangladesh/ npm run build   then   npm run preview:pages
// Like GitHub Pages: a folder address without "/" is redirected to the address with "/", a folder
// serves its index.html, and an unknown address gets 404.html with status 404.
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';

const DIST = resolve('dist');
const BASE = `/${(process.env.BASE_PATH ?? 'kemon-ache-bangladesh').replace(/^\/+|\/+$/g, '')}`;
const PORT = Number(process.env.PORT ?? 4174);
const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.txt': 'text/plain',
};

createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://x');
  const send = (status: number, file: string) => {
    res.writeHead(status, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
    res.end(readFileSync(file));
  };
  if (url.pathname === '/' ) return void res.writeHead(302, { location: `${BASE}/` }).end();
  if (url.pathname !== BASE && !url.pathname.startsWith(`${BASE}/`)) return send(404, join(DIST, '404.html'));
  const p = join(DIST, decodeURIComponent(url.pathname.slice(BASE.length)));
  if (!p.startsWith(DIST)) return send(404, join(DIST, '404.html'));
  if (existsSync(p) && statSync(p).isFile()) return send(200, p);
  if (existsSync(join(p, 'index.html'))) {
    if (!url.pathname.endsWith('/')) return void res.writeHead(301, { location: `${url.pathname}/${url.search}` }).end();
    return send(200, join(p, 'index.html'));
  }
  send(404, join(DIST, '404.html'));
}).listen(PORT, () => console.log(`Serving dist/ at http://localhost:${PORT}${BASE}/`));
