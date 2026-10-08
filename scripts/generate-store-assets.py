#!/usr/bin/env python3
"""
Draws the store's pictures from the phone screenshots in store/raw:

  store/play/01-…png        Google Play screenshots, 1080 x 1920 (Play refuses anything taller than 2:1,
                            so a raw 1080 x 2340 capture cannot be uploaded as it is)
  store/feature-graphic.png Google Play feature graphic, 1024 x 500
  store/mockups/…png        each screen in a phone frame on a clear ground, and three together

    python3 scripts/generate-store-assets.py      (needs Pillow)

The screenshots are taken on the phone with demo data (Developer, Add demo data), in light mode,
with the status bar cleaned (`adb shell am broadcast -a com.android.systemui.demo …`). Colours,
the typeface and the mark are the design system's; the headlines are in HEADLINES below.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / 'store' / 'raw'
OUT = ROOT / 'store'
FONTS = ROOT / 'assets' / 'fonts' / 'ProzaLibre'

# design/tokens/colors.ts
INK = (0, 0, 0)
WHITE = (255, 255, 255)
PAGE = (241, 241, 241)
BRAND_DEEP = (1, 106, 77)
BRAND = (17, 182, 122)
BRAND_BRIGHT = (108, 245, 121)
PASTEL = {'lilac': (165, 158, 254), 'pink': (244, 183, 238), 'orange': (251, 179, 105), 'teal': (159, 233, 224), 'green': (108, 245, 121)}

# Each Play screenshot: the capture, the line over it, and its ground ('waves' is the launch screen's).
HEADLINES = [
    ('home', 'Know where your\nmoney goes', 'waves'),
    ('add', 'Add an expense\nin seconds', 'lilac'),
    ('accounts', 'Every account,\nevery currency', 'orange'),
    ('insights-30b', 'See where the\nmonth is heading', 'teal'),
    ('insights-30c', 'Know what\nyou spend on', 'pink'),
    ('loan', 'Lent or borrowed,\nnever forgotten', 'green'),
    ('activity', 'Everything you\nrecorded, in one list', 'page'),
]

SS = 2  # everything is drawn at twice its size and reduced, for clean edges


def font(weight, size):
    return ImageFont.truetype(str(FONTS / f'ProzaLibre_{weight}.ttf'), size)


def cubic(p0, p1, p2, p3, steps=40):
    pts = []
    for i in range(steps + 1):
        t = i / steps
        a, b, c, d = (1 - t) ** 3, 3 * (1 - t) ** 2 * t, 3 * (1 - t) * t ** 2, t ** 3
        pts.append((a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]))
    return pts


def waves(w, h):
    """The launch screen's ground (design/components/WaveField.tsx), at any size."""
    im = Image.new('RGB', (w, h), BRAND)
    d = ImageDraw.Draw(im)
    p = lambda x, y: (x * w, y * h)
    deep = cubic(p(0.26, 0), p(0.5, 0.17), p(0.78, 0.06), p(1, 0.27)) + [p(1, 0)]
    d.polygon(deep, fill=BRAND_DEEP)
    bright = [p(0, 1), p(0, 0.84)] + cubic(p(0, 0.84), p(0.16, 0.75), p(0.3, 0.91), p(0.48, 0.84)) + cubic(p(0.48, 0.84), p(0.68, 0.76), p(0.82, 0.85), p(1, 0.7)) + [p(1, 1)]
    d.polygon(bright, fill=BRAND_BRIGHT)
    return im


def ground(kind, w, h):
    if kind == 'waves':
        return waves(w, h)
    return Image.new('RGB', (w, h), PAGE if kind == 'page' else PASTEL[kind])


