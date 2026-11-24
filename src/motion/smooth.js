// Rolagem suave: Lenis por lerp (0,1 por quadro) dirigido pelo ticker do GSAP. É a única suavização do site:
// o giro, a fita e o fecho leem o progresso direto (sem scrub com atraso por cima), então seguem o dedo.
// Criar depois dos pins (ou ele guarda o limite errado); o refresh do ScrollTrigger avisa o Lenis.
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function smoothScroll() {
  const lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, touchMultiplier: 1.1 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  ScrollTrigger.addEventListener('refresh', () => lenis.resize());
  return lenis;
}
