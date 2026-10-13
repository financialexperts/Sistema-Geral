import { sistemasDoCurso } from '../../../backend/domain/catalogo.js';
import { cliqueSimples, escapeHtml, plural } from '../../shared/dom.js';
import { arteHtml, estiloDoCurso } from '../cursos/aparencia.js';
import { iconeSvg } from '../sistemas/icones.js';
import { endereco } from '../app/rotas.js';

// A página de um curso: o banner com a arte e a logo dele e os sistemas em
// cartões. A capa de cada cartão usa a arte do curso (calma) com o ícone do
// sistema, e o resumo mostra o que o aluno já tem naquele sistema (perfil
// da carteira, planilha pronta…).

const els = {};
let cursoAberto = null;

export function iniciarCurso({ aoAbrirSistema, aoVoltar }) {
  els.titulo = document.getElementById('titulo-curso');
  els.subtitulo = document.getElementById('subtitulo-curso');
  els.banner = document.getElementById('banner-curso');
  els.descricao = document.getElementById('descricao-sistemas');
  els.lista = document.getElementById('lista-sistemas');

  document.getElementById('btn-voltar-curso').addEventListener('click', aoVoltar);

  // Cada cartão é um link para o sistema: clique simples abre aqui mesmo;
  // Ctrl/⌘ ou o botão do meio abrem em outra aba, como qualquer link.
  els.lista.addEventListener('click', evento => {
    const cartao = evento.target.closest('.cartao-sistema');
    if (!cartao || !cliqueSimples(evento)) return;
    evento.preventDefault();
    aoAbrirSistema(cursoAberto.id, cartao.dataset.sistema, cartao.dataset.pagina || null);
  });

  // Setas andam pela grade (↑ e ↓ pulam uma linha inteira), Home e End
  // vão às pontas — como numa coleção do macOS.
  els.lista.addEventListener('keydown', evento => {
    const atual = evento.target.closest('.cartao-sistema');
    if (!atual || evento.altKey || evento.ctrlKey || evento.metaKey) return;
    const cartoes = [...els.lista.querySelectorAll('.cartao-sistema')];
    const i = cartoes.indexOf(atual);
    const colunas = getComputedStyle(els.lista).gridTemplateColumns.split(' ').length;
    const destino = {
      ArrowRight: i + 1, ArrowLeft: i - 1, ArrowDown: i + colunas, ArrowUp: i - colunas, Home: 0, End: cartoes.length - 1,
    }[evento.key];
    if (destino === undefined || !cartoes[destino]) return;
    evento.preventDefault();
    cartoes[destino].focus();
  });
}

export function mostrarCurso(curso, { perfil }) {
  cursoAberto = curso;
  const sistemas = sistemasDoCurso(curso);

  els.titulo.textContent = curso.nome;
  els.subtitulo.textContent = `${curso.nomeCompleto} · ${plural(sistemas.length, 'sistema')}`;

  els.banner.dataset.arte = curso.arte;
  els.banner.dataset.tom = curso.tom;
  els.banner.setAttribute('style', estiloDoCurso(curso));
  els.banner.innerHTML = `
    ${arteHtml(curso)}
    <div class="banner__conteudo">
      <img class="banner__logo" src="${escapeHtml(curso.logo)}" alt="${escapeHtml(curso.nomeCompleto)}" decoding="async">
      <div class="banner__texto">
        <p class="banner__descricao">${escapeHtml(curso.descricao)}</p>
        <span class="selo">${escapeHtml(plural(sistemas.length, 'sistema'))}</span>
      </div>
    </div>`;

  els.descricao.textContent = `Abra um sistema para praticar o que você vê no ${curso.nome}. O que você faz fica salvo na sua conta.`;
  els.lista.innerHTML = sistemas.map((sistema, i) => cartaoHtml(curso, sistema, i, perfil)).join('');
  document.title = `${curso.nome} · Financial Experts`;
}

// O perfil chega depois da página: os resumos entram quando ele vier.
export function atualizarResumos(perfil) {
  if (!cursoAberto) return;
  for (const cartao of els.lista.querySelectorAll('.cartao-sistema')) {
    const sistema = sistemasDoCurso(cursoAberto).find(s => s.id === cartao.dataset.sistema);
    const linha = cartao.querySelector('.cartao-sistema__resumo');
    const texto = sistema?.resumo?.(perfil) ?? '';
    linha.textContent = texto;
    linha.hidden = !texto;
  }
}

// O curso que está desenhado na página (voltando de um sistema dele, a
// página não é redesenhada: o cartão e a rolagem continuam onde estavam).
export function cursoDesenhado() {
  return cursoAberto?.id ?? null;
}

export function cartaoDoSistema(sistemaId) {
  return els.lista.querySelector(`.cartao-sistema[data-sistema="${CSS.escape(sistemaId)}"]`);
}

export function focarSistema(sistemaId) {
  cartaoDoSistema(sistemaId)?.focus({ preventScroll: true });
}

export function limparCurso() {
  cursoAberto = null;
  els.lista.innerHTML = '';
  els.banner.innerHTML = '';
}

// ---------- Desenho ----------

function cartaoHtml(curso, sistema, i, perfil) {
  const resumo = sistema.resumo?.(perfil) ?? '';
  const rota = { tela: 'sistema', cursoId: curso.id, sistemaId: sistema.id };
  const paginas = sistema.paginas?.length > 1
    ? `<ul class="cartao-sistema__paginas" aria-label="Atividades">${sistema.paginas.map(p => `<li>${escapeHtml(p.nome)}</li>`).join('')}</ul>`
    : '';
  return `
    <li>
      <a class="cartao-sistema acende" href="${endereco(rota)}" data-sistema="${escapeHtml(sistema.id)}" style="--i:${i}">
        <span class="capa" data-arte="${escapeHtml(curso.arte)}" data-tom="${escapeHtml(curso.tom)}">
          ${arteHtml(curso, { calma: true })}
          <span class="capa__icone" data-arte="${escapeHtml(curso.arte)}">${iconeSvg(sistema.icone, 'icone-capa')}</span>
        </span>
        <span class="cartao-sistema__corpo">
          <span class="cartao-sistema__nome">${escapeHtml(sistema.nome)}</span>
          <span class="cartao-sistema__descricao">${escapeHtml(sistema.descricao)}</span>
          ${paginas}
          <span class="cartao-sistema__resumo"${resumo ? '' : ' hidden'}>${escapeHtml(resumo)}</span>
        </span>
        <span class="cartao-sistema__abrir">
          Abrir
          <svg class="icone" aria-hidden="true"><use href="#i-seta-direita"/></svg>
        </span>
      </a>
    </li>`;
}

