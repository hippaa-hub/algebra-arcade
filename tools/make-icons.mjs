// App icons without image libraries: a violet square with a gold planet and a pink ring (the arcade's world).
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';

const crcTable = (() => { const t = new Int32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c; } return t; })();
const crc32 = (buf) => { let c = -1; for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8); return (c ^ -1) >>> 0; };
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
const BG = [0x6c, 0x3c, 0xf0], GOLD = [0xff, 0xc9, 0x3c], PINK = [0xff, 0x5f, 0xa2], WHITE = [255, 255, 255];
function colourAt(x, y, s) {
  const cx = s / 2, cy = s / 2, px = x - cx, py = y - cy;
  // tilted ellipse ring
  const a = -0.45, rx = px * Math.cos(a) - py * Math.sin(a), ry = px * Math.sin(a) + py * Math.cos(a);
  const ring = Math.abs(Math.hypot(rx / (s * 0.4), ry / (s * 0.13)) - 1) < 0.09;
  const inPlanet = Math.hypot(px, py) < s * 0.24;
  const front = ry > 0;
  if (ring && (front || !inPlanet)) return PINK;
  if (inPlanet) return Math.hypot(px + s * 0.08, py + s * 0.08) < s * 0.06 ? WHITE : GOLD;
  if ((Math.round(x * 7.3 + y * 3.1) % 97 === 0) && !inPlanet) return WHITE;
  return BG;
}
function png(size) {
  const S = 3, raw = Buffer.alloc(size * (size * 3 + 1)); let p = 0;
  for (let y = 0; y < size; y++) {
    raw[p++] = 0;
    for (let x = 0; x < size; x++) {
      const acc = [0, 0, 0];
      for (let sy = 0; sy < S; sy++) for (let sx = 0; sx < S; sx++) { const c = colourAt(x + (sx + .5) / S, y + (sy + .5) / S, size); acc[0] += c[0]; acc[1] += c[1]; acc[2] += c[2]; }
      raw[p++] = acc[0] / (S * S); raw[p++] = acc[1] / (S * S); raw[p++] = acc[2] / (S * S);
    }
  }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}
for (const [name, size] of [['icon-192.png', 192], ['icon-512.png', 512], ['apple-touch-icon.png', 180]]) {
  writeFileSync(new URL(`../public/${name}`, import.meta.url), png(size));
  console.log('wrote public/' + name);
}
