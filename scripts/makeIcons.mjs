import fs from 'fs'
import zlib from 'zlib'

function makePng(size, outPath) {
  const channels = 4
  const imgData = new Uint8Array(size * size * channels)
  const cx = size / 2, cy = size / 2

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * channels
      let r = 0x1a, g = 0x1a, b = 0x2e, a = 255   // bg: #1a1a2e

      const dist = Math.hypot(x - cx, y - cy)
      if (dist < size * 0.42) { r = 0x3a; g = 0x3a; b = 0x7e }  // circle: #3a3a7e

      // Crate square
      const sq = size * 0.18
      if (Math.abs(x - cx) < sq && Math.abs(y - cy) < sq) { r = 0xff; g = 0x8c; b = 0x14 }

      // Target cross (thin lines through centre)
      const arm = size * 0.06, len = size * 0.22
      if (Math.abs(x - cx) < arm && Math.abs(y - cy) < len) { r = 0xff; g = 0xff; b = 0x80 }
      if (Math.abs(y - cy) < arm && Math.abs(x - cx) < len) { r = 0xff; g = 0xff; b = 0x80 }

      imgData[i] = r; imgData[i+1] = g; imgData[i+2] = b; imgData[i+3] = a
    }
  }

  // Build raw scanlines (filter byte 0 per row)
  const raw = []
  for (let y = 0; y < size; y++) {
    raw.push(0)
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * channels
      raw.push(imgData[i], imgData[i+1], imgData[i+2], imgData[i+3])
    }
  }
  const rawBuf = Buffer.from(raw)

  function u32(n) { const b = Buffer.alloc(4); b.writeUInt32BE(n >>> 0); return b }

  function crc32(buf) {
    const t = new Int32Array(256)
    for (let i = 0; i < 256; i++) {
      let c = i
      for (let j = 0; j < 8; j++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1)
      t[i] = c
    }
    let c = -1
    for (let i = 0; i < buf.length; i++) c = t[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
    return (c ^ -1) >>> 0
  }

  function chunk(type, data) {
    const t = Buffer.from(type)
    const d = Buffer.isBuffer(data) ? data : Buffer.from(data)
    const full = Buffer.concat([t, d])
    return Buffer.concat([u32(d.length), full, u32(crc32(full))])
  }

  // adler32 for zlib wrapper
  function adler32(buf) {
    let s1 = 1, s2 = 0
    for (let i = 0; i < buf.length; i++) { s1 = (s1 + buf[i]) % 65521; s2 = (s2 + s1) % 65521 }
    return (s2 << 16) | s1
  }

  const deflated = zlib.deflateRawSync(rawBuf, { level: 1 })
  const adl = adler32(rawBuf)
  const idat = Buffer.concat([Buffer.from([0x78, 0x01]), deflated, u32(adl)])

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.concat([u32(size), u32(size), Buffer.from([8, 6, 0, 0, 0])]) // 8-bit RGBA
  const png = Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))])

  fs.mkdirSync('public/icons', { recursive: true })
  fs.writeFileSync(outPath, png)
  console.log(`✓ ${outPath} (${png.length} bytes)`)
}

makePng(192, 'public/icons/icon-192.png')
makePng(512, 'public/icons/icon-512.png')
