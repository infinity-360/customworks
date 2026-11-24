// 04 Manifesto: o bloco vermelho abre de um fio no meio (clip-path preso ao scroll, a cortina), o busto em serigrafia
// sobe devagar (parallax) e as três linhas entram por tempo quando a cortina termina. A nav fica off-white em cima
// do vermelho.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { showLines, hideLines, split } from './split.js';
import { clamp } from './curve.js';

export function sobre({ reduced }) {
  const sec = document.querySelector('.sobre');
  const block = sec.querySelector('.sobre__block');
  const bust = sec.querySelector('.sobre__bust');
  const lines = [...sec.querySelectorAll('[data-split]')];
  const btn = sec.querySelector('.sobre__btn');
  const html = document.documentElement;
  const ease = (t) => 1 - Math.pow(1 - t, 3);

  if (reduced) block.style.clipPath = 'none';
  else ScrollTrigger.create({
    trigger: sec, start: 'top 92%', end: 'top 8%',
    onUpdate: (self) => {
      const v = 49.8 * (1 - ease(clamp(self.progress)));
      block.style.clipPath = `inset(${v.toFixed(2)}% 0 ${v.toFixed(2)}% 0)`;
    },
    onRefresh: (self) => { const v = 49.8 * (1 - ease(clamp(self.progress))); block.style.clipPath = `inset(${v.toFixed(2)}% 0 ${v.toFixed(2)}% 0)`; },
  });
  if (!reduced) gsap.fromTo(bust, { yPercent: 22 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: sec, start: 'top 60%', end: 'bottom bottom', scrub: true } });

  // linhas divididas e escondidas desde o começo (entram uma vez só, quando a cortina termina)
  if (!reduced) { lines.forEach((el) => split(el)); gsap.set(btn, { opacity: 0 }); }
  ScrollTrigger.create({
    trigger: sec, start: 'top 12%',
    onEnter: () => {
      lines.forEach((el, i) => showLines(el, { delay: i * 0.1, stagger: 0.1, instant: reduced }));
      if (!reduced) gsap.fromTo(btn, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 1, ease: 'expo.out', delay: 0.5 });
    },
    onLeaveBack: () => {
      lines.forEach((el) => hideLines(el, { dir: -1, instant: reduced }));
      if (!reduced) gsap.to(btn, { opacity: 0, duration: 0.3, ease: 'power3.in' });
    },
  });
  // nav off-white quando o bloco aberto passa por baixo dela
  ScrollTrigger.create({ trigger: sec, start: 'top 6%', end: 'bottom 6%', toggleClass: { targets: html, className: 'nav-red' } });
}
