// Texto: linhas com máscara (SplitText mask: 'lines') e letras soltas para as palavras gigantes.
// A máscara tem folga em cima e embaixo (base.css, .ln-mask), então a linha escondida sai a 140%, além da folga
// com acento e vírgula. Todo texto entra e sai por tempo (nunca preso ao scroll): parado no meio, nada fica cortado.
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { EASE } from './ease.js';

gsap.registerPlugin(SplitText);

export const HIDE = 140;

export function split(el) {
  if (el._ln) return el._ln;
  const state = { lines: [], shown: false, el, entry: null };
  el._ln = state;
  SplitText.create(el, {
    type: 'lines', mask: 'lines', linesClass: 'ln', autoSplit: true,
    onSplit(self) {
      const first = !state.lines.length;
      state.lines = self.lines;
      if (!first) state.resplits = (state.resplits || 0) + 1;
      // dividiu de novo (fonte, barra de rolagem, largura) no meio de uma entrada: a entrada recomeça nas linhas novas
      // com o tempo que faltava. Sem isso as linhas novas nasciam no lugar e o texto pulava inteiro, sem animar.
      const e = state.entry;
      if (state.shown && e && performance.now() < e.end) {
        const wait = Math.max(0, (e.start - performance.now()) / 1000);
        gsap.fromTo(self.lines, { yPercent: HIDE * e.dir }, { yPercent: 0, duration: e.duration, ease: EASE.out, stagger: e.stagger, delay: wait, overwrite: true });
        return;
      }
      gsap.set(self.lines, { yPercent: state.shown ? 0 : HIDE });
    },
  });
  return state;
}

/** entra: cada linha sobe de dentro da máscara. dir 1 = vem de baixo, −1 = vem de cima */
export function showLines(el, { delay = 0, stagger = 0.08, duration = 1.05, dir = 1, instant = false } = {}) {
  const s = split(el);
  s.shown = true;
  gsap.killTweensOf(s.lines);
  if (instant) { s.entry = null; return gsap.set(s.lines, { yPercent: 0 }); }
  const now = performance.now();
  s.entry = { start: now + delay * 1000, end: now + (delay + duration + stagger * s.lines.length) * 1000, dir, duration, stagger };
  return gsap.fromTo(s.lines, { yPercent: HIDE * dir }, { yPercent: 0, duration, ease: EASE.out, stagger, delay, overwrite: true });
}

/** sai: as linhas deixam a máscara pelo lado oposto ao que entraram (dir 1 = para cima) */
export function hideLines(el, { delay = 0, stagger = 0.035, duration = 0.42, dir = 1, instant = false } = {}) {
  const s = split(el);
  s.shown = false;
  s.entry = null;
  gsap.killTweensOf(s.lines);
  if (instant) return gsap.set(s.lines, { yPercent: HIDE });
  return gsap.to(s.lines, { yPercent: -HIDE * dir, duration, ease: EASE.in, stagger, delay, overwrite: true });
}

/** palavra gigante em letras (.ch), que sobem e descem pela linha de base */
export function splitChars(el) {
  const text = el.textContent.trim();
  el.setAttribute('aria-label', text);
  el.innerHTML = [...text].map((c) => `<span class="ch" aria-hidden="true">${c === ' ' ? '&nbsp;' : c}</span>`).join('');
  return [...el.querySelectorAll('.ch')];
}
