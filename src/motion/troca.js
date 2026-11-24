// Troca de página: uma grade de quadrados brancos cobre a tela numa onda diagonal a partir do canto superior
// esquerdo (a célula (col, lin) entra com atraso proporcional a col + lin); com a tela branca, o navegador troca de
// página; a página nova nasce coberta (index.html / peca.html: html.is-troca pinta o branco desde o primeiro quadro)
// e descobre na mesma onda, de novo a partir do canto superior esquerdo. Cada quadrado cresce ou encolhe seco, do
// centro, em ~0,1 s; a onda inteira leva 0,6 s. Os quadros são de verdade: a largura da tela vira um número inteiro de
// colunas (célula entre 86 e 118 px, a que deixa a altura mais perto de linhas inteiras) e as bordas caem em pixels
// inteiros do aparelho, então quadrados vizinhos encostam sem fio. Movimento reduzido: fusão curta.
const KEY = 'vulto:troca';
const WAVE = 0.6; // s, da primeira à última célula
const CELL = 0.1; // s, cada célula
const out3 = (t) => 1 - (1 - t) ** 3;

export function troca({ reduced = false } = {}) {
  const html = document.documentElement;
  const cv = document.createElement('canvas');
  cv.className = 'troca';
  cv.setAttribute('aria-hidden', 'true');
  document.body.appendChild(cv);
  const ctx = cv.getContext('2d');
  let g = null, busy = false, raf = 0;

  function measure() {
    const W = cv.clientWidth || innerWidth, H = cv.clientHeight || innerHeight;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    let best = null;
    for (let cols = Math.ceil(W / 118); cols <= Math.max(Math.ceil(W / 118), Math.floor(W / 86)); cols++) {
      const s = W / cols, rows = H / s;
      const score = (Math.ceil(rows - 0.001) - rows) + Math.abs(s - 100) / 200;
      if (!best || score < best.score) best = { s, cols, rows: Math.ceil(rows - 0.001), score };
    }
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    const xs = Array.from({ length: best.cols + 1 }, (_, c) => Math.round(c * best.s * dpr));
    const ys = Array.from({ length: best.rows + 1 }, (_, r) => Math.min(cv.height, Math.round(r * best.s * dpr)));
    g = { ...best, xs, ys, diag: Math.max(1, best.cols + best.rows - 2) };
  }

  // grow = true: cada célula de 0 a 1 (cobrir); false: de 1 a 0 (descobrir). t em segundos desde o começo da onda
  function paint(t, grow) {
    const { cols, rows, xs, ys, diag } = g;
    const step = (WAVE - CELL) / diag;
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.fillStyle = '#ffffff';
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const local = Math.min(1, Math.max(0, (t - (c + r) * step) / CELL));
        const k = grow ? out3(local) : 1 - out3(local);
        if (k <= 0) continue;
        const x0 = xs[c], x1 = xs[c + 1], y0 = ys[r], y1 = ys[r + 1];
        if (k >= 1) { ctx.fillRect(x0, y0, x1 - x0, y1 - y0); continue; }
        const w = (x1 - x0) * k, h = (y1 - y0) * k;
        ctx.fillRect(Math.round(x0 + (x1 - x0 - w) / 2), Math.round(y0 + (y1 - y0 - h) / 2), Math.round(w), Math.round(h));
      }
    }
  }

  function run(grow) {
    cancelAnimationFrame(raf);
    cv.style.display = 'block';
    measure();
    if (reduced) {
      paint(WAVE, true);
      return new Promise((res) => {
        const a = cv.animate([{ opacity: grow ? 0 : 1 }, { opacity: grow ? 1 : 0 }], { duration: grow ? 180 : 260, easing: 'linear', fill: 'forwards' });
        a.onfinish = () => { if (!grow) { cv.style.display = 'none'; a.cancel(); } res(); };
      });
    }
    cv.getAnimations().forEach((a) => a.cancel());
    return new Promise((res) => {
      const t0 = performance.now();
      const tick = (now) => {
        const t = (now - t0) / 1000;
        paint(t, grow);
        if (t < WAVE) raf = requestAnimationFrame(tick);
        else { if (!grow) cv.style.display = 'none'; res(); }
      };
      paint(0, grow);
      raf = requestAnimationFrame(tick);
    });
  }

  /** cobre a tela e troca de página */
  async function go(url) {
    if (busy) return;
    busy = true;
    html.classList.add('is-trocando'); // bloqueia cliques durante a onda
    try { sessionStorage.setItem(KEY, '1'); } catch (e) { /* sem sessionStorage: a página nova só não nasce coberta */ }
    await run(true);
    location.href = url;
  }

  /** a página nasceu coberta: descobre quando `ready` resolver (fontes e primeira foto), no máximo em 1,5 s */
  async function arrive(ready) {
    try { sessionStorage.removeItem(KEY); } catch (e) {}
    if (!html.classList.contains('is-troca')) return;
    cv.style.display = 'block';
    measure(); paint(WAVE, true);
    html.classList.remove('is-troca');
    await Promise.race([ready, new Promise((r) => setTimeout(r, 1500))]).catch(() => {});
    await run(false);
  }

  // links da troca: só o clique simples (Cmd/Ctrl/botão do meio abrem outra aba como sempre)
  const prefetched = new Set();
  const prefetch = (href) => {
    if (prefetched.has(href)) return;
    prefetched.add(href);
    const l = document.createElement('link');
    l.rel = 'prefetch'; l.href = href;
    document.head.appendChild(l);
  };
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-troca]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    e.preventDefault();
    go(url.pathname + url.search + url.hash);
  });
  ['pointerenter', 'focusin', 'touchstart'].forEach((ev) => document.addEventListener(ev, (e) => {
    const a = e.target.closest?.('a[data-troca]');
    if (a) prefetch(new URL(a.href, location.href).pathname);
  }, { capture: true, passive: true }));

  // voltar pelo navegador (cache de página): a página volta coberta como saiu; descobre na mesma onda
  addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    busy = false;
    html.classList.remove('is-trocando');
    try { sessionStorage.removeItem(KEY); } catch (err) {}
    if (cv.style.display === 'block') run(false);
  });

  /** um momento exato da onda, para conferir quadro a quadro (só os testes usam) */
  const paintAt = (t, grow) => { cv.style.display = 'block'; measure(); paint(t, grow); return { s: g.s, cols: g.cols, rows: g.rows }; };

  return { go, arrive, paintAt, cover: () => run(true), uncover: () => run(false) };
}
