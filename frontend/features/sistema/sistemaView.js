import { enderecoDoSistema } from '../../../backend/domain/catalogo.js';
import { escapeHtml } from '../../shared/dom.js';
import { estadoHtml } from '../../shared/estado.js';
import { ligarAbas } from '../../shared/abas.js';
import { iconeSvg } from '../sistemas/icones.js';

// Um sistema aberto: o cabeçalho (voltar, nome, curso, as atividades quando
// ele tem mais de uma e o tema claro/escuro) e o sistema em si, numa
// moldura (iframe) da mesma origem. O sistema não tem login próprio: usa a
// sessão do portal (apps/compartilhado/portal.js).
//
// A moldura continua viva enquanto a pessoa passeia pelo portal: voltar ao
// mesmo sistema não recarrega nada (o que estava sendo feito continua lá).
// Abrir outro sistema troca a moldura.

const ESPERA_MAXIMA = 25000; // depois disso, "demorou para abrir"
const CHAVE_TEMA = 'tema';   // a mesma que os sistemas sempre usaram

const els = {};
let aberto = null;     // { sistema, pagina, endereco, iframe }
let abasLargas = null;
let abasCelular = null;
let aoTrocarPagina = () => {};

export function iniciarSistema(opcoes) {
  aoTrocarPagina = opcoes.aoTrocarPagina;
  els.icone = document.getElementById('sistema-icone');
  els.titulo = document.getElementById('titulo-sistema');
  els.subtitulo = document.getElementById('subtitulo-sistema');
  els.abas = document.getElementById('abas-paginas');
  els.linhaPaginas = document.getElementById('linha-paginas');
  els.abasCelular = document.getElementById('abas-paginas-celular');
  els.tema = document.getElementById('btn-tema');
  els.moldura = document.getElementById('moldura');
  els.carregando = document.getElementById('carregando-sistema');
  els.carregandoIcone = document.getElementById('carregando-icone');
  els.carregandoTexto = document.getElementById('carregando-texto');
  els.estado = document.getElementById('estado-sistema');

  document.getElementById('btn-voltar-sistema').addEventListener('click', opcoes.aoVoltar);
  document.getElementById('btn-recarregar-sistema').addEventListener('click', recarregar);
  els.tema.addEventListener('click', alternarTema);
  els.estado.addEventListener('click', evento => {
    if (evento.target.closest('[data-acao="recarregar"]')) recarregar();
  });

  const escolherPagina = aba => aoTrocarPagina(aba.dataset.pagina);
  abasLargas = ligarAbas(els.abas, { aoEscolher: escolherPagina });
  abasCelular = ligarAbas(els.abasCelular, { aoEscolher: escolherPagina });

  // O tema trocado em outra aba (ou dentro de um sistema) acompanha aqui.
  addEventListener('storage', evento => {
    if (evento.key === CHAVE_TEMA) sincronizarBotaoTema();
  });
}

// Mostra o sistema da rota (curso, sistema e página já conferidos no catálogo).
export function mostrarSistema({ curso, sistema, pagina, perfil }) {
  els.icone.dataset.arte = curso.arte;
  els.icone.innerHTML = iconeSvg(sistema.icone);
  els.titulo.textContent = sistema.nome;
  atualizarSubtitulo(curso, sistema, perfil);
  desenharPaginas(sistema, pagina);
  els.tema.hidden = !sistema.temaEscuro;
  sincronizarBotaoTema();
  document.title = `${pagina && pagina.nome !== sistema.nome ? pagina.nome : sistema.nome} · ${curso.nome} · Financial Experts`;

  const endereco = enderecoDoSistema(sistema, pagina);
  if (aberto?.endereco === endereco && aberto.iframe.isConnected) return;
  abrirMoldura({ curso, sistema, pagina, endereco });
}

export function atualizarSubtitulo(curso, sistema, perfil) {
  const resumo = sistema.resumo?.(perfil) ?? '';
  els.subtitulo.innerHTML = `<span class="subtitulo__curso">${escapeHtml(curso.nome)}</span>`
    + (resumo ? `<span>· ${escapeHtml(resumo)}</span>` : '');
}

// Ao sair da conta: a moldura vai embora, com tudo o que o sistema tinha
// na memória (num computador compartilhado, nada fica para o próximo).
export function fecharSistema() {
  aberto?.iframe.remove();
  clearTimeout(aberto?.timer);
  aberto = null;
  els.carregando.hidden = true;
  els.estado.hidden = true;
}

// ---------- Moldura ----------

