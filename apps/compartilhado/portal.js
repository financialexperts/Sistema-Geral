// Liga um sistema ao portal da Financial Experts (o sistema principal).
//
// Cada sistema roda dentro do portal, numa moldura (iframe) do mesmo
// endereço, e não tem login próprio: o aluno entra uma vez, no portal, e a
// sessão do Supabase (guardada pelo navegador) vale para todos os sistemas.
//
// Vai no <head> de cada página do sistema, antes dos outros scripts:
//
//   <script src="../compartilhado/portal.js" data-sistema="fluxo-de-caixa"></script>
//
// (data-pagina="…" também, quando o sistema tem mais de uma atividade.) E faz
// três coisas:
//   1. aberto fora do portal (endereço direto, favorito antigo), leva para o
//      portal, que pede o login, se precisar, e abre o sistema por dentro;
//   2. FEPortal.comSessao(db, fn): roda fn(sessao) com a sessão do portal.
//      Sem sessão (saiu, expirou), avisa o portal, que mostra o login;
//   3. aplica o tema claro/escuro trocado no cabeçalho do portal.
(function (global) {
  "use strict";

  var script = document.currentScript;
  var sistema = script.getAttribute("data-sistema") || "";
  var pagina = script.getAttribute("data-pagina") || "";
  var raizDoPortal = new URL("../../", script.src).href;

  // O portal, se esta página estiver na moldura dele (mesma origem).
  function portal() {
    try {
      var pai = global.parent;
      if (pai && pai !== global && pai.FinancialExperts) return pai.FinancialExperts;
    } catch (err) { /* moldura de outra origem: não é o portal */ }
    return null;
  }

  var dentroDoPortal = !!portal();

  /* ============ fora do portal: vai para ele ============ */
  if (!dentroDoPortal) {
    var destino = new URL(raizDoPortal);
    if (sistema) destino.searchParams.set("sistema", sistema);
    if (pagina) destino.searchParams.set("pagina", pagina);
    // nada do sistema aparece enquanto a página troca
    document.documentElement.style.visibility = "hidden";
    global.location.replace(destino.href);
  }

  /* ============ sessão: a do portal ============ */
  function semSessao() {
    var p = portal();
    if (p) p.semSessao();
    else global.location.replace(raizDoPortal);
  }

  // Chama aoEntrar(sessao) uma vez, com a sessão que o portal abriu. Depois
  // disso, só a saída importa: renovações da sessão em segundo plano
  // (TOKEN_REFRESHED) e o SIGNED_IN que o Supabase repete ao voltar para a
  // aba não mexem na tela do sistema.
  function comSessao(db, aoEntrar) {
    if (!dentroDoPortal || !db) return;
    db.auth.getSession().then(function (res) {
      var sessao = res && res.data && res.data.session;
      if (!sessao) { semSessao(); return; }
      aoEntrar(sessao);
    }, semSessao);
    db.auth.onAuthStateChange(function (evento) {
      if (evento === "SIGNED_OUT") setTimeout(semSessao, 0);
    });
  }

  /* ============ tema claro/escuro ============ */
  // O botão do cabeçalho do portal grava a escolha na chave "tema" (a mesma
  // que os sistemas sempre leram) e avisa a moldura; trocada em outra aba,
  // chega pelo evento "storage".
  function aplicarTema(tema) {
    if (tema !== "dark" && tema !== "light") return;
    document.documentElement.setAttribute("data-theme", tema);
  }
  global.addEventListener("storage", function (evento) {
    if (evento.key === "tema" && evento.newValue) aplicarTema(evento.newValue);
  });

  global.FEPortal = {
    dentroDoPortal: dentroDoPortal,
    sistema: sistema,
    comSessao: comSessao,
    semSessao: semSessao,
    aplicarTema: aplicarTema
  };
})(window);
