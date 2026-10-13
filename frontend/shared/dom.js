const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

// Todo texto que vem do banco ou do catálogo passa por aqui antes de entrar
// em innerHTML.
export function escapeHtml(valor) {
  return String(valor ?? '').replace(/[&<>"']/g, c => ESCAPES[c]);
}

// Iniciais do monograma: primeira letra do primeiro e do último nome
// ("Maria da Silva" → "MS"). Aceita e-mail quando falta o nome.
export function iniciais(nomeOuEmail) {
  const partes = String(nomeOuEmail ?? '').split('@')[0].split(/[\s._-]+/).filter(Boolean);
  if (!partes.length) return '?';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes.at(-1)[0]).toUpperCase();
}

export function primeiroNome(nome) {
  return String(nome ?? '').trim().split(/\s+/)[0] ?? '';
}

// "1 sistema", "3 sistemas"
export function plural(n, singular, pluralTexto = `${singular}s`) {
  return `${n} ${n === 1 ? singular : pluralTexto}`;
}

export function movimentoReduzido() {
  return matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Clique simples (sem Ctrl/⌘/Shift/Alt, botão esquerdo): o portal navega
// por dentro. Os outros abrem o link em outra aba, como qualquer link.
export function cliqueSimples(evento) {
  return evento.button === 0 && !evento.metaKey && !evento.ctrlKey && !evento.shiftKey && !evento.altKey;
}

// Botão em espera: desabilita, troca o rótulo ("Entrando…") e mostra o
// indicador. Devolve a função que volta o botão ao normal.
export function ocupado(botao, textoEsperando) {
  const rotulo = botao.querySelector('.rotulo-botao');
  const original = rotulo.textContent;
  rotulo.textContent = textoEsperando;
  botao.disabled = true;
  botao.setAttribute('aria-busy', 'true');
  return () => {
    rotulo.textContent = original;
    botao.disabled = false;
    botao.removeAttribute('aria-busy');
  };
}
