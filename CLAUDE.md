# Guia do projeto — Vulto.

(Salve como `CLAUDE.md` na raiz do projeto se você usa o Claude Code, ou como `AGENTS.md` se usa o Codex, o Cursor ou outro agente. O conteúdo é o mesmo.)

Guia para construir e manter a landing page da Vulto. (streetwear bordado à mão, fundo branco). Leia inteiro antes de codar.

## O que importa
- **É uma loja de roupa, e a roupa está na capa.** A peça principal é o Moletom aranha em 3D preso na tela, girando com o scroll de frente às costas (onde aparece a aranha vermelha bordada) ao lado do manifesto, e que desfoca e some atrás da palavra "Loja" quando a loja sobe por cima. Ela vem primeiro e precisa estar perfeita antes das outras seções.
- O giro depende de três coisas: os quadros têm **fundo transparente** (o moletom assenta no branco da página, com a sombra de contato no alfa); a peça é posicionada **pela caixa da peça e pelo eixo do giro** do manifest, não pela caixa do PNG; e o texto **nunca** fica sobre ela.
- Depois da capa, **a loja funciona como loja**: grade padrão (cards iguais, 4 colunas, filtros, compra rápida no hover), uma página por peça com endereço próprio e a troca de página em quadrados brancos. O que tira a cara de template: o moletom girando, as fotos todas no mesmo estúdio, a página da peça como tira branca contínua com as interfaces fixas dos lados, a troca em diagonal, os detalhes mono (Esgotado, Nº 34/50, grau) e uma ideia própria por seção (relógio do bordado, cortina vermelha, "Vulto." gigante).
- O nível é de site premiado: nenhuma letra cortada em repouso, nenhuma transição mole, nenhum trecho morto no scroll, nada de fade-up genérico em cascata.
- As imagens em `arquivos/conceito/` são o alvo. Compare o resultado com elas.
- A peça principal (`giro.js`), a abertura, a troca de página (`troca.js`), a sacola e os utilitários vêm prontos em `arquivos/motion/`; os dados das peças e o gerador das páginas em `arquivos/data/` e `arquivos/scripts/`. Não reescreva: monte o HTML que eles esperam (prompt, Parte 2) e ajuste só as constantes do topo.

## Design system
Tokens em `src/styles/tokens.css`, sempre por variável:

| Token | Valor | Uso |
|---|---|---|
| `--bg` | `#fcfbfa` | fundo da loja e texto sobre o vermelho |
| — | `#ffffff` | fundo da página da peça e dos quadrados da troca (as fotos da peça têm esse branco exato) |
| `--card` | `#f4f2f0` | fundo das fotos de produto (as fotos já vêm com o branco puxado para essa cor) |
| `--rule` | `#e4e2de` | fios |
| `--fg` | `#2f3a40` | texto (ardósia, nunca preto) |
| `--dim` | `#8a9196` | categoria, legendas |
| `--red` | `#f01810` | **o único acento**: sacola cheia, barra das horas, aranha, bloco do manifesto |
| `--ink` | `#16191b` | etiqueta "Esgotado", aviso da sacola, botão "Avisar" |

- **Instrument Serif** (regular e itálico): o "V" do logo (itálico, 1,12em, encostado), "Loja" (12,6vw), o nome da peça (4,4vw) e a próxima peça (9,4vw), "Devagar, de propósito.", "Doze peças.", o manifesto vermelho, o menu. Tracking −0,015 a −0,035em.
- **Inter Tight** 400: o "ulto." do logo (tracking −0,045em), o parágrafo do hero (1,47vw), o manifesto do giro (3,05vw, entrelinha 1,08, tracking −0,028em), nomes e preços da grade (1,08vw), texto.
- **Geist Mono** 11 px caixa alta, tracking 0,06em: rótulos, etiqueta, grau, relógio (peso 200, 5,7vw).
- Margem `--gut: clamp(20px, 2.8vw, 44px)`; topo `--top: clamp(18px, 2.4vw, 36px)`. Fontes pelo npm (Fontsource).

