// Interpolação monotônica (Fritsch–Carlson): passa pelos pontos, sem passar do ponto e com velocidade contínua.
// Serve para o roteiro do giro (progresso do scroll → posição no movimento do carro) e para a câmera.
export function monotone(xs, ys) {
  const n = xs.length, d = [], m = new Array(n);
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = m[i + 1] = 0; continue; }
    const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b;
    if (s > 9) { const t = 3 / Math.sqrt(s); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; }
  }
  return (x) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0;
    while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i], t = (x - xs[i]) / h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
  };
}

/** quadro (fracionário, 0-based) em que o movimento acumulado chega a s (cum: um valor por quadro, 0 → 1) */
export function frameAt(cum, s) {
  if (s <= 0) return 0;
  const n = cum.length;
  if (s >= 1) return n - 1;
  let lo = 0, hi = n - 1;
  while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (cum[mid] <= s) lo = mid; else hi = mid; }
  return lo + (s - cum[lo]) / (cum[hi] - cum[lo] || 1);
}

/** o inverso: posição no movimento de um quadro (fracionário) */
export function motionAt(cum, f) {
  const i = Math.max(0, Math.min(cum.length - 2, Math.floor(f)));
  return cum[i] + (cum[i + 1] - cum[i]) * (f - i);
}

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
