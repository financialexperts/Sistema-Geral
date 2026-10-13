import { CURSOS, SISTEMAS } from '../config/catalogo.js';

// Consultas ao catálogo (backend/config/catalogo.js) e a conferência dele:
// um id de sistema digitado errado num curso aparece no console na hora, em
// vez de virar um cartão que some sem explicação.

const cursosPorId = new Map(CURSOS.map(curso => [curso.id, curso]));
const sistemasPorId = new Map(SISTEMAS.map(sistema => [sistema.id, sistema]));

export function listarCursos() {
  return CURSOS;
}

export function cursoPorId(id) {
  return cursosPorId.get(id) ?? null;
}

export function sistemaPorId(id) {
  return sistemasPorId.get(id) ?? null;
}

// Na ordem do curso; ids que não existem ficam de fora (e aparecem no console).
export function sistemasDoCurso(curso) {
  return curso.sistemas.map(id => sistemasPorId.get(id)).filter(Boolean);
}

export function cursosDoSistema(sistema) {
  return CURSOS.filter(curso => curso.sistemas.includes(sistema.id));
}

// A atividade aberta de um sistema com várias (paginas): a pedida, se
// existir, ou a primeira. Sistema de uma página só: null.
export function paginaDoSistema(sistema, paginaId) {
  if (!sistema.paginas?.length) return null;
  return sistema.paginas.find(pagina => pagina.id === paginaId) ?? sistema.paginas[0];
}

export function enderecoDoSistema(sistema, pagina) {
  return pagina?.endereco ?? sistema.endereco;
}

// ---------- Conferência ----------

const ARTES = ['neon', 'aurora', 'geometria'];
const COR = /^#[0-9a-f]{6}$/i;

function conferir() {
  const avisos = [];
  const repetidos = lista => lista.filter((id, i) => lista.indexOf(id) !== i);

  for (const id of repetidos(CURSOS.map(c => c.id))) avisos.push(`curso "${id}" cadastrado duas vezes`);
  for (const id of repetidos(SISTEMAS.map(s => s.id))) avisos.push(`sistema "${id}" cadastrado duas vezes`);

  for (const curso of CURSOS) {
    for (const id of curso.sistemas) {
      if (!sistemasPorId.has(id)) avisos.push(`o curso "${curso.id}" lista o sistema "${id}", que não existe em SISTEMAS`);
    }
    if (!ARTES.includes(curso.arte)) avisos.push(`o curso "${curso.id}" usa a arte "${curso.arte}", que não existe (${ARTES.join(', ')})`);
    for (const chave of ['destaque', 'brilho', 'texto', 'fundo', 'fundo2']) {
      if (!COR.test(curso.cores?.[chave] ?? '')) avisos.push(`o curso "${curso.id}" está sem a cor "${chave}" (formato #RRGGBB)`);
    }
  }

  for (const sistema of SISTEMAS) {
    if (!sistema.endereco && !sistema.paginas?.length) avisos.push(`o sistema "${sistema.id}" está sem endereco (nem paginas)`);
    if (!CURSOS.some(curso => curso.sistemas.includes(sistema.id))) {
      avisos.push(`o sistema "${sistema.id}" não está em nenhum curso: não aparece no portal`);
    }
  }

  for (const aviso of avisos) console.warn(`Catálogo do portal: ${aviso}.`);
}

conferir();
