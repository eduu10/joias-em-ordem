"""Monta as capas 3D: arte gerada (sem texto) + titulo dourado com contorno.

Uso: python covers/src/build-3d.py <pasta-com-as-artes>
Cada arte deve se chamar <id>.webp (ou .png) dentro da pasta.
"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

FONT = "C:/Windows/Fonts/ariblk.ttf"
OUT = Path(__file__).resolve().parent.parent
PORTRAIT = (1080, 1620)
LANDSCAPE = (1280, 720)
SAFE = 0.06

GAMES = [
    ("joias-em-ordem", ["JOIAS", "EM ORDEM"]),
    ("guardioes-da-fusao", ["GUARDIÕES", "DA FUSÃO"]),
    ("fusao-cosmica", ["FUSÃO", "CÓSMICA"]),
    ("blocos-de-cristal", ["BLOCOS", "DE CRISTAL"]),
    ("corrida-nas-nuvens", ["CORRIDA", "NAS NUVENS"]),
    ("qual-e-a-melodia", ["QUAL É A", "MELODIA?"]),
    ("complete-a-cantiga", ["COMPLETE A", "CANTIGA!"]),
    ("batida-total", ["BATIDA", "TOTAL"]),
]


def cover_crop(img, size):
    """Redimensiona preenchendo o tamanho e corta o excesso pelo centro."""
    w, h = size
    scale = max(w / img.width, h / img.height)
    resized = img.resize((round(img.width * scale), round(img.height * scale)), Image.LANCZOS)
    left = (resized.width - w) // 2
    top = (resized.height - h) // 2
    return resized.crop((left, top, left + w, top + h))


def fit_font(draw, lines, max_w, max_size):
    size = max_size
    while size > 20:
        font = ImageFont.truetype(FONT, size)
        widest = max(draw.textlength(line, font=font) for line in lines)
        if widest <= max_w:
            return font
        size -= 4
    return ImageFont.truetype(FONT, size)


def gold_layer(size, box):
    """Degrade dourado vertical recortado depois pela mascara do texto."""
    w, h = size
    top, bottom = box
    grad = Image.new("RGB", (1, h))
    for y in range(h):
        t = min(1, max(0, (y - top) / max(1, bottom - top)))
        r = 255
        g = round(244 - 70 * t)
        b = round(170 - 130 * t)
        grad.putpixel((0, y), (r, g, b))
    return grad.resize((w, h))


def draw_title(base, lines, area):
    """Escreve o titulo dentro de area=(x0, y0, x1, y1) com sombra, contorno e brilho."""
    x0, y0, x1, y1 = area
    w, h = base.size
    probe = ImageDraw.Draw(base)
    font = fit_font(probe, lines, x1 - x0, round((y1 - y0) / len(lines) * 0.92))
    asc, desc = font.getmetrics()
    line_h = asc + desc
    total = line_h * len(lines)
    top = y0 + ((y1 - y0) - total) // 2
    stroke = max(6, font.size // 9)

    mask = Image.new("L", (w, h), 0)
    outline = Image.new("L", (w, h), 0)
    md, od = ImageDraw.Draw(mask), ImageDraw.Draw(outline)
    for i, line in enumerate(lines):
        tw = probe.textlength(line, font=font)
        x = x0 + ((x1 - x0) - tw) / 2
        y = top + i * line_h
        md.text((x, y), line, font=font, fill=255)
        od.text((x, y), line, font=font, fill=255, stroke_width=stroke, stroke_fill=255)

    glow = outline.filter(ImageFilter.GaussianBlur(stroke * 2.2))
    base.paste(Image.new("RGB", (w, h), (255, 190, 80)), (0, 0), glow.point(lambda v: v * 0.55))
    shadow = outline.filter(ImageFilter.GaussianBlur(stroke * 0.8))
    base.paste(Image.new("RGB", (w, h), (0, 0, 0)), (0, round(stroke * 0.9)), shadow.point(lambda v: v * 0.8))
    base.paste(Image.new("RGB", (w, h), (40, 14, 70)), (0, 0), outline)
    base.paste(gold_layer((w, h), (top, top + total)), (0, 0), mask)
    shine = Image.new("RGB", (w, h), (255, 255, 255))
    band = Image.new("L", (w, h), 0)
    ImageDraw.Draw(band).rectangle((0, top, w, top + line_h * 0.32), fill=70)
    base.paste(shine, (0, 0), Image.composite(band, Image.new("L", (w, h), 0), mask))
    return base


def darken_top(img, frac):
    """Escurece o alto da imagem para o titulo ler bem."""
    w, h = img.size
    grad = Image.new("L", (1, h))
    limit = h * frac
    for y in range(h):
        grad.putpixel((0, y), round(max(0, 1 - y / limit) * 150))
    shade = Image.new("RGB", (w, h), (10, 4, 24))
    img.paste(shade, (0, 0), grad.resize((w, h)))
    return img


def vignette(img):
    w, h = img.size
    mask = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mask).ellipse((-w * 0.25, -h * 0.2, w * 1.25, h * 1.2), fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(min(w, h) * 0.12))
    dark = Image.new("RGB", (w, h), (0, 0, 0))
    return Image.composite(img, Image.blend(img, dark, 0.55), mask)


def portrait(art, lines):
    img = vignette(darken_top(cover_crop(art, PORTRAIT), 0.42))
    w, h = PORTRAIT
    m = round(w * SAFE)
    return draw_title(img, lines, (m, round(h * 0.045), w - m, round(h * 0.27)))


def landscape(art, lines):
    w, h = LANDSCAPE
    bg = cover_crop(art, LANDSCAPE).filter(ImageFilter.GaussianBlur(28))
    bg = Image.blend(bg, Image.new("RGB", LANDSCAPE, (10, 4, 24)), 0.35)
    fg_h = h
    fg = art.resize((round(art.width * fg_h / art.height), fg_h), Image.LANCZOS)
    fade = Image.new("L", fg.size, 255)
    fd = ImageDraw.Draw(fade)
    edge = round(fg.width * 0.18)
    for x in range(edge):
        fd.line((x, 0, x, fg_h), fill=round(255 * x / edge))
    bg.paste(fg, (w - fg.width, 0), fade)
    m = round(h * SAFE)
    img = vignette(bg)
    return draw_title(img, lines, (m, m, w - fg.width + edge // 2, h - m))


def main(src_dir):
    src = Path(src_dir)
    for game_id, lines in GAMES:
        art_path = next((p for p in (src / f"{game_id}.webp", src / f"{game_id}.png") if p.exists()), None)
        if art_path is None:
            print(f"sem arte para {game_id}")
            continue
        art = Image.open(art_path).convert("RGB")
        portrait(art, lines).save(OUT / f"{game_id}-portrait.png", optimize=True)
        landscape(art, lines).save(OUT / f"{game_id}-landscape.png", optimize=True)
        print(f"ok {game_id}")


if __name__ == "__main__":
    main(sys.argv[1])
