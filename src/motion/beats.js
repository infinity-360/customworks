// Marcos presos a um progresso: cada item tem uma janela [a, b) e é ligado/desligado quando o progresso entra/sai
// dela. Quem anima é o item, por tempo (enter/leave recebem a direção da rolagem). Vários itens podem estar ativos.
export function beats(items) {
  const on = new Set();
  return {
    update(p, dir = 1) {
      items.forEach((it, i) => {
        const inside = p >= it.a && p < it.b;
        if (inside && !on.has(i)) { on.add(i); it.enter(dir); }
        else if (!inside && on.has(i)) { on.delete(i); it.leave(dir); }
      });
    },
    reset() { on.clear(); },
  };
}
