// O catálogo da Custom Works, num lugar só. Quem lê: scripts/paginas.mjs (gera a grade do index.html e uma página
// estática por peça em peca/<slug>/index.html), o JS das páginas (lista de orçamento) e scripts/cw_imagens.py
// (lê `slug` e `src` daqui para preparar as fotos).
// Sem preço: tudo é sob consulta no WhatsApp. src = número da foto em _shopee/s-NN.jpg (loja NextLook na Shopee).
// Fotos: /img/loja/<slug>.webp (grade) e /img/peca/<slug>.webp + <slug>-800.webp (página da peça).

export const WHATS = '5544999922218';
export const WHATS_TXT = '(44) 99992-2218';
export const wa = (msg) => `https://wa.me/${WHATS}?text=${encodeURIComponent(msg)}`;

export const ENTREGA = [
  ['Preço', 'Sob consulta no WhatsApp'],
  ['Pedido', 'Sem quantidade mínima'],
  ['Estampa', 'DTF, padrão Custom Works'],
  ['Envio', 'De Maringá para todo o Brasil'],
];

const COSTAS = 'Grande, nas costas';
export const PECAS = [
  { slug: 'senna-mp4-4', src: 0, nome: 'Senna MP4/4', cat: 'Fórmula 1', desc: 'Camiseta masculina de algodão com Ayrton Senna e a McLaren MP4/4 de 1988 na frente.', mat: [['Base', 'Camiseta de algodão'], ['Estampa', 'Frente'], ['Tema', 'Ayrton Senna · F1']] },
  { slug: 'poeira-bota-e-estrada', src: 10, nome: 'Poeira, bota e estrada', cat: 'Country', desc: 'Camiseta country masculina, 100% algodão, com a arte "Poeira, bota e estrada" nas costas.', mat: [['Base', '100% algodão'], ['Estampa', COSTAS], ['Tema', 'Country · rodeio']] },
  { slug: 'guadalupe-protecao-e-fe', src: 4, nome: 'Guadalupe, proteção e fé', cat: 'Fé', desc: 'Camiseta feminina 100% algodão com Nossa Senhora de Guadalupe entre rosas.', mat: [['Base', '100% algodão'], ['Estampa', 'Frente'], ['Modelagem', 'Feminina']] },
  { slug: 'ele-vive-ele-reina', src: 20, nome: 'Ele vive, Ele reina', cat: 'Fé', desc: 'Camiseta masculina cristã, 100% algodão, com o leão "Ele vive, Ele reina" nas costas.', mat: [['Base', '100% algodão'], ['Estampa', COSTAS], ['Tema', 'Gospel']] },

  { slug: 'senna-lenda', src: 1, nome: 'Senna Lenda', cat: 'Fórmula 1', desc: 'Camiseta 100% algodão com Ayrton Senna, a assinatura e a MP4/4.', mat: [['Base', '100% algodão'], ['Estampa', 'Frente'], ['Tema', 'Ayrton Senna · F1']] },
  { slug: 'alma-de-peao', src: 11, nome: 'Alma de peão', cat: 'Country', desc: 'Camiseta country masculina, 100% algodão, com a arte "Alma de peão" nas costas.', mat: [['Base', '100% algodão'], ['Estampa', COSTAS], ['Tema', 'Country · sertanejo']] },
  { slug: 'tal-pai-tal-filha', src: 23, nome: 'Tal pai, tal filha', cat: 'Família', desc: 'Kit de camisetas 100% algodão para pai e filha, "Tal pai" e "Tal filha".', mat: [['Base', '100% algodão'], ['Kit', 'Pai e filha'], ['Ocasião', 'Dia dos Pais, presente']], tamanhos: ['A combinar'] },
  { slug: 'santa-rita-de-cassia', src: 5, nome: 'Santa Rita de Cássia', cat: 'Fé', desc: 'Camiseta feminina 100% algodão com Santa Rita de Cássia e rosas.', mat: [['Base', '100% algodão'], ['Estampa', 'Frente'], ['Modelagem', 'Feminina']] },

  { slug: 'respeita-o-cowboy', src: 12, nome: 'Respeita o cowboy', cat: 'Country', desc: 'Camiseta country masculina, 100% algodão, com a arte "Respeita o cowboy" nas costas.', mat: [['Base', '100% algodão'], ['Estampa', COSTAS], ['Tema', 'Country · western']] },
  { slug: 'procura-nu-gugo', src: 8, nome: 'Procura nu Gugo', cat: 'Humor', desc: 'Camiseta unissex de algodão fio 30.1 com o meme "Procura nu Gugo".', mat: [['Base', 'Algodão fio 30.1'], ['Estampa', 'Frente'], ['Modelagem', 'Unissex']] },
  { slug: 'sao-bento-cavaleiro', src: 18, nome: 'São Bento cavaleiro', cat: 'Fé', desc: 'Camiseta unissex 100% algodão com o cavaleiro medieval e a medalha de São Bento.', mat: [['Base', '100% algodão'], ['Estampa', COSTAS], ['Modelagem', 'Unissex']] },
  { slug: 'senna-kit-2', src: 2, nome: 'Kit 2 Senna', cat: 'Fórmula 1', desc: 'Kit com duas camisetas masculinas Ayrton Senna, estampa grande, algodão.', mat: [['Base', 'Algodão'], ['Kit', 'Duas camisetas'], ['Tema', 'Ayrton Senna · F1']] },

  { slug: 'criado-no-campo', src: 13, nome: 'Criado no campo', cat: 'Country', desc: 'Camiseta country masculina, 100% algodão, com a arte "Criado no campo" nas costas.', mat: [['Base', '100% algodão'], ['Estampa', COSTAS], ['Tema', 'Country · agro']] },
  { slug: 'natal-ho-ho-ho', src: 6, nome: 'Natal Ho Ho Ho', cat: 'Família', desc: 'Camisetas de Natal para a família toda, "Ho Ho Ho". Monte o conjunto: tamanhos adulto e infantil, por unidade.', mat: [['Base', 'Algodão'], ['Kit', 'Pai, mãe e filhos'], ['Ocasião', 'Natal']], tamanhos: ['Adulto', 'Infantil'] },
  { slug: 'fe-acima-do-medo', src: 22, nome: 'Fé acima do medo', cat: 'Fé', desc: 'Camiseta masculina cristã, 100% algodão, com o leão "Fé acima do medo" nas costas.', mat: [['Base', '100% algodão'], ['Estampa', COSTAS], ['Tema', 'Gospel']] },
  { slug: 'ayrton-senna-mclaren', src: 3, nome: 'Ayrton Senna McLaren', cat: 'Fórmula 1', desc: 'Camiseta masculina de algodão com Ayrton Senna na McLaren, estampa de automobilismo.', mat: [['Base', 'Algodão'], ['Estampa', 'Grande'], ['Tema', 'Ayrton Senna · F1']] },

  { slug: 'nascido-no-campo', src: 14, nome: 'Nascido no campo', cat: 'Country', desc: 'Camiseta country masculina, 100% algodão, com a arte "Nascido no campo" nas costas.', mat: [['Base', '100% algodão'], ['Estampa', COSTAS], ['Tema', 'Country · agro']] },
  { slug: 'guadalupe-fe-e-amor', src: 7, nome: 'Guadalupe, fé e amor', cat: 'Fé', desc: 'Camiseta feminina com Nossa Senhora de Guadalupe, fé, amor e proteção.', mat: [['Base', 'Algodão'], ['Estampa', 'Frente'], ['Modelagem', 'Feminina']] },
  { slug: 'tal-pai-tal-filho', src: 24, nome: 'Tal pai, tal filho', cat: 'Família', desc: 'Kit de camisetas 100% algodão para pai e filho, "Tal pai" e "Tal filho".', mat: [['Base', '100% algodão'], ['Kit', 'Pai e filho'], ['Ocasião', 'Dia dos Pais, presente']], tamanhos: ['A combinar'] },
  { slug: 'sao-bento-medalha', src: 17, nome: 'São Bento medalha', cat: 'Fé', desc: 'Camiseta masculina católica, 100% algodão, com a medalha de São Bento nas costas.', mat: [['Base', '100% algodão'], ['Estampa', COSTAS], ['Tema', 'Católica']] },

  { slug: 'bruto-por-natureza', src: 15, nome: 'Bruto por natureza', cat: 'Country', desc: 'Camiseta country masculina, 100% algodão, com o touro "Bruto por natureza" nas costas.', mat: [['Base', '100% algodão'], ['Estampa', COSTAS], ['Tema', 'Country · rodeio']] },
  { slug: 'sao-bento-cruz-sagrada', src: 25, nome: 'São Bento cruz sagrada', cat: 'Fé', desc: 'Camiseta unissex 100% algodão, "Cruz sagrada, seja minha luz", nas costas.', mat: [['Base', '100% algodão'], ['Estampa', COSTAS], ['Modelagem', 'Unissex']] },
  { slug: 'natal-feliz-natal', src: 9, nome: 'Natal Feliz Natal', cat: 'Família', desc: 'Camisetas "Feliz Natal" para pai, mãe e filhos. Venda por unidade, adulto e infantil.', mat: [['Base', '100% algodão'], ['Kit', 'Pai, mãe e filhos'], ['Ocasião', 'Natal']], tamanhos: ['Adulto', 'Infantil'] },
  { slug: 'mini-cowboy', src: 21, nome: 'Mini cowboy', cat: 'Country', desc: 'Camiseta infantil country, o mini cowboy boiadeiro: chapéu na frente e o cavalo nas costas.', mat: [['Base', 'Algodão'], ['Estampa', 'Frente e costas'], ['Modelagem', 'Infantil']], tamanhos: ['Infantil'] },

  { slug: 'bruto-de-verdade', src: 16, nome: 'Bruto de verdade', cat: 'Country', desc: 'Camiseta country masculina, 100% algodão, com o touro "Bruto de verdade".', mat: [['Base', '100% algodão'], ['Estampa', COSTAS], ['Tema', 'Country · rodeio']] },
  { slug: 'sao-bento-medalha-beneditina', src: 26, nome: 'Medalha beneditina', cat: 'Fé', desc: 'Camiseta católica 100% algodão com São Bento, a medalha beneditina e o mosteiro nas costas.', mat: [['Base', '100% algodão'], ['Estampa', COSTAS], ['Tema', 'Católica']] },
  { slug: 'halloween-abobora', src: 33, nome: 'Halloween abóbora', cat: 'Humor', desc: 'Camiseta unissex com o rosto de abóbora do Dia das Bruxas. Serve de fantasia.', mat: [['Base', 'Algodão'], ['Estampa', 'Frente'], ['Modelagem', 'Unissex']] },
  { slug: 'sangue-de-cowboy', src: 19, nome: 'Sangue de cowboy', cat: 'Country', desc: 'Camiseta country masculina, 100% algodão, com a arte "Sangue de cowboy" nas costas.', mat: [['Base', '100% algodão'], ['Estampa', COSTAS], ['Tema', 'Country · western']] },

  { slug: 'sao-bento-pax', src: 27, nome: 'São Bento PAX', cat: 'Fé', desc: 'Camiseta católica 100% algodão, PAX e a adoração ao Santíssimo nas costas.', mat: [['Base', '100% algodão'], ['Estampa', COSTAS], ['Tema', 'Católica']] },
  { slug: 'kit-3-tal-pai-tal-filha', src: 31, nome: 'Kit 3 Tal pai, tal filha', cat: 'Família', desc: 'Kit com três camisetas 100% algodão para a família, "Tal pai" e "Tal filha".', mat: [['Base', '100% algodão'], ['Kit', 'Três camisetas'], ['Ocasião', 'Dia dos Pais, presente']], tamanhos: ['A combinar'] },
  { slug: 'sao-bento-ora-et-labora', src: 28, nome: 'Ora et labora', cat: 'Fé', desc: 'Camiseta católica 100% algodão com São Bento e o lema "Ora et labora" nas costas.', mat: [['Base', '100% algodão'], ['Estampa', COSTAS], ['Tema', 'Católica']] },
  { slug: 'aparecida-filha-de-maria', src: 32, nome: 'Aparecida, filha de Maria', cat: 'Fé', desc: 'Camiseta feminina 100% algodão com Nossa Senhora Aparecida, "Filha de Maria".', mat: [['Base', '100% algodão'], ['Estampa', 'Frente'], ['Modelagem', 'Feminina']] },

  { slug: 'sao-bento-vade-retro', src: 29, nome: 'Vade retro Satana', cat: 'Fé', desc: 'Camiseta unissex 100% algodão com São Bento e o "Vade retro Satana" nas costas.', mat: [['Base', '100% algodão'], ['Estampa', COSTAS], ['Modelagem', 'Unissex']] },
  { slug: 'guadalupe-presente', src: 30, nome: 'Guadalupe presente', cat: 'Fé', desc: 'Camiseta católica feminina 100% algodão com Nossa Senhora de Guadalupe. Um presente religioso.', mat: [['Base', '100% algodão'], ['Estampa', 'Frente'], ['Modelagem', 'Feminina']] },
];

PECAS.forEach((p, i) => {
  p.n = String(i + 1).padStart(2, '0');
  p.img = p.img || p.slug;
  p.tamanhos = p.tamanhos || ['P', 'M', 'G', 'GG'];
  p.url = `/peca/${p.slug}/`;
  p.alt = p.alt || `${p.nome}: ${p.desc}`;
  p.materiais = [...p.mat, ['Pedido', 'Sem quantidade mínima']];
});
