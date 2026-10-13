import { state } from './state/store.js';
import { buscarPerfil } from '../backend/api/perfilRepo.js';
import {
  cursoPorId, cursosDoSistema, listarCursos, paginaDoSistema, sistemaPorId,
} from '../backend/domain/catalogo.js';
import { escapeHtml } from './shared/dom.js';
import { marcarChegada, trocarComTransicao } from './shared/transicao.js';
import { conferirSessao, iniciarAutenticacao, sair } from './features/auth/auth.js';
import {
  anunciar, atualizarConta, esconderApp, iniciarShell, mostrarApp, rolarParaOTopo, trocarTela,
} from './features/app/shell.js';
import {
  corrigirRota, iniciarRotas, irPara, limparRota, rotaAtual, trocarPagina, voltar,
} from './features/app/rotas.js';
import { iniciarNavegacao, marcarNavegacao } from './features/app/navegacao.js';
import { estiloDoCurso, pintarComCurso } from './features/cursos/aparencia.js';
import {
  atualizarCumprimento, atualizarUltimo, focarPortal, iniciarInicio, portalDoCurso,
} from './features/inicio/inicioView.js';
import {
  atualizarResumos, cartaoDoSistema, cursoDesenhado, focarSistema, iniciarCurso, limparCurso, mostrarCurso,
} from './features/curso/cursoView.js';
import { atualizarSubtitulo, fecharSistema, iniciarSistema, mostrarSistema } from './features/sistema/sistemaView.js';
import { guardarUltimo, lerUltimo } from './features/sistemas/ultimo.js';
import { iniciarAvisoDeCookies } from './features/avisos/cookies.js';

// Ponto de partida do portal: liga as telas, decide pela sessão entre o
// login e o portal e, dentro dele, mostra a tela do endereço (o início com
// os cursos, a página de um curso ou um sistema aberto na moldura).

// Para os sistemas dentro da moldura (apps/compartilhado/portal.js): é por
// aqui que um sistema avisa que não achou a sessão (expirou, saiu em outra
// aba). O portal confere a dele e, sem sessão, volta para o login.
window.FinancialExperts = {
  semSessao() { conferirSessao(); },
};

const app = document.getElementById('app');

desenharCursosDoAcesso();
iniciarAvisoDeCookies();

const abrirSistema = (cursoId, sistemaId, paginaId) => irPara({ tela: 'sistema', cursoId, sistemaId, paginaId });

iniciarShell({ aoSair: sair });
iniciarNavegacao({ aoIr: irPara, aoInicioDeNovo: rolarParaOTopo });
iniciarInicio({ aoAbrirCurso: cursoId => irPara({ tela: 'curso', cursoId }), aoAbrirSistema: abrirSistema });
iniciarCurso({ aoAbrirSistema: abrirSistema, aoVoltar: voltar });
iniciarSistema({
  aoVoltar: voltar,
  aoTrocarPagina: paginaId => {
    const { curso, sistema } = state.rota;
    trocarPagina({ tela: 'sistema', cursoId: curso.id, sistemaId: sistema.id, paginaId });
  },
});
iniciarRotas(mostrarRota);

iniciarAutenticacao({
  aoEntrar(usuario) {
    state.usuario = usuario;
    state.perfil = null;
    const nomeDoLogin = limpar(usuario.user_metadata?.full_name);
    atualizarConta({ nome: nomeDoLogin || null, email: usuario.email });
    atualizarCumprimento(nomeDoLogin);
    atualizarUltimo(lerUltimo(usuario.id));
    mostrarApp();
    mostrarRota(rotaAtual());
    carregarPerfil(usuario);
  },
  aoSair() {
    state.usuario = null;
    state.perfil = null;
    state.rota = null;
    fecharSistema();
    limparCurso();
    limparRota();
    pintarComCurso(app, null);
    document.title = 'Financial Experts';
    esconderApp();
  },
});

// O perfil (nome e o que cada sistema guarda do aluno) chega depois da
// tela: o nome do cumprimento e os resumos dos sistemas entram quando vier.
async function carregarPerfil(usuario) {
  let perfil = null;
  try {
    perfil = await buscarPerfil(usuario.id);
  } catch (erro) {
    console.error('Erro ao carregar o perfil:', erro);
  }
  if (state.usuario?.id !== usuario.id) return; // saiu enquanto carregava
  state.perfil = perfil;
  const nome = limpar(usuario.user_metadata?.full_name) || limpar(perfil?.full_name);
  atualizarConta({ nome: nome || null, email: usuario.email });
  atualizarCumprimento(nome);
  atualizarResumos(perfil);
  if (state.rota?.tela === 'sistema') atualizarSubtitulo(state.rota.curso, state.rota.sistema, perfil);
}

// ---------- Telas ----------

// Mostra a tela do endereço atual. Roda ao entrar, ao clicar num curso ou
// num sistema e no Voltar/Avançar do navegador.
function mostrarRota(pedida) {
  if (!state.usuario) return; // na tela de login o endereço espera o login
  const rota = conferirRota(pedida);
  const anterior = state.rota;
  state.rota = rota;
  trocarComTransicao(() => desenhar(rota, anterior), { antes: saindo(anterior, rota) });
}

