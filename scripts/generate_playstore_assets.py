"""Builds the Play Store listing art from raw device captures.

    screenshots/<name>.png            raw 1080x2340 captures (see SLIDES for the names)
    playstore_assets/mockups/         1080x1920 phone screenshots, in listing order
    playstore_assets/feature_graphic/ 1024x500 feature graphic

Run from the repo root: python3 scripts/generate_playstore_assets.py

The eight screenshots are slices of one panorama: a ribbon runs through all of them, the phones
tilt along it, and a few UI cards sit across the seams, so swiping the listing reads as one piece.
Flat, like the app: warm paper, ink, one lime fill. No shadows, glows or gradients.
"""
import math
import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IN_DIR = os.path.join(ROOT, "screenshots")
OUT_MOCKUPS = os.path.join(ROOT, "playstore_assets", "mockups")
OUT_FEATURE = os.path.join(ROOT, "playstore_assets", "feature_graphic")
FONTS = os.path.join(ROOT, "assets", "fonts", "MuseoModerno")

PAPER = (245, 244, 238)
INK = (22, 22, 18)
LIME = (0, 204, 106)
MUTED = (107, 106, 99)

SS = 2  # supersample, then downscale: smooth edges on tilted phones and type
W, H = 1080, 1920

THEMES = {
    "paper": dict(bg=PAPER, text=INK, sub=MUTED, mark=LIME, mark_text=INK, frame=INK, ribbon=LIME, dot=INK),
    # On ink the device needs a lighter body, or it disappears into the background.
    "ink": dict(bg=INK, text=PAPER, sub=(168, 167, 158), mark=LIME, mark_text=INK, frame=(58, 58, 51), ribbon=LIME, dot=PAPER),
    "lime": dict(bg=LIME, text=INK, sub=(14, 72, 42), mark=INK, mark_text=PAPER, frame=INK, ribbon=PAPER, dot=INK),
}

# capture, headline lines of (text, marked), supporting line, theme, phone tilt in degrees
SLIDES = [
    ("home", [[("Know where", False)], [("you ", False), ("stand", True)]], "Every account and currency in one calm place.", "paper", -7),
    ("analytics", [[("See where", False)], [("it ", False), ("goes", True)]], "Trends and category breakdowns, built in.", "ink", 6),
    ("add_transaction", [[("Log it in", False)], [("seconds", True)]], "Expense, income or transfer. A few taps and it's done.", "paper", -5),
    ("transaction_detail", [[("Every ", False), ("entry", True)], [("in detail", False)]], "Account, category, date and note — always to hand.", "lime", 7),
    ("loans", [[("Track who", False)], [("owes ", True), ("who", False)]], "Lent or borrowed, with due dates and repayments.", "paper", -6),
    ("person_detail", [[("Money with", False)], [("people", True), (", sorted", False)]], "See what you've spent, received and lent, per person.", "ink", 5),
    ("cloud_backup", [[("Backed up", True)], [("automatically", False)]], "Private, encrypted backups to your own Google Drive.", "paper", -7),
    ("onboarding", [[("Set up in", False)], [("a ", False), ("minute", True)]], "Private by design. Works fully offline.", "lime", 6),
]

# UI cards cut from a capture and laid across a seam: (capture, crop box, corner radius, seam after
# slide n, centre y, width, tilt). Each sits where both neighbouring backgrounds contrast with it.
FLOATERS = [
    ("home", (42, 320, 1038, 1012), 70, 2, 1690, 400, -9),
    ("home", (42, 1372, 520, 1820), 60, 4, 1560, 300, 10),
    ("loans", (43, 1000, 1034, 1489), 60, 6, 1700, 430, -8),
]


def font(weight, size):
    return ImageFont.truetype(os.path.join(FONTS, f"MuseoModerno-{weight}.ttf"), size)


def capture(name):
    return os.path.join(IN_DIR, f"{name}.png")


def rounded(im, radius):
    mask = Image.new("L", im.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, im.width - 1, im.height - 1], radius=radius, fill=255)
    out = im.convert("RGBA")
    out.putalpha(mask)
    return out


