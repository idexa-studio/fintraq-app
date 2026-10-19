#!/usr/bin/env python3
"""
Draws the store's pictures from the phone screenshots, one set for each listing in LISTINGS:

  global   the default listing (every language but en-IN): dollars as the main currency
  india    the en-IN listing: rupees first, udhar (money lent and borrowed) near the front

A listing's captures are in store/raw/<listing>/ (phone screens, and tablet7/ and tablet10/), and its
pictures go to store/<listing>/:

  phone/01-…png          Google Play phone screenshots, 1080 x 1920 (Play refuses anything taller than
                         2:1, so a raw 1080 x 2340 capture cannot be uploaded as it is). They are cut from
                         one long picture, so the grounds and the lifted cards run on from each into the next.
  tablet7/01-…png        the same for Play's 7-inch tablet slot, 1080 x 1920: a small tablet upright
  tablet10/01-…png       and for its 10-inch slot, 2560 x 1440: a large tablet on its side
                         (Play takes only 16:9 or 9:16 in both slots)
  feature-graphic.png    Google Play feature graphic, 1024 x 500
  strips/<slot>.jpg      each slot's long picture, reduced, to look at
  mockups/…              each screen in a phone frame on a clear ground, and the phones
                         together: a fan, a cascade and the cards by themselves

    python3 scripts/generate-store-assets.py      (needs Pillow; draws every listing)

The tablet captures are taken on the same phone with its display set to a tablet's size
(`adb shell wm size 1200x1920; adb shell wm density 320` is a 7-inch tablet upright, 600 x 960;
`wm size 2560x1600` a 10-inch one on its side, 1280 x 800; `wm size reset; wm density reset` after),
under the names in TABLETS below.

The screenshots are taken on the phone with demo data (Developer, Add demo data), in light mode, as
Pro (Developer, Always Pro), with Expo's floating Tools button turned off in the dev menu. The global
set is made with dollars as the main currency; India's with rupees, chosen when setting up a cleared
install, which makes the demo data an Indian one (data/seed/demo-data.ts). Colours, the typeface and
the mark are the design system's; the headlines are in each listing's screens below.
"""
from pathlib import Path
import math
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / 'store' / 'raw'
OUT = ROOT / 'store'
FONTS = ROOT / 'assets' / 'fonts' / 'ProzaLibre'
GLYPHS = ROOT / 'scripts' / 'glyphs'

# Characters the typeface lacks, drawn as the phone draws them in the app: from Android's sans-serif
# (Roboto, at weight 700 for a bold line), which is where it falls back to. Each was saved once from the
# phone's /system/fonts/Roboto-Regular.ttf at 1000 px, as wide as its advance; the number is how far its
# top stands above the baseline at that size. Roboto's capitals stand 711 high and Proza Libre's 716, so
# the two sit together at the same size.
FALLBACK = {'₹': ('rupee.png', 711)}

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
    'balance': ('home', (48, 260, 1032, 822)),
    'stack': ('home-accounts', (48, 928, 1032, 1669)),
    'amount': ('add', (48, 455, 1032, 747)),
    'worth': ('accounts', (48, 260, 1032, 792)),
    'euro': ('accounts', (48, 1201, 1032, 1392)),
    'budget': ('plan', (48, 440, 1032, 1000)),
    'forecast': ('insights-30b', (48, 1057, 1032, 1631)),
    'donut': ('insights-30c', (48, 954, 1032, 2123)),
    'loan': ('loan', (48, 260, 1032, 948)),
    'day': ('activity', (48, 665, 1032, 1050)),
}

# Each Play screenshot: the capture, the line over it, its ground ('waves' is the launch screen's),
# and the cards lifted out of it. A lifted card is drawn over its own place on the phone, a little
# larger and at the phone's lean, so it stands out past the frame on both sides.
SCREENS = [
    ('home', 'Know where your\nmoney goes', 'waves', ['balance']),
    ('add', 'Add an expense\nin seconds', 'lilac', ['amount']),
    ('plan', 'Budgets that show\nwhat is left', 'orange', ['budget']),
    ('insights-30b', 'See where the\nmonth is heading', 'teal', ['forecast']),
    ('accounts', 'Every account,\nevery currency', 'blue', ['worth', 'euro']),
    ('insights-30c', 'Know what\nyou spend on', 'pink', []),
    ('loan', 'Lent or borrowed,\nnever forgotten', 'green', ['loan']),
    ('activity', 'Everything you\nrecorded, in one list', 'page', ['day']),
]

