#!/usr/bin/env python3
"""Generate a distinct icon set for the CSN Admin PWA (orange→red, 'CSN ADMIN')."""
from PIL import Image, ImageDraw, ImageFont

OUT = "public/icons"
TOP = (255, 140, 0)      # #ff8c00
BOTTOM = (204, 43, 24)   # #cc2b18
WHITE = (255, 246, 238)

def font(size, bold=True):
    paths = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold
        else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    for p in paths:
        try:
            return ImageFont.truetype(p, size)
        except Exception:
            continue
    return ImageFont.load_default()

def gradient(size):
    img = Image.new("RGB", (size, size))
    px = img.load()
    for y in range(size):
        t = y / (size - 1)
        r = int(TOP[0] + (BOTTOM[0] - TOP[0]) * t)
        g = int(TOP[1] + (BOTTOM[1] - TOP[1]) * t)
        b = int(TOP[2] + (BOTTOM[2] - TOP[2]) * t)
        for x in range(size):
            px[x, y] = (r, g, b)
    return img

def centered_text(draw, cx, y, text, fnt, fill, spacing=0):
    if spacing:
        # manual letter spacing
        widths = [draw.textbbox((0, 0), ch, font=fnt)[2] for ch in text]
        total = sum(widths) + spacing * (len(text) - 1)
        x = cx - total / 2
        for ch, w in zip(text, widths):
            draw.text((x, y), ch, font=fnt, fill=fill)
            x += w + spacing
    else:
        bbox = draw.textbbox((0, 0), text, font=fnt)
        draw.text((cx - (bbox[2] - bbox[0]) / 2, y), text, font=fnt, fill=fill)

def make(size, safe=False):
    img = gradient(size)
    d = ImageDraw.Draw(img)
    cx = size / 2
    pad = size * (0.16 if safe else 0.10)

    # shield outline
    sw = size * 0.30
    sh = size * 0.34
    top = size * (0.22 if not safe else 0.26)
    left = cx - sw / 2
    right = cx + sw / 2
    d.line(
        [(left, top), (right, top), (right, top + sh * 0.55),
         (cx, top + sh), (left, top + sh * 0.55), (left, top)],
        fill=WHITE, width=max(3, size // 42), joint="curve",
    )
    # check mark inside shield
    d.line(
        [(cx - sw * 0.22, top + sh * 0.42),
         (cx - sw * 0.02, top + sh * 0.62),
         (cx + sw * 0.30, top + sh * 0.22)],
        fill=WHITE, width=max(3, size // 38), joint="curve",
    )

    centered_text(d, cx, top + sh + size * 0.06, "CSN", font(int(size * 0.20)), WHITE)
    centered_text(d, cx, top + sh + size * 0.28, "ADMIN",
                  font(int(size * 0.10)), WHITE, spacing=int(size * 0.02))
    return img

for name, size, safe in [
    ("icon-admin-192.png", 192, False),
    ("icon-admin-512.png", 512, False),
    ("icon-admin-maskable-512.png", 512, True),
    ("apple-touch-icon-admin-180.png", 180, False),
]:
    make(size, safe).save(f"{OUT}/{name}")
    print("wrote", name)
