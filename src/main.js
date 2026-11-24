import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import '@fontsource-variable/inter-tight';
import '@fontsource-variable/geist-mono';
import './styles/tokens.css';
import './styles/base.css';
import './sections/nav.css';
import './sections/giro.css';
import './sections/loja.css';
import './sections/atelie.css';
import './sections/sobre.css';
import './sections/foot.css';
import './sections/sacola.css';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { troca as makeTroca } from './motion/troca.js';
import { sacola } from './motion/sacola.js';
import { brand as makeBrand } from './motion/brand.js';
import { giro, HD } from './motion/giro.js';
import { loja } from './motion/loja.js';
import { atelie } from './motion/atelie.js';
import { sobre } from './motion/sobre.js';
import { foot } from './motion/foot.js';
import { smoothScroll } from './motion/smooth.js';
import { scrollbar } from './motion/scrollbar.js';
import { nav } from './motion/nav.js';
import { loader } from './motion/loader.js';
import { wa } from './data/pecas.js';

gsap.registerPlugin(ScrollTrigger);
window.__booted = true;

const html = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

async function boot() {
  await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]);

  const troca = makeTroca({ reduced });
  const bag = sacola({ reduced });
  const brand = makeBrand({ reduced });
  const g = giro({ section: document.querySelector('.giro'), reduced, brand });
  loja({ reduced, bag });
  atelie({ reduced });
  sobre({ reduced });
  const f = foot({ reduced });
  footForm();

  const lenis = reduced ? null : smoothScroll();
  scrollbar({ lenis });
  if (import.meta.env.DEV) window.__lenis = lenis; // só para conferir a rolagem nos testes
  nav({ lenis, hideFrom: () => g.st.end - innerHeight });

  // âncoras internas pelo Lenis
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.hasAttribute('data-troca')) return;
    const id = a.getAttribute('href');
    const el = id === '#top' ? document.body : document.querySelector(id);
    if (!el) return;
    e.preventDefault();
    let y = id === '#top' ? 0 : el.getBoundingClientRect().top + (lenis ? lenis.scroll : scrollY);
    if (id === '#loja') y = g.st.end;
    if (id === '#sobre') y += innerHeight * 0.6;
    lenis ? lenis.scrollTo(y, { duration: 1.6 }) : scrollTo(0, y);
  });

  // tudo que entra por tempo já está escondido: a página pode pintar
  html.classList.add('motion-ready');
  requestAnimationFrame(() => requestAnimationFrame(() => html.classList.remove('is-booting')));

  await document.fonts.ready;
  g.layout();
  f.fit();
  ScrollTrigger.refresh();
  lenis?.resize();
  brand.refresh();

  if (location.hash === '#loja') {
    const y = g.st.end;
    lenis ? lenis.scrollTo(y, { immediate: true, force: true }) : scrollTo(0, y);
    ScrollTrigger.update();
  }

  addEventListener('resize', () => { f.fit(); brand.refresh(); });

  loader({ frames: g.frames, hd: HD, lenis, brand, canvas: g.canvas, onReveal: g.heroIn });
  const firstImg = new Promise((r) => g.frames().first.then(r, r));
  troca.arrive(Promise.all([document.fonts.ready, firstImg]));
}

function footForm() {
  const form = document.querySelector('.foot__form');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const ideia = form.querySelector('input').value.trim();
    window.open(wa(`Olá, Custom Works! Tenho uma ideia de estampa: ${ideia}`), '_blank', 'noopener');
    form.querySelector('.foot__ok').textContent = 'Abrimos o WhatsApp com a sua ideia. É só enviar.';
    form.reset();
  });
}

boot();
