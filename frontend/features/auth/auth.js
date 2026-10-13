import { sb, SUPABASE_URL } from '../../../backend/api/supabaseClient.js';
import { salvarNome } from '../../../backend/api/perfilRepo.js';
import { esperar, movimentoReduzido, ocupado } from '../../shared/dom.js';
import { ligarAbas } from '../../shared/abas.js';

// Tela de acesso do portal: entrar, criar conta, pedir o link de
// redefinição e criar a senha nova. É o único login: os sistemas em apps/
// usam a sessão que nasce aqui (mesmo Supabase, mesmo navegador). As contas
// são as de sempre — quem já entrava no Fluxo de Caixa ou nas calculadoras
// entra aqui com o mesmo e-mail e senha.

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CHAVE_RECUPERACAO = 'fe-portal:recuperacao-pendente';
const DURACAO_ALINHAR = 540; // tempo das barras se alinharem (auth.css)

const telaInicial = document.getElementById('tela-inicial');
const tela = document.getElementById('tela-auth');
const cartao = document.getElementById('cartao-auth');
const paineis = {
  login: document.getElementById('form-login'),
  cadastro: document.getElementById('form-cadastro'),
  confirmar: document.getElementById('painel-confirmar'),
  recuperar: document.getElementById('form-recuperar'),
  'link-enviado': document.getElementById('painel-link-enviado'),
  'nova-senha': document.getElementById('form-nova-senha'),
};
const campo = id => document.getElementById(id);
const abasAuth = document.getElementById('abas-auth');
let abas = null;

// Checagem SÍNCRONA, antes de qualquer getSession(): o link de redefinição
// chega com "#...type=recovery" e o SDK transforma esse link numa sessão
// temporária. Se a sessão fosse restaurada primeiro, a pessoa entraria no
// portal sem criar a senha nova. A marca na sessionStorage cobre um
// recarregar da página depois que o link já saiu da barra de endereço.
const parametrosDoLink = new URLSearchParams(location.hash.slice(1));
let emRecuperacao = parametrosDoLink.get('type') === 'recovery' || lerMarcaRecuperacao();
const linkComErro = parametrosDoLink.has('error_code') || parametrosDoLink.has('error');

let callbacks = { aoEntrar() {}, aoSair() {} };
let logado = false;
let usuarioAtual = null;
let entrandoPeloFormulario = false;

export async function iniciarAutenticacao(opcoes) {
  callbacks = opcoes;
  ligarEventos();

  if (!sb) {
    mostrarPainel('login');
    mostrarErro('login', 'Não foi possível carregar o sistema. Verifique a conexão com a internet e recarregue a página.');
    campo('btn-entrar').disabled = true;
    return;
  }

  // Sem chamadas ao SDK dentro deste callback (a documentação do Supabase
  // avisa que isso pode travar); o trabalho fica para logo depois.
  sb.auth.onAuthStateChange((evento, sessao) => {
    if (evento === 'PASSWORD_RECOVERY') setTimeout(abrirCriacaoDeSenha);
    if (evento === 'SIGNED_OUT') setTimeout(concluirSaida);
    // Entrou em outra aba: esta acompanha. Outra conta entrou: recomeça do
    // zero, para nada da conta anterior ficar na tela.
    if (evento === 'SIGNED_IN' && sessao && !emRecuperacao && !entrandoPeloFormulario) {
      setTimeout(() => {
        if (logado && usuarioAtual?.id !== sessao.user.id) location.reload();
        else entrar(sessao.user);
      });
    }
  });

  if (emRecuperacao) mostrarPainel('nova-senha');

  // getSession() espera o SDK terminar de ler o link do e-mail, se houver.
  const { data } = await sb.auth.getSession();
  limparLinkDaUrl();

  if (linkComErro || (emRecuperacao && !data.session)) {
    marcarRecuperacao(false);
    mostrarPainel('recuperar');
    mostrarErro('recuperar', 'Este link de redefinição expirou ou já foi usado. Peça um link novo.');
    return;
  }
  if (emRecuperacao) return;

  if (data.session) entrar(data.session.user);
  else mostrarPainel('login');
}

