#!/usr/bin/env python3
"""
Draws the store's promo video, store/promo/fintraq-promo.mp4 (1920 x 1080, a little over half a
minute), from the same phone captures, colours and type as the screenshots
(scripts/generate-store-assets.py).

It is told, not read out: a voice asks where the month's money went and walks through the answer,
while the screen shows a few words of its own, the phone, a card lifting out of it and two or three
callouts. Everything moves the way the app's own brand does: the three coins of the mark fall and
stack, the waves of the launch screen roll, and one scene sweeps the last away along a wave.
Scenes change on the beat of the music.

The voice is Kokoro's (a neural voice that runs on this Mac, with no account and no fee) and the
music and effects are made here from sine waves and noise, so nothing in it is anyone else's.

    python3 scripts/generate-promo-video.py --ffmpeg /path/to/ffmpeg --kokoro /folder/with/the/model

Needs Pillow, numpy, an ffmpeg binary and, for the voice, `kokoro-onnx` with its two model files
(kokoro-v1.0.int8.onnx, voices-v1.0.bin); none is kept in the project. `--voice` picks another
Kokoro voice (af_heart, af_bella, am_michael, bm_george …). Without `--kokoro` the Mac's own `say`
speaks instead. `--music FILE` plays that file under the voice in place of the bed made here.
`--silent` leaves the voice out, to lay a recorded one over the music. `--reel` draws the same
film upright (1080 x 1920) for Reels, Shorts and TikTok, as store/promo/fintraq-reel.mp4.
"""
import argparse
import importlib.util
import math
import subprocess
import sys
import tempfile
import wave
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('store_assets', ROOT / 'scripts' / 'generate-store-assets.py')
art = importlib.util.module_from_spec(spec)
spec.loader.exec_module(art)

W, H, FPS = 1920, 1080, 30
UPRIGHT = False  # the reel: 1080 x 1920, the words over the phone instead of beside it (see `stand_upright`)
RATE = 44100
BEAT = 60 / 110
BAR = BEAT * 4

# What the voice says before the first scene, and what the screen asks with it.
OPENING = {'asks': 'Where did it all go, this month?', 'answers': 'Fintraq shows you.', 'words': 'Where did\nit all go?'}

# Each scene: the capture, the few words on screen, its ground, the card lifted out of the phone,
# the callouts (text, which side of the phone, how far down, the colour of its dot; a long one goes
# on the left, above or below the words, where there is room for it), and what the
# voice says meanwhile with how fast it says it. The voice tells it; the screen never repeats it.
SCENES = [
    dict(shot='home', words='One clear\nbalance', ground='waves', card='balance',
         pills=[('4 accounts', 'left', 290, 'lilac'), ('40% kept', 'right', 800, 'green')],
         says=('Every account, in one clear balance.', 0.96)),
    dict(shot='add', words='Add it\nin seconds', ground='lilac', card='amount',
         pills=[('Groceries', 'right', 430, 'orange'), ('Saved', 'left', 790, 'green')],
         says=('Spent something? Add it, in seconds.', 1.02)),
    dict(shot='plan', words='See what\nis left', ground='orange', card='budget',
         pills=[('$202.47 left', 'right', 330, 'green'), ('Coffee is over', 'left', 800, 'pink')],
         says=('Give your coffee a budget, and watch what is left.', 1.0)),
    dict(shot='insights-30b', words='Know what\nis coming', ground='teal', card='forecast',
         pills=[('On course', 'left', 300, 'blue'), ('5% less', 'right', 780, 'green')],
         says=('See where the month is heading, before it gets there.', 1.0)),
    dict(shot='accounts', words='Every\ncurrency', ground='blue', card='worth',
         pills=[('USD', 'left', 290, 'green'), ('EUR', 'right', 430, 'orange'), ('INR', 'right', 760, 'lilac'), ('TRY', 'left', 810, 'pink')],
         says=('Dollars, euros, rupees. All of it, side by side.', 1.0)),
    dict(shot='loan', words='Never\nforgotten', ground='pink', card='loan',
         pills=[('$350 to come back', 'left', 290, 'green'), ('Due Nov 10', 'right', 720, 'orange')],
         says=('And when you lend a friend some money, Fintraq remembers.', 0.98)),
]

CLOSING = {'says': [('It is free to record, and it stays on your phone.', 0.98), ('Fintraq. Know where your money goes.', 0.9)],
           'name': 'Fintraq', 'line': 'Know where your money goes', 'small': 'Free to record. Private by design.', 'pill': 'On Google Play'}

PHONE_W, PHONE_X, PHONE_TOP = 480, 1340, 90
TEXT_X = 150
WORDS_TOP = 250  # upright: where the words start, under what a reel's own buttons cover at the top
WIPE_S = 0.6  # one scene sweeping the last away
CARD_AT_S = 1.15  # when the card lifts out of the phone
PILL_AT_S, PILL_EVERY_S = 1.7, 0.32


