/**
 * Generates the PWA icon set (PNG) with zero dependencies.
 * Renders at 2× and box-downsamples for clean edges.
 * Run: npm run icons
 */

import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'icons');
mkdirSync(OUT, { recursive: true });

// ── tiny RGBA canvas ────────────────────────────────────────────────────────
function canvas(w, h, bg) {
  const buf = new Uint8Array(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    buf[i * 4] = bg[0]; buf[i * 4 + 1] = bg[1]; buf[i * 4 + 2] = bg[2]; buf[i * 4 + 3] = bg[3];
  }
  return { w, h, buf };
}

function px(c, x, y, color) {
  if (x < 0 || y < 0 || x >= c.w || y >= c.h) return;
  const i = (y * c.w + x) * 4;
  c.buf[i] = color[0]; c.buf[i + 1] = color[1]; c.buf[i + 2] = color[2]; c.buf[i + 3] = color[3];
}

function fillRect(c, x0, y0, x1, y1, color) {
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) px(c, x, y, color);
}

function fillCircle(c, cx, cy, r, color) {
  for (let y = cy - r; y <= cy + r; y++)
    for (let x = cx - r; x <= cx + r; x++)
      if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) px(c, x, y, color);
}

function ring(c, cx, cy, rOuter, rInner, color) {
  for (let y = cy - rOuter; y <= cy + rOuter; y++)
    for (let x = cx - rOuter; x <= cx + rOuter; x++) {
      const d2 = (x - cx) ** 2 + (y - cy) ** 2;
      if (d2 <= rOuter * rOuter && d2 >= rInner * rInner) px(c, x, y, color);
    }
}

function roundedBg(c, radius, color) {
  for (let y = 0; y < c.h; y++)
    for (let x = 0; x < c.w; x++) {
      const rx = Math.min(x, c.w - 1 - x), ry = Math.min(y, c.h - 1 - y);
      if (rx < radius && ry < radius) {
        const dx = radius - rx, dy = radius - ry;
        if (dx * dx + dy * dy > radius * radius) continue;
      }
      px(c, x, y, color);
    }
}

function downsample(src, factor) {
  const w = src.w / factor, h = src.h / factor;
  const out = canvas(w, h, [0, 0, 0, 0]);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < factor; sy++)
        for (let sx = 0; sx < factor; sx++) {
          const i = ((y * factor + sy) * src.w + x * factor + sx) * 4;
          r += src.buf[i]; g += src.buf[i + 1]; b += src.buf[i + 2]; a += src.buf[i + 3];
        }
      const n = factor * factor, o = (y * w + x) * 4;
      out.buf[o] = r / n; out.buf[o + 1] = g / n; out.buf[o + 2] = b / n; out.buf[o + 3] = a / n;
    }
  return out;
}

// ── PNG encoder (RGBA-8) ────────────────────────────────────────────────────
function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = (crc ^ buf[i]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePng(c) {
  const raw = Buffer.alloc((c.w * 4 + 1) * c.h);
  for (let y = 0; y < c.h; y++) {
    raw[y * (c.w * 4 + 1)] = 0; // filter: none
    Buffer.from(c.buf.buffer, y * c.w * 4, c.w * 4).copy(raw, y * (c.w * 4 + 1) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(c.w, 0);
  ihdr.writeUInt32BE(c.h, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── the mark: key glyph + spark dots ────────────────────────────────────────
const NAVY = [15, 23, 42, 255];       // slate-900
const SKY = [56, 189, 248, 255];      // sky-400
const SKY_SOFT = [125, 211, 252, 255];

function drawMark(size, { maskable }) {
  const S = 2; // supersample
  const s = size * S;
  const c = canvas(s, s, maskable ? NAVY : [0, 0, 0, 0]);
  if (!maskable) roundedBg(c, Math.round(s * 0.18), NAVY);

  // key: ring head (left), shaft (right), two teeth (down)
  const cx = Math.round(s * 0.36), cy = Math.round(s * 0.5);
  const rOut = Math.round(s * 0.155), rIn = Math.round(s * 0.07);
  ring(c, cx, cy, rOut, rIn, SKY);
  const shaftY0 = cy - Math.round(s * 0.035), shaftY1 = cy + Math.round(s * 0.035);
  fillRect(c, cx + rOut - Math.round(s * 0.01), shaftY0, Math.round(s * 0.78), shaftY1, SKY);
  fillRect(c, Math.round(s * 0.62), shaftY1, Math.round(s * 0.62 + s * 0.05), shaftY1 + Math.round(s * 0.12), SKY);
  fillRect(c, Math.round(s * 0.73), shaftY1, Math.round(s * 0.73 + s * 0.05), shaftY1 + Math.round(s * 0.16), SKY);

  // spark dots (the "random" motif)
  fillCircle(c, Math.round(s * 0.72), Math.round(s * 0.26), Math.round(s * 0.035), SKY_SOFT);
  fillCircle(c, Math.round(s * 0.82), Math.round(s * 0.18), Math.round(s * 0.022), SKY_SOFT);
  fillCircle(c, Math.round(s * 0.63), Math.round(s * 0.16), Math.round(s * 0.016), SKY_SOFT);

  return downsample(c, S);
}

for (const [name, size, maskable] of [
  ['icon-192.png', 192, false],
  ['icon-512.png', 512, false],
  ['maskable-512.png', 512, true],
  ['apple-touch-icon.png', 180, true],
]) {
  writeFileSync(join(OUT, name), encodePng(drawMark(size, { maskable })));
  console.log('wrote', name);
}
