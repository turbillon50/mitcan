#!/usr/bin/env python3
"""Extract the CSN badge from the orange JPEG into a transparent PNG.

Source: icons/IMG_5309.jpeg — brown shield badge on bright-orange gradient.
Output: assets/logo-badge.png — alpha-isolated badge, square canvas, trimmed.

Strategy: 4-corner flood fill against the bright orange background with a
loose threshold; everything contiguous and orange-ish becomes transparent.
The white outline of the badge stops the flood. Then trim to the badge
bounding box and pad to square.
"""
from PIL import Image, ImageDraw, ImageFilter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "icons" / "IMG_5309.jpeg"
OUT_BADGE = ROOT / "assets" / "logo-badge.png"
OUT_BADGE_SM = ROOT / "assets" / "logo-badge-sm.png"


def main():
    img = Image.open(SRC).convert("RGBA")
    w, h = img.size

    # Flood-fill the 4 corners with transparent against the orange background.
    transparent = (0, 0, 0, 0)
    for corner in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
        ImageDraw.floodfill(img, corner, transparent, thresh=70)

    # Crop to the bounding box of remaining (non-transparent) pixels.
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)

    # Pad to square so it composes cleanly on any background.
    w, h = img.size
    side = max(w, h)
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    canvas.paste(img, ((side - w) // 2, (side - h) // 2), img)

    # Soften edge artifacts left by JPEG compression.
    canvas.alpha_composite(canvas.filter(ImageFilter.GaussianBlur(0.4)))

    canvas.save(OUT_BADGE, "PNG", optimize=True)
    canvas.resize((256, 256), Image.LANCZOS).save(OUT_BADGE_SM, "PNG", optimize=True)
    print(f"wrote {OUT_BADGE.relative_to(ROOT)} ({canvas.size[0]}x{canvas.size[1]})")
    print(f"wrote {OUT_BADGE_SM.relative_to(ROOT)} (256x256)")


if __name__ == "__main__":
    main()