// Chamado pelo menu da conta.
export async function sair() {
  await encerrarSessao();
  concluirSaida();
}

// Um sistema (dentro da moldura) não achou a sessão: confere a do portal.
// Sem sessão, volta para o login; com ela, foi só um tropeço do sistema.
export async function conferirSessao() {
  if (!sb || !logado) return false;
  const { data } = await sb.auth.getSession();
  if (data.session) return true;
  concluirSaida();
  return false;
}

// ---------- Fluxos ----------

async function aoEnviarLogin(evento) {
  evento.preventDefault();
  limparMensagens();
  const email = campo('login-email').value.trim();
  const senha = campo('login-senha').value;

  if (!email) return mostrarErro('login', 'Digite seu e-mail.', 'login-email');
  if (!EMAIL_VALIDO.test(email)) return mostrarErro('login', 'Digite o e-mail no formato nome@exemplo.com.', 'login-email');
  if (!senha) return mostrarErro('login', 'Digite sua senha.', 'login-senha');

  const liberar = ocupado(campo('btn-entrar'), 'Entrando…');
  const animar = !movimentoReduzido();
  cartao.classList.toggle('alinhando', animar);
  entrandoPeloFormulario = true;

  // Espera as barras terminarem de se alinhar, para o gesto não ser cortado
  // no meio quando o servidor responde rápido.
  const [{ data, error }] = await Promise.all([
    sb.auth.signInWithPassword({ email, password: senha }).catch(erro => ({ data: {}, error: erro })),
    esperar(animar ? DURACAO_ALINHAR : 0),
  ]);

  entrandoPeloFormulario = false;
  cartao.classList.remove('alinhando');
  liberar();
  if (error) return mostrarErro('login', mensagemErroLogin(error), 'login-senha');

  campo('login-senha').value = '';
  entrar(data.user);
}

async function aoCriarConta(evento) {
  evento.preventDefault();
  limparMensagens();
  const nome = campo('cadastro-nome').value.trim().replace(/\s+/g, ' ');
  const email = campo('cadastro-email').value.trim();
  const senha = campo('cadastro-senha').value;

  if (!nome) return mostrarErro('cadastro', 'Digite seu nome completo.', 'cadastro-nome');
  if (!email) return mostrarErro('cadastro', 'Digite seu e-mail.', 'cadastro-email');
  if (!EMAIL_VALIDO.test(email)) return mostrarErro('cadastro', 'Digite o e-mail no formato nome@exemplo.com.', 'cadastro-email');
  if (senha.length < 6) return mostrarErro('cadastro', 'A senha precisa ter pelo menos 6 caracteres.', 'cadastro-senha');

  const liberar = ocupado(campo('btn-criar-conta'), 'Criando conta…');
  const animar = !movimentoReduzido();
  cartao.classList.toggle('alinhando', animar);
  entrandoPeloFormulario = true;

  const [{ data, error }] = await Promise.all([
    sb.auth.signUp({
      email,
      password: senha,
      options: { data: { full_name: nome }, emailRedirectTo: enderecoDoPortal() },
    }).catch(erro => ({ data: {}, error: erro })),
    esperar(animar ? DURACAO_ALINHAR : 0),
  ]);

  entrandoPeloFormulario = false;
  cartao.classList.remove('alinhando');
  liberar();
  if (error) {
    const naSenha = error.code === 'weak_password' || /password/i.test(error.message ?? '');
    return mostrarErro('cadastro', mensagemErroCadastro(error), naSenha ? 'cadastro-senha' : 'cadastro-email');
  }

  // Sem sessão, o projeto pede a confirmação do e-mail antes de entrar.
  if (!data.session) {
    paineis.cadastro.reset();
    campo('confirmar-email').textContent = email;
    mostrarPainel('confirmar');
    return;
  }

  // O nome também vai para `profiles`, a tabela que os sistemas leem.
  try { await salvarNome(data.user.id, nome); } catch (erro) { console.error('Erro ao salvar o nome no perfil:', erro); }
  paineis.cadastro.reset();
  entrar(data.user);
}

