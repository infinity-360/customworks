// Lista de orçamento (no lugar da sacola do template): a mesma na Loja e nas páginas das peças. Guarda as peças no
// localStorage (sobrevive à troca de página). Não há preço nem pagamento: "Pedir orçamento" abre o WhatsApp da
// Custom Works com a lista já escrita (peça, tamanho, quantidade e link de cada uma).
import { gsap } from 'gsap';
import { PECAS, wa } from '../data/pecas.js';

const KEY = 'cw:orcamento';
const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } };
const pecas = (n) => `${n} ${n === 1 ? 'peça' : 'peças'}`;

export function sacola({ reduced = false } = {}) {
  const html = document.documentElement;
  const count = document.querySelector('.nav__count');
  const btn = document.querySelector('.nav__bag');
  const toast = document.querySelector('.toast');
  const bag = document.querySelector('.bag');
  const list = bag.querySelector('.bag__list');
  const go = bag.querySelector('.bag__go');
  let items = read(), toastT;

  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) {} };
  const message = () => {
    if (!items.length) return 'Olá, Custom Works! Quero fazer um orçamento.';
    const base = location.origin + import.meta.env.BASE_URL.replace(/\/$/, '');
    const lines = items.map((it, i) => `${i + 1}. ${it.name} · ${it.size} · ${it.qty} un.\n${base}/peca/${it.slug}/`);
    return `Olá, Custom Works! Quero um orçamento destas peças:\n\n${lines.join('\n')}`;
  };
  function render() {
    const n = items.reduce((t, it) => t + it.qty, 0);
    count.textContent = n;
    count.classList.toggle('is-full', n > 0);
    btn.setAttribute('aria-label', `Orçamento, ${pecas(n)}`);
    bag.querySelector('.bag__n').textContent = pecas(n);
    bag.querySelector('.bag__sum').textContent = pecas(n);
    list.innerHTML = items.length
      ? items.map((it, i) => `<li><span>${it.name} <span class="dim">· ${it.size}</span></span><span class="mono">${it.qty} un.</span><button class="bag__rm mono dim" type="button" data-rm="${i}" aria-label="Tirar ${it.name}">Tirar</button></li>`).join('')
      : '<li class="bag__empty dim">Nada aqui ainda. Escolha as estampas e o tamanho; o orçamento sai pelo WhatsApp.</li>';
    go.href = wa(message());
  }
  const setOpen = (open) => {
    html.classList.toggle('bag-open', open);
    bag.setAttribute('aria-hidden', !open);
    btn.setAttribute('aria-expanded', open);
  };
  btn.addEventListener('click', (e) => { e.stopPropagation(); setOpen(!html.classList.contains('bag-open')); });
  addEventListener('click', (e) => { if (!bag.contains(e.target)) setOpen(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
  list.addEventListener('click', (e) => {
    const rm = e.target.closest('[data-rm]');
    if (!rm) return;
    e.stopPropagation();
    items.splice(+rm.dataset.rm, 1); save(); render();
  });
  go.addEventListener('click', () => setOpen(false));
  addEventListener('storage', (e) => { if (e.key === KEY) { items = read(); render(); } });
  render();

  return {
    /** soma uma peça ao orçamento (mesma peça e tamanho somam na quantidade) */
    add(slug, size) {
      const p = PECAS.find((x) => x.slug === slug);
      if (!p) return 0;
      const same = items.find((it) => it.slug === slug && it.size === size);
      if (same) same.qty += 1; else items.push({ slug, name: p.nome, size, qty: 1 });
      save(); render();
      if (!reduced) gsap.fromTo(count, { scale: 1.6 }, { scale: 1, duration: 0.9, ease: 'elastic.out(1, 0.45)' });
      toast.innerHTML = `${p.nome} · ${size} · <b>no orçamento</b>`;
      toast.classList.add('is-on');
      clearTimeout(toastT); toastT = setTimeout(() => toast.classList.remove('is-on'), 2600);
      return 1;
    },
    close: () => setOpen(false),
  };
}