# India's captures (store/raw/india) have their cards in other places: the rupee figures are longer, the
# accounts stack holds a UPI wallet, and the udhar list is a card of its own.
INDIA_CARDS = {
    'balance': ('home', (48, 260, 1032, 822)),
    'stack': ('home-accounts', (48, 757, 1032, 1629)),
    'amount': ('add', (48, 455, 1032, 747)),
    'worth': ('accounts', (48, 260, 1032, 792)),
    'dollar': ('accounts', (48, 1201, 1032, 1392)),
    'budget': ('plan', (48, 440, 1032, 1000)),
    'udhar': ('plan-loans', (48, 889, 1032, 1685)),
    'forecast': ('insights-30b', (48, 887, 1032, 1461)),
    'donut': ('insights-30c', (48, 950, 1032, 2120)),
    'loan': ('loan', (48, 260, 1032, 948)),
    'day': ('activity', (48, 1007, 1032, 1782)),
}

# India's eight: money lent and borrowed (udhar) comes second, since it is what sets Fintraq apart
# there; the list of everything recorded makes room for it.
INDIA_SCREENS = [
    ('home', 'Know where\nevery ₹ goes', 'waves', ['balance']),
    ('plan-loans', 'Udhar: see\nwho owes you', 'green', ['udhar']),
    ('add', 'Add an expense\nin seconds', 'lilac', ['amount']),
    ('plan', 'Budgets that show\nwhat is left', 'orange', ['budget']),
    ('insights-30b', 'See where the\nmonth is heading', 'teal', ['forecast']),
    ('accounts', 'Every account,\nevery currency', 'blue', ['worth', 'dollar']),
    ('insights-30c', 'Know what\nyou spend on', 'pink', []),
    ('loan', 'Lent or borrowed,\nnever forgotten', 'page', ['loan']),
]

# The status bar is painted over in every capture (the phone's demo mode does not hold on this
# Samsung): this many rows from the top take the colour found in the middle of them. A tablet on
# its side is captured with an empty band above the header, which is cut off instead.
STATUS = {'phone': 100, 'tablet7': 68, 'tablet10': 0}
CUT_TOP = {'tablet10': 250}

# Play's two tablet slots. Each: the folder of captures, the picture's size, how wide the tablet is drawn,
# where its top edge sits, the headline's size and leading, and the screens with their lines and grounds.
# A small tablet upright shows the one-column layout; a large one on its side shows the rail and two columns.
TABLETS = {
    'tablet7': {
        'panel': (1080, 1920), 'width': 940, 'top': 400, 'type': (84, 104),
        'screens': [
            ('home', 'Know where your\nmoney goes', 'waves'),
            ('add', 'Add an expense\nin seconds', 'lilac'),
            ('plan', 'Budgets that show\nwhat is left', 'orange'),
            ('insights', 'See where the\nmonth is heading', 'teal'),
            ('activity', 'Everything you\nrecorded, in one list', 'pink'),
            ('accounts', 'Every account,\nevery currency', 'blue'),
        ],
    },
    'tablet10': {
        'panel': (2560, 1440), 'width': 1960, 'top': 330, 'type': (108, 128),
        'screens': [
            ('home', 'Know where your money goes', 'waves'),
            ('insights', 'See where the month is heading', 'teal'),
            ('plan', 'Budgets that show what is left', 'orange'),
            ('activity', 'Everything you recorded, in one list', 'pink'),
            ('add', 'Add an expense in seconds', 'lilac'),
            ('accounts', 'Every account, every currency', 'blue'),
        ],
    },
}

