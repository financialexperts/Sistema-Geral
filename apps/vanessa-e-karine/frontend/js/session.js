(function (global) {
  "use strict";

  // A sessão das duas páginas. O login é o do portal (apps/compartilhado/
  // portal.js): quando a sessão chega, a atividade aparece e o app.js /
  // game-app.js começam, pelo ready(), já sabendo quem é (o que fica
  // guardado no navegador é separado por conta).
  //
  // As telas: #view-loading (esperando a sessão), #view-setup (sem conexão:
  // aviso) e #view-app (a atividade).

  var DB = global.DB;

  function el(id) { return document.getElementById(id); }

  function showView(name) {
    ["loading", "setup", "app"].forEach(function (v) {
      var view = el("view-" + v);
      if (view) view.hidden = v !== name;
    });
  }

  /* ============ quem está esperando a sessão ============ */
  // O app.js e o game-app.js pedem pra começar pelo ready(fn): fn roda uma
  // vez só, com o usuário, quando a sessão chega (ou na hora, se já chegou).
  var waiting = [];
  var user = null;

  // O nome que a pessoa cadastrou no login (o "Nome completo" do Criar
  // conta). Vem dos dados do login ou, numa conta antiga sem ele, do perfil
  // (tabela profiles, a mesma de todos os sistemas). Sem nome nenhum, fica o
  // começo do e-mail. É o nome do placar e do ranking do jogo.
  var fullName = "";

  function ready(fn) {
    if (user) fn(user);
    else waiting.push(fn);
  }

  function getFullName() { return fullName; }

  // o primeiro nome, pro título do placar ("O seu placar, Ana")
  function firstName() {
    return fullName ? fullName.split(/\s+/)[0] : "";
  }

  global.Session = { ready: ready, fullName: getFullName, firstName: firstName };

  /* ============ o aviso de quando não dá pra conectar ============ */
  if (!DB.isConfigured) {
    el("view-setup").innerHTML = '<div class="card setup-card">' +
      '<p class="card__kicker">Sem conexão</p>' +
      '<h2 class="invcard__title">Não foi possível conectar</h2>' +
      '<p class="card__sub" style="margin-top:10px">Confira a sua conexão com a internet e recarregue a página.</p>' +
      "</div>";
    showView("setup");
    return;
  }

  var db = DB.client;

  function clean(s) { return String(s || "").replace(/\s+/g, " ").trim(); }

  function guardarNome(u) {
    var meta = clean(u.user_metadata && u.user_metadata.full_name);
    fullName = meta || clean(String(u.email || "").split("@")[0]);
    if (meta) return;
    // conta sem o nome nos dados do login: o nome pode estar no perfil
    db.from("profiles").select("full_name").eq("id", u.id).maybeSingle().then(function (res) {
      var name = clean(res.data && res.data.full_name);
      if (name) fullName = name;
    });
  }

  showView("loading");
  global.FEPortal.comSessao(db, function (session) {
    user = session.user;
    guardarNome(user);
    showView("app");
    var fns = waiting;
    waiting = [];
    fns.forEach(function (fn) { fn(user); });
  });
})(window);