## Componentes
- **Logo**: um elemento só, fixo (`.brand` de fora some/volta com a nav por transição CSS; `.brand__in` de dentro é o que o GSAP escala). Tamanho de base = o do hero; os estados centro (abertura) e canto (nav) são `translate + scale` calculados.
- **Pílula**: cinza `#ecebe8`, 44 px, rótulo que rola para cima no hover e fundo que vira ardósia.
- **Card de produto**: foto 4:5 `cover` no `--card` (todos do mesmo tamanho), duas `<img>` (frente e costas) trocando por opacidade + desfoque no hover; número da peça em mono no canto; legenda em grade (nome | preço; categoria | "Restam n/50"); a faixa "Adicionar · P M G GG" sobe de dentro da foto no hover e cada tamanho soma direto na sacola. No celular, sem faixa, e o nome quebra em vez de cortar.
- **Etiqueta Esgotado**: fundo `--ink`, mono branco 10 px.
- **Página da peça**: três colunas (ficha | fotos | compra); as colunas dos lados são `sticky` com a altura da tela e o conteúdo dividido em cima e embaixo; as fotos no meio empilhadas sem gap, fundo `#ffffff`. Tamanhos quadrados de 46 px com contorno de 1 px; "Adicionar à sacola" em pílula preta de 54 px. No celular, barra fixa no pé com nome, preço, tamanhos e "Adicionar".
- **Troca de página**: canvas fixo por cima de tudo; quadrados brancos de ~100 px (colunas inteiras) que crescem do centro em onda diagonal a partir do canto superior esquerdo (0,1 s cada, 0,6 s a onda); a página nova nasce coberta e descobre na mesma onda.
- **Tabela fina**: rótulo mono numa coluna de 8,2em + valor mono, fios de 1 px entre as linhas.

## Motion
- GSAP + ScrollTrigger + SplitText + CustomEase, Lenis (`lerp 0.1`) como **única** suavização. Os palcos (giro, ateliê, manifesto) são `position: sticky`; os gatilhos nascem antes do Lenis e `lenis.resize()` roda no refresh.
- **O scroll dirige o contínuo; o texto entra por tempo.** Presos ao scroll: quadro do moletom, grau, desfoque do fim, relógio, barra, estados do bordado, cortina. Por tempo: logo encolhendo, parágrafos, manifesto, ficha, "Loja", cards, filtros, legendas, números, textos da página da peça, rodapé.
- Curvas: entradas `expo.out` (1–1,4 s); saídas `power3.in` (0,35–0,45 s); `linha` (`M0,0 C0.76,0 0.12,1 1,1`) no voo do logo e no menu.
- Desfoque como assinatura (da referência de moda): o manifesto palavra a palavra, os cards entrando, a troca frente/costas, o moletom sumindo atrás de "Loja", a troca dos estados do bordado. A troca de página é o contrário: **seca**, quadrados sem desfoque nem fade.
- Nenhuma transição CSS em propriedade que o GSAP anima.
- `prefers-reduced-motion`: sem abertura, sem Lenis, `transition: none !important`, moletom em três quadros fixos (frente, perfil, costas), texto direto, troca de página por fusão curta.

## Regras de qualidade
- Nenhum texto cortado em repouso em 1456, 1280 e 390 px (acento de "história", cedilha de "Peças", o "j" de "Loja", o "V" itálico do rodapé, nomes de peça com reticências).
- O texto do hero e do manifesto nunca fica sobre o moletom (o giro empurra o eixo para a direita se a tela for estreita).
- **Emenda invisível na página da peça**: medir o pixel na junção de duas fotos (tem que dar `#ffffff`, e a borda de cada foto também); nada de `gap`, borda, sombra ou fundo diferente na coluna.
- **Troca sem flash**: gravar a navegação (loja → peça → próxima peça → loja) e conferir quadro a quadro que a tela vai do conteúdo ao branco total e volta, sem nenhum quadro da página nova descoberta antes da onda.
- Cada página de peça abre direto pelo endereço no `dist/` servido por um servidor estático qualquer (`npx vite preview` ou `npx serve dist`).
- A nav nunca cobre conteúdo dentro do giro; fora dele, some ao descer.
- **Uma entrada por texto**: nenhum texto aparece antes da sua entrada nem entra duas vezes. Confira gravando a rolagem quadro a quadro (descendo e subindo) no Ateliê, no Manifesto, no fecho da Loja e no rodapé, abrindo uma peça direto pelo endereço e `/#loja` direto, e clicando nos filtros: o texto só surge quando a linha dele sobe, uma vez.
- O logo grande só existe no topo do hero: chegue na Loja por `/#loja`, recarregando no meio da página e voltando de uma peça, role para cima e para baixo, e o logo tem que estar sempre pequeno no canto.
- A sombra do moletom não pisca ao rolar devagar: o crossfade entre quadros é mistura linear (`lighter`), nunca o quadro seguinte por cima com alfa.
- A sombra do moletom nunca termina numa reta (os quadros já vêm com a sombra apagada nas bordas do corte).
- 60 fps rolando o giro no desktop; no celular com CPU 4× mais lenta, p95 perto de 16,7 ms (por isso a janela de ImageBitmaps).
- Console limpo num carregamento limpo rolando a página inteira; `npm run build` passa; imagens com `width`/`height`.

