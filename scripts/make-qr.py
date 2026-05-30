#!/usr/bin/env python3
"""Generate brand-tinted QR assets for the MITCAN PWA.

QR-Code uses MITCAN orange on a deep coffee background with a centered
"M" knockout so the membership code is unmistakable.
"""
import qrcode
from qrcode.constants import ERROR_CORRECT_H
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "assets"
OUT.mkdir(parents=True, exist_ok=True)

PAYLOAD = "CSN-CLUB-LUIS-2450"
ORANGE = (255, 183, 125)
BG = (14, 14, 14)
BLACK = (0, 0, 0)


def find_font(size: int) -> ImageFont.FreeTypeFont:
    for p in [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
        "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf",
    ]:
        if Path(p).exists():
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def make_qr(size_px: int, with_logo: bool = True) -> Image.Image:
    qr = qrcode.QRCode(
        version=None,
        error_correction=ERROR_CORRECT_H,
        box_size=10,
        border=2,
    )
    qr.add_data(PAYLOAD)
    qr.make(fit=True)
    img = qr.make_image(fill_color=ORANGE, back_color=BG).convert("RGB")
    img = img.resize((size_px, size_px), Image.LANCZOS)
    if with_logo:
        # Knockout box with "M"
        box = int(size_px * 0.22)
        x = (size_px - box) // 2
        y = (size_px - box) // 2
        draw = ImageDraw.Draw(img)
        draw.rounded_rectangle((x, y, x + box, y + box), radius=int(box * 0.22), fill=BLACK)
        # 1px primary border
        draw.rounded_rectangle(
            (x, y, x + box, y + box),
            radius=int(box * 0.22),
            outline=(255, 140, 0),
            width=max(1, size_px // 256),
        )
        text = "CSN"
        target_w = int(box * 0.78)
        fs = int(box * 0.55)
        while fs > 8:
            font = find_font(fs)
            bbox = draw.textbbox((0, 0), text, font=font)
            if (bbox[2] - bbox[0]) <= target_w:
                break
            fs -= 2
        bbox = draw.textbbox((0, 0), text, font=font)
        tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
        tx = x + (box - tw) // 2 - bbox[0]
        ty = y + (box - th) // 2 - bbox[1] - int(box * 0.04)
        draw.text((tx, ty), text, font=font, fill=ORANGE)
    return img


for name, size, logo in [
    ("qr-membership.png", 600, True),
    ("qr-membership-sm.png", 160, False),
]:
    img = make_qr(size, logo)
    img.save(OUT / name, "PNG", optimize=True)
    print(f"wrote assets/{name} ({img.size[0]}x{img.size[1]})")
