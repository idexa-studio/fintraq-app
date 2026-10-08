#!/usr/bin/env python3
"""
Draws the store's pictures from the phone screenshots in store/raw:

  store/play/01-…png        Google Play screenshots, 1080 x 1920 (Play refuses anything taller than 2:1,
                            so a raw 1080 x 2340 capture cannot be uploaded as it is). They are cut from
                            one long picture, so the grounds and the lifted cards run on from each into the next.
  store/play-strip.jpg      that long picture, reduced, to look at
  store/feature-graphic.png Google Play feature graphic, 1024 x 500
  store/mockups/…png        each screen in a phone frame on a clear ground, and the phones
                            together: a fan, a cascade and the cards by themselves

    python3 scripts/generate-store-assets.py      (needs Pillow)

The screenshots are taken on the phone with demo data (Developer, Add demo data), in light mode,
with the status bar cleaned (`adb shell am broadcast -a com.android.systemui.demo …`). Colours,
the typeface and the mark are the design system's; the headlines are in HEADLINES below.
"""
from pathlib import Path
import math
from PIL import Image, ImageDraw, ImageFilter, ImageFont

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
PASTEL = {'lilac': (165, 158, 254), 'pink': (244, 183, 238), 'orange': (251, 179, 105), 'teal': (159, 233, 224), 'green': (108, 245, 121), 'blue': (172, 196, 247)}

# The cards lifted out of a screen: the capture, and roughly where the card is in it (snapped to its edge).
CARDS = {
    'balance': ('home', (48, 259, 1032, 823)),
    'stack': ('home-accounts', (48, 793, 1032, 1533)),
    'amount': ('add', (48, 454, 1032, 748)),
    'euro': ('accounts', (48, 503, 1032, 694)),
    'rupee': ('accounts', (48, 1507, 1032, 1893)),
    'forecast': ('insights-30b', (48, 427, 1032, 951)),
    'donut': ('insights-30b', (48, 1400, 1032, 2075)),
    'loan': ('loan', (48, 259, 1032, 949)),
    'day': ('activity', (48, 664, 1032, 1051)),
    'spending': ('insights-30c', (48, 690, 1032, 1160)),
}

# Each Play screenshot: the capture, the line over it, its ground ('waves' is the launch screen's),
# and the cards lifted out of it. A lifted card is drawn over its own place on the phone, a little
# larger and at the phone's lean, so it stands out past the frame on both sides.
SCREENS = [
    ('home', 'Know where your\nmoney goes', 'waves', ['balance']),
    ('add', 'Add an expense\nin seconds', 'lilac', ['amount']),
    ('accounts', 'Every account,\nevery currency', 'orange', ['euro', 'rupee']),
    ('insights-30b', 'See where the\nmonth is heading', 'teal', ['forecast']),
    ('insights-30c', 'Know what\nyou spend on', 'pink', ['spending']),
    ('loan', 'Lent or borrowed,\nnever forgotten', 'blue', ['loan']),
    ('activity', 'Everything you\nrecorded, in one list', 'page', ['day']),
]
LIFT = 1.13  # how much larger a lifted card is than the same card on the phone under it

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


def waves(w, h, deep=1.0):
    """The launch screen's ground (design/components/WaveField.tsx), at any size; `deep` flattens the dark wave."""
    im = Image.new('RGB', (w, h), BRAND)
    d = ImageDraw.Draw(im)
    p = lambda x, y: (x * w, y * h)
    dark = cubic(p(0.26, 0), p(0.5, 0.17 * deep), p(0.78, 0.06 * deep), p(1, 0.27 * deep)) + [p(1, 0)]
    d.polygon(dark, fill=BRAND_DEEP)
    bright = [p(0, 1), p(0, 0.84)] + cubic(p(0, 0.84), p(0.16, 0.75), p(0.3, 0.91), p(0.48, 0.84)) + cubic(p(0.48, 0.84), p(0.68, 0.76), p(0.82, 0.85), p(1, 0.7)) + [p(1, 1)]
    d.polygon(bright, fill=BRAND_BRIGHT)
    return im


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


def shot(name):
    return Image.open(RAW / f'{name}.png').convert('RGB')


def shadowed(layer, blur, drop, strength=70):
    """A layer with a soft shadow under it; the picture grows by the returned pad on every side."""
    pad = blur * 3
    out = Image.new('RGBA', (layer.width + 2 * pad, layer.height + 2 * pad), (0, 0, 0, 0))
    shade = Image.new('RGBA', out.size, (0, 0, 0, 0))
    shade.paste(INK + (strength,), (pad, pad + drop), layer.getchannel('A'))
    out = Image.alpha_composite(out, shade.filter(ImageFilter.GaussianBlur(blur)))
    out.alpha_composite(layer, (pad, pad))
    return out


