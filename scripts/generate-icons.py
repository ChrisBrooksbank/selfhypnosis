import struct
import zlib
import os


def make_png(w: int, h: int, r: int, g: int, b: int) -> bytes:
    def chunk(tag: bytes, data: bytes) -> bytes:
        crc = zlib.crc32(tag + data) & 0xFFFFFFFF
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", crc)

    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0)
    row = bytes([0] + [r, g, b] * w)
    raw = row * h
    idat = chunk(b"IDAT", zlib.compress(raw))
    return sig + chunk(b"IHDR", ihdr) + idat + chunk(b"IEND", b"")


os.makedirs("public/icons", exist_ok=True)
for size in [192, 384, 512]:
    data = make_png(size, size, 99, 102, 241)
    path = f"public/icons/icon-{size}.png"
    with open(path, "wb") as f:
        f.write(data)
    print(f"Created {path} ({len(data)} bytes)")
