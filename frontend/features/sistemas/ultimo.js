import { cursoPorId, paginaDoSistema, sistemaPorId } from '../../../backend/domain/catalogo.js';

// O último sistema aberto, por conta (num computador compartilhado, cada
// aluno vê o dele): vira o "Continuar de onde parou" do início e o selo
// "Último acesso" no portal do curso.

const PREFIXO = 'fe-portal:ultimo:';

export function lerUltimo(usuarioId) {
  let salvo = null;
  try { salvo = JSON.parse(localStorage.getItem(PREFIXO + usuarioId) ?? 'null'); } catch { salvo = null; }
  // O catálogo pode ter mudado desde então: só vale o que ainda existe.
  const curso = cursoPorId(salvo?.cursoId);
  const sistema = sistemaPorId(salvo?.sistemaId);
  if (!curso || !sistema || !curso.sistemas.includes(sistema.id)) return null;
  return { curso, sistema, pagina: paginaDoSistema(sistema, salvo.paginaId) };
}

export function guardarUltimo(usuarioId, { cursoId, sistemaId, paginaId }) {
  try {
    localStorage.setItem(PREFIXO + usuarioId, JSON.stringify({ cursoId, sistemaId, paginaId: paginaId ?? null }));
  } catch { /* armazenamento bloqueado: o início só não mostra o atalho */ }
}
