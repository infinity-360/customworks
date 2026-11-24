// 02 Loja. "Loja" sobe letra a letra da linha de base quando o título chega na tela (por tempo); a grade é padrão de
// loja (scripts/paginas.mjs gera os cards de src/data/pecas.js): cada linha de cards entra do desfoque por tempo, da
// esquerda para a direita, quando chega na tela. Hover troca frente e costas (CSS) e mostra os tamanhos: clicar num
// tamanho soma na sacola sem sair da Loja. Clicar na foto ou no nome abre a página da peça (motion/troca.js).
// Os filtros escondem e mostram cards por tempo, sem pular de lugar no meio.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { showLines, hideLines, split } from './split.js';
import { onReach } from './reveal.js';
import { EASE } from './ease.js';

const HIDE = 118;

export function loja({ reduced, bag }) {
  const sec = document.querySelector('.loja');
  const title = sec.querySelector('[data-chars]');
  const text = title.textContent.trim();
  title.setAttribute('aria-label', text);
  title.innerHTML = [...text].map((c) => `<span class="ch" aria-hidden="true">${c}</span>`).join('');
  const chars = [...title.querySelectorAll('.ch')];
  const lead = sec.querySelector('.loja__p');
  const filtros = sec.querySelector('.filtros');
  // tudo que entra por tempo já nasce escondido (o texto não pode aparecer antes e depois ainda entrar)
  if (!reduced) { gsap.set(chars, { yPercent: HIDE }); gsap.set(filtros, { opacity: 0 }); split(lead); split(sec.querySelector('.loja__big')); }

  onReach(sec.querySelector('.loja__head'), {
    start: () => `top+=${innerHeight * 0.15} bottom`,
    enter: () => {
      if (reduced) return showLines(lead, { instant: true });
      gsap.to(chars, { yPercent: 0, duration: 1.25, ease: EASE.out, stagger: 0.06, overwrite: true });
      showLines(lead, { delay: 0.35 });
      gsap.fromTo(filtros, { opacity: 0, y: 12, filter: 'blur(6px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1, delay: 0.5, ease: EASE.out, clearProps: 'filter', overwrite: true });
    },
    leave: (d) => {
      if (reduced) return;
      gsap.to(chars, { yPercent: HIDE, duration: 0.45, ease: EASE.in, stagger: 0.02, overwrite: true });
      hideLines(lead, { dir: d });
      gsap.to(filtros, { opacity: 0, duration: 0.3, ease: EASE.in, overwrite: true });
    },
  });

  // cards: entram do desfoque por tempo, em linha (o atraso é a coluna do card na linha)
  const cards = [...sec.querySelectorAll('.card')];
  const colOf = (card) => {
    const top = card.offsetTop;
    return cards.filter((c) => c.offsetParent && c.offsetTop === top && c.offsetLeft < card.offsetLeft).length;
  };
  cards.forEach((card) => {
    const parts = [card.querySelector('.card__media'), card.querySelector('.card__cap')];
    if (!reduced) gsap.set(parts, { opacity: 0 });
    card._st = onReach(card, {
      start: 'top 94%',
      enter: () => {
        // card já mostrado (pelo filtro, por exemplo) não entra de novo
        if (reduced || card._shown || card.style.display === 'none') return;
        card._shown = true;
        const d = colOf(card) * 0.07;
        gsap.fromTo(parts[0], { opacity: 0, filter: 'blur(18px)', y: 26 }, { opacity: 1, filter: 'blur(0px)', y: 0, duration: 1.2, ease: EASE.out, clearProps: 'filter,transform', delay: d, overwrite: true });
        gsap.fromTo(parts[1], { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 1, ease: EASE.out, delay: 0.14 + d, clearProps: 'transform', overwrite: true });
      },
      leave: () => { if (reduced || !card._shown) return; card._shown = false; gsap.to(parts, { opacity: 0, duration: 0.3, ease: EASE.in, overwrite: true }); },
    });
  });

  // tamanhos do hover: somam direto na sacola
  sec.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-add]');
    if (!b) return;
    e.preventDefault();
    bag.add(b.dataset.add, b.dataset.size);
    b.classList.remove('is-hit'); void b.offsetWidth; b.classList.add('is-hit');
  });

  // filtros
  const btns = [...filtros.querySelectorAll('.filtros__b')];
  const countEl = filtros.querySelector('.filtros__count');
  let current = '*', anim = null;
  filtros.addEventListener('click', (e) => {
    const b = e.target.closest('.filtros__b');
    if (!b || b.dataset.cat === current) return;
    current = b.dataset.cat;
    btns.forEach((x) => { const on = x === b; x.classList.toggle('is-on', on); x.setAttribute('aria-pressed', on); });
    const show = cards.filter((c) => current === '*' || c.dataset.cat === current);
    countEl.textContent = show.length;
    anim?.kill();
    const visible = cards.filter((c) => c.style.display !== 'none');
    anim = gsap.timeline();
    if (!reduced) anim.to(visible, { opacity: 0, y: -8, duration: 0.22, ease: EASE.in, stagger: 0.015 });
    anim.add(() => {
      cards.forEach((c) => { c.style.display = show.includes(c) ? '' : 'none'; });
      // a entrada é a do filtro: os cards que ficam contam como mostrados (o refresh não dispara a entrada deles de novo)
      show.forEach((c) => { c._shown = true; });
      ScrollTrigger.refresh();
      // os cards que ficaram já estão na tela: entram de novo, em ordem
      show.forEach((c) => { const parts = [c.querySelector('.card__media'), c.querySelector('.card__cap')]; gsap.killTweensOf(parts); gsap.set(parts, { opacity: 1, clearProps: 'filter,transform' }); });
    });
    if (!reduced) anim.fromTo(show, { opacity: 0, y: 14, filter: 'blur(8px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.8, ease: EASE.out, stagger: 0.04, clearProps: 'filter,transform' });
    else anim.set(show, { opacity: 1 });
  });

  // fecho da grade: a frase sobe linha a linha e as condições de compra saem do desfoque logo depois, uma a uma
  const big = sec.querySelector('.loja__big');
  const terms = [...sec.querySelectorAll('.loja__terms > div')];
  if (!reduced) gsap.set(terms, { opacity: 0 });
  onReach(sec.querySelector('.loja__foot'), {
    start: 'top 86%',
    enter: () => {
      showLines(big, { instant: reduced });
      if (!reduced) gsap.fromTo(terms, { opacity: 0, y: 10, filter: 'blur(6px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1, ease: EASE.out, stagger: 0.07, delay: 0.3, clearProps: 'filter,transform', overwrite: true });
    },
    leave: (d) => {
      hideLines(big, { dir: d, instant: reduced });
      if (!reduced) gsap.to(terms, { opacity: 0, duration: 0.3, ease: EASE.in, overwrite: true });
    },
  });
}
