import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Minimal standard PNG generator in pure Node (without native dependencies)
function createPNG(width, height, drawFn) {
  const bytesPerPixel = 4;
  const scanlineLength = width * bytesPerPixel;
  const rawData = Buffer.alloc((scanlineLength + 1) * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (scanlineLength + 1);
    rawData[rowOffset] = 0; // Filter byte: None

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * bytesPerPixel;
      const [r, g, b, a] = drawFn(x, y, width, height);
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const deflated = zlib.deflateSync(rawData);

  // CRC32 implementation
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crcTable[n] = c;
  }

  function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  function makeChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(12 + len);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4);
    data.copy(buf, 8);
    const crc = crc32(buf.subarray(4, 8 + len));
    buf.writeUInt32BE(crc, 8 + len);
    return buf;
  }

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR Chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8-bit depth
  ihdrData[9] = 6; // RGBA color type
  ihdrData[10] = 0; // Compression
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // IDAT Chunk
  const idatChunk = makeChunk('IDAT', deflated);

  // IEND Chunk
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Drawing ChefMatch Icon with golden-amber background and emblem
function drawChefMatchIcon(x, y, w, h, isMaskable = false) {
  const cx = w / 2;
  const cy = h / 2;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Background: Amber gradient (#f59e0b to #d97706)
  const gradT = (x + y) / (w + h);
  let bgR = Math.round(245 - gradT * 28);
  let bgG = Math.round(158 - gradT * 39);
  let bgB = Math.round(11 - gradT * 5);

  // Outer corner rounding for non-maskable icons
  if (!isMaskable) {
    const cornerRadius = w * 0.22;
    const rx = Math.abs(dx) - (w / 2 - cornerRadius);
    const ry = Math.abs(dy) - (h / 2 - cornerRadius);
    if (rx > 0 && ry > 0 && Math.sqrt(rx * rx + ry * ry) > cornerRadius) {
      return [0, 0, 0, 0]; // Transparent outside squircle
    }
  }

  // Inner Plate Circle
  const plateRadius = isMaskable ? w * 0.32 : w * 0.36;
  if (dist <= plateRadius) {
    // White plate
    if (dist >= plateRadius - 3) {
      return [240, 240, 240, 255]; // Subtle rim
    }

    // Chef hat / initials inside
    const hatWidth = plateRadius * 0.9;
    const hatHeight = plateRadius * 0.7;
    
    // Central emblem symbol in warm amber
    const symbolDist = Math.sqrt(dx * dx + (dy + 5) * (dy + 5));
    if (symbolDist < plateRadius * 0.6) {
      // Amber emblem
      return [217, 119, 6, 255];
    }
    
    // Hat base band
    if (Math.abs(dx) < hatWidth * 0.65 && dy > hatHeight * 0.25 && dy < hatHeight * 0.55) {
      return [245, 158, 11, 255];
    }

    return [255, 255, 255, 255];
  }

  return [bgR, bgG, bgB, 255];
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate PWA Icons
console.log('Generating PWA icons...');

const icon192 = createPNG(192, 192, (x, y, w, h) => drawChefMatchIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), icon192);

const icon512 = createPNG(512, 512, (x, y, w, h) => drawChefMatchIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), icon512);

const iconMaskable = createPNG(512, 512, (x, y, w, h) => drawChefMatchIcon(x, y, w, h, true));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), iconMaskable);

const appleIcon = createPNG(180, 180, (x, y, w, h) => drawChefMatchIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleIcon);

console.log('All PWA icons generated successfully in public/');
