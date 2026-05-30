#!/usr/bin/env python3
"""Generate brand-tinted QR assets for the CSN PWA.

QR code uses CSN orange on a deep coffee background with the real CSN
badge composited at the center as a knockout. ERROR_CORRECT_H gives
~30% redundancy so the centered badge does not break readability.
"""
import qrcode
from qrcode.constants import ERROR_CORRECT_H
from PIL import Image, ImageDraw, ImageFilter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets"
BADGE_SRC = ROOT / "assets" / "logo-badge.png"

PAYLOAD = "CSN-CLUB-LUIS-2450"
ORANGE = (255, 183, 125)
BG = (14, 14, 14)


def make_qr(size_px: int, with_logo: bool = True) -> Image.Image:
    qr = qrcode.QRCode(
        version=None,
        error_correction=ERROR_CORRECT_H,
        box_size=10,
        border=2,
    )
    qr.add_data(PAYLOAD)
    qr.make(fit=True)
    img = qr.make_image(fill_color=ORANGE, back_color=BG).convert("RGBA")
    img = img.resize((size_px, size_px), Image.LANCZOS)

    if with_logo:
        # Black knockout panel for legibility.
        box = int(size_px * 0.26)
        x = (size_px - box) // 2
        y = (size_px - box) // 2
        draw = ImageDraw.Draw(img)
        draw.rounded_rectangle(
            (x, y, x + box, y + box),
            radius=int(box * 0.20),
            fill=(0, 0, 0, 255),
        )
        draw.rounded_rectangle(
            (x, y, x + box, y + box),
            radius=int(box * 0.20),
            outline=(255, 140, 0),
            width=max(1, size_px // 256),
        )
        # Place the real badge inside.
        badge = Image.open(BADGE_SRC).convert("RGBA")
        inner = int(box * 0.84)
        bw, bh = badge.size
        scale = inner / max(bw, bh)
        new = (max(1, int(bw * scale)), max(1, int(bh * scale)))
        badge = badge.resize(new, Image.LANCZOS)
        bx = x + (box - badge.width) // 2
        by = y + (box - badge.height) // 2
        img.paste(badge, (bx, by), badge)

    return img.convert("RGB")


for name, size, logo in [
    ("qr-membership.png", 600, True),
    ("qr-membership-sm.png", 160, False),
]:
    img = make_qr(size, logo)
    img.save(OUT / name, "PNG", optimize=True)
    print(f"wrote assets/{name} ({img.size[0]}x{img.size[1]})")
