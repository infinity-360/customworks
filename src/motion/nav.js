// Nav: no giro fica sempre (nada passa por baixo dela ali). Da sobreposição da Loja em diante, some ao descer e
// volta ao subir, com o fundo translúcido; no topo do hero, sem fundo. O menu abre em tela cheia.
export function nav({ lenis, hideFrom }) {
  const html = document.documentElement;
  let last = 0;
  const onScroll = () => {
    const y = lenis ? lenis.scroll : scrollY;
    const from = hideFrom();
    if (html.classList.contains('menu-open')) { last = y; return; }
    // a sacola fecha quando o visitante volta a rolar
    if (html.classList.contains('bag-open') && Math.abs(y - last) > 6) {
      html.classList.remove('bag-open'); document.querySelector('.bag')?.setAttribute('aria-hidden', 'true');
    }
    if (y > from && y > last + 4) html.classList.add('nav-hidden');
    else if (y < last - 4 || y <= from) html.classList.remove('nav-hidden');
    html.classList.toggle('nav-solid', y > from + 20);
    last = y;
  };
  if (lenis) lenis.on('scroll', onScroll); else addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const btn = document.querySelector('.nav__menu');
  const menu = document.querySelector('.menu');
  const setMenu = (open) => {
    html.classList.toggle('menu-open', open);
    btn.setAttribute('aria-expanded', open); btn.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    menu.setAttribute('aria-hidden', !open);
    if (open) { html.classList.remove('nav-hidden'); lenis?.stop(); } else lenis?.start();
  };
  btn.addEventListener('click', () => setMenu(!html.classList.contains('menu-open')));
  menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
}
