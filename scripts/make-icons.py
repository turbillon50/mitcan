#!/usr/bin/env python3
"""Generate CSN PWA icons using the real CSN badge logo.

Composites assets/logo-badge.png onto a premium dark canvas with a soft
orange ambient glow. Produces icons at all sizes the manifest needs,
including a maskable variant with a generous safe area.
"""
from PIL import Image, ImageDraw, ImageFilter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "icons"
BADGE_SRC = ROOT / "assets" / "logo-badge.png"
OUT.mkdir(parents=True, exist_ok=True)

BG = (10, 10, 10)
GLOW = (60, 28, 0)


def make_icon(size: int, maskable: bool = False) -> Image.Image:
    img = Image.new("RGB", (size, size), BG)

    # Soft orange ambient glow centered.
    glow = Image.new("RGB", (size, size), BG)
    gd = ImageDraw.Draw(glow)
    cx, cy = size // 2, size // 2
    r = int(size * 0.46)
    gd.ellipse((cx - r, cy - r, cx + r, cy + r), fill=GLOW)
    glow = glow.filter(ImageFilter.GaussianBlur(radius=size * 0.08))
    img = Image.blend(img, glow, 0.95)

    # Subtle rounded border for non-maskable icons (UI-only hint).
    draw = ImageDraw.Draw(img)
    if not maskable:
        margin = int(size * 0.08)
        draw.rounded_rectangle(
            (margin, margin, size - margin, size - margin),
            radius=int(size * 0.22),
            outline=(40, 40, 40),
            width=max(1, size // 128),
        )

    # Place the badge centered. Maskable icons need a tighter safe area
    # so that platform crops don't clip the badge.
    safe = 0.78 if not maskable else 0.62
    badge_max = int(size * safe)
    badge = Image.open(BADGE_SRC).convert("RGBA")
    bw, bh = badge.size
    scale = badge_max / max(bw, bh)
    new_size = (max(1, int(bw * scale)), max(1, int(bh * scale)))
    badge = badge.resize(new_size, Image.LANCZOS)

    # Cast a warm shadow underneath the badge so it lifts off the canvas.
    shadow = Image.new("RGBA", img.size, (0, 0, 0, 0))
    shadow.paste(badge, ((size - badge.width) // 2, (size - badge.height) // 2 + int(size * 0.012)))
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=size * 0.018))
    rgba = img.convert("RGBA")
    rgba.alpha_composite(shadow)
    rgba.paste(badge, ((size - badge.width) // 2, (size - badge.height) // 2), badge)

    return rgba.convert("RGB")


SIZES = {
    "icon-192.png": (192, False),
    "icon-512.png": (512, False),
    "icon-maskable-512.png": (512, True),
    "apple-touch-icon-180.png": (180, False),
    "favicon-32.png": (32, False),
    "favicon-16.png": (16, False),
}

for name, (size, maskable) in SIZES.items():
    make_icon(size, maskable).save(OUT / name, "PNG", optimize=True)
    print(f"wrote {name}")

# SVG favicon references the badge PNG so any future logo swap propagates.
svg = """<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'>
  <rect width='64' height='64' rx='14' fill='#0a0a0a'/>
  <circle cx='32' cy='32' r='22' fill='#3a1c00' opacity='0.7'/>
  <image href='/assets/logo-badge-sm.png' x='8' y='12' width='48' height='40' preserveAspectRatio='xMidYMid meet'/>
</svg>"""
(OUT / "favicon.svg").write_text(svg)
print("wrote favicon.svg")
