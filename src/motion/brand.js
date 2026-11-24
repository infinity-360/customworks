// O logo é um elemento só (index.html, .brand): nasce no centro da abertura, assenta grande no hero e encolhe para o
// canto quando o giro começa. Tamanho de base = o do hero (texto reduzido continua nítido); os outros estados são
// translate + scale calculados aqui.
import { gsap } from 'gsap';
import { EASE } from './ease.js';

export function brand({ reduced = false } = {}) {
  const el = document.querySelector('.brand__in');
  let state = 'hero';
  const mobile = () => innerWidth <= 760;
  function pose(s) {
    const w = el.offsetWidth, h = el.offsetHeight;
    const r = el.parentElement.getBoundingClientRect();
    if (s === 'center') {
      const k = mobile() ? 1.25 : 0.86;
      return { x: (innerWidth - w * k) / 2 - r.left, y: innerHeight / 2 - h * k * 0.62 - r.top, scale: k };
    }
    if (s === 'nav') { const k = (mobile() ? 30 : 36) / parseFloat(getComputedStyle(el).fontSize); return { x: 0, y: 0, scale: k }; }
    return { x: 0, y: 0, scale: 1 };
  }
  return {
    el,
    get state() { return state; },
    // set mata qualquer voo em curso (sem isso, um voo para o hero começado na abertura terminava por cima)
    set(s) { state = s; gsap.killTweensOf(el); gsap.set(el, pose(s)); },
    to(s, { duration = 1.15, ease = EASE.linha, delay = 0 } = {}) {
      if (s === state) return;
      state = s;
      if (reduced) return gsap.set(el, pose(s));
      gsap.to(el, { ...pose(s), duration, ease, delay, overwrite: true });
    },
    refresh() { gsap.set(el, pose(state)); },
  };
}
