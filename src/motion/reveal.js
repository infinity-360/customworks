// Entradas por tempo ligadas à posição na tela: quando o elemento cruza a linha (padrão: 86% da altura), entra;
// quando volta para baixo dela rolando para cima, sai. Nada fica preso ao meio do caminho.
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function onReach(el, { start = 'top 86%', enter, leave, once = false }) {
  return ScrollTrigger.create({
    trigger: el, start,
    onEnter: () => enter(1),
    onLeaveBack: () => { if (!once) leave?.(-1); },
  });
}
