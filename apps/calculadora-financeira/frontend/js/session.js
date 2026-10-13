(function () {
  "use strict";

  // O login é o do portal (apps/compartilhado/portal.js): aqui só espera a
  // sessão chegar para mostrar a calculadora. Ela não grava nada no banco.

  function showView(name) {
    ["loading", "setup", "calc"].forEach(function (v) {
      var el = document.getElementById("view-" + v);
      if (el) el.hidden = v !== name;
    });
  }

  if (!window.DB.isConfigured) {
    showView("setup");
    return;
  }

  showView("loading");
  window.FEPortal.comSessao(window.DB.client, function () { showView("calc"); });
})();
