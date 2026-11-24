// Abertura (o padrão da logo-intro, sem o símbolo): tela #fcfbfa e só o logo "Vulto." no centro, que nasce por uma
// máscara de borda macia da esquerda para a direita enquanto o desfoque limpa; espera os quadros do moletom baixarem
// (35% liberam, nunca antes de 1,3 s, no máximo 7 s; no ?hd, todos) e voa para o lugar dele no hero, enquanto o fundo
// da abertura some, o moletom sobe do desfoque e o parágrafo, a pílula e a nav entram.
import { gsap } from 'gsap';
import { EASE } from './ease.js';

const MIN_TIME = 1.3;
const NEED = 0.35;
const MAX_WAIT = 7;

export function loader({ frames, hd, lenis, brand, canvas, onReveal }) {
  const root = document.documentElement;
  const el = document.querySelector('.loader');
  const done = () => { root.classList.remove('is-loading'); el?.remove(); lenis?.start(); };
  if (!el || !root.classList.contains('is-loading')) { done(); onReveal?.(); return; }

  lenis?.stop();
  history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);
  brand.set('center');
  gsap.set(canvas, { opacity: 0 });
  gsap.set('.nav', { opacity: 0 });

  // revelar: máscara com 25% de borda macia andando da esquerda para a direita + desfoque que limpa
  const logo = brand.el;
  const mask = 'linear-gradient(90deg, #000 calc(var(--reveal) - 25%), transparent var(--reveal))';
  gsap.set(logo, { '--reveal': '0%', maskImage: mask, webkitMaskImage: mask, filter: 'blur(14px)', opacity: 1 });
  const intro = gsap.timeline()
    .to(logo, { '--reveal': '125%', duration: 0.95, ease: 'power2.out' }, 0)
    .to(logo, { filter: 'blur(0px)', duration: 1.1, ease: EASE.out }, 0.05)
    .set(logo, { clearProps: 'maskImage,webkitMaskImage,filter,--reveal' });

  const t0 = performance.now();
  const ready = () => {
    const f = frames();
    const elapsed = (performance.now() - t0) / 1000;
    if (elapsed < MIN_TIME || intro.isActive()) return false;
    if (hd) return f.progress() >= 1;
    return f.progress() >= NEED || (elapsed > MAX_WAIT && f.loaded > 0);
  };
  const tick = () => { if (ready()) { gsap.ticker.remove(tick); reveal(); } };
  gsap.ticker.add(tick);

  function reveal() {
    gsap.timeline({ onComplete: done })
      // só voa para o hero se a página ainda está no topo (um salto para a Loja no meio da abertura deixa o logo no canto)
      .add(() => (scrollY < innerHeight * 0.1 ? brand.to('hero', { duration: 1.15 }) : brand.to('nav', { duration: 0.8 })), 0)
      .to(el, { backgroundColor: 'rgba(252,251,250,0)', duration: 0.6, ease: 'none' }, 0.2)
      .fromTo(canvas, { opacity: 0, filter: 'blur(26px)', scale: 0.965, y: 40 }, { opacity: 1, filter: 'blur(0px)', scale: 1, y: 0, duration: 1.6, ease: EASE.out, clearProps: 'filter,transform,scale,y' }, 0.25)
      .add(() => onReveal?.(), 0.55)
      .fromTo('.nav', { opacity: 0 }, { opacity: 1, duration: 0.8, ease: EASE.out, clearProps: 'opacity' }, 0.7);
  }
}
