import { escapeHtml } from '../../shared/dom.js';

// Os ícones dos sistemas (catálogo › icone), no mesmo traço dos ícones do
// portal. Ficam aqui, e não no sprite do index.html, porque as partes de
// cada um se mexem quando o cartão acende (curso.css): as barras crescem, a
// curva dos juros se desenha, a balança balança, a fatia sai da pizza…
const ICONES = {
  // Fluxo de Caixa: barras dos meses e a linha do saldo subindo
  fluxo: `
    <path d="M3.5 20.25h17"/>
    <rect class="ic-barra ic-barra--1" x="5" y="14" width="3.4" height="6.25" rx="1"/>
    <rect class="ic-barra ic-barra--2" x="10.3" y="11" width="3.4" height="9.25" rx="1"/>
    <rect class="ic-barra ic-barra--3" x="15.6" y="8.5" width="3.4" height="11.75" rx="1"/>
    <path class="ic-traco" pathLength="1" d="M4.5 10.25 9.5 6.6l3.2 2.1 6.8-5.35M16.3 3.35h3.2v3.2"/>`,

  // Laura (renda): a moeda com o cifrão
  renda: `
    <g class="ic-moeda">
      <circle cx="12" cy="12" r="8.25"/>
      <path d="M14.6 9.1c-.5-.9-1.5-1.4-2.6-1.4-1.6 0-2.7.8-2.7 2 0 2.9 5.6 1.5 5.6 4.5 0 1.2-1.2 2.1-2.9 2.1-1.2 0-2.3-.6-2.8-1.5M12 6v1.6M12 16.4V18"/>
    </g>`,

  // Vanessa e Karine: a balança das escolhas
  balanca: `
    <path d="M12 5.25V20M8.5 20.25h7"/>
    <circle cx="12" cy="4" r="1.15"/>
    <g class="ic-braco">
      <path d="M4.5 7.25h15"/>
      <path d="m4.5 7.25-2 5.25m2-5.25 2 5.25M2 12.5h5a2.5 2.5 0 0 1-5 0Z"/>
      <path d="m19.5 7.25-2 5.25m2-5.25 2 5.25M17 12.5h5a2.5 2.5 0 0 1-5 0Z"/>
    </g>`,

  // Calculadora de Juros: os juros compostos fazendo a curva subir
  juros: `
    <path d="M4 3.75v16.5h16.25"/>
    <path class="ic-traco" pathLength="1" d="M6.5 17.75c5.2-.3 9.2-3.6 12.25-11.25"/>
    <circle class="ic-ponto" cx="18.75" cy="6.5" r="1.7" fill="currentColor" stroke="none"/>`,

  // Calculadora Financeira: o visor e as teclas
  calculadora: `
    <rect x="5" y="2.75" width="14" height="18.5" rx="2.75"/>
    <rect class="ic-visor" x="8" y="5.75" width="8" height="3.5" rx="1"/>
    <g fill="currentColor" stroke="none">
      <circle class="ic-tecla" cx="9" cy="12.75" r="1"/><circle class="ic-tecla" cx="12" cy="12.75" r="1"/><circle class="ic-tecla" cx="15" cy="12.75" r="1"/>
      <circle class="ic-tecla" cx="9" cy="15.75" r="1"/><circle class="ic-tecla" cx="12" cy="15.75" r="1"/><circle class="ic-tecla" cx="15" cy="15.75" r="1"/>
      <circle class="ic-tecla" cx="9" cy="18.6" r="1"/><circle class="ic-tecla" cx="12" cy="18.6" r="1"/><circle class="ic-tecla" cx="15" cy="18.6" r="1"/>
    </g>`,

  // Carteira de Investimentos: a pizza da carteira com uma fatia de fora
  carteira: `
    <path d="M10.5 13.5V5.6a7.9 7.9 0 1 0 7.9 7.9Z"/>
    <path class="ic-fatia" d="M13 11V3.1a7.9 7.9 0 0 1 7.9 7.9Z"/>`,

  // Sistema novo sem ícone no catálogo
  generico: `
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.8"/>
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.8"/>
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.8"/>
    <rect x="13.5" y="13.5" width="7" height="7" rx="1.8"/>`,
};

export function iconeSvg(chave, classe = 'icone') {
  return `<svg class="${escapeHtml(classe)}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICONES[chave] ?? ICONES.generico}</svg>`;
}
