// The World Today — Monday 23 November 2026 (make.fun news-image-20261123).
// Node 22, standard library only. Draws a 1024x1024 newspaper front page
// entirely in code — own PNG encoder (CRC32 + zlib), own 5x7 bitmap font,
// fixed-seed layout — and writes it to /output/entry.png. Deterministic:
// two runs produce identical bytes. No network, no Math.random, no Date.now.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';

const W = 1024;
const H = 1024;

// ---------------------------------------------------------------- font: 5x7
// Each glyph is 7 rows of 5 bits, top to bottom, leftmost column first.
const FONT: Record<string, string[]> = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01110', '10001', '10000', '10000', '10000', '10001', '01110'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01110', '10001', '10000', '10111', '10001', '10001', '01111'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['01110', '00100', '00100', '00100', '00100', '00100', '01110'],
  J: ['00111', '00010', '00010', '00010', '00010', '10010', '01100'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '10101', '11011', '10001'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00110', '01000', '10000', '11111'],
  '3': ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
  '.': ['00000', '00000', '00000', '00000', '00000', '01100', '01100'],
  ',': ['00000', '00000', '00000', '00000', '01100', '00100', '01000'],
  ':': ['00000', '01100', '01100', '00000', '01100', '01100', '00000'],
  ';': ['00000', '01100', '01100', '00000', '01100', '00100', '01000'],
  "'": ['00100', '00100', '01000', '00000', '00000', '00000', '00000'],
  '"': ['01010', '01010', '00000', '00000', '00000', '00000', '00000'],
  '-': ['00000', '00000', '00000', '01110', '00000', '00000', '00000'],
  '(': ['00010', '00100', '01000', '01000', '01000', '00100', '00010'],
  ')': ['01000', '00100', '00010', '00010', '00010', '00100', '01000'],
  '%': ['11001', '11010', '00010', '00100', '01000', '01011', '10011'],
  '$': ['00100', '01111', '10100', '01110', '00101', '11110', '00100'],
  '&': ['01100', '10010', '10100', '01000', '10101', '10010', '01101'],
  '/': ['00001', '00010', '00010', '00100', '01000', '01000', '10000'],
  '+': ['00000', '00100', '00100', '11111', '00100', '00100', '00000'],
  '=': ['00000', '00000', '11111', '00000', '11111', '00000', '00000'],
  '!': ['00100', '00100', '00100', '00100', '00100', '00000', '00100'],
  '?': ['01110', '10001', '00001', '00110', '00100', '00000', '00100'],
  '•': ['00000', '00000', '01110', '01110', '01110', '00000', '00000'],
};

// ---------------------------------------------------------------- canvas
const PAPER: [number, number, number] = [244, 236, 220];
const INK: [number, number, number] = [16, 16, 16];
const RED: [number, number, number] = [178, 34, 34];
const WHITE: [number, number, number] = [255, 255, 255];

const img = Buffer.alloc(W * H * 3);
for (let i = 0; i < W * H; i++) {
  img[i * 3] = PAPER[0];
  img[i * 3 + 1] = PAPER[1];
  img[i * 3 + 2] = PAPER[2];
}

function px(x: number, y: number, c: [number, number, number]): void {
  if (x < 0 || x >= W || y < 0 || y >= H) return;
  const o = (y * W + x) * 3;
  img[o] = c[0];
  img[o + 1] = c[1];
  img[o + 2] = c[2];
}

function rect(x: number, y: number, w: number, h: number, c: [number, number, number]): void {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) px(i, j, c);
}

function hline(y: number, x0: number, x1: number, c: [number, number, number], t = 1): void {
  rect(x0, y, x1 - x0, t, c);
}

function vline(x: number, y0: number, y1: number, c: [number, number, number], t = 1): void {
  rect(x, y0, t, y1 - y0, c);
}

// Thick straight segment, drawn as interpolated squares (deterministic).
function thickLine(x0: number, y0: number, x1: number, y1: number, c: [number, number, number], t: number): void {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  const half = Math.floor(t / 2);
  for (let s = 0; s <= steps; s++) {
    const x = Math.round(x0 + ((x1 - x0) * s) / steps);
    const y = Math.round(y0 + ((y1 - y0) * s) / steps);
    rect(x - half, y - half, t, t, c);
  }
}

// Filled disc.
function disc(cx: number, cy: number, r: number, c: [number, number, number]): void {
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy <= r * r) px(cx + dx, cy + dy, c);
    }
  }
}

// Fixed-seed LCG (deterministic; seed 20261123).
let seed = 20261123;
function rnd(): number {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
}

function textWidth(s: string, scale: number): number {
  return s.length * 6 * scale - scale;
}

