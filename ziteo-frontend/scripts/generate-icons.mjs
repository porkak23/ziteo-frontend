/**
 * Generates Ziteo PWA icons as PNG files using only Node.js built-ins.
 * Output: public/icons/icon-192.png, icon-512.png, icon-192-maskable.png, icon-512-maskable.png
 */
import zlib from 'zlib'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ICONS_DIR = path.join(__dirname, '..', 'public', 'icons')

// Ziteo brand colors
const ORANGE = [0xD9, 0x4F, 0x00]  // #D94F00
const WHITE  = [0xFF, 0xFF, 0xFF]

// ── CRC32 for PNG chunks ──────────────────────────────────────────────────────

const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return t
})()

function crc32(buf) {
  let crc = 0xFFFFFFFF
  for (const b of buf) crc = CRC_TABLE[(crc ^ b) & 0xFF] ^ (crc >>> 8)
  return (crc ^ 0xFFFFFFFF) >>> 0
}

function pngChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii')
  const lenBuf  = Buffer.alloc(4); lenBuf.writeUInt32BE(data.length, 0)
  const crcBuf  = Buffer.alloc(4); crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf])
}

// ── PNG builder ───────────────────────────────────────────────────────────────

function buildPNG(pixels, width, height) {
  // IHDR
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8; ihdr[9] = 2  // 8-bit RGB

  // Raw scanlines: filter byte 0 + RGB pixels
  const raw = Buffer.alloc(height * (1 + width * 3))
  for (let y = 0; y < height; y++) {
    raw[y * (1 + width * 3)] = 0  // None filter
    for (let x = 0; x < width; x++) {
      const [r, g, b] = pixels[y * width + x]
      const off = y * (1 + width * 3) + 1 + x * 3
      raw[off] = r; raw[off + 1] = g; raw[off + 2] = b
    }
  }

  const idat = zlib.deflateSync(raw, { level: 9 })

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),  // PNG signature
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

// ── Z glyph (12×14 pixel bitmap, 1 = white, 0 = transparent) ────────────────

const Z_GLYPH = [
  [1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1],
  [0,0,0,0,0,0,0,0,1,1,1,0],
  [0,0,0,0,0,0,0,1,1,1,0,0],
  [0,0,0,0,0,0,1,1,1,0,0,0],
  [0,0,0,0,0,1,1,1,0,0,0,0],
  [0,0,0,0,1,1,1,0,0,0,0,0],
  [0,0,0,1,1,1,0,0,0,0,0,0],
  [0,0,1,1,1,0,0,0,0,0,0,0],
  [0,1,1,1,0,0,0,0,0,0,0,0],
  [1,1,1,0,0,0,0,0,0,0,0,0],
  [1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1],
]

const GLYPH_W = 12
const GLYPH_H = 14

// ── Icon generator ────────────────────────────────────────────────────────────

function generateIcon(size, { maskable = false } = {}) {
  const pixels = new Array(size * size).fill(null).map(() => [...ORANGE])

  // Safe zone for maskable: 20% padding (Google spec)
  const padding = maskable ? Math.round(size * 0.2) : Math.round(size * 0.18)
  const drawW = size - padding * 2
  const drawH = size - padding * 2

  const scale = Math.min(drawW / GLYPH_W, drawH / GLYPH_H)
  const scaledW = Math.round(GLYPH_W * scale)
  const scaledH = Math.round(GLYPH_H * scale)
  const offsetX = Math.round((size - scaledW) / 2)
  const offsetY = Math.round((size - scaledH) / 2)

  for (let gy = 0; gy < GLYPH_H; gy++) {
    for (let gx = 0; gx < GLYPH_W; gx++) {
      if (!Z_GLYPH[gy][gx]) continue

      const px0 = offsetX + Math.round(gx * scale)
      const py0 = offsetY + Math.round(gy * scale)
      const px1 = offsetX + Math.round((gx + 1) * scale)
      const py1 = offsetY + Math.round((gy + 1) * scale)

      for (let py = py0; py < py1 && py < size; py++) {
        for (let px = px0; px < px1 && px < size; px++) {
          if (px >= 0 && py >= 0) pixels[py * size + px] = [...WHITE]
        }
      }
    }
  }

  return buildPNG(pixels, size, size)
}

// ── Main ──────────────────────────────────────────────────────────────────────

fs.mkdirSync(ICONS_DIR, { recursive: true })

const configs = [
  { file: 'icon-192.png',          size: 192, maskable: false },
  { file: 'icon-512.png',          size: 512, maskable: false },
  { file: 'icon-192-maskable.png', size: 192, maskable: true  },
  { file: 'icon-512-maskable.png', size: 512, maskable: true  },
]

for (const { file, size, maskable } of configs) {
  const buf = generateIcon(size, { maskable })
  fs.writeFileSync(path.join(ICONS_DIR, file), buf)
  console.log(`  ✓ ${file} (${size}x${size}${maskable ? ', maskable' : ''}) — ${buf.length} bytes`)
}

console.log('\nIconos generados en public/icons/')