async function aoPedirLink(evento) {
  evento.preventDefault();
  limparMensagens();
  const email = campo('recuperar-email').value.trim();

  if (!email) return mostrarErro('recuperar', 'Digite seu e-mail.', 'recuperar-email');
  if (!EMAIL_VALIDO.test(email)) return mostrarErro('recuperar', 'Digite o e-mail no formato nome@exemplo.com.', 'recuperar-email');

  const liberar = ocupado(campo('btn-enviar-link'), 'Enviando…');
  const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: enderecoDoPortal() })
    .catch(erro => ({ error: erro }));
  liberar();
  if (error) return mostrarErro('recuperar', mensagemErroEnvio(error), 'recuperar-email');

  campo('link-enviado-email').textContent = email;
  mostrarPainel('link-enviado');
}

async function aoSalvarSenhaNova(evento) {
  evento.preventDefault();
  limparMensagens();
  const senha = campo('nova-senha').value;
  const confirmacao = campo('confirmar-senha').value;

  if (senha.length < 6) return mostrarErro('nova-senha', 'Use pelo menos 6 caracteres.', 'nova-senha');
  if (senha !== confirmacao) return mostrarErro('nova-senha', 'Digite a mesma senha nos dois campos.', 'confirmar-senha');

  const liberar = ocupado(campo('btn-salvar-senha'), 'Salvando…');
  const { error } = await sb.auth.updateUser({ password: senha }).catch(erro => ({ error: erro }));
  if (error) {
    liberar();
    return mostrarErro('nova-senha', mensagemErroSenhaNova(error), 'nova-senha');
  }

  // A sessão do link é temporária: a pessoa entra de novo com a senha nova.
  marcarRecuperacao(false);
  await encerrarSessao();
  liberar();
  campo('nova-senha').value = '';
  campo('confirmar-senha').value = '';
  mostrarPainel('login');
  mostrarAviso('Senha alterada. Entre com a senha nova.');
}

async function aoCancelarSenhaNova() {
  marcarRecuperacao(false);
  await encerrarSessao();
  limparMensagens();
  mostrarPainel('login');
}

function abrirCriacaoDeSenha() {
  marcarRecuperacao(true);
  if (logado) {
    logado = false;
    usuarioAtual = null;
    callbacks.aoSair();
  }
  if (paineis['nova-senha'].hidden) mostrarPainel('nova-senha');
}

function entrar(usuario) {
  if (logado || !usuario) return;
  logado = true;
  usuarioAtual = usuario;
  telaInicial.hidden = true;
  tela.hidden = true;
  callbacks.aoEntrar(usuario);
}

// Idempotente: roda tanto pelo botão Sair quanto pelo evento SIGNED_OUT
// (sessão expirada, saída em outra aba) e pelo aviso de um sistema.
function concluirSaida() {
  if (!logado) return;
  logado = false;
  usuarioAtual = null;
  callbacks.aoSair();
  limparMensagens();
  mostrarPainel('login');
}

async function encerrarSessao() {
  const { error } = await sb.auth.signOut().catch(erro => ({ error: erro }));
  if (error) {
    // Sem rede o SDK não apaga a sessão guardada. Apaga na mão, para "Sair"
    // valer mesmo offline (chave padrão do supabase-js: sb-<projeto>-auth-token).
    const projeto = new URL(SUPABASE_URL).hostname.split('.')[0];
    try { localStorage.removeItem(`sb-${projeto}-auth-token`); } catch { /* armazenamento bloqueado */ }
  }
}

