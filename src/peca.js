import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import '@fontsource-variable/inter-tight';
import '@fontsource-variable/geist-mono';
import './styles/tokens.css';
import './styles/base.css';
import './sections/nav.css';
import './sections/sacola.css';
import './sections/peca.css';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { troca as makeTroca } from './motion/troca.js';
import { sacola } from './motion/sacola.js';
import { smoothScroll } from './motion/smooth.js';
import { scrollbar } from './motion/scrollbar.js';
import { EASE } from './motion/ease.js';

gsap.registerPlugin(ScrollTrigger);
window.__booted = true;

const html = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

async function boot() {
  await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]);
  const troca = makeTroca({ reduced });
  const bag = sacola({ reduced });

  // textos dos lados: escondidos até a troca descobrir a tela
  const ins = [...document.querySelectorAll('[data-in]')];
  if (!reduced) gsap.set(ins, { opacity: 0, y: 16 });

  // compra
  const form = document.querySelector('.peca__form');
  const warn = form.querySelector('.peca__warn');
  const sizes = [...document.querySelectorAll('.sizes')];
  const pick = () => document.querySelector('input[name="tam"]:checked, input[name="tam-bar"]:checked')?.value;
  // os dois grupos (lado e barra do celular) andam juntos
  document.addEventListener('change', (e) => {
    if (!e.target.matches('.size input')) return;
    document.querySelectorAll(`.size input[value="${e.target.value}"]`).forEach((i) => { i.checked = true; });
    warn.textContent = '';
  });
  const add = () => {
    const size = pick();
    if (!size) {
      warn.textContent = 'Escolha o tamanho';
      sizes.forEach((s) => { s.classList.remove('is-shake'); void s.offsetWidth; s.classList.add('is-shake'); });
      return;
    }
    bag.add(form.dataset.slug, size);
  };
  form.addEventListener('submit', (e) => { e.preventDefault(); add(); });
  document.querySelector('button.pbar__add')?.addEventListener('click', add);

  // índice das fotos: a foto com o meio mais perto do meio da tela fica ativa
  const fotos = [...document.querySelectorAll('.peca__foto')];
  const idx = [...document.querySelectorAll('.peca__idx a')];
  const dots = [...document.querySelectorAll('.pdots li')];
  let on = -1;
  const lenis = reduced ? null : smoothScroll();
  scrollbar({ lenis });
  const track = () => {
    const mid = innerHeight / 2;
    let best = 0, bd = Infinity;
    fotos.forEach((f, i) => { const r = f.getBoundingClientRect(); const d = Math.abs(r.top + r.height / 2 - mid); if (d < bd) { bd = d; best = i; } });
    if (best === on) return;
    on = best;
    idx.forEach((a, i) => a.classList.toggle('is-on', i === best));
    dots.forEach((d, i) => d.classList.toggle('is-on', i === best));
  };
  if (lenis) lenis.on('scroll', track); else addEventListener('scroll', track, { passive: true });
  track();
  idx.forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    const f = fotos[+a.dataset.ir];
    const y = f.getBoundingClientRect().top + (lenis ? lenis.scroll : scrollY) - (innerHeight - f.offsetHeight) / 2;
    lenis ? lenis.scrollTo(y, { duration: 1.2 }) : scrollTo(0, y);
  }));

  // a sacola fecha quando o visitante rola
  let lastY = 0;
  const closeOnScroll = () => { const y = lenis ? lenis.scroll : scrollY; if (Math.abs(y - lastY) > 6) bag.close(); lastY = y; };
  if (lenis) lenis.on('scroll', closeOnScroll); else addEventListener('scroll', closeOnScroll, { passive: true });

  html.classList.add('motion-ready');
  requestAnimationFrame(() => requestAnimationFrame(() => html.classList.remove('is-booting')));

  const img = document.querySelector('.peca__foto img');
  const firstImg = img.complete ? Promise.resolve() : new Promise((r) => { img.addEventListener('load', r, { once: true }); img.addEventListener('error', r, { once: true }); });
  const arrived = troca.arrive(Promise.all([document.fonts.ready, firstImg]));
  // os textos entram enquanto a troca descobre a tela
  const start = html.classList.contains('is-troca') ? Promise.race([Promise.all([document.fonts.ready, firstImg]), new Promise((r) => setTimeout(r, 1500))]) : Promise.resolve();
  await start;
  if (!reduced) gsap.to(ins, { opacity: 1, y: 0, duration: 1.1, ease: EASE.out, stagger: 0.045, delay: 0.1, clearProps: 'transform' });
  await arrived;
}

boot();