def phone(shot, width):
    """A screenshot in a plain black phone frame, `width` across, on a clear ground."""
    bezel = round(width * 0.022)
    screen_w = width - 2 * bezel
    screen_h = round(screen_w * shot.height / shot.width)
    height = screen_h + 2 * bezel
    outer = round(width * 0.105)
    inner = outer - bezel
    frame = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    ImageDraw.Draw(frame).rounded_rectangle((0, 0, width - 1, height - 1), radius=outer, fill=INK + (255,))
    screen = shot.convert('RGBA').resize((screen_w, screen_h), Image.LANCZOS)
    mask = Image.new('L', (screen_w, screen_h), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, screen_w - 1, screen_h - 1), radius=inner, fill=255)
    frame.paste(screen, (bezel, bezel), mask)
    # The front camera, as on the phone the shots were taken with.
    r = round(width * 0.014)
    cx, cy = width // 2, bezel + round(screen_h * 0.0205)
    ImageDraw.Draw(frame).ellipse((cx - r, cy - r, cx + r, cy + r), fill=INK + (255,))
    return frame


def mark(width):
    """The app's mark, cut from the splash image the brand script draws."""
    im = Image.open(ROOT / 'assets' / 'images' / 'splash.png').convert('RGBA')
    im = im.crop(im.getbbox())
    return im.resize((width, round(width * im.height / im.width)), Image.LANCZOS)


def centred_text(draw, text, f, cx, top, fill, leading):
    y = top
    for line in text.split('\n'):
        w = draw.textlength(line, font=f)
        draw.text((cx - w / 2, y), line, font=f, fill=fill)
        y += leading
    return y


def play_screenshot(name, headline, kind):
    W, H = 1080 * SS, 1920 * SS
    im = ground(kind, W, H)
    d = ImageDraw.Draw(im)
    bottom = centred_text(d, headline, font('700Bold', 84 * SS), W / 2, 120 * SS, INK, 104 * SS)
    device = phone(Image.open(RAW / f'{name}.png'), 820 * SS)
    # The phone runs off the foot of the picture, so the screen is as large as it can be.
    im.paste(device, ((W - device.width) // 2, bottom + 70 * SS), device)
    return im.resize((1080, 1920), Image.LANCZOS)


def feature_graphic():
    W, H = 1024 * SS, 500 * SS
    im = waves(W, H)
    d = ImageDraw.Draw(im)
    m = mark(84 * SS)
    left = 80 * SS
    im.paste(m, (left, 96 * SS), m)
    d.text((left + m.width + 28 * SS, 96 * SS + (m.height - 78 * SS) // 2 - 6 * SS), 'Fintraq', font=font('700Bold', 78 * SS), fill=INK)
    y = 96 * SS + m.height + 44 * SS
    for line in ('Know where your', 'money goes'):
        d.text((left, y), line, font=font('700Bold', 50 * SS), fill=INK)
        y += 62 * SS
    d.text((left, y + 14 * SS), 'Free to record. Private by design.', font=font('500Medium', 26 * SS), fill=INK)
    device = phone(Image.open(RAW / 'home.png'), 300 * SS)
    im.paste(device, (W - device.width - 110 * SS, 56 * SS), device)
    return im.resize((1024, 500), Image.LANCZOS)


def trio():
    """Three phones together on the grey page, for a website or a post."""
    W, H = 2400, 1600
    im = Image.new('RGB', (W, H), PAGE)
    side = 560
    for name, x, y, width in (('insights-30c', 300, 330, side), ('add', W - 300 - side, 330, side), ('home', (W - 640) // 2, 160, 640)):
        device = phone(Image.open(RAW / f'{name}.png'), width)
        im.paste(device, (x, y), device)
    return im


def main():
    (OUT / 'play').mkdir(parents=True, exist_ok=True)
    (OUT / 'mockups').mkdir(parents=True, exist_ok=True)
    for i, (name, headline, kind) in enumerate(HEADLINES, 1):
        play_screenshot(name, headline, kind).save(OUT / 'play' / f'{i:02d}-{name}.png', optimize=True)
    feature_graphic().save(OUT / 'feature-graphic.png', optimize=True)
    for shot in sorted(RAW.glob('*.png')):
        phone(Image.open(shot), 900).save(OUT / 'mockups' / shot.name, optimize=True)
    trio().save(OUT / 'mockups' / 'three-phones.jpg', quality=92)
    print('store/play, store/feature-graphic.png and store/mockups written')


if __name__ == '__main__':
    main()
