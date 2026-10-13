// Endereço de cada tela: o início (sem parâmetros), um curso
// (?curso=evolution) e um sistema dentro dele
// (?curso=evolution&sistema=fluxo-de-caixa e, num sistema com mais de uma
// atividade, &pagina=dinheiro-no-tempo). Voltar, recarregar e abrir em outra
// aba funcionam como num site comum. É parâmetro de busca, não "#", porque
// o "#" é dos links de e-mail do Supabase (trocar a senha, confirmar a conta).

let aoMudar = () => {};

export function iniciarRotas(callback) {
  aoMudar = callback;
  addEventListener('popstate', () => aoMudar(rotaAtual()));
}

export function rotaAtual() {
  const parametros = new URLSearchParams(location.search);
  const cursoId = parametros.get('curso') || null;
  const sistemaId = parametros.get('sistema') || null;
  const paginaId = parametros.get('pagina') || null;
  if (sistemaId) return { tela: 'sistema', cursoId, sistemaId, paginaId };
  if (cursoId) return { tela: 'curso', cursoId };
  return { tela: 'inicio' };
}

// Para links (href) e para o histórico.
export function endereco(rota) {
  if (rota.tela === 'inicio') return './';
  const parametros = new URLSearchParams();
  if (rota.cursoId) parametros.set('curso', rota.cursoId);
  if (rota.tela === 'sistema') {
    parametros.set('sistema', rota.sistemaId);
    if (rota.paginaId) parametros.set('pagina', rota.paginaId);
  }
  return `?${parametros}`;
}

// Abrir uma tela a partir de outra: a nova guarda de onde veio, para o
// "Voltar" do portal e o do navegador levarem ao mesmo lugar.
export function irPara(rota) {
  const de = rotaAtual();
  history.pushState({ de: de.tela, deCurso: de.cursoId ?? null }, '', endereco(rota));
  aoMudar(rotaAtual());
}

// Trocar a atividade de um sistema (as abas do cabeçalho) também entra no
// histórico: o Voltar do navegador volta para a atividade anterior.
export function trocarPagina(rota) {
  history.pushState({ de: 'sistema', deCurso: rota.cursoId ?? null }, '', endereco(rota));
  aoMudar(rotaAtual());
}

// Voltar um nível: do sistema para o curso dele, do curso para o início.
// Quem veio exatamente de lá volta pelo histórico; quem abriu o endereço
// direto (ou trocou de atividade no caminho) vai para lá sem sair do portal.
export function voltar() {
  const atual = rotaAtual();
  const pai = atual.tela === 'sistema' && atual.cursoId ? { tela: 'curso', cursoId: atual.cursoId } : { tela: 'inicio' };
  const estado = history.state;
  const veioDoPai = estado?.de === pai.tela && (pai.tela !== 'curso' || estado.deCurso === pai.cursoId);
  if (veioDoPai) {
    history.back();
    return;
  }
  history.pushState({ de: atual.tela, deCurso: atual.cursoId ?? null }, '', endereco(pai));
  aoMudar(rotaAtual());
}

// Corrige o endereço sem criar um passo no histórico (ex.: sistema aberto
// sem o curso no endereço ganha o curso).
export function corrigirRota(rota) {
  history.replaceState(history.state, '', endereco(rota));
}

// Ao sair da conta: o próximo login começa pelo início.
export function limparRota() {
  if (location.search) history.replaceState(null, '', location.pathname + location.hash);
}