# ── Motion ───────────────────────────────────────────────────────────────────

def ease(t):
    """Out-cubic: quick away, soft landing."""
    t = min(1.0, max(0.0, t))
    return 1 - (1 - t) ** 3


def spring(t, bounce=9.0, settle=6.5):
    """Arrives a little past its place and settles back: what makes a thing feel as if it has weight."""
    return 0.0 if t <= 0 else 1 - math.exp(-settle * t) * math.cos(bounce * t)


def mix(a, b, share):
    return tuple(round(a[i] + (b[i] - a[i]) * share) for i in range(3))


def paste(frame, sprite, cx, cy, alpha=1.0, scale=1.0):
    """Lays a sprite on the frame by its middle, at any size and strength; whatever falls outside is cut off."""
    if alpha <= 0.004 or scale <= 0.01:
        return
    if abs(scale - 1) > 0.002:
        sprite = sprite.resize((max(1, round(sprite.width * scale)), max(1, round(sprite.height * scale))), Image.BILINEAR)
    x, y = round(cx - sprite.width / 2), round(cy - sprite.height / 2)
    l, t, r, b = max(0, -x), max(0, -y), min(sprite.width, W - x), min(sprite.height, H - y)
    if r <= l or b <= t:
        return
    if (l, t, r, b) != (0, 0, sprite.width, sprite.height):
        sprite = sprite.crop((l, t, r, b))
    if alpha < 0.996:
        sprite = sprite.copy()
        sprite.putalpha(sprite.getchannel('A').point(lambda v: round(v * alpha)))
    frame.alpha_composite(sprite, (x + l, y + t))


# ── What is drawn ────────────────────────────────────────────────────────────

def tones(kind):
    """A ground's three colours: the ground, the wave that rolls along its foot, the one across its top."""
    if kind == 'waves':
        return art.BRAND, art.BRAND_BRIGHT, art.BRAND_DEEP
    base = art.PASTEL[kind]
    return base, mix(base, art.WHITE, 0.38), mix(base, art.INK, 0.09)


def roll(frame, colour, t, foot, seed):
    """One wave rolling slowly: along the foot of the picture, or down from its top right corner."""
    top, height = (H - 380, 380) if foot else (0, 360)
    s = 2
    mask = Image.new('L', (W * s, height * s), 0)
    points = []
    for x in range(0, W + 32, 32):
        u = x / W
        if foot:
            y = 150 + 46 * math.sin(2 * math.pi * (u * 1.05 + t * 0.07 + seed)) + 24 * math.sin(2 * math.pi * (u * 2.3 - t * 0.1 + seed))
        else:
            y = -110 + 400 * u ** 2 + 24 * math.sin(2 * math.pi * (u * 1.4 - t * 0.06 + seed))
        points.append((x * s, y * s))
    ImageDraw.Draw(mask).polygon(points + ([(W * s, height * s), (0, height * s)] if foot else [(W * s, 0), (0, 0)]), fill=255)
    frame.paste(colour, (0, top), mask.resize((W, height), Image.BILINEAR))


_MARK = []


def coins():
    """The mark's three coins, each by itself, with where it sits in the mark: the falling one, the upper, the lower."""
    if not _MARK:
        im = Image.open(ROOT / 'assets' / 'images' / 'splash.png').convert('RGBA')
        im = im.crop(im.getbbox())
        alpha = im.getchannel('A')
        rows = [max(alpha.crop((0, y, im.width, y + 1)).getdata()) > 20 for y in range(im.height)] + [False]
        start = None
        for y, inked in enumerate(rows):
            if inked and start is None:
                start = y
            if not inked and start is not None:
                piece = im.crop((0, start, im.width, y))
                box = piece.getbbox()
                _MARK.append((piece.crop(box), (box[0] + box[2]) / 2 - im.width / 2, start + (box[1] + box[3]) / 2 - im.height / 2, im.width))
                start = None
        assert len(_MARK) == 3, 'the mark is expected to be three coins with clear air between them'
    return _MARK


_SPRITES = {}


def sized(key, make):
    if key not in _SPRITES:
        _SPRITES[key] = make()
    return _SPRITES[key]


def coin(which, width):
    piece, _, _, full = coins()[which]
    scale = width / full
    return sized(('coin', which, width), lambda: piece.resize((max(1, round(piece.width * scale)), max(1, round(piece.height * scale))), Image.LANCZOS))


