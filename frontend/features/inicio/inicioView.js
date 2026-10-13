import { listarCursos, sistemasDoCurso } from '../../../backend/domain/catalogo.js';
import { cliqueSimples, escapeHtml, movimentoReduzido, plural, primeiroNome } from '../../shared/dom.js';
import { arteHtml, estiloDoCurso } from '../cursos/aparencia.js';
import { iconeSvg } from '../sistemas/icones.js';
import { endereco } from '../app/rotas.js';

// O início: o cumprimento e a escolha do curso, um portal para cada um.
// Cada portal tem a arte animada do curso (arte.css), a logo, o que ele
// tem dentro e se inclina na direção do ponteiro. Embaixo, o atalho para
// o último sistema aberto.

const portais = document.getElementById('portais');
const continuar = document.getElementById('continuar');
const titulo = document.getElementById('titulo-inicio');
const subtitulo = document.getElementById('subtitulo-inicio');

export function iniciarInicio({ aoAbrirCurso, aoAbrirSistema }) {
  portais.innerHTML = listarCursos().map(portalHtml).join('');

  portais.addEventListener('click', evento => {
    const portal = evento.target.closest('.portal');
    if (!portal || !cliqueSimples(evento)) return;
    evento.preventDefault();
    aoAbrirCurso(portal.dataset.curso);
  });

  // A inclinação e a luz seguem o mouse (no toque, não: o dedo rola a página).
  for (const portal of portais.querySelectorAll('.portal')) {
    portal.addEventListener('pointermove', inclinar);
    portal.addEventListener('pointerleave', endireitar);
  }

  // Setas do teclado andam entre os portais, como numa fileira de abas.
  portais.addEventListener('keydown', evento => {
    const lista = [...portais.querySelectorAll('.portal')];
    const i = lista.indexOf(document.activeElement);
    if (i < 0 || evento.altKey || evento.ctrlKey || evento.metaKey) return;
    const destino = {
      ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: lista.length - 1,
    }[evento.key];
    if (destino === undefined || !lista[destino]) return;
    evento.preventDefault();
    lista[destino].focus();
  });

  continuar.addEventListener('click', evento => {
    const link = evento.target.closest('.continuar__link');
    if (!link || !cliqueSimples(evento)) return;
    evento.preventDefault();
    aoAbrirSistema(link.dataset.curso, link.dataset.sistema, link.dataset.pagina || null);
  });
}

// O cumprimento muda com a hora do dia; sem nome (conta antiga ainda sem
// perfil), fica só ele.
export function atualizarCumprimento(nome) {
  const hora = new Date().getHours();
  const cumprimento = hora >= 5 && hora < 12 ? 'Bom dia' : hora >= 12 && hora < 18 ? 'Boa tarde' : 'Boa noite';
  const primeiro = primeiroNome(nome);
  titulo.textContent = primeiro ? `${cumprimento}, ${primeiro}!` : `${cumprimento}!`;
  subtitulo.textContent = 'Que bom ter você aqui.';
}

// O selo "Último acesso" no portal do curso e o atalho "Continuar".
export function atualizarUltimo(ultimo) {
  for (const portal of portais.querySelectorAll('.portal')) {
    portal.querySelector('[data-ultimo]').hidden = portal.dataset.curso !== ultimo?.curso.id;
  }
  continuar.hidden = !ultimo;
  continuar.innerHTML = ultimo ? continuarHtml(ultimo) : '';
}

function portalDoCurso(cursoId) {
  return portais.querySelector(`.portal[data-curso="${CSS.escape(cursoId)}"]`);
}

export function focarPortal(cursoId) {
  portalDoCurso(cursoId)?.focus({ preventScroll: true });
}

// ---------- Desenho ----------

function portalHtml(curso, i) {
  const sistemas = sistemasDoCurso(curso);
  const logo = new URL(curso.logo, document.baseURI).href;
  const chips = sistemas.map(sistema => `<li>${iconeSvg(sistema.icone)}${escapeHtml(sistema.nome)}</li>`).join('');
  return `
    <li>
      <a class="portal acende" href="${endereco({ tela: 'curso', cursoId: curso.id })}" data-curso="${escapeHtml(curso.id)}"
         data-arte="${escapeHtml(curso.arte)}" data-tom="${escapeHtml(curso.tom)}" style="${estiloDoCurso(curso)}">
        ${arteHtml(curso)}
        <div class="portal__conteudo">
          <div class="portal__topo">
            <span class="portal__nome">${escapeHtml(curso.nome)}</span>
            <span class="selo selo--pulsa" data-ultimo hidden>Último acesso</span>
          </div>
          <div class="portal__centro">
            <span class="portal__logo-caixa">
              <img class="portal__logo" src="${escapeHtml(curso.logo)}" alt="${escapeHtml(curso.nomeCompleto)}" decoding="async">
              <span class="portal__brilho" style="--logo:url('${escapeHtml(logo)}')" aria-hidden="true"></span>
            </span>
          </div>
          <div class="portal__base">
            <div class="portal__detalhes">
              <div>
                <p class="portal__descricao">${escapeHtml(curso.descricao)}</p>
                <ul class="portal__sistemas" aria-label="${escapeHtml(plural(sistemas.length, 'sistema'))}">${chips}</ul>
              </div>
            </div>
            <span class="portal__cta">
              Entrar no curso
              <span class="portal__seta" aria-hidden="true"><svg class="icone"><use href="#i-seta"/></svg></span>
            </span>
          </div>
        </div>
      </a>
    </li>`;
}

function continuarHtml({ curso, sistema, pagina }) {
  const rota = { tela: 'sistema', cursoId: curso.id, sistemaId: sistema.id, paginaId: pagina?.id };
  return `
    <p class="continuar__titulo">Continuar de onde parou</p>
    <a class="continuar__link" href="${endereco(rota)}" data-curso="${escapeHtml(curso.id)}" data-sistema="${escapeHtml(sistema.id)}"
       data-pagina="${escapeHtml(pagina?.id ?? '')}" style="${estiloDoCurso(curso)}">
      <span class="icone-sistema icone-sistema--continuar" data-arte="${escapeHtml(curso.arte)}">${iconeSvg(sistema.icone)}</span>
      <span class="continuar__texto">
        <span class="continuar__nome">${escapeHtml(pagina && pagina.nome !== sistema.nome ? `${sistema.nome}: ${pagina.nome}` : sistema.nome)}</span>
        <span class="subtitulo"><span class="subtitulo__curso">${escapeHtml(curso.nome)}</span></span>
      </span>
      <svg class="icone continuar__seta" aria-hidden="true"><use href="#i-seta-direita"/></svg>
    </a>`;
}

// ---------- Inclinação ----------

function inclinar(evento) {
  if (evento.pointerType !== 'mouse' || movimentoReduzido()) return;
  const portal = evento.currentTarget;
  const r = portal.getBoundingClientRect();
  const x = (evento.clientX - r.left) / r.width;
  const y = (evento.clientY - r.top) / r.height;
  portal.style.setProperty('--px', `${(x * 100).toFixed(1)}%`);
  portal.style.setProperty('--py', `${(y * 100).toFixed(1)}%`);
  portal.style.setProperty('--ry', `${((x - 0.5) * 7).toFixed(2)}deg`);
  portal.style.setProperty('--rx', `${((0.5 - y) * 5).toFixed(2)}deg`);
}

function endireitar(evento) {
  const portal = evento.currentTarget;
  portal.style.removeProperty('--rx');
  portal.style.removeProperty('--ry');
}
