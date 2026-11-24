# Prepara as imagens da Custom Works (rodar da raiz: python scripts/cw_imagens.py)
#   _shopee/s-NN.jpg  -> public/img/loja/<slug>.webp (800 px) e public/img/peca/<slug>.webp (1000 px) + -800
#   _ig/ig-NN.jpg     -> fotos da produção (ateliê) e a marca em linha branca (bloco verde)
import json, os, re, sys, unicodedata
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
J = lambda *p: os.path.join(ROOT, *p)

def slug(s):
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode()
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')

def save(im, path, w, q=84):
    im = im.copy()
    if im.width > w:
        im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    im.save(path, 'WEBP', quality=q, method=6)

# produtos: slug e src lidos de src/data/pecas.js
code = open(J('src', 'data', 'pecas.js'), encoding='utf-8').read()
prods = [{'slug': s, 'src': int(n)} for s, n in re.findall(r"slug: '([^']+)', src: (\d+)", code)]
for p in prods:
    im = Image.open(J('_shopee', f"s-{p['src']:02d}.jpg")).convert('RGB')
    s = p['slug']
    save(im, J('public', 'img', 'loja', f'{s}.webp'), 800, 80)
    save(im, J('public', 'img', 'peca', f'{s}.webp'), 1000, 86)
    save(im, J('public', 'img', 'peca', f'{s}-800.webp'), 800, 84)

# produção (três estados do ateliê), recorte retrato 4:5 centrado
def crop45(im, cx=0.5, cy=0.5):
    W, H = im.size
    tw, th = (W, round(W * 5 / 4)) if W * 5 / 4 <= H else (round(H * 4 / 5), H)
    x = min(max(0, round(W * cx - tw / 2)), W - tw); y = min(max(0, round(H * cy - th / 2)), H - th)
    return im.crop((x, y, x + tw, y + th))
for name, src, c in [('producao-1', 17, (0.5, 0.5)), ('producao-2', 14, (0.5, 0.55)), ('producao-3', 16, (0.5, 0.5))]:
    im = Image.open(J('_ig', f'ig-{src:02d}.jpg')).convert('RGB')
    save(crop45(im, *c), J('public', 'img', f'{name}.webp'), 1100, 82)

# marca em linha clara com alfa (a camiseta do logo), para o bloco verde
im = Image.open(J('_ig', 'ig-21.jpg')).convert('L')
w, h = im.size
im = im.crop((round(w * 0.2), round(w * 0.12), round(w * 0.8), round(w * 0.86)))
a = im.point(lambda v: 0 if v < 70 else min(255, (v - 70) * 255 // 150))
mark = Image.new('RGBA', im.size, (247, 248, 216, 0)); mark.putalpha(a)
save(mark, J('public', 'img', 'marca-linha.webp'), 900, 90)

# logo do perfil e foto de cliente para o rodapé/compartilhamento
save(Image.open(J('_ig', 'ig-19.jpg')).convert('RGB'), J('public', 'img', 'og.webp'), 1200, 82)
print('ok', len(prods), 'produtos')
