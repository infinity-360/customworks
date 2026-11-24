// Carrega a sequência de quadros (WebP com alfa) gerada por scripts/frames-alpha.sh.
// Baseado em tools/frames-lab/frame-scroll.js: 1º quadro antes de tudo, depois o último, depois "grosso → fino"
// (a cada 16, 8, 4, 2, 1). Quem pede um quadro que ainda não chegou recebe o carregado mais próximo.
//
// Desenhar um <img> WebP com alfa no canvas obriga o navegador a decodificar de novo quando o cache de imagens da
// GPU já o descartou (121 quadros de 1600 px não cabem): com a CPU 4× mais lenta, cada quadro custava ~26 ms e o
// scroll do celular perdia 15% dos quadros. Então o giro desenha ImageBitmaps já decodificados, numa janela em
// volta do quadro atual (decodificados fora da thread principal, na direção da rolagem); fora dela, o <img>.
// No celular os bitmaps saem reduzidos a 1.100 px (o carro nunca passa de ~1.050 px de tela ali).
// As miniaturas em loop (test-drive) usam bitmaps pequenos de um quadro sim, outro não.
export function loadFrames({ base, concurrency = 6 }) {
  const api = { count: 0, loaded: 0, images: [], manifest: null, onLoad: null };
  const canBitmap = typeof createImageBitmap === 'function';

  api.nearest = (i) => {
    const { images, count } = api;
    i = Math.round(i);
    for (let d = 0; d < count; d++) {
      if (images[i - d]) return images[i - d];
      if (images[i + d]) return images[i + d];
    }
    return null;
  };
  api.progress = () => (api.count ? api.loaded / api.count : 0);

  // ---- janela de bitmaps em volta do quadro atual ----
  const bmps = new Map(); // i → ImageBitmap
  const pending = new Set();
  let bmpWidth = 0, want = [], busy = 0;
  const BACK = 6, AHEAD = 18, PAR = 2;
  api.bitmap = (i) => bmps.get(i) || null;
  /** o bitmap já decodificado mais perto de i (até `range` quadros): rolando rápido no celular, desenhar um vizinho
   *  pronto é invisível; redecodificar o <img> na thread principal custa ~60 ms com a CPU 4× mais lenta */
  api.nearestBitmap = (i, range = 10) => {
    i = Math.round(i);
    for (let d = 0; d <= range; d++) {
      const a = bmps.get(i - d); if (a) return a;
      const b = bmps.get(i + d); if (b) return b;
    }
    return null;
  };
  api.onBitmap = null;
  function pump() {
    while (busy < PAR && want.length) {
      const i = want.shift();
      const img = api.images[i];
      if (!img || bmps.has(i) || pending.has(i)) continue;
      pending.add(i); busy++;
      const w = bmpWidth && bmpWidth < img.naturalWidth ? bmpWidth : 0;
      const opts = w ? { resizeWidth: w, resizeHeight: Math.round((img.naturalHeight * w) / img.naturalWidth), resizeQuality: 'medium' } : undefined;
      // a partir do Blob (já no cache HTTP): o navegador decodifica e reduz fora da thread principal
      fetch(img.src).then((r) => r.blob())
        .then((blob) => (opts ? createImageBitmap(blob, opts).catch(() => createImageBitmap(blob)) : createImageBitmap(blob)))
        .then((b) => { bmps.set(i, b); api.onBitmap?.(i); }, () => {})
        .finally(() => { pending.delete(i); busy--; pump(); });
    }
  }
  /** pede a decodificação dos quadros em volta de i (dir = sentido da rolagem); solta os que saíram da janela */
  api.warm = (i, dir = 1, { width = 0 } = {}) => {
    if (!canBitmap || !api.count) return;
    if (width !== bmpWidth) { bmps.forEach((b) => b.close()); bmps.clear(); bmpWidth = width; }
    const c = Math.round(i);
    const lo = Math.max(0, c - (dir > 0 ? BACK : AHEAD)), hi = Math.min(api.count - 1, c + (dir > 0 ? AHEAD : BACK));
    for (const [k, b] of bmps) if (k < lo - 4 || k > hi + 4) { b.close(); bmps.delete(k); }
    want = [];
    for (let d = 0; d <= hi - lo; d++) {
      const k = dir > 0 ? c + d : c - d;
      if (k >= lo && k <= hi && !bmps.has(k)) want.push(k);
      const k2 = dir > 0 ? c - d : c + d;
      if (d && d <= BACK && k2 >= lo && k2 <= hi && !bmps.has(k2)) want.push(k2);
    }
    pump();
  };

  // ---- bitmaps pequenos para as miniaturas (um quadro sim, outro não) ----
  const smalls = [];
  let smallStarted = false;
  api.small = (i, width = 560) => {
    if (!canBitmap) return api.images[i] || api.nearest(i);
    if (!smallStarted && api.loaded === api.count && api.count) {
      smallStarted = true;
      (async () => {
        for (let k = 0; k < api.count; k += 2) {
          const img = api.images[k];
          if (!img) continue;
          const h = Math.round((img.naturalHeight * width) / img.naturalWidth);
          const blob = await fetch(img.src).then((r) => r.blob()).catch(() => null);
          smalls[k] = blob ? await createImageBitmap(blob, { resizeWidth: width, resizeHeight: h, resizeQuality: 'medium' }).catch(() => null) : null;
        }
      })();
    }
    const k = i - (i % 2);
    return smalls[k] || null;
  };

  let resolveFirst;
  api.first = new Promise((r) => (resolveFirst = r));

  api.ready = (async () => {
    const manifest = (api.manifest = await fetch(`${base}/manifest.json`).then((r) => {
      if (!r.ok) throw new Error(`${base}: sem manifest`);
      return r.json();
    }));
    api.count = manifest.count;
    api.images = new Array(api.count);
    const url = (i) => `${base}/${String(i + 1).padStart(4, '0')}.${manifest.ext}`;
    const load = (i) => new Promise((resolve) => {
      const img = new Image();
      img.src = url(i);
      img.decode().then(() => { api.images[i] = img; api.loaded++; api.onLoad?.(i); }, () => {}).finally(resolve);
    });

    await load(0);
    resolveFirst(api.images[0]);

    const order = [];
    const seen = new Set([0]);
    if (api.count > 1) { order.push(api.count - 1); seen.add(api.count - 1); }
    for (let step = 16; step >= 1; step /= 2)
      for (let i = 0; i < api.count; i += step) if (!seen.has(i)) { seen.add(i); order.push(i); }
    await Promise.all(Array.from({ length: concurrency }, async () => {
      for (let i; (i = order.shift()) !== undefined; ) await load(i);
    }));
    return api;
  })();
  api.ready.catch(() => resolveFirst(null));
  return api;
}
