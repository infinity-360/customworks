// Gera, a partir de src/data/pecas.js:
//   - a grade da Loja dentro do index.html (entre <!-- grade:inicio --> e <!-- grade:fim -->)
//   - uma página estática por peça em peca/<slug>/index.html (endereço próprio que abre direto em qualquer hospedagem)
// Roda sozinho antes do dev e do build (package.json: predev/prebuild). Uso manual: node scripts/paginas.mjs
// BASE (env) = pasta do site na hospedagem ("/" na raiz, "/customworks/" no GitHub Pages); os links saem com ela.
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { PECAS, ENTREGA, WHATS_TXT, wa } from '../src/data/pecas.js';

const B = process.env.BASE || '/';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const total = String(PECAS.length).padStart(2, '0');
const url = (p) => `${B}peca/${p.slug}/`;
const pedir = (p) => wa(`Olá, Custom Works! Quero um orçamento da camiseta ${p.nome}.`);

// ---------- grade ----------
const card = (p) => `        <li class="card" data-cat="${esc(p.cat)}">
          <div class="card__media">
            <a class="card__fig" href="${url(p)}" data-troca aria-label="${esc(p.nome)}, sob consulta">
              <img class="card__img card__img--1" src="${B}img/loja/${p.img}.webp" alt="${esc(p.alt)}" width="800" height="800" loading="lazy" decoding="async" />
              <span class="card__n mono">${p.n}</span>
            </a>
            <div class="card__quick"><span class="mono dim">Orçar</span><span class="card__sizes">${p.tamanhos.map((t) => `<button class="mono" type="button" data-add="${p.slug}" data-size="${esc(t)}">${esc(t)}</button>`).join('')}</span></div>
          </div>
          <a class="card__cap" href="${url(p)}" data-troca tabindex="-1">
            <span class="card__name">${esc(p.nome)}</span><span class="card__price">Sob consulta</span>
            <span class="card__cat dim">${esc(p.cat)}</span><span class="card__left mono dim">Ver a peça</span>
          </a>
        </li>`;
const cats = [...new Set(PECAS.map((p) => p.cat))];
const filtros = `      <div class="filtros" role="toolbar" aria-label="Filtrar a loja">
        <button class="filtros__b mono is-on" type="button" data-cat="*" aria-pressed="true">Tudo<sup>${PECAS.length}</sup></button>
${cats.map((c) => `        <button class="filtros__b mono" type="button" data-cat="${esc(c)}" aria-pressed="false">${esc(c)}<sup>${PECAS.filter((p) => p.cat === c).length}</sup></button>`).join('\n')}
        <p class="filtros__n mono dim"><span class="filtros__count">${PECAS.length}</span> estampas · Sob consulta</p>
      </div>`;
const grade = `<!-- grade:inicio (gerado por scripts/paginas.mjs a partir de src/data/pecas.js; não editar à mão) -->
${filtros}
      <ul class="grade">
${PECAS.map(card).join('\n')}
      </ul>
      <!-- grade:fim -->`;

const index = readFileSync('index.html', 'utf8');
const re = /<!-- grade:inicio[\s\S]*?<!-- grade:fim -->/;
if (!re.test(index)) throw new Error('index.html sem os marcadores da grade');
writeFileSync('index.html', index.replace(re, grade));

// ---------- páginas das peças ----------
const head = (p) => `<!doctype html>
<html lang="pt-BR" class="pg-peca">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(p.nome)} · Custom Works Co.</title>
  <meta name="description" content="${esc(p.desc)} Sob consulta no WhatsApp." />
  <meta name="theme-color" content="#ffffff" />
  <link rel="icon" href="${B}favicon.svg" type="image/svg+xml" />
  <link rel="preload" as="image" type="image/webp" href="${B}img/peca/${p.img}.webp" imagesrcset="${B}img/peca/${p.img}-800.webp 800w, ${B}img/peca/${p.img}.webp 1000w" imagesizes="(max-width: 760px) 100vw, 42vw" />
  <script>
    // chegou por uma troca de página (motion/troca.js): a tela nasce coberta de branco e só faz a metade de descobrir
    (function () {
      var d = document.documentElement;
      try { if (sessionStorage.getItem('vulto:troca')) d.classList.add('is-troca'); } catch (e) {}
      if (!matchMedia('(prefers-reduced-motion: reduce)').matches) d.classList.add('js-motion');
      d.classList.add('is-booting');
      setTimeout(function () { if (!window.__booted) d.classList.remove('js-motion', 'is-booting', 'is-troca'); }, 5000);
    })();
  </script>
  <style>html.is-troca::after { content: ''; position: fixed; inset: 0; z-index: 300; background: #fff; } html.js-motion { background: #fff; } .is-booting *, .is-booting *::before, .is-booting *::after { transition: none !important; } .js-motion:not(.motion-ready) body > * { visibility: hidden; }</style>
  <script type="module" src="/src/peca.js"></script>
</head>`;

