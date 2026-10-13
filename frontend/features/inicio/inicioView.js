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

  for (const portal of portais.querySelectorAll('.portal')) ligarMovimento(portal);

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

export function focarPortal(cursoId) {
  portais.querySelector(`.portal[data-curso="${CSS.escape(cursoId)}"]`)?.focus({ preventScroll: true });
}

// ---------- Desenho ----------

function portalHtml(curso) {
  const sistemas = sistemasDoCurso(curso);
  const logo = new URL(curso.logo, document.baseURI).href;
  const chips = sistemas.map(sistema => `<li>${iconeSvg(sistema.icone)}${escapeHtml(sistema.nome)}</li>`).join('');
  return `
    <li style="${estiloDoCurso(curso)}">
      <a class="portal acende" href="${endereco({ tela: 'curso', cursoId: curso.id })}" data-curso="${escapeHtml(curso.id)}"
         data-arte="${escapeHtml(curso.arte)}" data-tom="${escapeHtml(curso.tom)}">
        ${arteHtml(curso)}
        <span class="portal__luz" aria-hidden="true"></span>
        <span class="portal__veu" aria-hidden="true"></span>
        <div class="portal__conteudo">
          <div class="portal__topo">
            <span class="portal__nome">${escapeHtml(curso.nome)}</span>
            <span class="selo selo--ponto" data-ultimo hidden>Último acesso</span>
          </div>
          <div class="portal__centro">
            <span class="portal__logo-caixa">
              <img class="portal__logo" src="${escapeHtml(curso.logo)}" alt="${escapeHtml(curso.nomeCompleto)}" decoding="async">
              <span class="portal__brilho" style="--logo:url('${escapeHtml(logo)}')" aria-hidden="true"></span>
            </span>
          </div>
          <div class="portal__base">
            <div class="portal__detalhes">
              <p class="portal__descricao">${escapeHtml(curso.descricao)}</p>
              <ul class="portal__sistemas" aria-label="${escapeHtml(plural(sistemas.length, 'sistema'))}">${chips}</ul>
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

// ---------- Movimento do portal ----------
// A inclinação, a subida e a luz que segue o ponteiro são calculadas quadro
// a quadro (requestAnimationFrame), sempre perseguindo o alvo com uma
// suavização que não depende da taxa de quadros da tela: o portal desliza
// atrás do mouse em vez de pular. Só transform e opacity mudam — a placa de
// vídeo compõe sem redesenhar nada. O tamanho do portal é lido do item da
// lista (que não se inclina), então ler a posição não força cálculo de layout.

const INCLINACAO_X = 5;     // graus, de cima a baixo
const INCLINACAO_Y = 7;     // graus, de um lado ao outro
const SUBIDA = -6;          // px, sob o mouse ou com foco
const ESCALA = 1.012;
const MEIA_VIDA = 70;       // ms para andar metade do caminho até o alvo

function ligarMovimento(portal) {
  const item = portal.parentElement;
  const luz = portal.querySelector('.portal__luz');
  const atual = { rx: 0, ry: 0, sobe: 0, escala: 1, x: 0, y: 0, luz: 0 };
  const alvo = { ...atual };
  let quadro = 0;
  let ultimoTempo = 0;

  function passo(agora) {
    const dt = ultimoTempo ? Math.min(agora - ultimoTempo, 64) : 16.7;
    ultimoTempo = agora;
    const fator = 1 - Math.pow(0.5, dt / MEIA_VIDA);
    let mexendo = false;
    for (const chave in alvo) {
      const falta = alvo[chave] - atual[chave];
      if (Math.abs(falta) > 0.002) {
        atual[chave] += falta * fator;
        mexendo = true;
      } else {
        atual[chave] = alvo[chave];
      }
    }
    portal.style.transform =
      `perspective(1200px) rotateX(${atual.rx.toFixed(3)}deg) rotateY(${atual.ry.toFixed(3)}deg) ` +
      `translate3d(0, ${atual.sobe.toFixed(2)}px, 0) scale(${atual.escala.toFixed(4)})`;
    luz.style.transform = `translate3d(${atual.x.toFixed(1)}px, ${atual.y.toFixed(1)}px, 0)`;
    luz.style.opacity = atual.luz.toFixed(3);
    quadro = mexendo ? requestAnimationFrame(passo) : 0;
    if (!quadro) ultimoTempo = 0;
  }

  function mover() {
    if (!quadro) quadro = requestAnimationFrame(passo);
  }

  function acender() {
    alvo.sobe = SUBIDA;
    alvo.escala = ESCALA;
    mover();
  }

  function apagar() {
    Object.assign(alvo, { rx: 0, ry: 0, sobe: 0, escala: 1, luz: 0 });
    mover();
  }

  portal.addEventListener('pointerenter', evento => {
    if (evento.pointerType !== 'mouse' || movimentoReduzido()) return;
    const r = item.getBoundingClientRect();
    // a luz começa onde o mouse entrou, sem atravessar o portal
    atual.x = alvo.x = evento.clientX - r.left;
    atual.y = alvo.y = evento.clientY - r.top;
    alvo.luz = 1;
    acender();
  });

  portal.addEventListener('pointermove', evento => {
    if (evento.pointerType !== 'mouse' || movimentoReduzido()) return;
    const r = item.getBoundingClientRect();
    const x = evento.clientX - r.left;
    const y = evento.clientY - r.top;
    alvo.x = x;
    alvo.y = y;
    alvo.ry = (x / r.width - 0.5) * INCLINACAO_Y;
    alvo.rx = (0.5 - y / r.height) * INCLINACAO_X;
    mover();
  });

  portal.addEventListener('pointerleave', evento => {
    if (evento.pointerType !== 'mouse') return;
    apagar();
  });

  // Teclado: o portal com foco sobe, como sob o mouse (sem inclinar).
  portal.addEventListener('focus', () => {
    if (!movimentoReduzido() && portal.matches(':focus-visible')) acender();
  });
  portal.addEventListener('blur', () => {
    if (!portal.matches(':hover')) apagar();
  });
}