## Como checar
1. `npm run dev`, recarregue e veja a abertura inteira (só o logo nascendo no centro pela máscara macia e saindo do desfoque → voando para o lugar dele no hero → moletom subindo do desfoque, ~2,3 s). Grave os primeiros quadros: nenhum pode mostrar o logo gigante no canto nem texto sem estilo.
2. Role o giro devagar e depressa: o moletom gira sem trancos de frente às costas, o grau anda de 000° a 180°, as palavras do manifesto saem do desfoque inteiras, a ficha desenha os fios.
3. Pare no meio de cada marco: nada fica cortado; espere 1 s e tudo assenta.
4. Continue: "Loja" sobe na frente do moletom que desfoca; use os filtros; passe o mouse nos cards (frente/costas) e clique num tamanho da faixa (a sacola soma); clique numa peça: quadrados brancos cobrem a tela em diagonal e descobrem a página da peça; role as fotos (os lados ficam presos, o índice acompanha), escolha um tamanho, adicione, vá para a próxima peça e volte para a loja (cai direto na grade). No ateliê o relógio e o bordado andam juntos; a cortina vermelha abre de um fio; o "Vulto." do rodapé sobe.
5. Repita em 1280 × 720, no celular (390 × 844), no Safari e com movimento reduzido.
6. Com `?hd` (se gerou `public/frames/giro-hd/`), a abertura segura até os 121 quadros HD baixarem.

