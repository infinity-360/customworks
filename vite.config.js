import { defineConfig } from 'vite';
import { readdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

// todas as páginas como entrada: a loja e uma pasta por peça (peca/<slug>/index.html, geradas por scripts/paginas.mjs)
const pages = () => {
  const input = { main: resolve(__dirname, 'index.html') };
  if (existsSync('peca')) for (const slug of readdirSync('peca')) input[`peca-${slug}`] = resolve(__dirname, 'peca', slug, 'index.html');
  return input;
};

export default defineConfig({
  base: process.env.BASE || '/',
  build: { rolldownOptions: { input: pages() } },
});