def put(im, layer, cx, cy):
    im.alpha_composite(layer, (round(cx - layer.width / 2), round(cy - layer.height / 2)))


def tilted(layer, degrees):
    """Turned by `degrees`, clockwise."""
    return layer.rotate(-degrees, resample=Image.BICUBIC, expand=True) if degrees else layer


def card(name, width, lean=0, shade=True):
    """A card lifted out of its screen: cut on its own edge, corners rounded, `width` across, leaning."""
    source, (l, t, r, b) = CARDS[name]
    im = shot(source)
    # Snap each side to where the grey page ends, when that is within a few pixels of the given box.
    m = 14
    near = im.crop((l - m, t - m, r + m, b + m))
    off = near.point(lambda v: 255 if abs(v - PAGE[0]) > 3 else 0).convert('L').getbbox()
    if off:
        l, r = (l - m + off[0] if off[0] > 0 else l), (l - m + off[2] if off[2] < near.width else r)
        t, b = (t - m + off[1] if off[1] > 0 else t), (t - m + off[3] if off[3] < near.height else b)
    cut = im.crop((l, t, r, b)).convert('RGBA')
    scale = width / cut.width
    cut = cut.resize((width, round(cut.height * scale)), Image.LANCZOS)
    mask = Image.new('L', (cut.width * 2, cut.height * 2), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, mask.width - 1, mask.height - 1), radius=round(30 * scale * 2), fill=255)
    cut.putalpha(mask.resize(cut.size, Image.LANCZOS))
    cut = tilted(cut, lean)
    return shadowed(cut, max(4, round(width * 0.03)), max(3, round(width * 0.025)), 64) if shade else cut


def device(name, width, lean=0):
    """A screen in its phone, leaning, with its shadow."""
    return shadowed(tilted(phone(shot(name), width), lean), max(4, round(width * 0.035)), max(3, round(width * 0.03)), 72)


# A phone laid back and turned, as drawn on an isometric grid: where its width and its height point.
LAID = ((0.88, 0.36), (-0.52, 0.80))


def laid_back(layer, depth, axes=LAID):
    """A phone laid back (an affine picture of it), given `depth` pixels of thickness."""
    (ax, ay), (bx, by) = axes
    w, h = layer.size
    xs = [0, ax * w, bx * h, ax * w + bx * h]
    ys = [0, ay * w, by * h, ay * w + by * h]
    ox, oy = -min(xs), -min(ys)
    size = (math.ceil(max(xs) + ox), math.ceil(max(ys) + oy))
    det = ax * by - bx * ay
    # Pillow wants the way back: from a point of the result to a point of the phone.
    back = (by / det, -bx / det, (bx * oy - by * ox) / det, -ay / det, ax / det, (ay * ox - ax * oy) / det)
    face = layer.transform(size, Image.AFFINE, back, resample=Image.BICUBIC)
    out = Image.new('RGBA', (size[0], size[1] + depth), (0, 0, 0, 0))
    side = Image.new('RGBA', size, (38, 38, 38, 255))
    for i in range(depth, 0, -1):
        out.paste(side, (0, i), face.getchannel('A'))
    out.alpha_composite(face)
    return out


def centred_text(draw, text, f, cx, top, fill, leading):
    y = top
    for line in text.split('\n'):
        w = draw.textlength(line, font=f)
        draw.text((cx - w / 2, y), line, font=f, fill=fill)
        y += leading
    return y


PANEL = (1080, 1920)


def play_strip():
    """All the Play screenshots as one picture, so the grounds and the cards run on from one into the next."""
    pw, ph = PANEL[0] * SS, PANEL[1] * SS
    W, H = pw * len(SCREENS), ph
    im = Image.new('RGBA', (W, H), BRAND + (255,))
    # The dark wave is kept shallow here, so the headline stays on the middle green.
    im.paste(waves(pw + 200 * SS, H, deep=0.3), (0, 0))
    d = ImageDraw.Draw(im)
    # Each ground meets the last along a slow wave, not a straight cut at the join.
    for i, (_, _, kind, _) in enumerate(SCREENS):
        if i == 0:
            continue
        edge = [(i * pw + 64 * SS * math.sin(2 * math.pi * y / H * 0.9 + i * 1.9), y) for y in range(0, H + 16, 16)]
        d.polygon(edge + [(W, H), (W, 0)], fill=PAGE if kind == 'page' else PASTEL[kind])
    for i, (name, headline, _, lifted) in enumerate(SCREENS):
        cx = i * pw + pw // 2
        centred_text(d, headline, font('700Bold', 88 * SS), cx, 116 * SS, INK, 108 * SS)
        # Each phone leans the other way from the last; it runs off the foot of the picture.
        width, lean = 780 * SS, -4 if i % 2 == 0 else 4
        body = device(name, width, lean)
        cy = 400 * SS + body.height / 2
        put(im, body, cx, cy)
        # Where a point of the screen lands on the picture: the frame's inset, then the lean about the phone's middle.
        bezel = round(width * 0.022)
        scale = (width - 2 * bezel) / 1080
        turn = math.radians(lean)
        for which in lifted:
            l, t, r, b = CARDS[which][1]
            x = bezel + (l + r) / 2 * scale - width / 2
            y = bezel + (t + b) / 2 * scale - (2340 * scale + 2 * bezel) / 2
            put(im, card(which, round((r - l) * scale * LIFT), lean),
                cx + x * math.cos(turn) - y * math.sin(turn), cy + x * math.sin(turn) + y * math.cos(turn))
    return im.convert('RGB')