function desenhar(rota, anterior) {
  marcarNavegacao({ tela: rota.tela, cursoId: rota.curso?.id, sistemaId: rota.sistema?.id });

  if (rota.tela === 'inicio') {
    pintarComCurso(app, null);
    trocarTela('inicio', { voltarRolagem: Boolean(anterior) });
    document.title = 'Financial Experts';
    if (anterior?.curso) {
      const portal = portalDoCurso(anterior.curso.id);
      marcarChegada(portal, 'arte-curso');
      marcarChegada(portal?.querySelector('.portal__logo'), 'logo-curso');
      focarPortal(anterior.curso.id);
    } else if (anterior) {
      document.getElementById('titulo-inicio').focus({ preventScroll: true });
    }
    anunciar('Início: escolha o seu curso');
    return;
  }

  pintarComCurso(app, rota.curso);

  if (rota.tela === 'curso') {
    const voltandoDoSistema = anterior?.tela === 'sistema' && anterior.curso.id === rota.curso.id;
    if (cursoDesenhado() !== rota.curso.id) mostrarCurso(rota.curso, { perfil: state.perfil });
    else document.title = `${rota.curso.nome} · Financial Experts`;
    trocarTela('curso', { voltarRolagem: voltandoDoSistema && cursoDesenhado() === rota.curso.id });
    if (anterior?.tela === 'inicio') {
      const banner = document.getElementById('banner-curso');
      marcarChegada(banner, 'arte-curso');
      marcarChegada(banner.querySelector('.banner__logo'), 'logo-curso');
    }
    if (voltandoDoSistema) {
      const cartao = cartaoDoSistema(anterior.sistema.id);
      marcarChegada(cartao, 'janela-sistema');
      marcarChegada(cartao?.querySelector('.capa__icone'), 'icone-sistema');
      focarSistema(anterior.sistema.id);
    } else {
      document.getElementById('titulo-curso').focus({ preventScroll: true });
    }
    anunciar(`Curso ${rota.curso.nome}`);
    return;
  }

  const { curso, sistema, pagina } = rota;
  mostrarSistema({ curso, sistema, pagina, perfil: state.perfil });
  trocarTela('sistema');
  if (anterior?.tela === 'curso') {
    marcarChegada(document.getElementById('moldura'), 'janela-sistema');
    marcarChegada(document.getElementById('sistema-icone'), 'icone-sistema');
  }
  document.getElementById('titulo-sistema').focus({ preventScroll: true });
  anunciar(`${sistema.nome}, do curso ${curso.nome}`);

  guardarUltimo(state.usuario.id, { cursoId: curso.id, sistemaId: sistema.id, paginaId: pagina?.id });
  atualizarUltimo(lerUltimo(state.usuario.id));
}

// O que "voa" para a tela nova (View Transitions): o portal do curso vira o
// banner dele, o cartão de um sistema vira a moldura onde ele abre — e o
// caminho de volta, ao contrário.
function saindo(anterior, rota) {
  if (!anterior) return [];
  if (anterior.tela === 'inicio' && rota.tela === 'curso') {
    const portal = portalDoCurso(rota.curso.id);
    return [[portal, 'arte-curso'], [portal?.querySelector('.portal__logo'), 'logo-curso']];
  }
  if (anterior.tela === 'curso' && rota.tela === 'inicio') {
    const banner = document.getElementById('banner-curso');
    return [[banner, 'arte-curso'], [banner.querySelector('.banner__logo'), 'logo-curso']];
  }
  if (anterior.tela === 'curso' && rota.tela === 'sistema') {
    const cartao = cartaoDoSistema(rota.sistema.id);
    return [[cartao, 'janela-sistema'], [cartao?.querySelector('.capa__icone'), 'icone-sistema']];
  }
  if (anterior.tela === 'sistema' && rota.tela === 'curso' && anterior.curso.id === rota.curso.id) {
    return [[document.getElementById('moldura'), 'janela-sistema'], [document.getElementById('sistema-icone'), 'icone-sistema']];
  }
  return [];
}

// Confere o endereço com o catálogo: curso ou sistema que não existe volta
// um nível; sistema sem curso (ou com um curso que não é dele) ganha o
// curso certo — o último aberto, se ele tiver o sistema, ou o primeiro.
function conferirRota(pedida) {
  if (pedida.tela === 'inicio') return { tela: 'inicio' };

  if (pedida.tela === 'curso') {
    const curso = cursoPorId(pedida.cursoId);
    if (curso) return { tela: 'curso', curso };
    corrigirRota({ tela: 'inicio' });
    return { tela: 'inicio' };
  }

  const sistema = sistemaPorId(pedida.sistemaId);
  const cursos = sistema ? cursosDoSistema(sistema) : [];
  if (!sistema || !cursos.length) {
    const destino = cursoPorId(pedida.cursoId) ? { tela: 'curso', cursoId: pedida.cursoId } : { tela: 'inicio' };
    corrigirRota(destino);
    return conferirRota(destino);
  }
  const ultimo = state.usuario ? lerUltimo(state.usuario.id) : null;
  const curso = cursos.find(c => c.id === pedida.cursoId)
    ?? cursos.find(c => c.id === state.rota?.curso?.id)
    ?? cursos.find(c => c.id === ultimo?.curso.id)
    ?? cursos[0];
  const pagina = paginaDoSistema(sistema, pedida.paginaId);
  if (curso.id !== pedida.cursoId || (pagina?.id ?? null) !== (pedida.paginaId ?? null)) {
    corrigirRota({ tela: 'sistema', cursoId: curso.id, sistemaId: sistema.id, paginaId: pagina?.id });
  }
  return { tela: 'sistema', curso, sistema, pagina };
}

// Os cursos que o login abre, embaixo do cartão de acesso.
function desenharCursosDoAcesso() {
  document.getElementById('auth-cursos').innerHTML = listarCursos().map((curso, i) => `
    <li class="auth-curso" style="${estiloDoCurso(curso)};--i:${i}">${escapeHtml(curso.nome)}</li>`).join('');
}

function limpar(texto) {
  return String(texto ?? '').replace(/\s+/g, ' ').trim();
}
