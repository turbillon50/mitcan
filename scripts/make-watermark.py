#!/usr/bin/env python3
"""Generate hero watermark assets from the CSN badge.

Outputs:
- assets/logo-watermark.png   1600px, alpha ~22% — for big hero backdrops.
- assets/logo-hero.png        900px,  full alpha — sharp display logo.
"""
from PIL import Image
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets" / "logo-badge.png"
OUT = ROOT / "assets"


def main():
    src = Image.open(SRC).convert("RGBA")

    # Sharp hero logo (full color, big).
    hero = src.copy()
    hero.thumbnail((900, 900), Image.LANCZOS)
    hero.save(OUT / "logo-hero.png", "PNG", optimize=True)
    print(f"wrote assets/logo-hero.png ({hero.size[0]}x{hero.size[1]})")

    # Watermark (large + low alpha so it sits as a backdrop).
    wm = src.copy()
    wm.thumbnail((1600, 1600), Image.LANCZOS)
    r, g, b, a = wm.split()
    a = a.point(lambda px: int(px * 0.22))
    wm = Image.merge("RGBA", (r, g, b, a))
    wm.save(OUT / "logo-watermark.png", "PNG", optimize=True)
    print(f"wrote assets/logo-watermark.png ({wm.size[0]}x{wm.size[1]})")


if __name__ == "__main__":
    main()
