"""
Builds the one page collab sheet we send to community managers.

Run it again whenever a TBA turns into a real answer:

    pip install reportlab
    python scripts/collab_sheet.py

Everything that can change lives in FACTS, LINKS, REQUIREMENTS, NOTES and CARDS
near the top. The drawing code below reads those and nothing else, so updating
the mint price is a one line edit rather than a redesign.

The look is the site's: aged paper, hard ink rules, black section bars, flat
green, and offset shadows with no blur. Fonts fall back to what Windows ships,
which is roughly what the site itself resolves to for the display face.
"""

from __future__ import annotations

import os

from io import BytesIO

from PIL import Image
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "collab", "squib-society-collab.pdf")

# ── the content ───────────────────────────────────────────────────────────

HANDLE = "@SquibSociety"
DOMAIN = "squibsociety.xyz"
POST = "https://x.com/SquibSociety/status/2090843215754928485"

TITLE = "Squib Society"
KICKER = "369 SQUIBS ON ROBINHOOD CHAIN"
LEAD = "just squibs being squibs."

BLURB = (
    "Round green head, small tentacle mouth, two very shiny eyes, and whatever outfit fits "
    "what they are into. Some skate, one cooks, one has a paper bag on his head. There are "
    "369 of them, each one modelled and shot on its own, and no two are the same. The "
    "allowlist goes first and it may never open to public."
)

LINKS = [
    ("X", "https://x.com/SquibSociety"),
    ("WEB", "https://squibsociety.xyz"),
    ("POST", POST),
]

REQUIREMENTS = [
    "Follow " + HANDLE + " on X",
    "Like the pinned post",
    "Repost the pinned post",
    "Quote the pinned post mentioning " + HANDLE,
]
REQUIREMENTS_NOTE = (
    "The same four things the allowlist asks for on the site, so nobody does the work twice."
)

NOTES = [
    "Winner sheet needs the X handle and the EVM wallet address for each winner",
    "Please share proof of distribution once the giveaway closes",
    "Spots are GTD or WL. Tell us which one when you confirm the collab",
    "Winners go straight onto the allowlist at " + DOMAIN + ", nothing else to claim",
    "No Discord involved. An X handle is enough for us to verify a winner",
    "Winner sheet within 24 hours of the giveaway ending",
]

# label, value, small caption under the value, highlight
CARDS = [
    ("SUPPLY", "369", "fixed, no second batch", True),
    ("CHAIN", "Robinhood Chain", "EVM, Arbitrum L2", False),
    ("MINT VENUE", "OpenSea", "never on our site", False),
    ("MINT DATE", "TBA", "announced on X first", False),
    ("GTD MINT PRICE", "TBA", "guaranteed spot", False),
    ("WL MINT PRICE", "TBA", "allowlist spot", False),
]

ART = [
    "0009-mage-squib.png",
    "0052-fox-squib.png",
    "0184-lotus-squib.png",
    "0080-warden-squib.png",
    "0369-skullknit-squib.png",
]

# ── the palette, straight off tailwind.config.ts ───────────────────────────

PAPER = HexColor("#E9E1CF")
SURFACE = HexColor("#F6F1E3")
INK = HexColor("#17150F")
GREEN = HexColor("#56B947")
DEEP = HexColor("#2E7226")
WASH = HexColor("#DDEBD4")
MUTED = HexColor("#5C564A")

W, H = A4
M = 26.0
CW = W - 2 * M

# ── fonts ─────────────────────────────────────────────────────────────────

FONTS = "C:/Windows/Fonts"


def _register(name: str, filename: str, fallback: str) -> str:
    """Use the real face when it is installed, otherwise a built in."""
    path = os.path.join(FONTS, filename)
    if os.path.exists(path):
        pdfmetrics.registerFont(TTFont(name, path))
        return name
    return fallback


# Display is a heavy serif standing in for the slab the site asks for; body is
# a plain grotesk; mono carries every label, stamp and URL.
DISPLAY = _register("SquibDisplay", "georgiab.ttf", "Times-Bold")
BODY = _register("SquibBody", "segoeui.ttf", "Helvetica")
BODY_B = _register("SquibBodyB", "segoeuib.ttf", "Helvetica-Bold")
MONO = _register("SquibMono", "consola.ttf", "Courier")
MONO_B = _register("SquibMonoB", "consolab.ttf", "Courier-Bold")


# ── small drawing helpers ─────────────────────────────────────────────────


def stamp(c, x, y, text, size=7.5, font=MONO_B, colour=INK, space=1.4, right=None):
    """Uppercase, letterspaced, the site's stamp treatment.

    Letterspacing only exists on a text object, so this goes the long way round
    rather than using drawString.
    """
    if right is not None:
        x = right - (pdfmetrics.stringWidth(text, font, size) + space * len(text))
    t = c.beginText(x, y)
    t.setFont(font, size)
    t.setCharSpace(space)
    t.setFillColor(colour)
    t.textOut(text)
    # Tc is graphics state, not text object state: leave it set and every plain
    # drawString after this one comes out spaced like a stamp too.
    t.setCharSpace(0)
    c.drawText(t)