def word(text, size, weight='700Bold', fill=None):
    def make():
        f = art.font(weight, size * 2)
        box = ImageDraw.Draw(Image.new('L', (4, 4))).textbbox((0, 0), text, font=f)
        im = Image.new('RGBA', (box[2] + 8, round(size * 2 * 1.3)), (0, 0, 0, 0))
        ImageDraw.Draw(im).text((4, 0), text, font=f, fill=(fill or art.INK) + (255,))
        return im.resize((im.width // 2, im.height // 2), Image.LANCZOS)
    return sized(('word', text, size, weight, fill), make)


def pill(text, dot):
    """A callout: a white pill with a coloured dot, the app's own badge at film size."""
    def make():
        s = 2
        f = art.font('700Bold', 30 * s)
        width = round(ImageDraw.Draw(Image.new('L', (4, 4))).textlength(text, font=f)) + 100 * s
        height = 68 * s
        im = Image.new('RGBA', (width, height), (0, 0, 0, 0))
        d = ImageDraw.Draw(im)
        d.rounded_rectangle((0, 0, width - 1, height - 1), radius=height // 2, fill=art.WHITE + (255,), outline=art.INK + (255,), width=3 * s)
        d.ellipse((22 * s, 22 * s, 46 * s, 46 * s), fill=dot + (255,), outline=art.INK + (255,), width=3 * s)
        d.text((60 * s, 13 * s), text, font=f, fill=art.INK + (255,))
        return art.shadowed(im.resize((width // s, height // s), Image.LANCZOS), 10, 8, 46)
    return sized(('pill', text, dot), make)


# Where a coin may drift: the open ground round the words, never where the phone or a callout will be.
BESIDE_WORDS = [(70, 430, 70, 220), (520, 760, 110, 250), (80, 420, 860, 1010), (500, 740, 900, 1020), (1740, 1880, 60, 150)]
AT_THE_EDGES = [(90, 380, 110, 330), (120, 420, 700, 960), (1540, 1820, 120, 340), (1500, 1800, 720, 960), (560, 660, 880, 1000)]


def stand_upright():
    """Turns the film on end for a reel: the same parts, laid out top to bottom."""
    global W, H, UPRIGHT, PHONE_W, PHONE_X, PHONE_TOP, BESIDE_WORDS, AT_THE_EDGES
    W, H, UPRIGHT = 1080, 1920, True
    PHONE_W, PHONE_X, PHONE_TOP = 600, 540, 700
    # Down the two sides of the phone, and in the corners above the words.
    BESIDE_WORDS = [(50, 190, 70, 190), (880, 1030, 90, 200), (40, 170, 760, 1040), (910, 1040, 820, 1120), (50, 180, 1380, 1620)]
    AT_THE_EDGES = [(60, 240, 140, 380), (840, 1020, 200, 420), (50, 220, 1280, 1520), (860, 1030, 1340, 1600), (420, 660, 1560, 1700)]


def drifting(frame, t, seed, zones=None):
    """A few of the mark's pale coins adrift behind everything, rising slowly: the one motif the whole film shares."""
    rng = np.random.default_rng(seed)
    for i, (l, r, top, bottom) in enumerate(zones or BESIDE_WORDS):
        x, y = rng.uniform(l, r), rng.uniform(top, bottom)
        width = int(rng.choice([130, 170, 220]))
        shown = spring((t - 0.25 - i * 0.07) * 1.2)
        paste(frame, coin(0, width), x + 14 * math.sin(t * 0.7 + i * 1.7), y - 12 * t + 9 * math.sin(t * 1.1 + i), 1.0, shown)


def lifted_card(which, lean):
    """A card and where it belongs over a phone standing in the scene's place (see `lift` in the store script)."""
    bezel = round(PHONE_W * 0.022)
    scale = (PHONE_W - 2 * bezel) / 1080
    turn = math.radians(lean)
    l, t, r, b = art.CARDS[which][1]
    x = bezel + (l + r) / 2 * scale - PHONE_W / 2
    y = bezel + (t + b) / 2 * scale - (2340 * scale + 2 * bezel) / 2
    sprite = art.card(which, round((r - l) * scale * 1.2), lean)
    return sprite, x * math.cos(turn) - y * math.sin(turn), x * math.sin(turn) + y * math.cos(turn)


class Scene:
    def __init__(self, index, spec):
        self.spec, self.index = spec, index
        self.lean = -4 if index % 2 == 0 else 4
        self.ground, self.foot, self.top = tones(spec['ground'])
        self.phone = art.device(spec['shot'], PHONE_W, self.lean)
        self.card, self.card_x, self.card_y = lifted_card(spec['card'], self.lean)
        self.lines = [[word(w, 118) for w in line.split(' ')] for line in spec['words'].split('\n')]

    def frame(self, t):
        frame = Image.new('RGBA', (W, H), self.ground + (255,))
        roll(frame, self.top, t, False, self.index * 0.37)
        roll(frame, self.foot, t, True, self.index * 0.23)
        drifting(frame, t, 40 + self.index)

        # The words land one at a time, each a breath after the last; a short bar draws itself under them.
        n, y = 0, WORDS_TOP if UPRIGHT else H // 2 - (len(self.lines) * 136 + 40) // 2
        for line in self.lines:
            x = (W - sum(s.width for s in line) - 22 * (len(line) - 1)) / 2 if UPRIGHT else TEXT_X
            for sprite in line:
                at = t - 0.3 - n * 0.11
                paste(frame, sprite, x + sprite.width / 2, y + sprite.height / 2 + (1 - spring(at * 1.1)) * 46, min(1, max(0, at / 0.16)))
                x += sprite.width + 22
                n += 1
            y += 136
        bar = ease((t - 0.3 - n * 0.11) / 0.5)
        if bar > 0:
            left = W / 2 - 95 * bar if UPRIGHT else TEXT_X + 4
            ImageDraw.Draw(frame).rounded_rectangle((left, y + 26, left + 190 * bar, y + 42), radius=8, fill=art.INK)

        # The phone springs up from below and then never quite stands still.
        rise = spring((t - 0.1) * 0.95, 7.5, 5.2)
        bob = 7 * math.sin(t * 1.5)
        cy = PHONE_TOP + self.phone.height / 2 + (1 - rise) * (1400 if UPRIGHT else 980) + bob
        paste(frame, self.phone, PHONE_X, cy)

        # Its card lifts out towards you, and floats a little apart from it.
        out = spring((t - CARD_AT_S) * 1.25, 10.0, 6.0)
        if out > 0:
            paste(frame, self.card, PHONE_X + self.card_x - 10 * out, cy + self.card_y - 8 * out + 5 * math.sin(t * 1.9 + 1), min(1, (t - CARD_AT_S) / 0.1), (1 / 1.2) + (1 - 1 / 1.2) * out)

        # Then the callouts, one after another, each from its own side.
        pills = [pill(text, art.PASTEL[dot]) for text, _, _, dot in self.spec['pills']]
        if UPRIGHT:
            # No room beside the phone: they line up between the words and it, popping in from left to right.
            x = (W - sum(s.width - 60 for s in pills) - 16 * (len(pills) - 1)) / 2
            for i, sprite in enumerate(pills):
                at = t - PILL_AT_S - i * PILL_EVERY_S
                paste(frame, sprite, x + (sprite.width - 60) / 2, WORDS_TOP + len(self.lines) * 136 + 118 + (1 - ease(at / 0.4)) * 40 + 4 * math.sin(t * 1.3 + i * 2), min(1, max(0, at / 0.12)), 0.6 + 0.4 * spring(at * 1.3, 11, 7))
                x += sprite.width - 60 + 16
            return frame
        for i, (text, side, down, dot) in enumerate(self.spec['pills']):
            at = t - PILL_AT_S - i * PILL_EVERY_S
            sprite = pills[i]
            # Clear of the phone and of the card that stands out past it, so it never covers what the screen says.
            x = PHONE_X + (-1 if side == 'left' else 1) * (PHONE_W / 2 + 22 + (sprite.width - 60) / 2)
            paste(frame, sprite, x + (-1 if side == 'left' else 1) * (1 - ease(at / 0.4)) * 60, down + 6 * math.sin(t * 1.3 + i * 2), min(1, max(0, at / 0.12)), 0.6 + 0.4 * spring(at * 1.3, 11, 7))
        return frame


class Opening:
    """The question, on the launch screen's waves; then the mark's three coins fall into place as the answer."""

    def __init__(self, asked_s):
        self.turn = asked_s + 0.75  # when the question gives way to the mark
        self.lines = [[word(w, 150) for w in line.split(' ')] for line in OPENING['words'].split('\n')]
        self.name = word('Fintraq', 108)

    def frame(self, t):
        frame = Image.new('RGBA', (W, H), art.BRAND + (255,))
        roll(frame, art.BRAND_DEEP, t, False, 0.1)
        roll(frame, art.BRAND_BRIGHT, t, True, 0.6)
        gone = ease((t - self.turn) / 0.3)
        n, y = 0, H // 2 - 190
        for line in self.lines:
            x = (W - sum(s.width for s in line) - 30 * (len(line) - 1)) / 2
            for sprite in line:
                at = t - 0.25 - n * 0.13
                paste(frame, sprite, x + sprite.width / 2, y + sprite.height / 2 + (1 - spring(at * 1.1)) * 60 - gone * 90, min(1, max(0, at / 0.16)) * (1 - gone))
                x += sprite.width + 30
                n += 1
            y += 172
        # The lower coin lands first, the upper on it, and the pale one falls last and rocks to rest.
        width, since = 250, t - self.turn - 0.12
        for order, which in enumerate((2, 1, 0)):
            _, dx, dy, full = coins()[which]
            at = since - order * 0.17
            if at <= 0:
                continue
            fall = spring(at * 1.15, 12.0, 6.0)
            paste(frame, coin(which, width), W / 2 + dx * width / full, H / 2 - 70 + dy * width / full - (1 - fall) * 700)
        at = since - 0.66
        paste(frame, self.name, W / 2, H / 2 + 185 + (1 - spring(at * 1.2)) * 44, min(1, max(0, at / 0.14)))
        return frame


class Closing:
    """The icon, the name, the line the whole film has been saying, and where to get it."""

    def __init__(self):
        self.icon = art.shadowed(art.app_icon(210), 16, 12, 60)
        self.name = word(CLOSING['name'], 132)
        self.line = [word(w, 56 if UPRIGHT else 70) for w in CLOSING['line'].split(' ')]
        self.small = word(CLOSING['small'], 40, '500Medium')
        self.pill = pill(CLOSING['pill'], art.PASTEL['green'])

    def frame(self, t):
        frame = Image.new('RGBA', (W, H), art.BRAND + (255,))
        roll(frame, art.BRAND_DEEP, t, False, 0.45)
        roll(frame, art.BRAND_BRIGHT, t, True, 0.15)
        drifting(frame, t, 91, AT_THE_EDGES)
        mid = H / 2
        paste(frame, self.icon, W / 2, mid - 270 + 6 * math.sin(t * 1.4), min(1, t / 0.15), 0.5 + 0.5 * spring(t * 1.2, 10, 6))
        at = t - 0.3
        paste(frame, self.name, W / 2, mid - 65 + (1 - spring(at * 1.1)) * 50, min(1, max(0, at / 0.18)))
        x = (W - sum(s.width for s in self.line) - 18 * (len(self.line) - 1)) / 2
        for i, sprite in enumerate(self.line):
            at = t - 0.75 - i * 0.1
            paste(frame, sprite, x + sprite.width / 2, mid + 70 + (1 - spring(at * 1.1)) * 36, min(1, max(0, at / 0.15)))
            x += sprite.width + 18
        paste(frame, self.small, W / 2, mid + 160, ease((t - 1.6) / 0.5))
        at = t - 2.1
        paste(frame, self.pill, W / 2, mid + 270, min(1, max(0, at / 0.12)), 0.6 + 0.4 * spring(at * 1.3, 11, 7))
        return frame


def sweep(old, new, t):
    """One scene sweeps the last away from the left along a wave, behind a band of black."""
    s = 2
    reach = -260 + (W + 520) * ease(t / WIPE_S)

    def mask(lead):
        m = Image.new('L', (W // s, H // s), 0)
        edge = [((reach + lead + 70 * math.sin(2 * math.pi * (y / H * 0.9 + t * 0.6))) / s, y / s) for y in range(0, H + 24, 24)]
        ImageDraw.Draw(m).polygon(edge + [(-10, H / s), (-10, 0)], fill=255)
        return m.resize((W, H), Image.BILINEAR)

    out = old.copy()
    out.paste(art.INK, (0, 0), mask(70))
    out.paste(new, (0, 0), mask(0))
    return out


# ── Sound ────────────────────────────────────────────────────────────────────

def say(text, voice, path):
    """The Mac's own voice: what is used when Kokoro is not at hand."""
    subprocess.run(['say', '-v', voice, '-r', '168', '--file-format=WAVE', f'--data-format=LEI16@{RATE}', '-o', str(path), text], check=True)
    with wave.open(str(path)) as w:
        data = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
        if w.getnchannels() == 2:
            data = data.reshape(-1, 2).mean(axis=1)
    return data


_KOKORO = []


def kokoro(text, voice, speed, models):
    """Kokoro's voice, brought to this film's sample rate."""
    if not _KOKORO:
        from kokoro_onnx import Kokoro
        _KOKORO.append(Kokoro(str(Path(models) / 'kokoro-v1.0.int8.onnx'), str(Path(models) / 'voices-v1.0.bin')))
    audio, rate = _KOKORO[0].create(text, voice=voice, speed=speed, lang='en-gb' if voice[0] == 'b' else 'en-us')
    audio = np.asarray(audio, dtype=np.float32)
    return np.interp(np.arange(int(len(audio) * RATE / rate)) * rate / RATE, np.arange(len(audio)), audio).astype(np.float32)


def spoken_line(data):
    """A line trimmed of the silence either side, with soft edges, at an even level."""
    loud = np.flatnonzero(np.abs(data) > 0.012 * np.abs(data).max())
    data = data[max(0, loud[0] - int(0.02 * RATE)): loud[-1] + int(0.12 * RATE)].copy()
    edge = int(0.015 * RATE)
    data[:edge] *= np.linspace(0, 1, edge)
    data[-edge:] *= np.linspace(1, 0, edge)
    # Levelled by how loud it is on average, not by its one loudest moment, so no line sits under the others.
    data = data / (math.sqrt(float(np.mean(data ** 2))) or 1) * 0.12
    return np.tanh(data * 1.4) / 1.4  # rounds off a peak instead of clipping it


HZ = {'D': 293.66, 'E': 329.63, 'F#': 369.99, 'G': 392.0, 'A': 440.0, 'B': 493.88, 'C#': 554.37}
# D major, home to bright to wistful to open and round again: the four chords of most songs people hum.
CHORDS = [('D', ['D', 'F#', 'A']), ('A', ['A', 'C#', 'E']), ('B', ['B', 'D', 'F#']), ('G', ['G', 'B', 'D'])]
TUNE = [[('F#', 0), ('A', 1.5), ('D', 2.5, 2), ('A', 3)], [('E', 0), ('A', 1.5), ('C#', 2.5), ('A', 3)],
        [('D', 0), ('F#', 1.5), ('B', 2.5), ('F#', 3)], [('D', 0), ('G', 1.5), ('B', 2.5), ('A', 3)]]


class Mix:
    def __init__(self, seconds):
        self.n = int(seconds * RATE)
        self.left, self.right = np.zeros(self.n, np.float32), np.zeros(self.n, np.float32)

    def add(self, sound, at, gain=1.0, pan=0.5):
        i = int(at * RATE)
        if i >= self.n or i < 0:
            return
        s = sound[: self.n - i] * gain
        self.left[i:i + len(s)] += s * (1 - pan) * 2 ** 0.5
        self.right[i:i + len(s)] += s * pan * 2 ** 0.5


def tone(seconds):
    return np.arange(int(seconds * RATE)) / RATE


def music(mix, drums_from, tune_from, ends):
    """A bright, unhurried bed: a pad, a plucked figure, a bass that steps, a soft kick and snap, and a bell that joins later."""
    rng = np.random.default_rng(7)
    t_kick = tone(0.22)
    kick = np.sin(2 * math.pi * (45 * t_kick + (110 - 45) / 26 * (1 - np.exp(-26 * t_kick)))) * np.exp(-t_kick * 17)
    t_snap = tone(0.14)
    snap = np.diff(rng.standard_normal(len(t_snap)) * np.exp(-t_snap * 42), prepend=0) + 0.5 * np.sin(2 * math.pi * 1900 * t_snap) * np.exp(-t_snap * 70)
    t_shake = tone(0.06)
    t_pluck, t_bell, t_bass = tone(0.8), tone(1.6), tone(BEAT * 0.9)
    bars = int(ends / BAR) + 1
    for b in range(bars):
        at = b * BAR
        if at >= ends:
            break
        root, notes = CHORDS[b % 4]
        last = at + BAR >= ends
        # The pad: each note a pair of sines a hair apart, swelling over the bar. The last chord is left to ring.
        tt = tone(BAR + (3.2 if last else 0.5))
        swell = np.minimum(1, tt / 0.7) * (np.exp(-np.maximum(0, tt - BAR) * 1.3) if last else np.minimum(1, (BAR + 0.5 - tt) / 0.7))
        pad = sum(np.sin(2 * math.pi * HZ[k] / 2 * tt) + np.sin(2 * math.pi * HZ[k] / 2 * 1.004 * tt) for k in notes)
        mix.add((pad * swell).astype(np.float32), at, 0.024)
        # The plucked figure in eighths, like a marimba, falling from one side to the other.
        for step in range(8):
            f = HZ[notes[(0, 1, 2, 1, 0, 2, 1, 2)[step]]] * (2 if step in (2, 5, 7) else 1)
            pluck = (np.sin(2 * math.pi * f * t_pluck) + 0.45 * np.sin(2 * math.pi * 4 * f * t_pluck) * np.exp(-t_pluck * 22)) * np.exp(-t_pluck * 7) * np.minimum(1, t_pluck / 0.003)
            mix.add(pluck.astype(np.float32), at + step * BEAT / 2, 0.07, 0.28 if step % 2 else 0.72)
        drums = at >= drums_from - 0.01
        for beat in range(4):
            if drums:
                # The bass steps: the root, and its octave on the last beat.
                f = HZ[root] / 4 * (2 if beat == 3 else 1)
                bass = (np.sin(2 * math.pi * f * t_bass) + 0.25 * np.sin(2 * math.pi * 2 * f * t_bass)) * np.exp(-t_bass * 4) * np.minimum(1, t_bass / 0.01)
                mix.add(bass.astype(np.float32), at + beat * BEAT, 0.2)
                mix.add(kick.astype(np.float32), at + beat * BEAT, 0.42 if beat % 2 == 0 else 0.3)
                if beat % 2 == 1:
                    mix.add(snap.astype(np.float32), at + beat * BEAT, 0.085, 0.55)
                for half in (0, 0.5):
                    shake = np.diff(rng.standard_normal(len(t_shake)) * np.exp(-t_shake * 80), prepend=0)
                    mix.add(shake.astype(np.float32), at + (beat + half) * BEAT, 0.05 if half else 0.028, 0.4)
        if at >= tune_from - 0.01:
            for note in TUNE[b % 4]:
                f = HZ[note[0]] * (note[2] if len(note) > 2 else 1) * 2
                bell = (np.sin(2 * math.pi * f * t_bell) + 0.35 * np.sin(2 * math.pi * 2.76 * f * t_bell) * np.exp(-t_bell * 9)) * np.exp(-t_bell * 3.6) * np.minimum(1, t_bell / 0.004)
                mix.add(bell.astype(np.float32), at + note[1] * BEAT, 0.05, 0.62)


def effects(mix, sweeps, pops, ticks, drops):
    """What the pictures sound like: a breath of air for a sweep, a small rise for a card, a tap for a callout or a coin."""
    rng = np.random.default_rng(3)
    for at in sweeps:
        tt = tone(0.55)
        air = np.convolve(rng.standard_normal(len(tt)), np.ones(24) / 24, mode='same') * np.sin(math.pi * tt / 0.55) ** 2
        mix.add(air.astype(np.float32), at - 0.08, 0.22, 0.5)
    for at in pops:
        tt = tone(0.12)
        pop = np.sin(2 * math.pi * (520 * tt + 1500 * tt ** 2)) * np.exp(-tt * 26)
        mix.add(pop.astype(np.float32), at, 0.1, 0.7)
    for i, at in enumerate(ticks):
        tt = tone(0.06)
        tick = np.sin(2 * math.pi * (1250 + 180 * (i % 3)) * tt) * np.exp(-tt * 70)
        mix.add(tick.astype(np.float32), at, 0.06, 0.3 if i % 2 else 0.7)
    for i, at in enumerate(drops):
        tt = tone(0.3)
        f = (392, 494, 784)[i % 3]
        ding = (np.sin(2 * math.pi * f * tt) + 0.4 * np.sin(2 * math.pi * 2 * f * tt)) * np.exp(-tt * (16 if i < 2 else 7))
        mix.add(ding.astype(np.float32), at, 0.13)


def track(path, ffmpeg, seconds):
    """A piece of music from a file, cut to the film's length (and begun again if it is shorter)."""
    # A little is taken out round 2.8 kHz, where the consonants of speech are, so words stay clear over it.
    raw = subprocess.run([ffmpeg, '-loglevel', 'error', '-i', str(path), '-af', 'highpass=f=45,equalizer=f=2800:t=q:w=1.2:g=-4',
                          '-f', 'f32le', '-ac', '2', '-ar', str(RATE), 'pipe:1'], check=True, capture_output=True).stdout
    data = np.frombuffer(raw, dtype=np.float32).reshape(-1, 2)
    n = int(seconds * RATE)
    while len(data) < n:
        data = np.concatenate([data, data])
    return data[:n].copy()


VOICE_RMS = 0.12  # how loud a spoken line is made (see `spoken_line`)
BED_DB, UNDER_VOICE_DB = -8.0, -16.0  # the music against the voice: between lines, and while someone is speaking


def soundtrack(seconds, spoken, drums_from, tune_from, ends, cues, music_file=None, ffmpeg=None):
    """The music and effects with the voice laid over them. The music steps well back while someone is speaking."""
    n = int(seconds * RATE)
    if music_file:
        bed = track(music_file, ffmpeg, seconds)
        # Set by how loud it is on average over the film, so any piece of music sits at the same level.
        bed *= VOICE_RMS * 10 ** (BED_DB / 20) / (math.sqrt(float(np.mean(bed ** 2))) or 1)
    else:
        made = Mix(seconds)
        music(made, drums_from, tune_from, ends)
        bed = np.stack([made.left, made.right], axis=1)
        bed *= VOICE_RMS * 10 ** (BED_DB / 20) / (math.sqrt(float(np.mean(bed ** 2))) or 1)
    sounds = Mix(seconds)
    effects(sounds, *cues)
    t = np.arange(n) / RATE
    fade = np.minimum(1, t / 0.8) * np.minimum(1, (seconds - t) / 2.6)
    voice = np.zeros(n, np.float32)
    for at, data in spoken:
        i = int(at * RATE)
        voice[i:i + len(data)] += data[: n - i]
    # Where someone is speaking, widened by a quarter of a second either side and smoothed, so the
    # music is already down when a line starts and does not pump between its words.
    speaking = np.zeros(n, np.float32)
    for at, data in spoken:
        speaking[max(0, int((at - 0.25) * RATE)): int((at + len(data) / RATE + 0.25) * RATE)] = 1
    window = int(0.35 * RATE)
    speaking = np.convolve(speaking, np.hanning(window) / np.hanning(window).sum(), mode='same')
    duck = (1 - (1 - 10 ** ((UNDER_VOICE_DB - BED_DB) / 20)) * speaking) * fade
    out = bed * duck[:, None] + np.stack([sounds.left, sounds.right], axis=1) * 0.55 * fade[:, None] + voice[:, None]
    out = np.tanh(out * 1.1) / 1.1
    out = out / np.abs(out).max() * 0.9

    # Said plainly, so the balance can be checked without ears: how far the voice stands over the music while it speaks.
    if len(spoken):
        on = speaking > 0.9
        under = math.sqrt(float(np.mean((bed * duck[:, None])[on] ** 2)))
        said = math.sqrt(float(np.mean(voice[np.abs(voice) > 0.01] ** 2)))
        print(f'while speaking the voice is {20 * math.log10(said / under):.1f} dB over the music; between lines the music is {BED_DB:.0f} dB under the voice')
    return out


def beats(seconds):
    """A length rounded up to whole pairs of beats, so that a scene always changes on one."""
    return math.ceil(seconds / (BEAT * 2) - 0.02) * BEAT * 2


def main():
    args = argparse.ArgumentParser()
    args.add_argument('--ffmpeg', required=True)
    args.add_argument('--kokoro', help='folder holding kokoro-v1.0.int8.onnx and voices-v1.0.bin')
    args.add_argument('--voice', help="a Kokoro voice with --kokoro (af_heart), otherwise one of the Mac's (Samantha)")
    args.add_argument('--music', help='a music file to play under the voice, instead of the bed made here')
    args.add_argument('--silent', action='store_true')
    args.add_argument('--reel', action='store_true', help='draw it upright, 1080 x 1920, as store/promo/fintraq-reel.mp4')
    args.add_argument('--out')
    opts = args.parse_args()
    if opts.reel:
        stand_upright()
    work = Path(tempfile.mkdtemp(prefix='fintraq-promo-'))

    def speak(text, speed=1.0):
        if opts.silent:
            return np.zeros(int(2.4 * RATE), np.float32)
        raw = kokoro(text, opts.voice or 'af_heart', speed, opts.kokoro) if opts.kokoro else say(text, opts.voice or 'Samantha', work / 'line.wav')
        return spoken_line(raw)

    # The timeline is laid out from how long each thing takes to say, then squared to the beat.
    spoken, sweeps, pops, ticks, drops = [], [], [], [], []
    asks, answers = speak(OPENING['asks'], 0.94), speak(OPENING['answers'], 0.94)
    asked = 0.35 + len(asks) / RATE
    opening = Opening(asked)
    spoken += [(0.35, asks), (opening.turn + 0.45, answers)]
    drops += [opening.turn + 0.12 + 0.17 * i + 0.2 for i in range(3)]
    at = beats(opening.turn + 0.45 + len(answers) / RATE + 0.5)
    starts = []
    for spec in SCENES:
        line = speak(*spec['says'])
        length = beats(max(4 * BEAT, 0.55 + len(line) / RATE + 0.75))
        starts.append((at, length))
        spoken.append((at + 0.55, line))
        sweeps.append(at)
        pops.append(at + CARD_AT_S)
        ticks += [at + PILL_AT_S + i * PILL_EVERY_S for i in range(len(spec['pills']))]
        at += length
    close_at = at
    sweeps.append(close_at)
    said = close_at + 0.6
    for text, speed in CLOSING['says']:
        line = speak(text, speed)
        spoken.append((said, line))
        said += len(line) / RATE + 0.4
    ends = beats(said - close_at + 0.3) + close_at  # where the last chord is struck
    total = ends + 2.6

    audio = work / 'sound.wav'
    with wave.open(str(audio), 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(RATE)
        mixed = soundtrack(total, [] if opts.silent else spoken, starts[0][0], starts[2][0], ends, (sweeps, pops, ticks, drops), opts.music, opts.ffmpeg)
        w.writeframes((np.clip(mixed, -1, 1) * 32767).astype(np.int16).tobytes())

    out = Path(opts.out or ROOT / 'store' / 'promo' / ('fintraq-reel.mp4' if opts.reel else 'fintraq-promo.mp4'))
    out.parent.mkdir(parents=True, exist_ok=True)
    ffmpeg = subprocess.Popen(
        [opts.ffmpeg, '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-', '-i', str(audio),
         '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-shortest', str(out)],
        stdin=subprocess.PIPE)

    # The parts in order, each with when it starts. Only two are ever held: the one showing and the one it sweeps away.
    parts = [(0.0, lambda: opening)] + [(start, (lambda i=i, spec=spec: Scene(i, spec))) for i, ((start, _), spec) in enumerate(zip(starts, SCENES))] + [(close_at, Closing)]
    made = {}

    def part(i):
        if i not in made:
            for old in [k for k in made if k < i - 1]:
                del made[old]
            made[i] = parts[i][1]()
        return made[i]

    for n in range(int(total * FPS)):
        t = n / FPS
        i = max(k for k, (start, _) in enumerate(parts) if t >= start)
        frame = part(i).frame(t - parts[i][0])
        if i > 0 and t - parts[i][0] < WIPE_S:
            frame = sweep(part(i - 1).frame(t - parts[i - 1][0]), frame, t - parts[i][0])
        ffmpeg.stdin.write(frame.convert('RGB').tobytes())
    ffmpeg.stdin.close()
    if ffmpeg.wait() != 0:
        sys.exit('ffmpeg failed')
    for f in work.iterdir():
        f.unlink()
    work.rmdir()
    print(f'{out.relative_to(ROOT)} written: {total:.1f}s, scenes at ' + ', '.join(f'{start:.1f}' for start, _ in starts) + f', close at {close_at:.1f}')


if __name__ == '__main__':
    main()
