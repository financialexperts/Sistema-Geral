(function (global) {
  "use strict";

  var Sim = global.Simulation;
  var Format = global.Format;
  var Icons = global.Icons;

  // O elemento surpresa. O botão que revela fica escondido de propósito no pé
  // do resultado, com cara de "dados complementares", pra a pandemia pegar a
  // turma de surpresa. A pausa antes de mostrar é o suspense.
  var PAUSA = 800;
  var LABEL = "Carregar dados complementares";
  var timer = null;
  var onReveal = null;   // leva a tela até o painel quando ele aparece

  function el(id) { return document.getElementById(id); }

  function rowHTML(opt) {
    var before = Sim.beforeOf(opt);
    var after = Sim.afterOf(opt);
    var dir = after < before ? "down" : after > before ? "up" : "same";
    return '<li class="ledger__row fx pdrow--' + opt.impact + '">' +
      Icons.optionTile(opt, "itile--sm") +
      '<div class="ledger__main">' +
        '<p class="ledger__badge">' + Format.esc(opt.label) + "</p>" +
        '<p class="ledger__title">' + Format.esc(opt.title) + "</p>" +
        '<p class="pdnote pdnote--' + opt.impact + '">' + Format.esc(opt.note) + "</p>" +
      "</div>" +
      '<div class="pdcompare">' +
        '<div class="pdcompare__col"><p class="ledger__label">Antes</p>' +
          '<p class="ledger__num ledger__num--before">' + Format.money(before) + "</p></div>" +
        '<div class="pdcompare__col"><p class="ledger__label">Depois</p>' +
          '<p class="ledger__num is-' + dir + '">' + Format.money(after) + "</p></div>" +
      "</div>" +
      "</li>";
  }

  // a frase diz o que aconteceu; a cor do quadro só ajuda a ver rápido
  function deltaText(diff, before) {
    if (diff === 0) return "Igual aos primeiros meses.";
    var quanto = Format.money(Math.abs(diff));
    var pct = before > 0 ? " (" + Format.pct(Math.abs(diff) / before * 100) + ")" : "";
    return (diff < 0 ? "Caiu " : "Subiu ") + quanto + pct + " em relação aos primeiros meses.";
  }

  function render() {
    var t = Sim.totals();
    var diff = Math.round((t.after - t.before) * 100) / 100;

    el("pd-total").className = "pdtotal fx " + (diff < 0 ? "is-down" : diff > 0 ? "is-up" : "is-same");
    el("pd-total-ico").innerHTML = Icons.svg(diff < 0 ? "queda" : diff > 0 ? "grafico" : "igual");
    el("pd-total-value").textContent = Format.money(t.after);
    el("pd-total-delta").textContent = deltaText(diff, t.before);
    el("pd-list").innerHTML = Sim.chosen().map(rowHTML).join("");
  }

  function reveal() {
    var btn = el("btn-pandemic");
    btn.disabled = true;
    btn.classList.add("is-loading");
    el("btn-pandemic-label").textContent = "Carregando…";

    timer = setTimeout(function () {
      render();
      // o botão já cumpriu o papel: sai, e o foco vai pro painel
      el("res-surprise").hidden = true;
      el("sec-pandemic").hidden = false;
      // o alarme: a tela pisca em vermelho (tira e põe a classe pra repetir)
      var alarme = el("alarm");
      alarme.classList.remove("is-on");
      void alarme.offsetWidth;
      alarme.classList.add("is-on");
      if (onReveal) onReveal(el("sec-pandemic"));
    }, PAUSA);
  }

  // esconde o painel e devolve o botão ao estado inicial
  function reset() {
    clearTimeout(timer);
    var btn = el("btn-pandemic");
    btn.disabled = false;
    btn.classList.remove("is-loading");
    el("btn-pandemic-label").textContent = LABEL;
    el("res-surprise").hidden = false;
    el("sec-pandemic").hidden = true;
    el("alarm").classList.remove("is-on");
  }

  function mount(revealCallback) {
    onReveal = revealCallback || null;
    el("btn-pandemic").addEventListener("click", reveal);
    reset();
  }

  global.PandemicView = {
    mount: mount,
    reset: reset
  };
})(window);
