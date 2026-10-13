import { iniciais, movimentoReduzido } from '../../shared/dom.js';

// Estrutura do portal: barra lateral (mostrar/ocultar), troca entre as
// telas (início, curso e sistema), efeito de borda de rolagem no cabeçalho
// e o menu da conta no canto superior direito.

const app = document.getElementById('app');
const barra = document.getElementById('barra-lateral');
const btnBarra = document.getElementById('btn-barra-lateral');
const veu = document.getElementById('veu');
const principal = document.getElementById('principal');
const cabecalho = document.getElementById('cabecalho');
const btnConta = document.getElementById('btn-conta');
const menuConta = document.getElementById('menu-conta');
const avisoTela = document.getElementById('aviso-tela');

// Mesmo corte do app.css: abaixo dele a barra vira painel sobreposto.
const janelaEstreita = matchMedia('(max-width: 899px)');
const CHAVE_BARRA_OCULTA = 'fe-portal:barra-lateral-oculta';

let telaAtual = 'inicio';
const rolagens = { inicio: 0, curso: 0 };

export function iniciarShell({ aoSair }) {
  app.toggleAttribute('data-barra-oculta', lerPreferenciaBarra());

  btnBarra.addEventListener('click', alternarBarra);
  veu.addEventListener('click', () => fecharBarraSobreposta(true));
  // Na janela estreita, escolher um item fecha o painel.
  barra.addEventListener('click', evento => {
    if (janelaEstreita.matches && evento.target.closest('a')) fecharBarraSobreposta(false);
  });
  document.addEventListener('keydown', evento => {
    if (evento.key === 'Escape' && janelaEstreita.matches && app.hasAttribute('data-barra-aberta')) {
      fecharBarraSobreposta(true);
    }
  });
  janelaEstreita.addEventListener('change', () => {
    app.removeAttribute('data-barra-aberta');
    sincronizarBarra();
  });

  // O efeito só aparece quando há conteúdo passando por baixo do cabeçalho.
  principal.addEventListener('scroll', atualizarBordaDeRolagem, { passive: true });
  // Ao navegar pelo teclado, o cartão focado não fica escondido sob o cabeçalho fixo.
  new ResizeObserver(() => {
    principal.style.setProperty('--altura-cabecalho', `${cabecalho.offsetHeight}px`);
  }).observe(cabecalho);

  menuConta.addEventListener('beforetoggle', evento => {
    if (evento.newState === 'open') posicionarMenuConta();
  });
  addEventListener('resize', () => {
    if (menuConta.matches(':popover-open')) posicionarMenuConta();
  });
  document.getElementById('btn-sair').addEventListener('click', () => {
    menuConta.hidePopover();
    aoSair();
  });

  sincronizarBarra();
}

export function mostrarApp() {
  app.hidden = false;
  app.classList.add('entrando');
  app.addEventListener('animationend', () => app.classList.remove('entrando'), { once: true });
  principal.scrollTop = 0;
}

export function esconderApp() {
  if (menuConta.matches(':popover-open')) menuConta.hidePopover();
  app.hidden = true;
  app.removeAttribute('data-barra-aberta');
  trocarTela('inicio');
  rolagens.inicio = 0;
  rolagens.curso = 0;
  sincronizarBarra();
}

// Mostra só os pedaços da tela pedida (cabeçalho e conteúdo têm
// data-tela). Voltando para uma tela (do sistema para o curso dele, do
// curso para o início), ela reaparece na rolagem onde estava; as outras
// abrem no topo. O sistema não rola: quem rola é ele, dentro da moldura.
export function trocarTela(nome, { voltarRolagem = false } = {}) {
  if (telaAtual in rolagens) rolagens[telaAtual] = principal.scrollTop;
  telaAtual = nome;
  app.dataset.telaAtual = nome;
  for (const parte of app.querySelectorAll('[data-tela]')) parte.hidden = parte.dataset.tela !== nome;
  principal.scrollTop = voltarRolagem ? rolagens[nome] ?? 0 : 0;
  atualizarBordaDeRolagem();
  animarEntrada(nome);
}

