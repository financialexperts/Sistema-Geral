import { movimentoReduzido } from './dom.js';

// Troca de tela com a View Transitions API, quando o navegador tem e a
// pessoa não pediu menos movimento: o que tem o mesmo view-transition-name
// nas duas telas "voa" de um lugar para o outro (o portal do curso vira o
// banner dele; o ícone do cartão vira o do cabeçalho do sistema). Sem a
// API, a tela só troca.
//
// `antes` marca quem sai (na tela que ainda está à vista); `atualizar`
// desenha a tela nova e marca quem chega. Os nomes são limpos no fim, para
// não sobrar dois iguais na próxima troca.
export function trocarComTransicao(atualizar, { antes = [] } = {}) {
  if (!document.startViewTransition || movimentoReduzido() || document.hidden) {
    atualizar();
    return Promise.resolve();
  }
  const marcados = [];
  for (const [elemento, nome] of antes) {
    if (!elemento) continue;
    elemento.style.viewTransitionName = nome;
    marcados.push(elemento);
  }
  const transicao = document.startViewTransition(() => {
    for (const elemento of marcados) elemento.style.viewTransitionName = '';
    atualizar();
  });
  return transicao.finished.catch(() => {}).finally(() => {
    for (const elemento of document.querySelectorAll('[data-transicao]')) {
      elemento.style.viewTransitionName = '';
      delete elemento.dataset.transicao;
    }
  });
}

// Marca quem chega na tela nova (chamado dentro de `atualizar`).
export function marcarChegada(elemento, nome) {
  if (!elemento || !document.startViewTransition || movimentoReduzido()) return;
  elemento.style.viewTransitionName = nome;
  elemento.dataset.transicao = '';
}
