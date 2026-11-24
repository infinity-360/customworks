// 05 Rodapé: "Vulto." gigante ajustado à largura (medido), letras que sobem da linha de base por tempo quando ele
// entra; a pergunta da newsletter entra por linha.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { showLines, hideLines, split } from './split.js';
import { EASE } from './ease.js';

export function foot({ reduced }) {
  const f = document.querySelector('.foot');
  const logo = f.querySelector('.foot__logo');
  const chars = [...logo.querySelectorAll('.ch')];
  const q = f.querySelector('.foot__q');
  const fit = () => {
    logo.style.setProperty('--foot-logo', '100px');
    const w = logo.querySelector('.chars').getBoundingClientRect().width;
    const gut = parseFloat(getComputedStyle(f).paddingLeft);
    logo.style.setProperty('--foot-logo', `${((100 * (innerWidth - gut * 2)) / w).toFixed(2)}px`);
  };
  fit();
  if (!reduced) { gsap.set(chars, { yPercent: 105 }); split(q); } // a pergunta nasce escondida: entra uma vez só
  ScrollTrigger.create({
    trigger: logo, start: 'top 96%',
    onEnter: () => { if (!reduced) gsap.to(chars, { yPercent: 0, duration: 1.3, ease: EASE.out, stagger: 0.055, overwrite: true }); },
    onLeaveBack: () => { if (!reduced) gsap.to(chars, { yPercent: 105, duration: 0.45, ease: EASE.in, stagger: 0.02, overwrite: true }); },
  });
  ScrollTrigger.create({
    trigger: q, start: 'top 88%',
    onEnter: () => showLines(q, { instant: reduced }),
    onLeaveBack: () => hideLines(q, { dir: -1, instant: reduced }),
  });
  return { fit };
}