// Para onde voltam os links do e-mail (confirmar a conta, trocar a senha):
// a página do portal, sem o ?busca e sem o #. Ela precisa estar em Supabase
// → Authentication → URL Configuration → Redirect URLs.
function enderecoDoPortal() {
  return location.origin + location.pathname;
}

// ---------- Tela ----------

function ligarEventos() {
  abas = ligarAbas(abasAuth, {
    aoEscolher: aba => {
      limparMensagens();
      mostrarPainel(aba.id === 'aba-criar' ? 'cadastro' : 'login', { focar: false });
    },
  });

  paineis.login.addEventListener('submit', aoEnviarLogin);
  paineis.cadastro.addEventListener('submit', aoCriarConta);
  paineis.recuperar.addEventListener('submit', aoPedirLink);
  paineis['nova-senha'].addEventListener('submit', aoSalvarSenhaNova);
  campo('btn-cancelar-nova-senha').addEventListener('click', aoCancelarSenhaNova);

  cartao.addEventListener('click', evento => {
    const destino = evento.target.closest('[data-ir-para]')?.dataset.irPara;
    if (destino) {
      if (destino === 'recuperar') campo('recuperar-email').value = campo('login-email').value.trim();
      limparMensagens();
      mostrarPainel(destino);
      return;
    }
    const alternar = evento.target.closest('.alternar-senha');
    if (alternar) {
      const entrada = campo(alternar.dataset.alvo);
      const mostrar = entrada.type === 'password';
      entrada.type = mostrar ? 'text' : 'password';
      alternar.setAttribute('aria-pressed', String(mostrar));
      alternar.setAttribute('aria-label', mostrar ? 'Ocultar senha' : 'Mostrar senha');
      alternar.title = mostrar ? 'Ocultar senha' : 'Mostrar senha';
    }
  });

  // O aviso de erro some do campo assim que a pessoa começa a corrigir.
  cartao.addEventListener('input', evento => {
    if (evento.target.matches('.entrada')) evento.target.removeAttribute('aria-invalid');
  });
}

function mostrarPainel(nome, { focar = true } = {}) {
  telaInicial.hidden = true;
  tela.hidden = false;
  for (const [chave, painel] of Object.entries(paineis)) painel.hidden = chave !== nome;

  // As abas só aparecem em "Entrar" e "Criar conta", e seguem o painel.
  const comAbas = nome === 'login' || nome === 'cadastro';
  abasAuth.hidden = !comAbas;
  if (comAbas) abas.escolher(campo(nome === 'login' ? 'aba-entrar' : 'aba-criar'), { avisar: false });

  if (focar) {
    const primeiro = paineis[nome].querySelector('.entrada, .botao-primario');
    primeiro?.focus({ preventScroll: true });
  }
}

function mostrarErro(painel, texto, idCampo) {
  const aviso = campo(`${painel}-erro`);
  aviso.textContent = texto;
  aviso.hidden = false;
  if (idCampo) {
    const entrada = campo(idCampo);
    entrada.setAttribute('aria-invalid', 'true');
    entrada.focus();
    entrada.select?.();
  }
}

function mostrarAviso(texto) {
  const aviso = campo('login-aviso');
  aviso.textContent = texto;
  aviso.hidden = false;
}

function limparMensagens() {
  for (const aviso of cartao.querySelectorAll('.mensagem')) aviso.hidden = true;
  for (const entrada of cartao.querySelectorAll('[aria-invalid]')) entrada.removeAttribute('aria-invalid');
}

function limparLinkDaUrl() {
  if (/(access_token|error|type)=/.test(location.hash)) {
    history.replaceState(history.state, '', location.pathname + location.search);
  }
}

function lerMarcaRecuperacao() {
  try { return sessionStorage.getItem(CHAVE_RECUPERACAO) === '1'; } catch { return false; }
}

