(function () {
  "use strict";

  function showView(name) {
    ["loading", "setup", "onboarding", "sheet"].forEach(function (v) {
      var el = document.getElementById("view-" + v);
      if (el) el.hidden = v !== name;
    });
  }

  /* ============ tema ============ */
  // A escolha é feita no cabeçalho do portal (chave "tema", a mesma de
  // sempre); quando ela muda, o apps/compartilhado/portal.js aplica aqui.
  var root = document.documentElement;
  var stored = null;
  try { stored = localStorage.getItem("tema"); } catch (err) { stored = null; }
  if (stored === "dark" || stored === "light") {
    root.setAttribute("data-theme", stored);
  } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    root.setAttribute("data-theme", "dark");
  }

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
  // O login é o do portal: aqui a sessão já chega pronta. Sem a primeira
  // configuração feita, aparecem as três etapas; depois, a planilha.
  function route(session) {
    db.from("profiles").select("*").eq("id", session.user.id).single().then(function (res) {
      var profile = res.data;
      if (!profile || !profile.onboarding_completed) {
        showView("onboarding");
        window.OnboardingView.show(session.user, profile, function () { route(session); });
        return;
      }
      showView("sheet");
      window.SheetView.show(session.user, profile);
    });
  }

  window.OnboardingView.mount();
  window.SheetView.mount();

  showView("loading");
  window.FEPortal.comSessao(db, route);
})();
