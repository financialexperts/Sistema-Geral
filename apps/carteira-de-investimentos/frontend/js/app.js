(function () {
  "use strict";

  function showView(name) {
    ["loading", "setup", "onboarding", "portfolio"].forEach(function (v) {
      var el = document.getElementById("view-" + v);
      if (el) el.hidden = v !== name;
    });
  }

  /* ============ tema ============ */
  var root = document.documentElement;
  var metaTheme = document.getElementById("meta-theme-color");
  function syncThemeColor() {
    if (!metaTheme) return;
    metaTheme.setAttribute("content", root.getAttribute("data-theme") === "dark" ? "#171435" : "#F7F7FA");
  }
  var stored = null;
  try { stored = localStorage.getItem("tema"); } catch (err) { stored = null; }
  if (stored === "dark" || stored === "light") {
    root.setAttribute("data-theme", stored);
  } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    root.setAttribute("data-theme", "dark");
  }
  syncThemeColor();
  // O botão de trocar o tema fica no cabeçalho do portal; a troca chega
  // aqui pelo apps/compartilhado/portal.js (mesma chave "tema").

  /* ============ liquid glass: brilho que segue o ponteiro ============ */
  document.addEventListener("pointermove", function (e) {
    var el = e.target.closest && e.target.closest(".glass");
    if (!el) return;
    var r = el.getBoundingClientRect();
    el.style.setProperty("--gx", ((e.clientX - r.left) / r.width * 100) + "%");
    el.style.setProperty("--gy", ((e.clientY - r.top) / r.height * 100) + "%");
  });

  /* ============ conexão com o Supabase ============ */
  if (!window.DB.isConfigured) {
    showView("setup");
    return;
  }

  var db = window.DB.client;

  /* ============ roteamento ============ */
  // O login é o do portal (apps/compartilhado/portal.js): a sessão já chega
  // pronta, uma vez só. Renovações da sessão e o SIGNED_IN que o Supabase
  // repete ao voltar para a aba não redesenham nada aqui (o que o aluno
  // digitou e ainda não salvou continua na tela).
  function showOnboarding(session, profile, step) {
    showView("onboarding");
    window.OnboardingView.show(session.user, profile, step, function () { route(session); });
  }

  function route(session) {
    db.from("profiles").select("*").eq("id", session.user.id).single().then(function (res) {
      var profile = res.data;
      // quem decide se as etapas aparecem são as próprias colunas delas: um
      // perfil válido salvo pula a etapa 01, e investimentos salvos pulam a 02
      if (!profile || !window.InvestorProfiles.byKey(profile.investor_profile)) {
        showOnboarding(session, profile, 1);
        return;
      }
      // escolheu o perfil mas ainda não montou a carteira: cai direto na
      // etapa 02, sem repetir a escolha do perfil.
      // ou tem um rascunho que ainda não foi salvo (o celular descarregou a
      // aba no meio da edição): volta pra etapa 02 com ele, em vez de
      // esconder o que ele digitou atrás da carteira antiga.
      if (!window.Investments.isFilled(profile) || window.OnboardingView.hasDraft(session.user.id)) {
        showOnboarding(session, profile, 2);
        return;
      }
      showView("portfolio");
      window.PortfolioView.show(session.user, profile, function (step) { showOnboarding(session, profile, step); });
    });
  }

  window.OnboardingView.mount();
  window.PortfolioView.mount();

  showView("loading");
  window.FEPortal.comSessao(db, route);
})();
