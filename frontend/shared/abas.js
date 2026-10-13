// Abas com a "pílula" branca que desliza até a escolhida (base.css › .abas).
// Teclado como pede o padrão de abas (WAI-ARIA): ← e → trocam e escolhem,
// Home e End vão às pontas.
export function ligarAbas(container, { aoEscolher } = {}) {
  const pilula = container.querySelector('.abas__pilula');
  const abas = () => [...container.querySelectorAll('[role="tab"]')];

  // A posição e a largura vêm da aba escolhida (as abas podem ter larguras
  // diferentes). Sem animar quando é só a janela que mudou de tamanho.
  function posicionar({ animar = true } = {}) {
    const escolhida = abas().find(aba => aba.getAttribute('aria-selected') === 'true');
    if (!pilula || !escolhida || !escolhida.offsetWidth) return;
    if (!animar) pilula.style.transition = 'none';
    container.style.setProperty('--x', `${escolhida.offsetLeft}px`);
    container.style.setProperty('--l', `${escolhida.offsetWidth}px`);
    if (!animar) {
      pilula.getBoundingClientRect();
      pilula.style.transition = '';
    }
  }

  function escolher(aba, { focar = false, avisar = true } = {}) {
    for (const outra of abas()) {
      const sim = outra === aba;
      outra.setAttribute('aria-selected', String(sim));
      outra.tabIndex = sim ? 0 : -1;
    }
    posicionar();
    if (focar) aba.focus();
    if (avisar) aoEscolher?.(aba);
  }

  container.addEventListener('click', evento => {
    const aba = evento.target.closest('[role="tab"]');
    if (aba && container.contains(aba) && aba.getAttribute('aria-selected') !== 'true') escolher(aba);
  });

  container.addEventListener('keydown', evento => {
    const lista = abas();
    const i = lista.indexOf(document.activeElement);
    if (i < 0) return;
    const destino = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: lista.length - 1 }[evento.key];
    if (destino === undefined) return;
    evento.preventDefault();
    escolher(lista[(destino + lista.length) % lista.length], { focar: true });
  });

  // Aparecer (sair de um [hidden]) e mudar de largura também reposicionam.
  new ResizeObserver(() => posicionar({ animar: false })).observe(container);

  return { escolher, posicionar };
}
