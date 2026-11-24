# Render do busto (PNG RGBA de scripts/busto.py) → quadros WebP com alfa para o canvas do giro + manifest.json.
# Corta todos os quadros na mesma caixa (a união do alfa), apaga a sombra perto das bordas do corte (o render corta
# a sombra no limite do quadro; sem isso ela viraria uma reta no site) e mede a caixa do mármore (alfa > 0,7),
# o eixo do giro e o pé do pedestal, para o site posicionar o busto pela pedra e não pelo PNG.
# Uso: python3 scripts/quadros.py <render> <saida> <largura> <q> <alfa_q> [--lum 14] [--deg 62,150] [--shadow 0.55]
#   site: python3 scripts/quadros.py ../render public/frames/giro 1100 80 82 --lum 3 --deg 0,180
#   ?hd:  python3 scripts/quadros.py ../render public/frames/giro-hd 1536 92 95 --lum 3 --deg 0,180
#   --lum: brilho mínimo que separa a peça da sombra (a sombra do shadow catcher é preta pura no RGB; o mármore
#   passa de 14, o moletom preto lavado fica em 3)
import glob, json, os, subprocess, sys, tempfile
import numpy as np
from PIL import Image

src, out, W, Q, AQ = sys.argv[1], sys.argv[2], int(sys.argv[3]), sys.argv[4], sys.argv[5]
SHADOW = float(sys.argv[sys.argv.index('--shadow') + 1]) if '--shadow' in sys.argv else 0.55   # intensidade da sombra de contato
# pixel opaco é sempre da peça (a sombra do shadow catcher não passa de alfa ~140): sem isso, o avesso do moletom,
# escuro no vão entre a manga e o corpo, caía como sombra e ficava translúcido
OPAQUE = 200
LUM = float(sys.argv[sys.argv.index('--lum') + 1]) if '--lum' in sys.argv else 14
DEG = [float(v) for v in sys.argv[sys.argv.index('--deg') + 1].split(',')] if '--deg' in sys.argv else [62, 150]
files = sorted(glob.glob(os.path.join(src, '*.png')))
first = Image.open(files[0]); FW, FH = first.size

# união do alfa (com sombra) e do mármore (sem sombra)
any_a = np.zeros((FH, FW), bool); solid = np.zeros((FH, FW), bool)
for f in files:
    im = np.asarray(Image.open(f).convert('RGBA'))
    a = im[..., 3]; lum = im[..., :3].mean(axis=2)
    any_a |= a > 16; solid |= (a > 178) & ((lum > LUM) | (a >= OPAQUE))
ys, xs = np.where(any_a)
pad = 8
x0, x1 = max(0, xs.min() - pad), min(FW, xs.max() + pad + 1)
y0, y1 = max(0, ys.min() - pad), min(FH, ys.max() + pad + 1)
sy, sx = np.where(solid)
cw, ch = x1 - x0, y1 - y0
obj = [float(v) for v in [(sx.min() - x0) / cw, (sx.max() + 1 - x0) / cw, (sy.min() - y0) / ch, (sy.max() + 1 - y0) / ch]]
axis = float((FW / 2 - x0) / cw)         # a câmera mira o eixo de giro: centro do quadro
# rampa de alfa nas bordas do corte (só a sombra chega lá)
fx = np.ones(cw); r = int(cw * 0.12)
fx[:r] = np.linspace(0, 1, r) ** 1.6; fx[-r:] = np.linspace(1, 0, r) ** 1.6
fy = np.ones(ch); rb = int(ch * 0.05)
fy[-rb:] = np.linspace(1, 0, rb) ** 1.6
fade = np.outer(fy, fx)

H = round(ch * W / cw)
os.makedirs(out, exist_ok=True)
for f in glob.glob(os.path.join(out, '*.webp')): os.remove(f)
tmp = tempfile.mkdtemp()
boxes = []
procs = []
for i, f in enumerate(files):
    im = Image.open(f).convert('RGBA').crop((x0, y0, x1, y1))
    arr = np.asarray(im).astype(np.float32)
    lum = arr[..., :3].mean(axis=2)
    marble = ((lum > LUM) & (arr[..., 3] > 30)) | (arr[..., 3] >= OPAQUE)
    # o mármore fica inteiro; a sombra (preta no alfa) fica mais leve e apaga perto das bordas do corte
    a = arr[..., 3] * np.where(marble, 1, fade * SHADOW)
    arr[..., 3] = a
    m = marble & (a > 178); yy, xx = np.where(m)
    boxes.append([round(float(xx.min()) / cw, 4), round(float(xx.max() + 1) / cw, 4), round(float(yy.min()) / ch, 4), round(float(yy.max() + 1) / ch, 4)])
    p = os.path.join(tmp, f'{i + 1:04d}.png')
    Image.fromarray(arr.clip(0, 255).astype(np.uint8)).resize((W, H), Image.LANCZOS).save(p)
    procs.append(subprocess.Popen(['cwebp', '-quiet', '-q', Q, '-alpha_q', AQ, '-m', '6', '-exact', p, '-o', os.path.join(out, f'{i + 1:04d}.webp')]))
    if len(procs) >= 8:
        for pr in procs: pr.wait()
        procs = []
for pr in procs: pr.wait()
size = sum(os.path.getsize(f) for f in glob.glob(os.path.join(out, '*.webp')))
man = {'count': len(files), 'width': W, 'height': H, 'ext': 'webp', 'alpha': True, 'bytes': size,
       'deg': DEG, 'axis': round(axis, 4), 'obj': [round(v, 4) for v in obj], 'box': boxes}
json.dump(man, open(os.path.join(out, 'manifest.json'), 'w'))
print(f'{out}: {len(files)} quadros {W}x{H}, {size / 1e6:.1f} MB, eixo {axis:.3f}, mármore {obj}')
