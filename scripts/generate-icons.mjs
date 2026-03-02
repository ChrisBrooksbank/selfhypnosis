import fs from 'fs';
import zlib from 'zlib';

function createPNG(width, height, r, g, b) {
    const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(height, 4);
    ihdr[8] = 8;
    ihdr[9] = 2;
    ihdr[10] = 0;
    ihdr[11] = 0;
    ihdr[12] = 0;

    const rowSize = 1 + width * 3;
    const raw = Buffer.alloc(rowSize * height);
    for (let y = 0; y < height; y++) {
        const rowStart = y * rowSize;
        raw[rowStart] = 0;
        for (let x = 0; x < width; x++) {
            raw[rowStart + 1 + x * 3] = r;
            raw[rowStart + 1 + x * 3 + 1] = g;
            raw[rowStart + 1 + x * 3 + 2] = b;
        }
    }
    const compressed = zlib.deflateSync(raw);

    function crc32(buf) {
        let crc = 0xffffffff;
        for (let i = 0; i < buf.length; i++) {
            crc ^= buf[i];
            for (let j = 0; j < 8; j++) crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
        }
        return (crc ^ 0xffffffff) >>> 0;
    }

    function chunk(type, data) {
        const len = Buffer.alloc(4);
        len.writeUInt32BE(data.length, 0);
        const t = Buffer.from(type, 'ascii');
        const crcVal = Buffer.alloc(4);
        crcVal.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
        return Buffer.concat([len, t, data, crcVal]);
    }

    return Buffer.concat([
        sig,
        chunk('IHDR', ihdr),
        chunk('IDAT', compressed),
        chunk('IEND', Buffer.alloc(0)),
    ]);
}

// Brand color #6366f1 = rgb(99, 102, 241)
const r = 99,
    g = 102,
    b = 241;
for (const size of [192, 384, 512]) {
    const png = createPNG(size, size, r, g, b);
    fs.writeFileSync(`public/icons/icon-${size}.png`, png);
    console.log(`Created icon-${size}.png (${png.length} bytes)`);
}