_IMAGES: dict[str, ImageReader] = {}


def art(path: str, px: int = 620) -> ImageReader:
    """Shrink before embedding.

    The source renders are 1200 square. Dropped in whole they make an eleven
    megabyte sheet nobody wants in a DM, and none of it survives a tile 130
    points wide.
    """
    key = "%s@%d" % (path, px)
    if key not in _IMAGES:
        im = Image.open(path)
        im.thumbnail((px, px), Image.LANCZOS)
        buf = BytesIO()
        if im.mode in ("RGBA", "LA", "P"):
            im.convert("RGBA").save(buf, "PNG", optimize=True)
        else:
            im.convert("RGB").save(buf, "JPEG", quality=86, optimize=True)
        buf.seek(0)
        _IMAGES[key] = ImageReader(buf)
    return _IMAGES[key]


def speckle(c):
    """The faint fibre grid the site paints on its body background.

    Same idea as the radial gradient in globals.css: close enough in tone that
    you read it as paper stock rather than as dots.
    """
    c.setFillColor(HexColor("#DFD6C1"))
    step, r = 7.0, 0.42
    x = 0.0
    while x < W:
        y = 0.0
        while y < H:
            c.circle(x, y, r, stroke=0, fill=1)
            y += step
        x += step


def rule(c, y, weight=2.0):
    c.setStrokeColor(INK)
    c.setLineWidth(weight)
    c.line(M, y, W - M, y)


def section(c, y, label):
    """A solid ink bar with the label knocked out of it. Returns the new y."""
    h = 20.0
    c.setFillColor(INK)
    c.rect(M, y - h, CW, h, stroke=0, fill=1)
    stamp(c, M + 9, y - h + 6.8, label, size=8, colour=SURFACE, space=2.0)
    return y - h


def shadow_box(c, x, y, w, h, fill, offset=3.0, weight=1.4):
    """Filled block over a hard ink offset. No blur, that is the whole point."""
    c.setFillColor(INK)
    c.rect(x + offset, y - offset, w, h, stroke=0, fill=1)
    c.setFillColor(fill)
    c.setStrokeColor(INK)
    c.setLineWidth(weight)
    c.rect(x, y, w, h, stroke=1, fill=1)


def wrap(text, font, size, width):
    words, lines, line = text.split(), [], ""
    for word in words:
        trial = (line + " " + word).strip()
        if pdfmetrics.stringWidth(trial, font, size) <= width:
            line = trial
        else:
            lines.append(line)
            line = word
    if line:
        lines.append(line)
    return lines


def paragraph(c, x, y, text, font, size, leading, width, colour=INK):
    c.setFont(font, size)
    c.setFillColor(colour)
    for line in wrap(text, font, size, width):
        c.drawString(x, y, line)
        y -= leading
    return y


# ── the sheet ─────────────────────────────────────────────────────────────


