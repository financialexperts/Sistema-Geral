import { listarCursos, sistemasDoCurso } from '../../../backend/domain/catalogo.js';
import { cliqueSimples, escapeHtml } from '../../shared/dom.js';
import { estiloDoCurso, marcaHtml } from '../cursos/aparencia.js';
import { iconeSvg } from '../sistemas/icones.js';
import { endereco } from './rotas.js';

// A barra lateral: o Início e os cursos do catálogo. O curso aberto (na
// página dele ou num sistema dele) mostra os sistemas logo abaixo, para
// pular de um para outro sem voltar.

const barra = document.getElementById('barra-lateral');
const linkInicio = document.getElementById('link-inicio');
const listaCursos = document.getElementById('menu-cursos');

export function iniciarNavegacao({ aoIr, aoInicioDeNovo }) {
  listaCursos.innerHTML = listarCursos().map(cursoHtml).join('');

  barra.addEventListener('click', evento => {
    const link = evento.target.closest('a');
    if (!link || !cliqueSimples(evento)) return;
    if (link === linkInicio) {
      evento.preventDefault();
      // Já no início: sobe para o topo, como tocar de novo numa aba.
      if (linkInicio.getAttribute('aria-current') === 'page') aoInicioDeNovo();
      else aoIr({ tela: 'inicio' });
      return;
    }
    const { curso, sistema } = link.dataset;
    if (!curso) return;
    evento.preventDefault();
    aoIr(sistema ? { tela: 'sistema', cursoId: curso, sistemaId: sistema } : { tela: 'curso', cursoId: curso });
  });
}

// Marca onde a pessoa está: a página atual tem aria-current="page"; o curso
// do sistema aberto continua marcado (aria-current="true") e aberto.
export function marcarNavegacao(rota) {
  linkInicio.setAttribute('aria-current', 'page');
  if (rota.tela !== 'inicio') linkInicio.removeAttribute('aria-current');

  for (const item of listaCursos.querySelectorAll('.menu__curso')) {
    const ehOCurso = item.dataset.curso === rota.cursoId && rota.tela !== 'inicio';
    item.toggleAttribute('data-aberto', ehOCurso);
    const linkCurso = item.querySelector('.menu__item--curso');
    if (ehOCurso) linkCurso.setAttribute('aria-current', rota.tela === 'curso' ? 'page' : 'true');
    else linkCurso.removeAttribute('aria-current');

    for (const linkSistema of item.querySelectorAll('.menu__item--sistema')) {
      const ehOSistema = ehOCurso && rota.tela === 'sistema' && linkSistema.dataset.sistema === rota.sistemaId;
      if (ehOSistema) linkSistema.setAttribute('aria-current', 'page');
      else linkSistema.removeAttribute('aria-current');
    }
  }
}

function cursoHtml(curso) {
  const sistemas = sistemasDoCurso(curso).map(sistema => `
    <li>
      <a class="menu__item menu__item--sistema" href="${endereco({ tela: 'sistema', cursoId: curso.id, sistemaId: sistema.id })}"
         data-curso="${escapeHtml(curso.id)}" data-sistema="${escapeHtml(sistema.id)}">
        <span class="icone-sistema icone-sistema--menu" data-arte="${escapeHtml(curso.arte)}">${iconeSvg(sistema.icone)}</span>
        <span>${escapeHtml(sistema.nome)}</span>
      </a>
    </li>`).join('');

  return `
    <li class="menu__curso" data-curso="${escapeHtml(curso.id)}" style="${estiloDoCurso(curso)}">
      <a class="menu__item menu__item--curso" href="${endereco({ tela: 'curso', cursoId: curso.id })}" data-curso="${escapeHtml(curso.id)}">
        ${marcaHtml(curso, 'menu__marca')}
        <span>${escapeHtml(curso.nome)}</span>
      </a>
      <div class="menu__sistemas">
        <ul aria-label="Sistemas do ${escapeHtml(curso.nome)}">${sistemas}</ul>
      </div>
    </li>`;
}