def phone(shot_path, width, frame=INK, tilt=0):
    """A flat device around a capture, `width` px wide before tilting."""
    shot = Image.open(shot_path).convert("RGB")
    bezel = round(width * 0.028)
    sw = width - 2 * bezel
    sh = round(sw * shot.height / shot.width)
    body = Image.new("RGBA", (width, sh + 2 * bezel), (0, 0, 0, 0))
    ImageDraw.Draw(body).rounded_rectangle([0, 0, width - 1, body.height - 1], radius=round(width * 0.105), fill=frame)
    screen = rounded(shot.resize((sw, sh), Image.LANCZOS), round(width * 0.08))
    body.paste(screen, (bezel, bezel), screen)
    return body.rotate(tilt, resample=Image.BICUBIC, expand=True) if tilt else body


def paste_centered(canvas, im, cx, cy):
    canvas.paste(im, (round(cx - im.width / 2), round(cy - im.height / 2)), im)


def ribbon_y(x, points):
    """Cosine-eased height of the ribbon's centre line at x."""
    for (x1, y1), (x2, y2) in zip(points, points[1:]):
        if x1 <= x <= x2:
            t = (1 - math.cos((x - x1) / (x2 - x1) * math.pi)) / 2
            return y1 + (y2 - y1) * t
    return points[-1][1]


def ribbon_mask(size, points, thickness):
    mask = Image.new("L", size, 0)
    d = ImageDraw.Draw(mask)
    r = thickness / 2
    for x in range(-int(r), size[0] + int(r), max(2, int(r / 12))):
        y = ribbon_y(x, points)
        d.ellipse([x - r, y - r, x + r, y + r], fill=255)
    return mask


def headline(draw, lines, y, f, th, x0, width):
    """Centred lines. A marked run sits on a block — lime is a fill, never type."""
    for runs in lines:
        total = sum(draw.textlength(t, font=f) for t, _ in runs)
        cx = x0 + (width - total) / 2
        for t, marked in runs:
            w = draw.textlength(t, font=f)
            if marked:
                lead = draw.textlength(t[: len(t) - len(t.lstrip())], font=f)
                cw = draw.textlength(t.strip(), font=f)
                pad = round(f.size * 0.16)
                draw.rounded_rectangle([cx + lead - pad, y + round(f.size * 0.26), cx + lead + cw + pad, y + round(f.size * 1.2)], radius=round(f.size * 0.3), fill=th["mark"])
            draw.text((cx, y), t, font=f, fill=th["mark_text"] if marked else th["text"])
            cx += w
        y += round(f.size * 1.22)
    return y


def wrap(draw, text, f, max_w):
    lines, cur = [], ""
    for word in text.split():
        trial = f"{cur} {word}".strip()
        if draw.textlength(trial, font=f) <= max_w:
            cur = trial
        else:
            lines.append(cur)
            cur = word
    return lines + [cur]


