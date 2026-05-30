#!/usr/bin/env python3
"""Generate CSN PWA icons (CSN monogram on premium black, orange glow)."""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "icons"
OUT.mkdir(parents=True, exist_ok=True)

BG = (10, 10, 10)
ORANGE = (255, 140, 0)
ORANGE_BRIGHT = (255, 183, 125)


def find_font(size: int) -> ImageFont.FreeTypeFont:
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
        "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf",
    ]
    for path in candidates:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def make_icon(size: int, maskable: bool = False) -> Image.Image:
    img = Image.new("RGB", (size, size), BG)
    glow = Image.new("RGB", (size, size), BG)
    gd = ImageDraw.Draw(glow)
    cx, cy = size // 2, size // 2
    r = int(size * 0.45)
    gd.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(60, 28, 0))
    glow = glow.filter(ImageFilter.GaussianBlur(radius=size * 0.08))
    img = Image.blend(img, glow, 0.9)

    draw = ImageDraw.Draw(img)
    if not maskable:
        margin = int(size * 0.08)
        draw.rounded_rectangle(
            (margin, margin, size - margin, size - margin),
            radius=int(size * 0.22),
            outline=(40, 40, 40),
            width=max(1, size // 128),
        )

    # At tiny sizes use a dot; otherwise fit "CSN" to the safe area.
    if size < 32:
        text = "C"
    else:
        text = "CSN"
    safe = size * (0.78 if not maskable else 0.62)
    font_size = max(8, int(size * 0.5))
    font = find_font(font_size)
    while font_size > 6:
        font = find_font(font_size)
        bbox = draw.textbbox((0, 0), text, font=font)
        if (bbox[2] - bbox[0]) <= safe:
            break
        font_size -= 2
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    tx = (size - tw) // 2 - bbox[0]
    ty = (size - th) // 2 - bbox[1] - int(size * 0.02)

    # Glow under the wordmark
    layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    ld = ImageDraw.Draw(layer)
    ld.text((tx, ty), text, font=font, fill=(255, 140, 0, 200))
    layer = layer.filter(ImageFilter.GaussianBlur(radius=size * 0.025))
    img.paste(layer, (0, 0), layer)

    draw.text((tx, ty), text, font=font, fill=ORANGE_BRIGHT)
    return img


sizes = {
    "icon-192.png": (192, False),
    "icon-512.png": (512, False),
    "icon-maskable-512.png": (512, True),
    "apple-touch-icon-180.png": (180, False),
    "favicon-32.png": (32, False),
    "favicon-16.png": (16, False),
}

for name, (size, maskable) in sizes.items():
    make_icon(size, maskable).save(OUT / name, "PNG", optimize=True)
    print(f"wrote {name}")

svg = """<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'>
  <rect width='64' height='64' rx='14' fill='#0a0a0a'/>
  <circle cx='32' cy='32' r='22' fill='#3a1c00' opacity='0.7'/>
  <text x='50%' y='54%' text-anchor='middle' dominant-baseline='middle'
        font-family='Inter, Arial, sans-serif' font-weight='800' font-size='22'
        fill='#ffb77d'>CSN</text>
</svg>"""
(OUT / "favicon.svg").write_text(svg)
print("wrote favicon.svg")