const page = (p, i) => {
  const next = PECAS[(i + 1) % PECAS.length];
  const prev = PECAS[(i - 1 + PECAS.length) % PECAS.length];
  const one = p.tamanhos.length === 1;
  const sizes = (name) => p.tamanhos.map((t) => `<label class="size"><input type="radio" name="${name}" value="${esc(t)}"${one ? ' checked' : ''} /><span class="mono">${esc(t)}</span></label>`).join('');
  const cols = Math.min(4, p.tamanhos.length);
  return `${head(p)}
<body data-slug="${p.slug}">
  <header class="pnav">
    <a class="pnav__logo logo" href="${B}" data-troca aria-label="Custom Works, início"><span class="logo__v">C</span>ustom.</a>
    <nav class="pnav__crumb mono" aria-label="Você está em"><a class="ul" href="${B}#loja" data-troca>Loja</a><span class="dim"> / </span><span class="dim">${esc(p.cat)}</span></nav>
    <div class="pnav__right">
      <a class="pnav__back ul" href="${B}#loja" data-troca>Voltar para a loja</a>
      <button class="nav__bag" type="button" aria-label="Orçamento, 0 peças" aria-expanded="false"><span>Orçamento</span><b class="nav__count mono">0</b></button>
    </div>
  </header>

  <main class="peca">
    <aside class="peca__info">
      <div class="peca__top">
        <p class="peca__k mono dim" data-in>Coleção · Estampa ${p.n}/${total}</p>
        <h1 class="peca__t serif" data-in>${esc(p.nome)}</h1>
        <p class="peca__price" data-in>Sob consulta</p>
        <p class="peca__desc" data-in>${esc(p.desc)}</p>
      </div>
      <dl class="peca__mat" data-in>
${p.materiais.map(([k, v]) => `        <div><dt class="mono dim">${k}</dt><dd class="mono">${esc(v)}</dd></div>`).join('\n')}
      </dl>
    </aside>

    <div class="peca__fotos" aria-label="Foto da peça">
      <figure class="peca__foto" id="foto-1" data-foto="0">
        <img src="${B}img/peca/${p.img}.webp" srcset="${B}img/peca/${p.img}-800.webp 800w, ${B}img/peca/${p.img}.webp 1000w" sizes="(max-width: 760px) 100vw, 42vw" alt="${esc(p.alt)}" width="1000" height="1000" fetchpriority="high" decoding="async" />
      </figure>
    </div>

    <aside class="peca__buy">
      <form class="peca__form" data-slug="${p.slug}" data-name="${esc(p.nome)}">
        <fieldset class="peca__sizes" data-in>
          <legend class="mono"><span>Tamanho</span><span class="dim">Outros sob consulta</span></legend>
          <div class="sizes" style="--cols: ${cols}">${sizes('tam')}</div>
          <p class="peca__warn mono" aria-live="polite"></p>
        </fieldset>
        <button class="peca__add" type="submit" data-in><span class="pill__t" data-t="Adicionar ao orçamento">Adicionar ao orçamento</span></button>
        <a class="peca__wa" href="${pedir(p)}" target="_blank" rel="noopener" data-in><span class="pill__t" data-t="Pedir esta no WhatsApp">Pedir esta no WhatsApp</span></a>
      </form>
      <div class="peca__bottom">
        <dl class="peca__ship" data-in>
${ENTREGA.map(([k, v]) => `          <div><dt class="mono dim">${k}</dt><dd class="mono">${esc(v)}</dd></div>`).join('\n')}
        </dl>
        <p class="peca__fale mono dim" data-in>WhatsApp ${WHATS_TXT} · Maringá, PR</p>
      </div>
    </aside>
  </main>

  <nav class="prox" aria-label="Outras peças">
    <a class="prox__a" href="${url(next)}" data-troca>
      <span class="prox__k mono dim">Próxima estampa · ${next.n}/${total}</span>
      <span class="prox__t serif">${esc(next.nome)}</span>
      <img class="prox__img" src="${B}img/loja/${next.img}.webp" alt="" width="800" height="800" loading="lazy" decoding="async" />
    </a>
    <p class="prox__row mono">
      <a class="ul" href="${url(prev)}" data-troca>← ${esc(prev.nome)}</a>
      <a class="ul" href="${B}#loja" data-troca>Voltar para a loja</a>
      <a class="ul" href="${url(next)}" data-troca>${esc(next.nome)} →</a>
    </p>
  </nav>

  <footer class="pfoot mono dim">
    <p>Custom Works Co. · Estampas em DTF · Maringá, PR · Envio para todo o Brasil</p>
    <p>© 2026 · <a class="ul" href="https://www.instagram.com/customworks.co/" target="_blank" rel="noopener">@customworks.co</a></p>
  </footer>

  <!-- celular: tamanho e "Orçar" numa barra fixa embaixo -->
  <div class="pbar" aria-label="Pedir orçamento">
    <p class="pbar__row"><span class="pbar__name">${esc(p.nome)}</span><span class="pbar__price">Sob consulta</span></p>
    <div class="pbar__row">
      <div class="sizes sizes--bar" style="--cols: ${cols}">${sizes('tam-bar')}</div>
      <button class="pbar__add mono" type="button">Orçar</button>
    </div>
  </div>

  <p class="toast mono" role="status" aria-live="polite"></p>
  <aside class="bag" aria-label="Orçamento" aria-hidden="true">
    <p class="bag__head mono"><span>Orçamento</span><span class="bag__n">0 peças</span></p>
    <ul class="bag__list"><li class="bag__empty dim">Nada aqui ainda.</li></ul>
    <p class="bag__total"><span>Total</span><span class="bag__sum">0 peças</span></p>
    <a class="bag__go" href="${wa('Olá, Custom Works! Quero fazer um orçamento.')}" target="_blank" rel="noopener"><span class="pill__t" data-t="Pedir orçamento no WhatsApp">Pedir orçamento no WhatsApp</span></a>
  </aside>
</body>
</html>
`;
};

if (existsSync('peca')) rmSync('peca', { recursive: true });
PECAS.forEach((p, i) => {
  mkdirSync(`peca/${p.slug}`, { recursive: true });
  writeFileSync(`peca/${p.slug}/index.html`, page(p, i));
});
console.log(`grade com ${PECAS.length} peças; ${PECAS.length} páginas em peca/ (base ${B})`);
