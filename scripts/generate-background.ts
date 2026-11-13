// Generates the two background assets (docs/reference/08-design-system.md, 8.4):
//   src/assets/delta.svg  about 40 hairline curves that flow from the top and branch
//                         toward the bottom-right like a river delta. Abstract: no outline,
//                         no labels, no places. Must stay under 25 KB.
//   src/assets/grain.png  a small tiling paper-grain texture. Must stay under 8 KB.
// Both are seeded, so every run gives exactly the same files. Run: npm run assets
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { deflateSync } from 'node:zlib';
import { ROOT } from './lib/files.ts';

/** Small seeded random generator (mulberry32). */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- Delta contours ----------
const W = 1440;
const H = 1000;
type Pt = [number, number];

/** Smooth path through points (Catmull-Rom converted to cubic Béziers). */
function smoothPath(pts: Pt[]): string {
  const f = (n: number) => (Math.round(n * 10) / 10).toString();
  let d = `M${f(pts[0]![0])} ${f(pts[0]![1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]!;
    const p1 = pts[i]!;
    const p2 = pts[i + 1]!;
    const p3 = pts[i + 2] ?? p2;
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d;
}

export function deltaSvg(seed = 1971): string {
  const r = rng(seed);
  const paths: string[] = [];
  // Three main channels enter from the top, like three great rivers meeting.
  const trunks = [
    { x: 260, bend: 0.9 },
    { x: 560, bend: 0.75 },
    { x: 900, bend: 0.55 },
  ];
  const perTrunk = [13, 14, 13]; // 40 curves in all
  trunks.forEach((trunk, ti) => {
    // The point where this channel starts to split.
    const split: Pt = [trunk.x + 160 + r() * 120, 300 + r() * 120];
    for (let i = 0; i < perTrunk[ti]!; i++) {
      const spread = (i / (perTrunk[ti]! - 1)) * 2 - 1; // -1 … 1
      const start: Pt = [trunk.x + spread * 26 + (r() - 0.5) * 8, -20];
      const mid: Pt = [trunk.x + 60 + spread * 30 + (r() - 0.5) * 20, 150 + r() * 30];
      const s: Pt = [split[0] + spread * 22, split[1] + spread * 10];
      // Branches fan out toward the bottom-right and the sea.
      const angle = (0.35 + 0.5 * ((spread + 1) / 2)) * trunk.bend; // radians below horizontal
      const reach = 520 + r() * 380;
      const m2: Pt = [s[0] + Math.cos(angle) * reach * 0.45 + (r() - 0.5) * 40, s[1] + Math.sin(angle) * reach * 0.55 + (r() - 0.5) * 40];
      const m3: Pt = [s[0] + Math.cos(angle) * reach * 0.8 + (r() - 0.5) * 60, s[1] + Math.sin(angle) * reach * 0.85 + (r() - 0.5) * 50];
      const end: Pt = [Math.min(W + 30, s[0] + Math.cos(angle) * reach * 1.25), Math.min(H + 30, s[1] + Math.sin(angle) * reach * 1.2)];
      paths.push(smoothPath([start, mid, s, m2, m3, end]));
    }
  });
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">` +
    `<g fill="none" stroke="currentColor" stroke-width="0.6" stroke-linecap="round" vector-effect="non-scaling-stroke">` +
    paths.map((d) => `<path d="${d}" pathLength="1" vector-effect="non-scaling-stroke"/>`).join('') +
    `</g></svg>\n`
  );
}

// ---------- Paper grain (greyscale PNG) ----------
function crc32(buf: Buffer): number {
  let c = ~0;
  for (const b of buf) {
    c ^= b;
    for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
  }
  return ~c >>> 0;
}
function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

export function grainPng(size = 64, seed = 1952): Buffer {
  const r = rng(seed);
  const rows: Buffer[] = [];
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(size + 1); // filter byte 0 + pixels
    for (let x = 0; x < size; x++) row[x + 1] = 96 + Math.floor(r() * 9) * 16; // 9 grey levels, light to mid
    rows.push(row);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 0; // greyscale
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(Buffer.concat(rows), { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------- Muslin fibres (greyscale PNG) ----------
/**
 * A rough, hand-made paper / muslin look: a light flat tile with a few hundred short,
 * slightly curved darker fibres, mostly running across (like threads in muslin) with a
 * few running down. Mostly flat colour, so it compresses well. Tiles seamlessly (wraps).
 */
export function fibresPng(size = 256, seed = 1757): Buffer {
  const r = rng(seed);
  const base = 236;
  const px = new Uint8Array(size * size).fill(base);
  const plot = (x: number, y: number, v: number) => {
    const xi = ((Math.round(x) % size) + size) % size;
    const yi = ((Math.round(y) % size) + size) % size;
    const i = yi * size + xi;
    px[i] = Math.min(px[i]!, v);
  };
  for (let f = 0; f < 420; f++) {
    const across = r() < 0.78;
    let x = r() * size;
    let y = r() * size;
    let a = across ? (r() - 0.5) * 0.5 : Math.PI / 2 + (r() - 0.5) * 0.5;
    const len = 6 + r() * 26;
    const shade = 150 + Math.floor(r() * 70); // darker = more visible
    for (let s = 0; s < len; s++) {
      plot(x, y, shade);
      x += Math.cos(a);
      y += Math.sin(a);
      a += (r() - 0.5) * 0.18; // gentle curl
    }
  }
  // A few soft flecks, like specks in hand-made paper.
  for (let k = 0; k < 60; k++) {
    const x = r() * size, y = r() * size, v = 170 + Math.floor(r() * 50);
    plot(x, y, v); plot(x + 1, y, v); plot(x, y + 1, v);
  }
  const rows: Buffer[] = [];
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(size + 1);
    for (let x = 0; x < size; x++) row[x + 1] = px[y * size + x]!;
    rows.push(row);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(Buffer.concat(rows), { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

if (process.argv[1] && /generate-background/.test(process.argv[1])) {
  const svg = deltaSvg();
  const png = grainPng();
  const fibres = fibresPng();
  writeFileSync(resolve(ROOT, 'src/assets/delta.svg'), svg);
  writeFileSync(resolve(ROOT, 'src/assets/grain.png'), png);
  writeFileSync(resolve(ROOT, 'src/assets/fibres.png'), fibres);
  console.log(
    `delta.svg ${(svg.length / 1024).toFixed(1)} KB, grain.png ${(png.length / 1024).toFixed(1)} KB, fibres.png ${(fibres.length / 1024).toFixed(1)} KB`,
  );
}
