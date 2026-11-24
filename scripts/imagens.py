# Imagens geradas ou fotografadas (fonte/) → versões web (WebP) em public/img/. Os PNG sem alfa viram JPG q90 em fonte/.
#
# Roupas, para cada peça de src/data/pecas.js (lista abaixo, a mesma ordem): frente, costas e modelo.
#   1. O branco do estúdio não é 255 exato: a mediana da borda vai a 255 por canal (níveis).
#   2. Mesma escala entre peças: a caixa da roupa (pixels que não são branco) cabe em 80% do quadro (boné 58% da
#      largura); no modelo, a pessoa ocupa 88% da altura com o pé a 95%, centrada pelo corpo.
#   3. Branco puro: o que passa de 244 vira 255 numa rampa curta (some o ruído do fundo, a sombra suave fica) e uma
#      faixa de 40 px nas bordas é levada a 255 com degradê: as fotos se emendam na página da peça sem fio nenhum.
#   Saídas: public/img/peca/<img>-<vista>.webp (1200 × 1500) e -800.webp (800 × 1000), fundo #ffffff exato;
#           public/img/loja/<img>-frente|costas.webp (720 × 900), multiplicadas pela cor do card (#f4f2f0).
# Uso (da pasta da template): python3 scripts/imagens.py   (precisa de Pillow e numpy)
import glob, os, sys
import numpy as np
from PIL import Image

CARD = np.array((0xF4, 0xF2, 0xF0), np.float32) / 255.0
PECAS = ['moletom-aranha', 'calca-01', 'jaqueta-peonia', 'camiseta-teia', 'calca-branca-03', 'bone-aranha', 'camisa-vermelha',
         'moletom-teia', 'camiseta-flor', 'bermuda-galho', 'camisa-galho', 'camiseta-aranha']
OUTRAS = {'bastidor-1': 1024, 'bastidor-2': 1024, 'bastidor-3': 1024, 'etiqueta': 640}
W, H = 1200, 1500
os.makedirs('public/img/peca', exist_ok=True)
os.makedirs('public/img/loja', exist_ok=True)


def src(n):
    for ext in ('png', 'jpg'):
        p = f'fonte/{n}.{ext}'
        if os.path.exists(p): return p
    return None


def to_jpg(p):
    if p.endswith('.png'):
        im = Image.open(p)
        if im.mode in ('RGBA', 'LA') and im.getextrema()[-1][0] < 255: return p  # tem alfa de verdade: fica PNG
        im.convert('RGB').save(p[:-4] + '.jpg', quality=90); os.remove(p); return p[:-4] + '.jpg'
    return p


def levels(a):
    edge = np.concatenate([a[:12].reshape(-1, 3), a[-12:].reshape(-1, 3), a[:, :12].reshape(-1, 3), a[:, -12:].reshape(-1, 3)])
    return np.clip(a * (255.0 / np.median(edge, axis=0)), 0, 255)


def bbox(a):
    mn, mx = a.min(axis=2), a.max(axis=2)
    m = (mn < 236) | ((mx - mn) > 14)
    rows = np.where(m.sum(axis=1) > 4)[0]; cols = np.where(m.sum(axis=0) > 4)[0]
    return cols[0], rows[0], cols[-1] + 1, rows[-1] + 1


def whiten(a):
    mn = a.min(axis=2, keepdims=True)
    t = np.clip((mn - 244.0) / 8.0, 0, 1)
    a = a * (1 - t) + 255.0 * t
    # faixa das bordas: 255 exato nos últimos 12 px, degradê até 40 px
    h, w = a.shape[:2]
    y = np.minimum(np.arange(h), np.arange(h)[::-1])[:, None]
    x = np.minimum(np.arange(w), np.arange(w)[::-1])[None, :]
    d = np.minimum(x, y).astype(np.float32)
    k = np.clip((40.0 - d) / 28.0, 0, 1)[..., None]
    return a * (1 - k) + 255.0 * k


def place(a, view, name):
    x0, y0, x1, y1 = bbox(a)
    bw, bh = x1 - x0, y1 - y0
    if view == 'modelo':
        s = 0.88 * H / bh
        cx = (x0 + x1) / 2; ox = W / 2 - cx * s; oy = 0.95 * H - y1 * s
    else:
        fw = 0.58 if name.startswith('bone') else 0.80
        s = min(fw * W / bw, 0.80 * H / bh)
        ox = W / 2 - (x0 + x1) / 2 * s; oy = H / 2 - (y0 + y1) / 2 * s
    im = Image.fromarray(a.round().astype(np.uint8))
    im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    out = Image.new('RGB', (W, H), (255, 255, 255))
    out.paste(im, (round(ox), round(oy)))
    return np.asarray(out).astype(np.float32)


def save_webp(arr, path, q):
    im = Image.fromarray(np.clip(arr, 0, 255).round().astype(np.uint8))
    im.save(path, quality=q, method=6)


worst = 255
for name in PECAS:
    for view in ('frente', 'costas', 'modelo'):
        p = src(f'{name}-{view}')
        if not p: print('falta', name, view); continue
        a = levels(np.asarray(Image.open(p).convert('RGB')).astype(np.float32))
        a = whiten(place(a, view, name))
        save_webp(a, f'public/img/peca/{name}-{view}.webp', 84)
        small = np.asarray(Image.fromarray(a.round().astype(np.uint8)).resize((800, 1000), Image.LANCZOS)).astype(np.float32)
        save_webp(whiten(small), f'public/img/peca/{name}-{view}-800.webp', 82)
        # confere: a borda da versão web, decodificada, é 255 exato
        for f in (f'public/img/peca/{name}-{view}.webp', f'public/img/peca/{name}-{view}-800.webp'):
            d = np.asarray(Image.open(f).convert('RGB'))
            border = np.concatenate([d[:6].reshape(-1, 3), d[-6:].reshape(-1, 3), d[:, :6].reshape(-1, 3), d[:, -6:].reshape(-1, 3)])
            worst = min(worst, int(border.min()))
        if view != 'modelo':
            card = np.asarray(Image.fromarray(a.round().astype(np.uint8)).resize((720, 900), Image.LANCZOS)).astype(np.float32) * CARD
            save_webp(card, f'public/img/loja/{name}-{view}.webp', 82)
        if '--keep-png' not in sys.argv: to_jpg(p)
print('menor valor de borda nas fotos da página:', worst)

for n, w in OUTRAS.items():
    p = src(n)
    if not p: print('falta', n); continue
    im = Image.open(p).convert('RGB')
    im.resize((w, round(im.height * w / im.width)), Image.LANCZOS).save(f'public/img/{n}.webp', quality=82, method=6)
    to_jpg(p)
tot = sum(os.path.getsize(f) for f in glob.glob('public/img/**/*.webp', recursive=True))
print(f'public/img: {tot / 1e6:.2f} MB')