function drawText(s: string, x: number, y: number, scale: number, c: [number, number, number]): void {
  for (let i = 0; i < s.length; i++) {
    const g = FONT[s[i]] ?? FONT['?'];
    for (let r = 0; r < 7; r++) {
      for (let col = 0; col < 5; col++) {
        if (g[r][col] === '1') {
          rect(x + i * 6 * scale + col * scale, y + r * scale, scale, scale, c);
        }
      }
    }
  }
}

function drawTextCentered(s: string, cx: number, y: number, scale: number, c: [number, number, number]): void {
  drawText(s, Math.round(cx - textWidth(s, scale) / 2), y, scale, c);
}

// Word-wrap plain text to lines that fit maxWidth px at the given scale.
function wrap(s: string, maxWidth: number, scale: number): string[] {
  const maxChars = Math.max(1, Math.floor((maxWidth + scale) / (6 * scale)));
  const words = s.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const next = cur === '' ? w : `${cur} ${w}`;
    if (next.length <= maxChars) {
      cur = next;
    } else {
      if (cur !== '') lines.push(cur);
      cur = w.length > maxChars ? w.slice(0, maxChars) : w;
      if (w.length > maxChars) lines.push(cur), (cur = w.slice(maxChars));
    }
  }
  if (cur !== '') lines.push(cur);
  return lines;
}

function drawPara(s: string, x: number, y: number, maxWidth: number, scale: number, c: [number, number, number], lineH: number): number {
  const lines = wrap(s, maxWidth, scale);
  lines.forEach((ln, i) => drawText(ln, x, y + i * lineH, scale, c));
  return y + lines.length * lineH;
}

// ---------------------------------------------------------------- PNG encoder
const CRC_TABLE: number[] = (() => {
  const t: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td), 0);
  return Buffer.concat([len, td, crc]);
}

function encodePNG(): Buffer {
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0; // filter: none
    img.copy(raw, y * (1 + W * 3) + 1, y * W * 3, (y + 1) * W * 3);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------- layout
const M = 40; // margin
const R = W - M; // right edge of text area
const GREEN: [number, number, number] = [34, 139, 92];
const NAVY: [number, number, number] = [16, 26, 48];
const GRID: [number, number, number] = [52, 68, 104];
const LIME: [number, number, number] = [120, 220, 130];
const GOLD: [number, number, number] = [247, 215, 116];

// Masthead
drawTextCentered('THE WORLD TODAY', W / 2, 30, 9, INK);
hline(100, M, R, INK, 2);
hline(105, M, R, INK, 1);

// Black date band
rect(M, 112, R - M, 38, INK);
drawTextCentered('MONDAY 23 NOVEMBER 2026', W / 2, 120, 4, WHITE);

// Lead kicker + headline + deck
drawText('WALL STREET - TECHNOLOGY', M, 164, 2, RED);
drawText('NVIDIA BRINGS', M, 184, 6, INK);
drawText('HUANG BACK', M, 228, 6, INK);
drawText('SHARES SOAR 33% AS S&P 500 JUMPS 4.82% IN SHARP REBOUND', M, 278, 2, INK);
hline(298, M, R, INK, 1);

// Lead art: market-surge chart on a dark board, y 306..436
const ART_TOP = 306;
const ART_BOT = 436;
rect(M, ART_TOP, R - M, ART_BOT - ART_TOP, NAVY);
// grid
for (let gy = ART_TOP + 24; gy < ART_BOT - 8; gy += 26) hline(gy, M + 8, R - 8, GRID, 1);
for (let gx = M + 90; gx < R - 8; gx += 90) vline(gx, ART_TOP + 8, ART_BOT - 8, GRID, 1);
// rising bars (volume) along the bottom
const barHeights = [14, 20, 16, 26, 22, 34, 30, 44, 38, 52, 48, 62, 58, 74, 68, 84];
for (let i = 0; i < barHeights.length; i++) {
  const bw = 44;
  const bx = M + 24 + i * 56;
  const bh = barHeights[i];
  rect(bx, ART_BOT - 8 - bh, bw, bh, i % 2 === 0 ? [38, 96, 74] : [30, 84, 64]);
}
// the surge line, climbing left to right
const pts: [number, number][] = [
  [M + 30, 414], [M + 150, 402], [M + 260, 408], [M + 380, 382],
  [M + 500, 388], [M + 620, 356], [M + 740, 342], [M + 850, 322], [R - 34, 316],
];
for (let i = 0; i < pts.length - 1; i++) {
  thickLine(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], LIME, 6);
}
// arrowhead at the end of the line
const tip: [number, number] = [R - 34, 316];
thickLine(tip[0], tip[1], tip[0] - 22, tip[1] - 2, LIME, 6);
thickLine(tip[0], tip[1], tip[0] - 18, tip[1] + 14, LIME, 6);
// dots on the line
for (const [pxx, pyy] of pts) disc(pxx, pyy, 5, WHITE);
// labels on the board
drawText('NVDA +33%', M + 24, ART_TOP + 14, 4, GOLD);
drawText('S&P 500 +4.82%', M + 24, ART_TOP + 46, 2, WHITE);
drawText('SK HYNIX +20%', M + 24, ART_TOP + 66, 2, WHITE);