INDIA_TABLETS = {
    'tablet7': {
        **TABLETS['tablet7'],
        'screens': [
            ('home', 'Know where\nevery ₹ goes', 'waves'),
            ('plan-loans', 'Udhar: see\nwho owes you', 'green'),
            ('add', 'Add an expense\nin seconds', 'lilac'),
            ('plan', 'Budgets that show\nwhat is left', 'orange'),
            ('insights', 'See where the\nmonth is heading', 'teal'),
            ('accounts', 'Every account,\nevery currency', 'blue'),
        ],
    },
    'tablet10': {
        **TABLETS['tablet10'],
        'screens': [
            ('home', 'Know where every ₹ goes', 'waves'),
            ('plan', 'Udhar and budgets, side by side', 'green'),
            ('insights', 'See where the month is heading', 'teal'),
            ('activity', 'Everything you recorded, in one list', 'pink'),
            ('add', 'Add an expense in seconds', 'lilac'),
            ('accounts', 'Every account, every currency', 'blue'),
        ],
    },
}

# Each listing: where its captures are, where its pictures go, and what they show and say. The feature
# graphic's phones are (capture, middle, top, width, lean); the middle one has the balance lifted out.
LISTINGS = {
    'global': {
        'raw': RAW / 'global', 'out': OUT / 'global', 'cards': CARDS, 'screens': SCREENS, 'tablets': TABLETS,
        'feature': {'lines': ('Know where', 'your money goes'), 'phones': (('insights-30b', 612, 140, 172, -7), ('loan', 922, 140, 172, 7), ('home', 767, 64, 202, 0))},
    },
    'india': {
        'raw': RAW / 'india', 'out': OUT / 'india', 'cards': INDIA_CARDS, 'screens': INDIA_SCREENS, 'tablets': INDIA_TABLETS,
        'feature': {'lines': ('Know where', 'every ₹ goes'), 'phones': (('insights-30b', 612, 140, 172, -7), ('plan-loans', 922, 140, 172, 7), ('home', 767, 64, 202, 0))},
    },
}

LIFT = 1.13  # how much larger a lifted card is than the same card on the phone under it

SS = 2  # everything is drawn at twice its size and reduced, for clean edges


def font(weight, size):
    return ImageFont.truetype(str(FONTS / f'ProzaLibre_{weight}.ttf'), size)


def fallback(char, size):
    """A character the typeface lacks, as a mask at a font size of `size`, and how far its top stands above the baseline."""
    name, top = FALLBACK[char]
    mask = Image.open(GLYPHS / name).convert('L')
    k = size / 1000
    return mask.resize((round(mask.width * k), round(mask.height * k)), Image.LANCZOS), round(top * k)


def pieces(text):
    """The text in runs the typeface draws and single characters it lacks."""
    out = []
    for ch in text:
        if ch in FALLBACK or not out or out[-1] in FALLBACK:
            out.append(ch)
        else:
            out[-1] += ch
    return out


def text_width(draw, text, f):
    return sum(fallback(p, f.size)[0].width if p in FALLBACK else draw.textlength(p, font=f) for p in pieces(text))


def write(draw, xy, text, f, fill):
    """Text at (left, top), as draw.text puts it; a character the typeface lacks is drawn from FALLBACK on the same baseline."""
    if not any(ch in FALLBACK for ch in text):
        draw.text(xy, text, font=f, fill=fill)
        return
    x, baseline = xy[0], xy[1] + f.getmetrics()[0]
    for p in pieces(text):
        if p in FALLBACK:
            mask, top = fallback(p, f.size)
            draw.bitmap((round(x), baseline - top), mask, fill=fill)
            x += mask.width
        else:
            draw.text((x, baseline), p, font=f, fill=fill, anchor='ls')
            x += draw.textlength(p, font=f)


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


