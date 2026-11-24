// 03 Ateliê: palco preso por 170vh. O scroll dirige o relógio (00:00 → 14:00), a barra vermelha e o bordado da
// foto (risco a giz → metade → pronto, com desfoque cruzado). Rótulo, título e números entram por tempo quando o
// palco chega; os números contam até o valor.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { showLines, hideLines, split } from './split.js';
import { clamp } from './curve.js';
import { EASE } from './ease.js';

const HOURS = 14;
const T0 = 0.06, T1 = 0.9;                 // o relógio anda entre esses progressos
const CUTS = [0.34, 0.68];                 // troca de estado do bordado (centro do desfoque)
const W = 0.07;                            // meia largura da troca
const STATES = ['Arte', 'Estampa em DTF', 'Pedido pronto'];

export function atelie({ reduced }) {
  const sec = document.querySelector('.atelie');
  const imgs = [...sec.querySelectorAll('.atelie__img')];
  const hEl = sec.querySelector('.clock__h'), mEl = sec.querySelector('.clock__m');
  const bar = sec.querySelector('.clock__bar i');
  const stateEl = sec.querySelector('.atelie__state');
  const splits = [...sec.querySelectorAll('.atelie__side [data-split]')];
  const nums = [...sec.querySelectorAll('[data-count]')];
  const numItems = [...sec.querySelectorAll('.nums li')];
  let lastTxt = '', lastState = -1, shown = false;

  const smooth = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0)); return t * t * (3 - 2 * t); };
  function update(p) {
    const t = clamp((p - T0) / (T1 - T0));
    // Custom Works: o contador vai de 000% a 100% (da arte ao pedido pronto), de 5 em 5
    const txt = String(Math.round(t * 20) * 5).padStart(3, '0');
    if (txt !== lastTxt) { lastTxt = txt; hEl.textContent = txt; }
    bar.style.transform = `scaleX(${t.toFixed(4)})`;
    // bordado: cada estado por cima do anterior; desfoque no meio da troca
    const k1 = reduced ? (p > CUTS[0] ? 1 : 0) : smooth(CUTS[0] - W, CUTS[0] + W, p);
    const k2 = reduced ? (p > CUTS[1] ? 1 : 0) : smooth(CUTS[1] - W, CUTS[1] + W, p);
    imgs[1].style.opacity = k1; imgs[2].style.opacity = k2;
    const scale = reduced ? 1 : 1.08 - 0.08 * p;
    // só o estado que está chegando desfoca (filtro em uma imagem por vez)
    const b1 = reduced ? 0 : 9 * Math.sin(Math.PI * k1), b2 = reduced ? 0 : 9 * Math.sin(Math.PI * k2);
    imgs.forEach((im, k) => {
      im.style.transform = `scale(${scale.toFixed(4)})`;
      const b = k === 1 ? b1 : k === 2 ? b2 : 0;
      im.style.filter = b > 0.1 ? `blur(${b.toFixed(1)}px)` : '';
    });
    const s = p >= CUTS[1] ? 2 : p >= CUTS[0] ? 1 : 0;
    if (s !== lastState) {
      const first = lastState < 0; lastState = s;
      if (first || reduced) stateEl.textContent = STATES[s];
      else gsap.timeline()
        .to(stateEl, { opacity: 0, y: -6, filter: 'blur(4px)', duration: 0.25, ease: EASE.in })
        .add(() => { stateEl.textContent = STATES[s]; })
        .fromTo(stateEl, { opacity: 0, y: 8, filter: 'blur(4px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.8, ease: EASE.out });
    }
  }

  function enter(d) {
    if (shown) return; shown = true;
    splits.forEach((el, i) => showLines(el, { dir: d, delay: i * 0.12, instant: reduced }));
    numItems.forEach((li, i) => {
      if (reduced) return gsap.set(li, { opacity: 1 });
      gsap.fromTo(li, { opacity: 0, y: 18, filter: 'blur(8px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.1, ease: EASE.out, delay: 0.35 + i * 0.1, clearProps: 'filter' });
    });
    nums.forEach((el, i) => {
      const to = +el.dataset.count, pad = +el.dataset.pad || 0, o = { v: 0 };
      if (reduced) { el.textContent = String(to).padStart(pad, '0'); return; }
      gsap.to(o, { v: to, duration: 1.6, ease: 'power3.out', delay: 0.4 + i * 0.1, onUpdate: () => { el.textContent = String(Math.round(o.v)).padStart(pad, '0'); } });
    });
  }
  function leave(d) {
    if (!shown) return; shown = false;
    splits.forEach((el) => hideLines(el, { dir: d, instant: reduced }));
    if (!reduced) gsap.to(numItems, { opacity: 0, duration: 0.35, ease: EASE.in });
  }
  // as linhas nascem divididas e escondidas: sem isso o texto subia já visível e, ao cruzar a linha, sumia e entrava de novo
  if (!reduced) { splits.forEach((el) => split(el)); gsap.set(numItems, { opacity: 0 }); }

  ScrollTrigger.create({
    trigger: sec, start: 'top top', end: 'bottom bottom',
    onUpdate: (self) => update(self.progress),
    onRefresh: (self) => update(self.progress),
  });
  // o texto entra quando o palco está quase todo na tela (por tempo), e sai se o visitante voltar para cima
  ScrollTrigger.create({ trigger: sec, start: 'top 32%', onEnter: () => enter(1), onLeaveBack: () => leave(-1) });
  update(0);
}