// Lead body
drawPara(
  'NVIDIA REINSTATED JENSEN HUANG AS CHIEF EXECUTIVE 11 DAYS AFTER HE RESIGNED, AND SHARES JUMPED ABOUT 33 PERCENT. THE S&P 500 ROSE 4.82 PERCENT IN A SHARP REBOUND AFTER LAST WEEK\'S AI SELL-OFF. SK HYNIX SOARED 20 PERCENT.',
  M,
  450,
  R - M,
  2,
  INK,
  16,
);
hline(506, M, R, INK, 1);

// Three columns, y 520..800
const COL_Y = 520;
const COL_W = 304;
const COLS = [M, 360, 680];
vline(352, COL_Y, 798, INK, 1);
vline(672, COL_Y, 798, INK, 1);

// Column A — Ukraine strikes Russia in Libya
drawText('UKRAINE - WAR AT SEA', COLS[0], COL_Y, 2, RED);
drawText('UKRAINE STRIKES', COLS[0], COL_Y + 18, 3, INK);
drawText('RUSSIA IN LIBYA', COLS[0], COL_Y + 42, 3, INK);
drawPara(
  'UKRAINIAN SEA DRONES STRUCK RUSSIAN SHIPS IN THE LIBYAN PORT OF BENGHAZI. PRESIDENT ZELENSKYY SAYS THE CORVETTE MERKURY WAS SUNK BY SEVEN NAVAL DRONES. THE WAR WIDENS BEYOND EUROPE\'S BORDERS.',
  COLS[0],
  COL_Y + 72,
  COL_W,
  2,
  INK,
  16,
);

// Column B — COP31 ends with no deal
drawText('ANTALYA - CLIMATE', COLS[1], COL_Y, 2, RED);
drawText('COP31 ENDS', COLS[1], COL_Y + 18, 3, INK);
drawText('WITH NO DEAL', COLS[1], COL_Y + 42, 3, INK);
drawPara(
  'UN CLIMATE TALKS IN ANTALYA, TURKEY ENDED WITHOUT AN OVERALL AGREEMENT AFTER DIVISIONS OVER FOSSIL FUELS AND MONEY. TALKS RAN UNTIL LATE SUNDAY, THE LONGEST UN CLIMATE CONFERENCE IN HISTORY.',
  COLS[1],
  COL_Y + 72,
  COL_W,
  2,
  INK,
  16,
);

// Column C — GTA VI weekend sales (analyst estimate)
drawText('GAMES - SALES', COLS[2], COL_Y, 2, RED);
drawText('GTA VI: 45M', COLS[2], COL_Y + 18, 3, INK);
drawText('COPIES IN', COLS[2], COL_Y + 42, 3, INK);
drawText('ONE WEEKEND', COLS[2], COL_Y + 66, 3, INK);
drawPara(
  'ANALYSTS ESTIMATE 44.9 MILLION COPIES SOLD THROUGH LAUNCH WEEKEND - 33.7 MILLION ON PS5 AND 11.2 MILLION ON XBOX - WITH REVENUE OVER $4 BILLION.',
  COLS[2],
  COL_Y + 96,
  COL_W,
  2,
  INK,
  16,
);

// IN BRIEF
hline(810, M, R, INK, 1);
drawText('IN BRIEF', M, 822, 3, INK);
const BRIEF_LEFT = [
  "TRUMP CALLS PUTIN 'MY FRIEND' AFTER XI SUMMIT",
  'DEMOCRATS WIN BIGGEST HOUSE MAJORITY SINCE 1992',
  'EU PROPOSES 22ND SANCTIONS PACKAGE ON RUSSIA',
];
const BRIEF_RIGHT = [
  "'EL CHAPO ISIDRO' CAPTURED IN SINALOA",
  'RUSSIAN STRIKE ON DYMER FLAT KILLS AT LEAST 11',
  'IRAN VOWS TO COUNTER US BLOCKADE, DOWNED US DRONE',
];
function drawBrief(items: string[], x: number, y0: number): void {
  let y = y0;
  for (const item of items) {
    rect(x, y + 3, 8, 8, RED);
    y = drawPara(item, x + 16, y, 440, 2, INK, 16) + 6;
  }
}
drawBrief(BRIEF_LEFT, M, 848);
drawBrief(BRIEF_RIGHT, 540, 848);

// Footer
hline(972, M, R, INK, 1);
drawTextCentered('THE WORLD TODAY - MONDAY 23 NOVEMBER 2026', W / 2, 984, 2, INK);

// ---------------------------------------------------------------- write
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'entry.png'), encodePNG());