def lockup(im, left, top, height):
    """The mark and the name side by side; returns where it ends."""
    m = mark(round(height * 392 / 474))
    im.alpha_composite(m, (left, top))
    f = font('700Bold', round(height * 0.86))
    d = ImageDraw.Draw(im)
    box = d.textbbox((0, 0), 'Fintraq', font=f)
    d.text((left + m.width + round(height * 0.3), top + (m.height - (box[3] + box[1])) // 2), 'Fintraq', font=f, fill=INK)
    return top + m.height


def feature_graphic():
    W, H = 1024 * SS, 500 * SS
    im = waves(W, H).convert('RGBA')
    put(im, device('home', 300 * SS, 8), 815 * SS, 330 * SS)
    put(im, card('stack', 270 * SS, -6), 632 * SS, 372 * SS)
    put(im, card('donut', 184 * SS, 7), 922 * SS, 322 * SS)
    d = ImageDraw.Draw(im)
    left = 64 * SS
    y = lockup(im, left, 96 * SS, 64 * SS) + 44 * SS
    for line in ('Know where', 'your money goes'):
        d.text((left, y), line, font=font('700Bold', 46 * SS), fill=INK)
        y += 58 * SS
    return im.convert('RGB').resize((1024, 500), Image.LANCZOS)


def fan():
    """Three phones fanned out on the launch screen's waves, with two cards lifted out."""
    W, H = 2400, 1600
    im = waves(W, H).convert('RGBA')
    put(im, device('insights-30c', 540, -9), 700, 980)
    put(im, device('loan', 540, 9), W - 700, 980)
    put(im, device('home', 620, 0), W // 2, 880)
    put(im, card('donut', 520, -6), 330, 1150)
    put(im, card('stack', 560, 6), W - 340, 1180)
    return im.convert('RGB')


def cascade():
    """Five phones laid back in a row on the grey page, each a step lower than the last."""
    W, H = 2400, 1600
    im = Image.new('RGBA', (W, H), PAGE + (255,))
    for i, name in enumerate(('activity', 'insights-30c', 'home', 'add', 'accounts')):
        body = shadowed(laid_back(phone(shot(name), 560), 16), 30, 26, 55)
        im.alpha_composite(body, (-420 + i * 500, -520 + i * 205))
    return im.convert('RGB')


def cards():
    """The cards by themselves, loosely laid out on the waves: for a post or a web page."""
    W, H = 2400, 1600
    im = waves(W, H).convert('RGBA')
    for which, x, y, width, lean in (('forecast', 450, 400, 720, -5), ('day', 560, 1130, 760, 4), ('balance', 1280, 580, 800, 3),
                                    ('donut', 1960, 520, 640, -4), ('loan', 1330, 1230, 700, -3), ('stack', 2000, 1200, 660, 5)):
        put(im, card(which, width, lean), x, y)
    return im.convert('RGB')


def main():
    (OUT / 'play').mkdir(parents=True, exist_ok=True)
    (OUT / 'mockups').mkdir(parents=True, exist_ok=True)
    strip = play_strip()
    pw = PANEL[0] * SS
    for i, (name, *_) in enumerate(SCREENS):
        strip.crop((i * pw, 0, (i + 1) * pw, strip.height)).resize(PANEL, Image.LANCZOS).save(OUT / 'play' / f'{i + 1:02d}-{name}.png', optimize=True)
    strip.resize((PANEL[0] * len(SCREENS) // 3, PANEL[1] // 3), Image.LANCZOS).save(OUT / 'play-strip.jpg', quality=90)
    feature_graphic().save(OUT / 'feature-graphic.png', optimize=True)
    for raw in sorted(RAW.glob('*.png')):
        phone(Image.open(raw), 900).save(OUT / 'mockups' / raw.name, optimize=True)
    fan().save(OUT / 'mockups' / 'fan.jpg', quality=92)
    cascade().save(OUT / 'mockups' / 'cascade.jpg', quality=92)
    cards().save(OUT / 'mockups' / 'cards.jpg', quality=92)
    print('store/play, store/play-strip.jpg, store/feature-graphic.png and store/mockups written')


if __name__ == '__main__':
    main()
