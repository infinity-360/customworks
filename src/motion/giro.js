// 01 Hero + giro: a seção tem 100svh + 360vh (celular 300vh) e o palco fica preso enquanto ela passa.
// A peça da capa é o Moletom aranha em 3D (render do Blender, scripts/roupa.py): o scroll dirige só o contínuo, o
// quadro do moletom (0° de frente → 180° de costas, onde está a aranha), o grau no canto e, no fim, o desfoque do
// moletom enquanto a Loja sobe por cima. Todo texto entra e sai por tempo, em marcos do progresso (beats.js).
//
// Roteiro (p = progresso do percurso, 0 → 1; f = quadro, 0–120; grau = f/120 × 180):
//   0,00–0,035  hero parado de frente                       logo grande, parágrafo, pílula, nav
//   0,035–0,36  gira de frente a perfil (f 0 → 60)          o logo encolhe para o canto; manifesto 1
//   0,36–0,70   de perfil às costas (f 60 → 120)            manifesto 2 + ficha da peça com "Ver a peça"
//   pOv–1       a Loja sobe por cima do palco (a última tela do percurso); o moletom desfoca e apaga atrás de "Loja"
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { loadFrames } from './frames.js';
import { monotone, clamp } from './curve.js';
import { beats } from './beats.js';
import { showLines, hideLines, split } from './split.js';
import { showWords, hideWords } from './blur.js';
import { EASE } from './ease.js';

// ?hd no endereço: o conjunto de 1536 px (WebP q92; só local) para gravar a prévia; a abertura segura até ele baixar
export const HD = new URLSearchParams(location.search).has('hd');

const SCRIPT = { p: [0, 0.035, 0.36, 0.7, 1], f: [0, 0, 60, 120, 120] };
const DEG = [0, 180];
// onde fica o moletom: eixo do giro (fração da largura), pé da sombra e altura da peça (frações da altura)
// (a barra do moletom fica em `base`; a sombra de contato cai embaixo dela, ~25% da altura da peça)
const PLACE = {
  desktop: { axis: 0.655, base: 0.8, h: 0.66, maxW: 0.5 },
  mobile: { axis: 0.5, base: 0.83, h: 0.42, maxW: 0.86 },
};
const REDUCED_F = [0, 60, 120];
// câmera (desktop, presa ao scroll): no marco 2 o moletom recua e sobe para a ficha da peça caber embaixo dele
const CAM = { p: [0, 0.37, 0.47, 0.7, 1], k: [1, 1, 0.84, 0.84, 0.84], base: [0, 0, -0.17, -0.17, -0.17] };
// movimento reduzido: três quadros fixos (frente, perfil, costas)