## Origem do moletom 3D e das imagens
- **Modelo 3D do moletom**: baseado em "Classic Black Flame Hoodie" (https://sketchfab.com/3d-models/classic-black-flame-hoodie-0fd0effa321e456cb2a7467e2899b658) de kril (https://sketchfab.com/krrril_), licença CC-BY-4.0 (http://creativecommons.org/licenses/by/4.0/). Do modelo só entra a forma: a estampa de chamas (costuras vermelhas e o relevo do normal map) foi tirada, e o tecido, as aranhas bordadas e a luz são da Vulto. O crédito já está no rodapé do site (`.foot__credit`). O tecido preto lavado, a aranha bordada, a luz e o giro foram feitos no Blender com `arquivos/scripts/roupa.py`; `arquivos/scripts/quadros.py` gera os WebP com alfa e o manifest. A licença CC-BY exige manter este crédito (no rodapé ou numa página de créditos do site).
- **Busto da serigrafia** (manifesto): "Head of David", molde de gesso do David de Michelangelo, Statens Museum for Kunst, Copenhague, objeto KAS2232, digitalização publicada com Public Domain Mark 1.0.
- **Fotos das peças, do modelo e do bastidor**: geradas para esta marca fictícia (pessoa e peças inventadas). Para pôr as suas, troque os arquivos em `public/img/loja/` e `public/img/peca/` mantendo os nomes e o branco do fundo (o `arquivos/scripts/imagens.py` que veio no bundle leva o fundo a 255 e iguala a escala; ver "Personalizar").

## Personalizar

O site chega como a demo da Vulto., uma marca inventada. Esta seção vale sempre que a pessoa pedir uma mudança, hoje ou daqui a meses: trocar a marca, uma peça, um preço, uma foto, o moletom da capa, ou levar uma parte para outro site.

### Antes de mexer
- Se ainda não sabe o objetivo, pergunte qual destes é (uma pergunta por vez, em linguagem simples):
  1. **Ver a demo funcionando** como está, para trocar depois.
  2. **O site da minha marca**, com esta estrutura e estas animações.
  3. **Só algumas peças** (o giro da capa, a troca de página em quadrados, a loja com a página da peça, uma seção) para um site que já existe.
- Para o caminho 2, pergunte o que ainda não sabe: nome da marca, o que vende e para quem, as peças (nome, categoria, preço, tamanhos, descrição, materiais), envio e trocas, endereço, cores e logo (se tiver), e **que material a pessoa já tem** (fotos das peças, fotos com modelo, um modelo 3D da peça principal). Não peça tudo de uma vez.
- Para o caminho 3, pergunte quais peças e onde fica o site de destino. Leia o código do destino antes: se for React, Next ou outro framework, adapte o módulo de `src/motion/` ao framework em vez de colar o HTML desta página. A troca de página (`troca.js`) depende de páginas separadas com o script do `<head>`; o giro (`giro.js` + `frames.js`) depende dos quadros com o `manifest.json`.
- Diga com clareza o que muda só com texto e o que depende de material novo (tabela abaixo). Ninguém consegue "pôr a minha peça no lugar do moletom" editando os quadros atuais: o giro são 121 imagens renderizadas de um modelo 3D do moletom da Vulto, e a peça da pessoa só gira se houver um modelo 3D dela e um render novo, como em `arquivos/receitas/LEIA.md`.
- A sacola é de vitrine: guarda as peças no navegador e soma o total, mas não cobra. "Finalizar compra" leva ao rodapé (`#avise`). Ligar a um pagamento de verdade (link de checkout, loja externa) é um trabalho à parte: avise e pergunte como a pessoa vende hoje.

### O que muda e onde
| o quê | onde | precisa de material novo? |
|---|---|---|
| Textos da capa, manifesto, ficha da peça do giro, ateliê, bloco vermelho, rodapé, menu | `index.html` (`.hero__p`, `.mani__t`, `dl.specs`, `.atelie`, `.sobre`, `.foot`, `.menu__foot`) e o `<title>`/`description` do `<head>` | não |
| Peças: nome, categoria, preço, esgotado, tiragem, descrição, materiais, tamanhos | `PECAS` em `src/data/pecas.js` (`preco: null` = esgotado; `tamanhos` só se não for P M G GG; `img` quando o nome das fotos difere do `slug`). A grade, os filtros e as páginas `peca/<slug>/` saem de `scripts/paginas.mjs`, que roda sozinho no `dev` e no `build` | não (fotos, se a peça é nova) |
| Envio, frete, trocas, etiqueta (a tabela da página da peça) | `ENTREGA` em `src/data/pecas.js` | não |
| Rodapé e logo das páginas de peça | o modelo de página em `scripts/paginas.mjs` (`.pnav__logo` e o parágrafo com a razão social e o endereço) | não |
| Nome da marca e logo | `index.html`: `.brand` (o "V" em `.logo__v` + "ulto.") e o "Vulto." gigante do rodapé (`.foot__logo`, uma letra por `.ch`); nas peças, `.pnav__logo` em `scripts/paginas.mjs`. A abertura e o voo do logo (`loader.js`, `brand.js`) medem o tamanho sozinhos; nome curto, de 4 a 7 letras, fica melhor | não |
| Cores | `src/styles/tokens.css` (`--bg`, `--fg`, `--red` etc.). O `#ffffff` da página da peça e o `--card` estão também **dentro das fotos** (o `imagens.py` puxa o fundo para essas cores, em `CARD`): mudou a cor, rode o script de novo | não |
| Fontes | `@fontsource` no `package.json`, os imports no topo de `src/main.js` e `src/peca.js`, e `--serif`, `--text`, `--mono` em `tokens.css` | não |
| Relógio e estados do bordado no ateliê | `HOURS` e `STATES` em `src/motion/atelie.js`; os números (`data-count`) no `index.html` | fotos novas, se mudar o bordado |
| Ficha e roteiro do giro | `dl.specs` no `index.html` (o link "Ver a peça" aponta para o `slug` da peça principal); a velocidade do giro em `SCRIPT` e o lugar da peça em `PLACE` (`src/motion/giro.js`) | não |
| Tirar uma seção (ateliê ou bloco vermelho) | apague o HTML da `<section>`, o import do CSS e a chamada (`atelie()`, `sobre()`) em `src/main.js`; os links da nav e do menu que apontam para ela | não |
| Fotos da grade e da página da peça | `public/img/loja/<img>-frente|costas.webp` e `public/img/peca/<img>-modelo|frente|costas(-800).webp` | sim: três fotos por peça |
| Bastidor do ateliê (três estados) e etiqueta | `public/img/bastidor-1|2|3.webp`, `public/img/etiqueta.webp` | sim: a **mesma foto** em três estados |
| Busto do bloco vermelho | `public/img/busto-serigrafia.webp` (digitalização em domínio público; pode ficar) | não |
| Moletom que gira na capa | `public/frames/giro/` (desktop) e `public/frames/giro-m/` (celular), cada um com o `manifest.json` | sim: modelo 3D e render novo (receitas) |
| Crédito do modelo 3D | `.foot__credit` no `index.html` | só sai se o moletom sair |

### Material da pessoa
Para cada peça visual, ofereça estes caminhos, do mais simples para o mais trabalhoso, e deixe a pessoa escolher:
1. **Manter a imagem da demo por enquanto** e trocar o resto. O site fica pronto hoje. As fotos das doze peças são da Vulto: numa loja de verdade, são as primeiras a trocar.
2. **Usar fotos que ela já tem.** As peças precisam de três fotos cada: frente e costas da peça sozinha, deitada ou em cabide, em **fundo branco liso** de estúdio, e uma de corpo inteiro com modelo, também em fundo branco. Todas em retrato 4:5, com 1200 px de largura ou mais, a mesma luz e a mesma escala entre as peças. Ponha os originais em `fonte/` com os nomes `<img>-frente`, `<img>-costas` e `<img>-modelo` (`.jpg` ou `.png`), acrescente o nome na lista `PECAS` do `arquivos/scripts/imagens.py` (copie-o para `scripts/`) e rode `python3 scripts/imagens.py` da raiz do projeto (precisa de Pillow e numpy). Ele leva o fundo ao branco exato, iguala a escala e grava `public/img/peca/` (1200 × 1500 e 800 × 1000) e `public/img/loja/` (720 × 900, no tom do card). Foto com fundo cinza, sombra forte, chão aparecendo ou peça cortada não emenda na tira branca da página da peça: diga isso e proponha o caminho 3. O bastidor são três fotos quadradas **do mesmo enquadramento** em três estados do trabalho (`fonte/bastidor-1`, `-2`, `-3`, saem com 1024 × 1024); a etiqueta, uma quadrada (`fonte/etiqueta`, sai com 640 px). O mesmo script converte as duas; o que faltar em `fonte/` ele pula.
3. **Gerar com IA** seguindo `arquivos/receitas/LEIA.md`: são os prompts que fizeram cada foto da demo. Troque o SUBJECT de cada prompt pela peça dela e anexe a foto real da peça como referência; a pessoa roda no gerador de imagem que usar e devolve os arquivos. Você passa pelo `imagens.py` como no caminho 2.
4. **A peça girando na capa.** Com um modelo 3D da peça dela (`.glb` ou `.gltf`), o render sai no Blender com `roupa.py` e vira quadros com `quadros.py` (os dois em `arquivos/scripts/`, copiados para `scripts/`; passo a passo em `arquivos/receitas/LEIA.md`). Sem modelo 3D, há uma saída que o código já aceita: o giro lê quantos quadros o `manifest.json` disser (o roteiro em `giro.js` é escrito em 121 quadros e se ajusta ao tamanho do conjunto) e mistura um quadro no outro conforme o scroll. Com **três fotos da peça** (frente, perfil, costas), recortadas com fundo transparente, em PNG do mesmo tamanho, numa pasta só e em ordem, rode `python3 scripts/quadros.py <pasta> public/frames/giro 1100 80 82 --lum 3 --deg 0,180` e de novo com `800` para `public/frames/giro-m`; sai um conjunto de três quadros com o manifest certo, sem mudar código. A peça passa de frente a costas numa fusão em vez de girar; o encaixe, o manifesto, a ficha e o desfoque atrás de "Loja" continuam. É o mesmo modo de três quadros que aparece para quem desliga as animações no sistema (`REDUCED_F`).

### Regras ao trocar
- As regras de motion acima continuam valendo: texto nunca preso ao scroll, uma entrada por texto, nada cortado em 1456, 1280 e 390 px, troca de página sem flash.
- O giro posiciona a peça pela caixa da peça (`obj`) e pelo eixo (`axis`) do `manifest.json`, não pela caixa do PNG. Quadro novo sem manifest gerado pelo `quadros.py` cai fora do lugar. Os quadros precisam de fundo transparente.
- As fotos da página da peça têm fundo `#ffffff` exato até a borda; confira o pixel na emenda de duas fotos depois de trocar.
- Peça nova: entrada em `PECAS` (`src/data/pecas.js`) + as três fotos + o nome na lista do `imagens.py`. Peça que sai: tire de `PECAS` e da lista do `imagens.py` (o gerador apaga a pasta `peca/` e recria só as páginas que existem). O "Ver a peça" da ficha do giro tem que apontar para um `slug` que existe.
- Moletom trocado por outra peça: tire o crédito CC BY do rodapé só se nenhum quadro do modelo antigo ficou; modelo novo com licença CC BY pede o crédito dele no mesmo lugar.
- Nada de texto, preço, tiragem ou depoimento inventado como se fosse da marca: o que a pessoa não informou fica marcado como `[preencher]` e entra na lista do fim.
- Depois de cada troca, rode o "Como checar" de novo nos trechos que mudaram, e no fim liste para a pessoa o que ficou da demo (fotos, quadros do moletom, textos, endereço) e o que falta ela mandar.