def build(path: str) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    c = canvas.Canvas(path, pagesize=A4)
    c.setTitle("Squib Society collab sheet")
    c.setAuthor(HANDLE)
    c.setSubject("369 squibs on Robinhood Chain")

    # paper, then the ink band across the top edge
    c.setFillColor(PAPER)
    c.rect(0, 0, W, H, stroke=0, fill=1)
    speckle(c)
    c.setFillColor(INK)
    c.rect(0, H - 9, W, 9, stroke=0, fill=1)

    y = H - 9

    # ── header ────────────────────────────────────────────────────────────
    logo = os.path.join(ROOT, "public", "logo", "squib-logo-transparent.png")
    mark = 50.0
    if os.path.exists(logo):
        c.drawImage(
            art(logo, 200),
            M,
            y - mark - 12,
            width=mark,
            height=mark,
            mask="auto",
            preserveAspectRatio=True,
        )

    tx = M + mark + 12
    c.setFont(DISPLAY, 27)
    c.setFillColor(INK)
    c.drawString(tx, y - 34, TITLE)
    stamp(c, tx + 1, y - 48, KICKER, size=8, space=1.9, colour=DEEP)

    chip = "COLLAB SHEET"
    chip_w = pdfmetrics.stringWidth(chip, MONO_B, 7.5) + 7.5 * 2 + 18
    c.setFillColor(INK)
    c.rect(W - M - chip_w, y - 40, chip_w, 17, stroke=0, fill=1)
    stamp(c, W - M - chip_w + 9, y - 34.5, chip, size=7.5, colour=SURFACE, space=2.0)

    y = y - mark - 22
    rule(c, y, 3.0)

    # ── the art, because a CM wants to see it before reading anything ──────
    y -= 13
    tiles, gap = len(ART), 8.0
    tw = (CW - gap * (tiles - 1)) / tiles
    th = tw
    for i, name in enumerate(ART):
        f = os.path.join(ROOT, "public", "squibs", name)
        x = M + i * (tw + gap)
        shadow_box(c, x, y - th, tw, th, SURFACE, offset=3.0, weight=1.4)
        if os.path.exists(f):
            pad = 3.0
            c.drawImage(
                art(f),
                x + pad,
                y - th + pad,
                width=tw - 2 * pad,
                height=th - 2 * pad,
                mask="auto",
                preserveAspectRatio=True,
                anchor="c",
            )
    y -= th + 20

    # ── the pitch ─────────────────────────────────────────────────────────
    c.setFont(DISPLAY, 13.5)
    c.setFillColor(DEEP)
    c.drawString(M, y, LEAD)
    lead_w = pdfmetrics.stringWidth(LEAD, DISPLAY, 13.5)
    c.setFillColor(GREEN)
    c.rect(M, y - 8.5, lead_w, 3, stroke=0, fill=1)
    y -= 19
    y = paragraph(c, M, y, BLURB, BODY, 9.5, 13.2, CW, MUTED)

    # ── links ─────────────────────────────────────────────────────────────
    y -= 8
    y = section(c, y, "LINKS")
    y -= 15
    for label, url in LINKS:
        stamp(c, M + 2, y, label + ":", size=7.5, space=1.2)
        c.setFont(MONO, 8.5)
        c.setFillColor(DEEP)
        c.drawString(M + 56, y, url)
        # A CM reads this on a phone. Make the URLs tappable rather than
        # something they have to retype.
        c.linkURL(
            url,
            (M + 56, y - 3, M + 56 + pdfmetrics.stringWidth(url, MONO, 8.5), y + 9),
            relative=0,
            thickness=0,
        )
        y -= 14

    # ── requirements ──────────────────────────────────────────────────────
    y -= 4
    y = section(c, y, "REQUIREMENTS")
    y -= 20
    box = 15.0
    for i, item in enumerate(REQUIREMENTS, start=1):
        shadow_box(c, M + 2, y - 3, box, box, GREEN, offset=2.0, weight=1.2)
        c.setFont(MONO_B, 8)
        c.setFillColor(INK)
        c.drawCentredString(M + 2 + box / 2, y + 1.5, "%02d" % i)
        c.setFont(BODY, 10)
        c.drawString(M + box + 14, y + 1.5, item)
        y -= 21
    c.setFont(BODY, 8.5)
    c.setFillColor(MUTED)
    c.drawString(M + 2, y + 3, REQUIREMENTS_NOTE)
    y -= 8

    # ── notes for the CM ──────────────────────────────────────────────────
    y = section(c, y, "NOTES FOR CM")
    y -= 17
    for item in NOTES:
        c.setFillColor(INK)
        c.setStrokeColor(INK)
        c.setLineWidth(1.0)
        c.rect(M + 3, y - 0.5, 5, 5, stroke=1, fill=1)
        c.setFont(BODY, 9.5)
        c.drawString(M + 17, y, item)
        y -= 15.5

    # ── the numbers ───────────────────────────────────────────────────────
    y -= 4
    y = section(c, y, "COLLECTION INFO")
    y -= 10

    cols, cgap = 3, 9.0
    cw = (CW - cgap * (cols - 1)) / cols
    ch = 48.0
    for i, (label, value, caption, highlight) in enumerate(CARDS):
        col, row = i % cols, i // cols
        x = M + col * (cw + cgap)
        top = y - row * (ch + cgap + 3)
        shadow_box(c, x, top - ch, cw, ch, GREEN if highlight else SURFACE)
        stamp(c, x + 9, top - 15, label, size=6.8, space=1.3, colour=INK if highlight else MUTED)
        c.setFont(DISPLAY, 15 if len(value) < 12 else 12.5)
        c.setFillColor(INK)
        c.drawString(x + 9, top - 32, value)
        c.setFont(BODY, 7.5)
        c.setFillColor(INK if highlight else MUTED)
        c.drawString(x + 9, top - 42, caption)

    y = y - 2 * (ch + cgap + 3) - 6

    # ── footer ────────────────────────────────────────────────────────────
    rule(c, y, 2.0)
    y -= 16
    c.setFont(DISPLAY, 12)
    c.setFillColor(INK)
    c.drawString(M, y, DOMAIN)
    c.setFont(BODY, 9)
    c.setFillColor(MUTED)
    c.drawString(M, y - 12, HANDLE)
    stamp(c, 0, y, "369 SQUIBS", size=8, colour=DEEP, space=2.0, right=W - M)
    stamp(c, 0, y - 12, "ROBINHOOD CHAIN", size=7.5, colour=MUTED, space=1.8, right=W - M)

    c.setFillColor(INK)
    c.rect(0, 0, W, 6, stroke=0, fill=1)

    c.showPage()
    c.save()
    print("wrote", path, "%.0f KB" % (os.path.getsize(path) / 1024))


if __name__ == "__main__":
    build(OUT)