// Toda tela entra igual: o conteúdo aparece subindo um pouco e o título do
// cabeçalho, só no fade. Pela Web Animations API (só opacity e transform, a
// placa de vídeo anima): assim a entrada também acontece trocando de um
// curso para outro, quando a tela continua a mesma.
const ENTRADA_CONTEUDO = [
  { opacity: 0, transform: 'translate3d(0, 10px, 0)' },
  { opacity: 1, transform: 'translate3d(0, 0, 0)' },
];
const ENTRADA_TITULO = [{ opacity: 0 }, { opacity: 1 }];
const CURVA = 'cubic-bezier(0.22, 0.61, 0.36, 1)';

function animarEntrada(nome) {
  if (movimentoReduzido()) return;
  for (const parte of app.querySelectorAll(`.conteudo[data-tela="${nome}"]`)) {
    parte.animate(ENTRADA_CONTEUDO, { duration: 380, easing: CURVA });
  }
  for (const parte of app.querySelectorAll(`.cabecalho__tela[data-tela="${nome}"]`)) {
    parte.animate(ENTRADA_TITULO, { duration: 280, easing: CURVA });
  }
}

export function telaMostrada() {
  return telaAtual;
}

// A conta no canto: monograma, nome e e-mail.
export function atualizarConta({ nome, email }) {
  const titulo = nome || email || '';
  const monograma = iniciais(titulo);
  document.getElementById('conta-avatar').textContent = monograma;
  document.getElementById('menu-conta-avatar').textContent = monograma;
  document.getElementById('menu-conta-nome').textContent = titulo;
  const linhaEmail = document.getElementById('menu-conta-email');
  linhaEmail.textContent = nome ? email : '';
  linhaEmail.hidden = !nome;
  btnConta.setAttribute('aria-label', `Conta de ${titulo}`);
  btnConta.title = titulo;
}

// Anuncia a tela nova para o leitor de tela (o título também recebe foco).
export function anunciar(texto) {
  avisoTela.textContent = '';
  requestAnimationFrame(() => { avisoTela.textContent = texto; });
}

export function rolarParaOTopo() {
  principal.scrollTo({ top: 0, behavior: movimentoReduzido() ? 'auto' : 'smooth' });
}

function atualizarBordaDeRolagem() {
  cabecalho.classList.toggle('rolado', principal.scrollTop > 4);
}

// ---------- Barra lateral ----------

function alternarBarra() {
  if (janelaEstreita.matches) {
    const abrir = !app.hasAttribute('data-barra-aberta');
    app.toggleAttribute('data-barra-aberta', abrir);
    sincronizarBarra();
    if (abrir) barra.querySelector('a[aria-current], a')?.focus();
    return;
  }
  const ocultar = !app.hasAttribute('data-barra-oculta');
  app.toggleAttribute('data-barra-oculta', ocultar);
  salvarPreferenciaBarra(ocultar);
  sincronizarBarra();
}

function fecharBarraSobreposta(devolverFoco) {
  app.removeAttribute('data-barra-aberta');
  sincronizarBarra();
  if (devolverFoco) btnBarra.focus();
}

// Uma fonte da verdade para o estado visível: botão, leitor de tela e
// ordem de foco concordam (barra escondida fica inerte).
function sincronizarBarra() {
  const sobreposta = janelaEstreita.matches && app.hasAttribute('data-barra-aberta');
  const visivel = janelaEstreita.matches ? sobreposta : !app.hasAttribute('data-barra-oculta');
  btnBarra.setAttribute('aria-expanded', String(visivel));
  btnBarra.title = visivel ? 'Ocultar barra lateral' : 'Mostrar barra lateral';
  barra.inert = !visivel;
  principal.inert = sobreposta; // com o painel aberto, o foco fica nele
}

function lerPreferenciaBarra() {
  try { return localStorage.getItem(CHAVE_BARRA_OCULTA) === '1'; } catch { return false; }
}

function salvarPreferenciaBarra(oculta) {
  try {
    if (oculta) localStorage.setItem(CHAVE_BARRA_OCULTA, '1');
    else localStorage.removeItem(CHAVE_BARRA_OCULTA);
  } catch { /* armazenamento bloqueado: a preferência vale só nesta visita */ }
}

// ---------- Menu da conta ----------

function posicionarMenuConta() {
  const r = btnConta.getBoundingClientRect();
  menuConta.style.top = `${Math.round(r.bottom + 8)}px`;
  menuConta.style.right = `${Math.max(8, Math.round(document.documentElement.clientWidth - r.right))}px`;
}