export function giro({ section, reduced, brand }) {
  const stage = section.querySelector('.giro__stage');
  const canvas = section.querySelector('.giro__canvas');
  const ctx = canvas.getContext('2d');
  const mq = matchMedia('(max-width: 760px)');
  const html = document.documentElement;
  const degN = section.querySelector('.giro__n');
  const toFrame = monotone(SCRIPT.p, SCRIPT.f);
  const camK = monotone(CAM.p, CAM.k);
  let camB = monotone(CAM.p, CAM.base);

  // celular: conjunto de 800 px (decodifica 2× mais rápido; a peça nunca passa de ~380 px de tela ali)
  const SMALL = matchMedia('(max-width: 760px)').matches && !HD;
  const B = import.meta.env.BASE_URL; // a pasta do site na hospedagem ("/" ou "/customworks/")
  let frames = loadFrames({ base: B + (HD ? 'frames/giro-hd' : SMALL ? 'frames/giro-m' : 'frames/giro'), concurrency: HD ? 8 : 6 });
  if (HD) frames.ready.catch(() => { frames = loadFrames({ base: B + 'frames/giro' }); frames.onLoad = onLoad; frames.onBitmap = onBitmap; });

  // ---- encaixe ----
  let cw = 0, ch = 0, dpr = 1, travel = 1, pOv = 0.72, mode = 'desktop';
  const box = { x: 0, y: 0, w: 0, h: 0 };
  function place(p = 0) {
    const m = frames.manifest || { width: 1100, height: 1243, axis: 0.466, obj: [0.0598, 0.8728, 0.0055, 0.7983] };
    const P = PLACE[mode];
    const [ox0, ox1, oy0, oy1] = m.obj;
    const k = mode === 'desktop' && !reduced ? camK(p) : 1;
    let s = (ch * P.h) / ((oy1 - oy0) * m.height);
    s = Math.min(s, (cw * P.maxW) / ((ox1 - ox0) * m.width)) * k;
    box.w = m.width * s; box.h = m.height * s;
    // no desktop a peça nunca encosta na coluna de texto (42% da largura)
    let ax = cw * P.axis;
    if (mode === 'desktop') ax = Math.max(ax, cw * 0.42 + (m.axis - ox0) * box.w);
    box.x = ax - m.axis * box.w;
    box.y = ch * (P.base + (mode === 'desktop' && !reduced ? camB(p) : 0)) - oy1 * box.h;
  }

  // ---- mouse (desktop): a peça acompanha o cursor alguns pixels, com atraso (viva mesmo parada) ----
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  if (!reduced && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    addEventListener('pointermove', (e) => {
      mouse.tx = (e.clientX / innerWidth - 0.5) * -14;
      mouse.ty = (e.clientY / innerHeight - 0.5) * -8;
    }, { passive: true });
    gsap.ticker.add(() => {
      const dx = mouse.tx - mouse.x, dy = mouse.ty - mouse.y;
      if (Math.abs(dx) < 0.05 && Math.abs(dy) < 0.05) return;
      mouse.x += dx * 0.06; mouse.y += dy * 0.06;
      if (canvas.style.visibility !== 'hidden' && state.p < 0.99) draw();
    });
  }

  // ---- desenho: quadro atual + o próximo por cima na fração, só quando muda ----
  const state = { p: 0, f: 0 };
  let lastKey = '', dir = 1, lastDeg = -1, lastLook = '';
  function draw(force) {
    if (!frames.count) return;
    const p = state.p;
    let f = toFrame(p);
    if (reduced) f = REDUCED_F[p < 0.2 ? 0 : p < 0.5 ? 1 : 2];
    state.f = f;
    place(p);
    const fi = (f * (frames.count - 1)) / 120; // o roteiro é em 121 quadros; o conjunto pode ter outro tamanho
    const i = Math.min(frames.count - 1, Math.floor(fi)), t = fi - i;
    const a = frames.images[i] || frames.nearest(i);
    if (!a) return;
    // bitmap exato, ou o vizinho decodificado mais perto; o <img> só antes do primeiro bitmap
    const exact = a === frames.images[i] ? frames.bitmap(i) : null;
    const base = exact || frames.nearestBitmap(i) || a;
    const nextB = exact && t > 0.03 ? frames.bitmap(i + 1) : null;
    const b = nextB || null;
    const key = `${i}|${b ? t.toFixed(2) : 0}|${base === exact ? 'x' : base === a ? 'i' : 'n'}|${a.src}|${cw}x${ch}|${box.w.toFixed(1)}|${box.y.toFixed(1)}|${mouse.x.toFixed(1)}|${mouse.y.toFixed(1)}`;
    if (key !== lastKey || force) {
      lastKey = key;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalAlpha = 1;
      const x = box.x + mouse.x, y = box.y + mouse.y;
      // mistura linear dos dois quadros: A·(1 − t) + B·t, somados ('lighter' soma as cores pré-multiplicadas e o alfa).
      // Desenhar B por cima com alfa t escurecia a sombra semitransparente no meio de cada troca e ela piscava.
      if (b) {
        ctx.globalAlpha = 1 - t; ctx.drawImage(base, x, y, box.w, box.h);
        ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = t; ctx.drawImage(b, x, y, box.w, box.h);
        ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
      } else ctx.drawImage(base, x, y, box.w, box.h);
      // bitmaps já reduzidos ao tamanho de tela quando o quadro é bem maior que o desenho (celular)
      const bw = Math.round(box.w * dpr);
      frames.warm(fi, dir, { width: bw < (frames.manifest?.width || 0) * 0.9 ? bw : 0 });
    }
    // grau no canto (HUD contínuo)
    const deg = Math.round(DEG[0] + (f / 120) * (DEG[1] - DEG[0]));
    if (deg !== lastDeg) { lastDeg = deg; degN.textContent = String(deg).padStart(3, '0'); }
    // fim: a Loja sobe por cima; o moletom desfoca, encolhe um pouco e apaga
    const o = clamp((p - pOv) / (1 - pOv));
    const blur = reduced ? 0 : 22 * clamp(o / 0.62) ** 1.2;
    const op = reduced ? (o > 0.3 ? 0 : 1) : 1 - clamp((o - 0.06) / 0.4);
    const sc = reduced ? 1 : 1 - 0.035 * clamp(o / 0.62);
    const look = `${blur.toFixed(1)}|${op.toFixed(3)}|${sc.toFixed(4)}`;
    if (look !== lastLook) {
      lastLook = look;
      canvas.style.filter = blur > 0.05 ? `blur(${blur.toFixed(1)}px)` : '';
      canvas.style.opacity = op;
      canvas.style.transform = sc < 1 ? `scale(${sc})` : '';
      canvas.style.visibility = op <= 0 ? 'hidden' : '';
    }
  }
  function onLoad(i) { if (Math.abs(i - (state.f * (frames.count - 1)) / 120) < 3 || !lastKey) draw(true); }
  frames.onLoad = onLoad;
  // quando o bitmap do quadro atual (ou do seguinte) fica pronto, redesenha com ele
  const onBitmap = (k) => { const fi = (state.f * (frames.count - 1)) / 120; if (k === Math.floor(fi) || k === Math.floor(fi) + 1) draw(true); };
  frames.onBitmap = onBitmap;

  // ---- marcos (texto por tempo) ----
  const heroP = section.querySelector('.hero__p');
  if (!reduced) split(heroP); // as linhas nascem escondidas: a abertura as revela
  const pill = section.querySelector('.hero__pill');
  const hint = section.querySelector('.giro__hint');
  const mani = [...section.querySelectorAll('.mani__t')];
  const maniBox = [...section.querySelectorAll('.mani')];
  const specs = section.querySelector('.specs');
  const degEl = section.querySelector('.giro__deg');
  [...specs.querySelectorAll('.specs__row')].forEach((r, k) => r.style.setProperty('--i', k));
  const hideTimer = new Map();
  const vis = (el, on, delay = 0.7) => {
    hideTimer.get(el)?.kill();
    if (on) gsap.set(el, { visibility: 'visible' });
    else hideTimer.set(el, gsap.delayedCall(reduced ? 0 : delay, () => gsap.set(el, { visibility: 'hidden' })));
  };
  const fadeEl = (el, on, dir) => {
    gsap.killTweensOf(el);
    if (reduced) return gsap.set(el, { opacity: on ? 1 : 0, y: 0 });
    if (on) gsap.fromTo(el, { opacity: 0, y: 14 * dir, filter: 'blur(8px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1, ease: EASE.out, clearProps: 'filter' });
    else gsap.to(el, { opacity: 0, y: -10 * dir, filter: 'blur(6px)', duration: 0.38, ease: EASE.in });
  };

  const heroItem = {
    a: -1, b: 0.035,
    enter: (d) => {
      html.classList.add('nav-top');
      brand?.to('hero', { duration: 1.1 });
      showLines(heroP, { dir: d, delay: 0.08, instant: reduced });
      fadeEl(pill, true, d); fadeEl(hint, true, d);
    },
    leave: (d) => {
      html.classList.remove('nav-top');
      brand?.to('nav', { duration: 1.05 });
      hideLines(heroP, { dir: d, instant: reduced });
      fadeEl(pill, false, d); fadeEl(hint, false, d);
    },
  };
  const maniItem = (k, a, b) => ({
    a, b,
    enter: (d) => { vis(maniBox[k], true); showWords(mani[k], { dir: d, delay: 0.12, instant: reduced }); },
    leave: (d) => { hideWords(mani[k], { dir: d, instant: reduced }); vis(maniBox[k], false); },
  });
  const items = [
    heroItem,
    maniItem(0, 0.075, 0.36),
    maniItem(1, 0.395, 0.68),
    { a: 0.43, b: 0.68, enter: () => specs.classList.add('is-on'), leave: () => specs.classList.remove('is-on') },
    { a: 0.05, b: 0.7, enter: () => degEl.classList.add('is-on'), leave: () => degEl.classList.remove('is-on') },
  ];
  const beat = beats(items);
  let started = false;

  // ---- medidas ----
  function layout() {
    mode = mq.matches ? 'mobile' : 'desktop';
    cw = stage.clientWidth; ch = stage.clientHeight;
    dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
    travel = Math.max(1, section.offsetHeight - ch);
    pOv = clamp(1 - ch / travel, 0.5, 0.95);
    // os marcos do fim nunca passam do começo da sobreposição
    items[2].b = items[3].b = Math.min(0.68, pOv - 0.03);
    items[4].b = pOv;
    // a barra do moletom no marco 2 fica 20 px acima da ficha (medida, para qualquer altura de tela)
    const specsTop = specs.offsetTop;
    if (specsTop > 0) {
      // a sombra (embaixo da barra) também tem que caber acima da ficha
      const d = Math.min(-0.08, (specsTop - 20 - ch * 0.1) / ch - PLACE.desktop.base);
      camB = monotone(CAM.p, CAM.base.map((v) => (v ? d : 0)));
    }
    place(state.p);
    lastKey = ''; lastLook = '';
    draw(true);
  }

  // ---- scroll ----
  let lastP = 0;
  const st = ScrollTrigger.create({
    trigger: section, start: 'top top', end: 'bottom bottom', refreshPriority: 1,
    onUpdate: (self) => {
      state.p = self.progress;
      if (self.progress !== lastP) dir = self.progress > lastP ? 1 : -1;
      draw();
      if (started) {
        beat.update(state.p, dir);
        // seja qual for o caminho até aqui (salto por âncora, recarga, voo da abertura), passou do hero = logo no canto
        if (state.p >= items[0].b && brand && brand.state !== 'nav') { brand.to('nav', { duration: 0.8 }); html.classList.remove('nav-top'); }
      }
      lastP = self.progress;
    },
    onRefresh: (self) => { state.p = self.progress; },
  });

  frames.first.then(() => layout());
  mq.addEventListener('change', () => layout());

  return {
    frames: () => frames,
    layout,
    st,
    canvas,
    /** a abertura chama no fim: o parágrafo, a pílula e a nav entram; os marcos passam a valer */
    heroIn() {
      started = true;
      // chegou já depois do hero (/#loja): o logo vai direto para o canto
      if (state.p >= items[0].b) { brand?.set('nav'); html.classList.remove('nav-top'); }
      beat.update(state.p, 1);
    },
  };
}
