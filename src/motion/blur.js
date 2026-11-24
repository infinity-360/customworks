// Palavras que saem do desfoque (a assinatura da orla): por tempo, nunca presas ao scroll.
// Entram: desfoque 14 px → 0, sobem 0,18em, uma depois da outra (expo.out). Saem mais rápido (power3.in), para o
// lado da rolagem. No fim da entrada o filtro é limpo, para o texto parado ficar nítido.
import { gsap } from 'gsap';
import { EASE } from './ease.js';

export function splitWords(el) {
  if (el._w) return el._w;
  const text = el.textContent.trim().replace(/\s+/g, ' ');
  el.setAttribute('aria-label', text);
  el.innerHTML = text.split(' ').map((w) => `<span class="w" aria-hidden="true">${w}</span>`).join(' ');
  el._w = [...el.querySelectorAll('.w')];
  gsap.set(el._w, { opacity: 0 });
  return el._w;
}

export function showWords(el, { dir = 1, delay = 0, instant = false } = {}) {
  const ws = splitWords(el);
  gsap.killTweensOf(ws);
  if (instant) return gsap.set(ws, { opacity: 1, filter: 'none', yPercent: 0 });
  return gsap.fromTo(ws, { opacity: 0, filter: 'blur(14px)', yPercent: 22 * dir },
    { opacity: 1, filter: 'blur(0px)', yPercent: 0, duration: 1.15, ease: EASE.out, stagger: 0.05, delay, overwrite: true, clearProps: 'filter' });
}

export function hideWords(el, { dir = 1, instant = false } = {}) {
  const ws = splitWords(el);
  gsap.killTweensOf(ws);
  if (instant) return gsap.set(ws, { opacity: 0 });
  return gsap.to(ws, { opacity: 0, filter: 'blur(10px)', yPercent: -16 * dir, duration: 0.42, ease: EASE.in, stagger: 0.012, overwrite: true });
}