def tablet(shot, width):
    """A screenshot in a plain black tablet frame, `width` across: an even bezel, gentler corners, no camera."""
    bezel = round(min(width, width * shot.height / shot.width) * 0.034)
    screen_w = width - 2 * bezel
    screen_h = round(screen_w * shot.height / shot.width)
    height = screen_h + 2 * bezel
    outer = round(bezel * 2.1)
    inner = outer - bezel
    frame = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    ImageDraw.Draw(frame).rounded_rectangle((0, 0, width - 1, height - 1), radius=outer, fill=INK + (255,))
    screen = shot.convert('RGBA').resize((screen_w, screen_h), Image.LANCZOS)
    mask = Image.new('L', (screen_w, screen_h), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, screen_w - 1, screen_h - 1), radius=inner, fill=255)
    frame.paste(screen, (bezel, bezel), mask)
    return frame


def mark(width):
    """The app's mark, cut from the splash image the brand script draws."""
    im = Image.open(ROOT / 'assets' / 'images' / 'splash.png').convert('RGBA')
    im = im.crop(im.getbbox())
    return im.resize((width, round(width * im.height / im.width)), Image.LANCZOS)


def clean(im, kind):
    """A capture with its status bar painted out, and (a tablet on its side) the empty band above its header cut off."""
    im = im.convert('RGB')
    if CUT_TOP.get(kind):
        im = im.crop((0, CUT_TOP[kind], im.width, im.height))
    band = STATUS[kind]
    if band:
        ImageDraw.Draw(im).rectangle((0, 0, im.width, band), fill=im.getpixel((im.width // 2, band // 2)))
    return im


def shot(L, name):
    return clean(Image.open(L['raw'] / f'{name}.png'), 'phone')


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


def card(L, name, width, lean=0, shade=True):
    """A card lifted out of its screen: cut on its own edge, corners rounded, `width` across, leaning."""
    source, (l, t, r, b) = L['cards'][name]
    im = shot(L, source)
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


def device(L, name, width, lean=0):
    """A screen in its phone, leaning, with its shadow."""
    return shadowed(tilted(phone(shot(L, name), width), lean), max(4, round(width * 0.035)), max(3, round(width * 0.03)), 72)


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
        w = text_width(draw, line, f)
        write(draw, (cx - w / 2, y), line, f, fill)
        y += leading
    return y


def lift(L, im, which, width, lean, cx, cy):
    """Draws a card over its own place on a phone `width` across, leaning, whose middle is at (cx, cy)."""
    # Where a point of the screen lands on the picture: the frame's inset, then the lean about the phone's middle.
    bezel = round(width * 0.022)
    scale = (width - 2 * bezel) / 1080
    turn = math.radians(lean)
    l, t, r, b = L['cards'][which][1]
    x = bezel + (l + r) / 2 * scale - width / 2
    y = bezel + (t + b) / 2 * scale - (2340 * scale + 2 * bezel) / 2
    put(im, card(L, which, round((r - l) * scale * LIFT), lean),
        cx + x * math.cos(turn) - y * math.sin(turn), cy + x * math.sin(turn) + y * math.cos(turn))


PANEL = (1080, 1920)


def play_strip(L):
    """All the Play screenshots as one picture, so the grounds and the cards run on from one into the next."""
    screens = L['screens']
    pw, ph = PANEL[0] * SS, PANEL[1] * SS
    W, H = pw * len(screens), ph
    im = Image.new('RGBA', (W, H), BRAND + (255,))
    # The dark wave is kept shallow here, so the headline stays on the middle green.
    im.paste(waves(pw + 200 * SS, H, deep=0.3), (0, 0))
    d = ImageDraw.Draw(im)
    # Each ground meets the last along a slow wave, not a straight cut at the join.
    for i, (_, _, kind, _) in enumerate(screens):
        if i == 0:
            continue
        edge = [(i * pw + 64 * SS * math.sin(2 * math.pi * y / H * 0.9 + i * 1.9), y) for y in range(0, H + 16, 16)]
        d.polygon(edge + [(W, H), (W, 0)], fill=PAGE if kind == 'page' else PASTEL[kind])
    for i, (name, headline, _, lifted) in enumerate(screens):
        cx = i * pw + pw // 2
        centred_text(d, headline, font('700Bold', 88 * SS), cx, 116 * SS, INK, 108 * SS)
        # Each phone leans the other way from the last; it runs off the foot of the picture.
        width, lean = 780 * SS, -4 if i % 2 == 0 else 4
        body = device(L, name, width, lean)
        cy = 400 * SS + body.height / 2
        put(im, body, cx, cy)
        for which in lifted:
            lift(L, im, which, width, lean, cx, cy)
    return im.convert('RGB')


def tablet_strip(L, kind):
    """One tablet slot's screenshots as one picture, drawn as the phones' are: the grounds run on, the tablets stand upright."""
    spec = L['tablets'][kind]
    screens = spec['screens']
    pw, ph = spec['panel'][0] * SS, spec['panel'][1] * SS
    W, H = pw * len(screens), ph
    im = Image.new('RGBA', (W, H), BRAND + (255,))
    im.paste(waves(pw + 200 * SS, H, deep=0.3), (0, 0))
    d = ImageDraw.Draw(im)
    for i, (_, _, ground) in enumerate(screens):
        if i == 0:
            continue
        edge = [(i * pw + 64 * SS * math.sin(2 * math.pi * y / H * 0.9 + i * 1.9), y) for y in range(0, H + 16, 16)]
        d.polygon(edge + [(W, H), (W, 0)], fill=PAGE if ground == 'page' else PASTEL[ground])
    size, leading = spec['type']
    for i, (name, headline, _) in enumerate(screens):
        cx = i * pw + pw // 2
        lines = headline.count('\n') + 1
        # A one-line headline sits where the middle of a two-line one would.
        centred_text(d, headline, font('700Bold', size * SS), cx, (116 + (leading // 2 if lines == 1 and spec['panel'][1] > spec['panel'][0] else 0)) * SS, INK, leading * SS)
        raw = clean(Image.open(L['raw'] / kind / f'{name}.png'), kind)
        body = shadowed(tablet(raw, spec['width'] * SS), round(spec['width'] * SS * 0.02), round(spec['width'] * SS * 0.016), 72)
        put(im, body, cx, spec['top'] * SS + body.height / 2)
    return im.convert('RGB')


def app_icon(size):
    """The app icon as a launcher shows it: the square icon with its corners rounded."""
    icon = Image.open(ROOT / 'assets' / 'images' / 'icon.png').convert('RGBA').resize((size, size), Image.LANCZOS)
    mask = Image.new('L', (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, size - 1, size - 1), radius=round(size * 0.24), fill=255)
    icon.putalpha(mask)
    return icon


def feature_graphic(L, side=BRAND_DEEP):
    """The icon, the name and the line on the left; three phones fanned out on a darker green on the right."""
    W, H = 1024 * SS, 500 * SS
    im = Image.new('RGBA', (W, H), BRAND + (255,))
    d = ImageDraw.Draw(im)
    # One wave, the wave card's, stood on end: the phones' side of the picture.
    p = lambda x, y: (x * W, y * H)
    d.polygon(cubic(p(0.47, 0), p(0.56, 0.3), p(0.40, 0.66), p(0.50, 1)) + [p(1, 1), p(1, 0)], fill=side)
    for name, x, top, width, lean in L['feature']['phones']:
        body = device(L, name, width * SS, lean)
        cy = top * SS + body.height / 2
        put(im, body, x * SS, cy)
        if name == 'home':
            lift(L, im, 'balance', width * SS, lean, x * SS, cy)
    left, top = 60 * SS, 118 * SS
    icon = app_icon(60 * SS)
    im.alpha_composite(icon, (left, top))
    name_font = font('700Bold', 34 * SS)
    box = d.textbbox((0, 0), 'Fintraq', font=name_font)
    d.text((left + icon.width + 16 * SS, top + (icon.height - box[3] - box[1]) // 2), 'Fintraq', font=name_font, fill=INK)
    y = top + icon.height + 34 * SS
    for line in L['feature']['lines']:
        write(d, (left, y), line, font('700Bold', 46 * SS), INK)
        y += 58 * SS
    d.text((left, y + 14 * SS), 'Free to record. Private by design.', font=font('500Medium', 21 * SS), fill=INK)
    return im.convert('RGB').resize((1024, 500), Image.LANCZOS)


def fan(L):
    """Three phones fanned out on the launch screen's waves, with two cards lifted out."""
    W, H = 2400, 1600
    im = waves(W, H).convert('RGBA')
    put(im, device(L, 'insights-30c', 540, -9), 700, 980)
    put(im, device(L, 'loan', 540, 9), W - 700, 980)
    put(im, device(L, 'home', 620, 0), W // 2, 880)
    put(im, card(L, 'donut', 520, -6), 330, 1150)
    put(im, card(L, 'stack', 560, 6), W - 340, 1180)
    return im.convert('RGB')


def cascade(L):
    """Five phones laid back in a row on the grey page, each a step lower than the last."""
    W, H = 2400, 1600
    im = Image.new('RGBA', (W, H), PAGE + (255,))
    for i, name in enumerate(('activity', 'insights-30c', 'home', 'add', 'accounts')):
        body = shadowed(laid_back(phone(shot(L, name), 560), 16), 30, 26, 55)
        im.alpha_composite(body, (-420 + i * 500, -520 + i * 205))
    return im.convert('RGB')


def cards(L):
    """The cards by themselves, loosely laid out on the waves: for a post or a web page."""
    W, H = 2400, 1600
    im = waves(W, H).convert('RGBA')
    for which, x, y, width, lean in (('forecast', 450, 400, 720, -5), ('day', 560, 1130, 760, 4), ('balance', 1280, 580, 800, 3),
                                    ('donut', 1960, 520, 640, -4), ('loan', 1330, 1230, 700, -3), ('stack', 2000, 1200, 660, 5)):
        put(im, card(L, which, width, lean), x, y)
    return im.convert('RGB')


def draw_listing(L):
    OUT, RAW = L['out'], L['raw']
    for folder in ('phone', 'strips', 'mockups'):
        (OUT / folder).mkdir(parents=True, exist_ok=True)
    strip = play_strip(L)
    pw = PANEL[0] * SS
    for i, (name, *_) in enumerate(L['screens']):
        strip.crop((i * pw, 0, (i + 1) * pw, strip.height)).resize(PANEL, Image.LANCZOS).save(OUT / 'phone' / f'{i + 1:02d}-{name}.png', optimize=True)
    strip.resize((PANEL[0] * len(L['screens']) // 3, PANEL[1] // 3), Image.LANCZOS).save(OUT / 'strips' / 'phone.jpg', quality=90)
    for kind, spec in L['tablets'].items():
        if not (RAW / kind).is_dir():
            print(f'{(RAW / kind).relative_to(ROOT)} is missing: its screenshots were not drawn')
            continue
        (OUT / kind).mkdir(parents=True, exist_ok=True)
        strip, panel = tablet_strip(L, kind), spec['panel']
        for i, (name, *_) in enumerate(spec['screens']):
            strip.crop((i * panel[0] * SS, 0, (i + 1) * panel[0] * SS, strip.height)).resize(panel, Image.LANCZOS).save(OUT / kind / f'{i + 1:02d}-{name}.png', optimize=True)
        strip.resize((panel[0] * len(spec['screens']) // 4, panel[1] // 4), Image.LANCZOS).save(OUT / 'strips' / f'{kind}.jpg', quality=90)
    feature_graphic(L).save(OUT / 'feature-graphic.png', optimize=True)
    # Only the phone captures: the tablets' are in folders of their own.
    for raw in sorted(RAW.glob('*.png')):
        phone(clean(Image.open(raw), 'phone'), 900).save(OUT / 'mockups' / raw.name, optimize=True)
    fan(L).save(OUT / 'mockups' / 'fan.jpg', quality=92)
    cascade(L).save(OUT / 'mockups' / 'cascade.jpg', quality=92)
    cards(L).save(OUT / 'mockups' / 'cards.jpg', quality=92)
    print(f'{OUT.relative_to(ROOT)}: phone, tablet7, tablet10, strips, feature-graphic.png and mockups written')


def main():
    for L in LISTINGS.values():
        draw_listing(L)


if __name__ == '__main__':
    main()