function abrirMoldura({ curso, sistema, pagina, endereco }) {
  fecharSistema();
  els.estado.hidden = true;

  els.carregandoIcone.dataset.arte = curso.arte;
  els.carregandoIcone.innerHTML = iconeSvg(sistema.icone);
  els.carregandoTexto.textContent = `Abrindo ${pagina && pagina.nome !== sistema.nome ? pagina.nome : sistema.nome}…`;
  els.carregando.hidden = false;
  els.carregando.classList.remove('saindo');

  // Uma moldura nova a cada sistema (em vez de trocar o src da mesma): o
  // primeiro carregamento de uma moldura não cria passo no histórico, então
  // o Voltar do navegador continua andando pelas telas do portal.
  const iframe = document.createElement('iframe');
  iframe.className = 'moldura__sistema';
  iframe.title = pagina && pagina.nome !== sistema.nome ? `${sistema.nome}: ${pagina.nome}` : sistema.nome;
  iframe.src = endereco;
  const estaAbertura = { curso, sistema, pagina, endereco, iframe, timer: 0, carregou: false };
  iframe.addEventListener('load', () => {
    estaAbertura.carregou = true;
    clearTimeout(estaAbertura.timer);
    esconderCarregando();
  });
  estaAbertura.timer = setTimeout(() => {
    if (estaAbertura.carregou || aberto !== estaAbertura) return;
    els.carregando.hidden = true;
    els.estado.innerHTML = estadoHtml({
      icone: 'i-sem-conexao',
      titulo: 'O sistema está demorando para abrir',
      texto: 'Verifique a conexão com a internet e tente de novo.',
      acao: ['recarregar', 'Tentar de novo'],
    });
    els.estado.hidden = false;
  }, ESPERA_MAXIMA);

  aberto = estaAbertura;
  els.moldura.append(iframe);
}

function esconderCarregando() {
  if (els.carregando.hidden) return;
  els.carregando.classList.add('saindo');
  setTimeout(() => {
    els.carregando.hidden = true;
    els.carregando.classList.remove('saindo');
  }, 320);
}

function recarregar() {
  if (!aberto) return;
  const { curso, sistema, pagina, endereco } = aberto;
  abrirMoldura({ curso, sistema, pagina, endereco });
}

// ---------- Atividades (sistema com mais de uma página) ----------

function desenharPaginas(sistema, pagina) {
  const temPaginas = sistema.paginas?.length > 1;
  els.abas.hidden = !temPaginas;
  els.linhaPaginas.hidden = !temPaginas;
  if (!temPaginas) {
    els.abas.innerHTML = '';
    els.abasCelular.innerHTML = '';
    return;
  }
  const html = `<span class="abas__pilula" aria-hidden="true"></span>` + sistema.paginas.map(p => `
    <button type="button" class="abas__aba" role="tab" data-pagina="${escapeHtml(p.id)}"
            aria-selected="${p.id === pagina.id}" tabindex="${p.id === pagina.id ? 0 : -1}"><span>${escapeHtml(p.nome)}</span></button>`).join('');
  // Só redesenha se mudou o sistema; trocando de atividade, a pílula desliza.
  if (els.abas.dataset.sistema !== sistema.id) {
    els.abas.innerHTML = html;
    els.abasCelular.innerHTML = html;
    els.abas.dataset.sistema = sistema.id;
  }
  for (const [container, abas] of [[els.abas, abasLargas], [els.abasCelular, abasCelular]]) {
    const aba = container.querySelector(`[data-pagina="${CSS.escape(pagina.id)}"]`);
    if (aba) abas.escolher(aba, { avisar: false });
  }
}

// ---------- Tema claro/escuro dos sistemas ----------
// O portal é sempre claro, e os sistemas dentro dele também abrem claros;
// o escuro vale quando a pessoa escolhe aqui. A escolha fica na chave
// "tema" do navegador e vale para todos (a moldura recebe na hora, e os
// outros sistemas, ao abrir — apps/compartilhado/portal.js).

function temaDosSistemas() {
  let guardado = null;
  try { guardado = localStorage.getItem(CHAVE_TEMA); } catch { guardado = null; }
  return guardado === 'dark' ? 'dark' : 'light';
}

function sincronizarBotaoTema() {
  const escuro = temaDosSistemas() === 'dark';
  els.tema.setAttribute('aria-pressed', String(escuro));
  const rotulo = escuro ? 'Tema claro nos sistemas' : 'Tema escuro nos sistemas';
  els.tema.setAttribute('aria-label', rotulo);
  els.tema.title = rotulo;
}

function alternarTema() {
  const proximo = temaDosSistemas() === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem(CHAVE_TEMA, proximo); } catch { /* vale só para a moldura aberta */ }
  try { aberto?.iframe.contentWindow?.FEPortal?.aplicarTema(proximo); } catch { /* moldura ainda carregando */ }
  sincronizarBotaoTema();
}
