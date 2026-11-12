import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export const RAW_DIR = resolve(ROOT, 'data/raw');
export const PROCESSED_DIR = resolve(ROOT, 'data/processed');

export const rawPath = (code: string, kind: 'data' | 'meta') => resolve(RAW_DIR, `${code}.BGD.${kind}.json`);
export const processedPath = (id: string) => resolve(PROCESSED_DIR, `${id}.json`);
export const metaPath = () => resolve(PROCESSED_DIR, 'meta.json');
export const countryMetaPath = () => resolve(RAW_DIR, 'country.BGD.meta.json');

export function readJson<T>(path: string): T | null {
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

/** Write via a temporary file and rename, so a crash never leaves half a file. */
export function writeJson(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  renameSync(tmp, path);
}
