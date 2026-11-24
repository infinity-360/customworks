// As curvas do site, num lugar só (as mesmas de tokens.css):
//   out    entradas: ataque rápido e pouso longo (expo.out)
//   in     saídas: segura e acelera (power3.in), sempre mais curta que a entrada
//   linha  o fio da agulha: parado, puxão seco e pouso longo (voo do logo, cortina do manifesto, troca de lado)
import { gsap } from 'gsap';
import { CustomEase } from 'gsap/CustomEase';

gsap.registerPlugin(CustomEase);
CustomEase.create('linha', 'M0,0 C0.76,0 0.12,1 1,1');

export const EASE = { out: 'expo.out', in: 'power3.in', linha: 'linha', io: 'expo.inOut' };