def make_mockups():
    slides = [s for s in SLIDES if os.path.exists(capture(s[0]))]
    for s in SLIDES:
        if s not in slides:
            print(f"  skip {s[0]}: screenshots/{s[0]}.png not found")
    if not slides:
        return
    n = len(slides)
    sw, sh = W * SS, H * SS
    pano = Image.new("RGB", (sw * n, sh), PAPER)
    d = ImageDraw.Draw(pano)

    # Backgrounds, then the ribbon: one line through every slide, recoloured per background.
    points = [(-sw, 1500 * SS)] + [(i * sw + sw // 2, (1180 if i % 2 else 1520) * SS) for i in range(n)] + [((n + 1) * sw, 1300 * SS)]
    mask = ribbon_mask(pano.size, points, 250 * SS)
    for i, (_, _, _, theme, _) in enumerate(slides):
        th = THEMES[theme]
        box = (i * sw, 0, (i + 1) * sw, sh)
        d.rectangle(box, fill=th["bg"])
        pano.paste(Image.new("RGB", (sw, sh), th["ribbon"]), box[:2], mask.crop(box))

    f_head, f_sub = font("Bold", 92 * SS), font("Medium", 35 * SS)
    for i, (name, lines, sub, theme, tilt) in enumerate(slides):
        th = THEMES[theme]
        x0 = i * sw
        y = headline(d, lines, 92 * SS, f_head, th, x0, sw) + 24 * SS
        for line in wrap(d, sub, f_sub, sw - 200 * SS):
            d.text((x0 + (sw - d.textlength(line, font=f_sub)) / 2, y), line, font=f_sub, fill=th["sub"])
            y += round(f_sub.size * 1.4)
        # The phone rides the ribbon and bleeds off the bottom, so the screen stays large.
        device = phone(capture(name), 720 * SS, th["frame"], tilt)
        cx = x0 + sw / 2 + (26 if tilt < 0 else -26) * SS
        paste_centered(pano, device, cx, y + 70 * SS + device.height / 2)

    for name, box, radius, seam, cy, width, tilt in FLOATERS:
        if seam >= n or not os.path.exists(capture(name)):
            continue
        card = Image.open(capture(name)).convert("RGB").crop(box)
        scale = width * SS / card.width
        card = rounded(card.resize((round(card.width * scale), round(card.height * scale)), Image.LANCZOS), round(radius * scale))
        paste_centered(pano, card.rotate(tilt, resample=Image.BICUBIC, expand=True), seam * sw, cy * SS)

    for i, (name, *_rest) in enumerate(slides):
        out = os.path.join(OUT_MOCKUPS, f"{i + 1:02d}_{name}.png")
        pano.crop((i * sw, 0, (i + 1) * sw, sh)).resize((W, H), Image.LANCZOS).save(out, optimize=True)
        print(f"  {os.path.relpath(out, ROOT)}")
    preview = os.path.join(OUT_MOCKUPS, "_panorama_preview.jpg")
    pano.resize((W * n // 4, H // 4), Image.LANCZOS).save(preview, quality=88)
    print(f"  {os.path.relpath(preview, ROOT)}")


def make_feature_graphic():
    names = ("analytics", "home", "loans")
    if not all(os.path.exists(capture(n)) for n in names):
        print("  skip feature graphic: needs the home, analytics and loans captures")
        return
    fw, fh = 1024 * SS, 500 * SS
    canvas = Image.new("RGB", (fw, fh), INK)
    d = ImageDraw.Draw(canvas)

    # The ribbon rises from below the copy (never behind it) and sweeps under the fan of phones.
    points = [(-200 * SS, 590 * SS), (360 * SS, 560 * SS), (660 * SS, 270 * SS), (1100 * SS, 120 * SS)]
    canvas.paste(Image.new("RGB", (fw, fh), LIME), (0, 0), ribbon_mask((fw, fh), points, 150 * SS))

    f_brand = font("Bold", 96 * SS)
    x, y = 60 * SS, 66 * SS
    d.text((x, y), "Fintraq", font=f_brand, fill=PAPER)
    d.text((x + d.textlength("Fintraq", font=f_brand), y), ".", font=f_brand, fill=LIME)
    f_tag = font("SemiBold", 37 * SS)
    d.text((x, y + 136 * SS), "Your money,", font=f_tag, fill=PAPER)
    d.text((x, y + 182 * SS), "calm and clear.", font=f_tag, fill=PAPER)
    f_note = font("Medium", 20 * SS)
    d.text((x, y + 252 * SS), "Private  ·  Offline-first  ·  Multi-currency", font=f_note, fill=(168, 167, 158))

    frame = (58, 58, 51)
    paste_centered(canvas, phone(capture("analytics"), 210 * SS, frame, 14), 610 * SS, 350 * SS)
    paste_centered(canvas, phone(capture("loans"), 210 * SS, frame, -14), 930 * SS, 350 * SS)
    paste_centered(canvas, phone(capture("home"), 250 * SS, frame, 0), 770 * SS, 330 * SS)

    out = os.path.join(OUT_FEATURE, "feature_graphic.png")
    canvas.resize((1024, 500), Image.LANCZOS).save(out, optimize=True)
    print(f"  {os.path.relpath(out, ROOT)}")


def main():
    os.makedirs(OUT_MOCKUPS, exist_ok=True)
    os.makedirs(OUT_FEATURE, exist_ok=True)
    print("Mockups:")
    make_mockups()
    print("Feature graphic:")
    make_feature_graphic()


if __name__ == "__main__":
    main()
