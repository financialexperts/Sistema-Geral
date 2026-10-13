// A aparência de cada curso, a partir do catálogo: as cores (variáveis CSS
// que a arte, os cartões e o menu usam) e a arte animada (arte.css).

const VARIAVEIS = {
  '--cor': 'destaque',
  '--cor-brilho': 'brilho',
  '--cor-texto': 'texto',
  '--cor-fundo': 'fundo',
  '--cor-fundo-2': 'fundo2',
};

// Para o atributo style de um elemento desenhado em HTML.
export function estiloDoCurso(curso) {
  return Object.entries(VARIAVEIS).map(([variavel, chave]) => `${variavel}:${curso.cores[chave]}`).join(';');
}

// Para um elemento que já existe (cabeçalho, moldura do sistema…).
export function pintarComCurso(elemento, curso) {
  for (const [variavel, chave] of Object.entries(VARIAVEIS)) {
    if (curso) elemento.style.setProperty(variavel, curso.cores[chave]);
    else elemento.style.removeProperty(variavel);
  }
}

// A arte animada do curso. `calma`: a versão das capas dos sistemas, sem
// moldura nem faíscas (muitas juntas numa tela cansariam).
export function arteHtml(curso, { calma = false } = {}) {
  const desenhar = { neon: arteNeon, aurora: arteAurora, geometria: arteGeometria }[curso.arte];
  return desenhar ? desenhar(calma) : '<div class="arte" aria-hidden="true"></div>';
}

// ---------- As três artes ----------

function arteNeon(calma) {
  const sorteio = sorteador(7);
  const faiscas = calma ? '' : Array.from({ length: 6 }, () => {
    const x = Math.round(6 + sorteio() * 88);
    const t = (5.5 + sorteio() * 3).toFixed(2);
    const d = (-sorteio() * 5).toFixed(2);
    const dx = Math.round(-24 + sorteio() * 48);
    return `<span class="arte__faisca" style="--x:${x}%;--t:${t}s;--d:${d}s;--dx:${dx}px"></span>`;
  }).join('');
  return `
    <div class="arte arte--neon" aria-hidden="true">
      <div class="arte__piso"><div class="arte__grade"></div></div>
      <div class="arte__horizonte"></div>
      ${calma ? '' : '<div class="arte__neon"><div class="arte__moldura"></div></div>'}
      ${faiscas}
    </div>`;
}

function arteAurora() {
  return `
    <div class="arte arte--aurora" aria-hidden="true">
      <span class="arte__luz arte__luz--1"></span>
      <span class="arte__luz arte__luz--2"></span>
      <span class="arte__luz arte__luz--3"></span>
    </div>`;
}

// As três peças do M da logo do Master (medidas na logo original, numa
// caixa de 195 × 190): a do alto com a perna direita, o V do meio e a
// perna esquerda.
const PECAS_DO_M = [
  'M0 0 99 58 195 0V190H161V62L99 99 0 41Z',
  'M0 61 98 119 142 92V135L99 161 0 101Z',
  'M0 127 35 147V190H0Z',
];

function arteGeometria() {
  const pecas = PECAS_DO_M
    .map((d, i) => `<g class="arte__flutua"><path class="arte__peca arte__peca--${i + 1}" d="${d}"/></g>`)
    .join('');
  return `
    <div class="arte arte--geometria" aria-hidden="true">
      <svg class="arte__m" viewBox="0 0 195 190" focusable="false">${pecas}</svg>
      <span class="arte__varredura"></span>
    </div>`;
}

// Números "sorteados", mas sempre os mesmos: a arte fica com cara de
// natural sem mudar a cada vez que a tela é desenhada.
function sorteador(semente) {
  let estado = semente;
  return () => {
    estado = (estado * 9301 + 49297) % 233280;
    return estado / 233280;
  };
}