function marcarRecuperacao(ativa) {
  emRecuperacao = ativa;
  try {
    if (ativa) sessionStorage.setItem(CHAVE_RECUPERACAO, '1');
    else sessionStorage.removeItem(CHAVE_RECUPERACAO);
  } catch { /* armazenamento bloqueado: vale só a checagem do link */ }
}

// ---------- Mensagens de erro: o que houve e como resolver ----------

function semConexao(erro) {
  return !navigator.onLine || erro?.name === 'AuthRetryableFetchError' || erro?.status === 0
    || /failed to fetch|network/i.test(erro?.message ?? '');
}

function mensagemErroLogin(erro) {
  switch (erro?.code) {
    case 'invalid_credentials':
      return 'E-mail ou senha incorretos. Confira e tente de novo.';
    case 'email_not_confirmed':
      return 'Este e-mail ainda não foi confirmado. Abra a mensagem de confirmação que chegou nele.';
    case 'user_banned':
      return 'Este acesso está bloqueado. Fale com a equipe da Financial Experts.';
    case 'over_request_rate_limit':
      return 'Muitas tentativas seguidas. Aguarde alguns minutos e tente de novo.';
  }
  if (semConexao(erro)) return 'Sem conexão com o servidor. Verifique a internet e tente de novo.';
  if (erro?.status === 429) return 'Muitas tentativas seguidas. Aguarde alguns minutos e tente de novo.';
  if (erro?.status === 400 || /invalid login credentials/i.test(erro?.message ?? '')) {
    return 'E-mail ou senha incorretos. Confira e tente de novo.';
  }
  return 'Não foi possível entrar agora. Tente de novo em instantes.';
}

function mensagemErroCadastro(erro) {
  const texto = erro?.message ?? '';
  if (erro?.code === 'user_already_exists' || /already registered|already exists/i.test(texto)) {
    return 'Este e-mail já tem uma conta. Entre pela aba Entrar (ou use “Esqueci minha senha”).';
  }
  if (erro?.code === 'weak_password' || /password should be/i.test(texto)) {
    return 'Escolha uma senha mais forte: pelo menos 6 caracteres, misturando letras e números.';
  }
  if (erro?.code === 'email_address_invalid' || /invalid.*email|email.*invalid/i.test(texto)) {
    return 'Este e-mail não parece válido. Confira e tente de novo.';
  }
  if (erro?.code === 'signup_disabled') return 'O cadastro de contas novas está desligado. Fale com a equipe da Financial Experts.';
  if (semConexao(erro)) return 'Sem conexão com o servidor. Verifique a internet e tente de novo.';
  if (erro?.status === 429 || /rate limit/i.test(texto)) return 'Muitas tentativas seguidas. Aguarde alguns minutos e tente de novo.';
  return 'Não foi possível criar a conta agora. Tente de novo em instantes.';
}

function mensagemErroEnvio(erro) {
  if (semConexao(erro)) return 'Sem conexão com o servidor. Verifique a internet e tente de novo.';
  if (erro?.status === 429 || erro?.code === 'over_email_send_rate_limit') {
    return 'Muitos pedidos seguidos. Aguarde alguns minutos antes de pedir outro link.';
  }
  return 'Não foi possível enviar o link agora. Tente de novo em instantes.';
}

function mensagemErroSenhaNova(erro) {
  if (erro?.code === 'same_password') return 'A senha nova precisa ser diferente da atual.';
  if (erro?.code === 'weak_password') return 'Escolha uma senha mais forte, misturando letras e números.';
  if (semConexao(erro)) return 'Sem conexão com o servidor. Verifique a internet e tente de novo.';
  if (erro?.name === 'AuthSessionMissingError' || erro?.status === 401 || erro?.status === 403) {
    return 'Este link de redefinição expirou. Volte para o login e peça um link novo.';
  }
  return 'Não foi possível salvar a senha nova. Tente de novo.';
}
