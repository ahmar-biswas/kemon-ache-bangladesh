// The folder the site lives in on the host (M9, DECISIONS 140). On GitHub Pages a project site is at
// https://<user>.github.io/<repository>/, so every address starts with "/<repository>". Set at build
// time with BASE_PATH (see vite.config.ts); empty when the site is at the root of its address
// (local development, tests, the CI checks, or a custom domain later).
export const BASE = import.meta.env.BASE_URL.replace(/\/+$/, '');

/** "/kemon-ache-bangladesh/en/economy" → "/en/economy" (the address as the router sees it). */
export function stripBase(pathname: string): string {
  if (!BASE) return pathname;
  if (pathname === BASE) return '/';
  return pathname.startsWith(`${BASE}/`) ? pathname.slice(BASE.length) : pathname;
}
