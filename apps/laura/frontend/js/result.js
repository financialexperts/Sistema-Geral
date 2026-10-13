(function (global) {
  "use strict";

  var S = global.Scenario;
  var Sim = global.Simulation;
  var Format = global.Format;
  var Icons = global.Icons;

  // Uma frase por tipo de fonte de renda presente na combinação (o "kind" de
  // backend/js/incomeOptions.js). Tipo sem frase aqui só não comenta nada.
  var INSIGHTS = {
    salario: "Renda salarial fixa garante <strong>previsibilidade</strong>.",
    investimento: "O investimento financeiro trabalha o capital <strong>passivamente</strong>.",
    empreendimento: "A atividade empreendedora traz <strong>alto potencial de ganho</strong>, mas risco maior."
  };

  function statHTML(icon, tone, label, value, sub, highlight) {
    return '<div class="stat fx' + (highlight ? " stat--hl" : "") + '">' +
      '<p class="stat__label">' + Icons.tile(icon, tone, "itile--xs") + label + "</p>" +
      '<p class="stat__value">' + value + "</p>" +
      '<p class="stat__sub">' + sub + "</p>" +
      "</div>";
  }

  function rowHTML(opt) {
    var v = Sim.investOf(opt);
    return '<li class="ledger__row fx">' +
      Icons.optionTile(opt, "itile--sm") +
      '<div class="ledger__main">' +
        '<p class="ledger__badge">' + Format.esc(opt.label) + "</p>" +
        '<p class="ledger__title">' + Format.esc(opt.title) + "</p>" +
        '<p class="ledger__meta">' + Format.esc(opt.hoursLabel) + " · " +
          (v > 0 ? "Investimento de " + Format.money(v) : "Sem investimento") + "</p>" +
      "</div>" +
      '<div class="ledger__value">' +
        '<p class="ledger__label">Renda real</p>' +
        '<p class="ledger__num">' + Format.money(Sim.beforeOf(opt)) + "</p>" +
      "</div>" +
      "</li>";
  }

  function insightHTML(list, t) {
    var kinds = list.map(function (o) { return o.kind; });
    var n = list.length;

    var txt = "A " + Format.esc(S.person) + " gerou <strong>" + Format.money(t.before) + " por mês</strong> com " +
      n + (n === 1 ? " fonte de renda. " : " fontes de renda. ");
    txt += n >= 2
      ? "Boa estratégia de <strong>diversificação</strong>. "
      : "Com apenas uma fonte, a estratégia é <strong>concentrada</strong>, o que pode ser arriscado. ";
    Object.keys(INSIGHTS).forEach(function (k) {
      if (kinds.indexOf(k) > -1) txt += INSIGHTS[k] + " ";
    });

    return '<p class="insight__title">' + Icons.tile("lampada", "amber", "itile--xs") + "Análise da sua escolha</p>" +
      "<p>" + txt.trim() + "</p>" +
      '<p class="insight__hook">Mas será que a situação se manteve? Continue para descobrir…</p>';
  }

  function show() {
    var list = Sim.chosen();
    var t = Sim.totals();

    document.getElementById("res-stats").innerHTML =
      statHTML("cifrao", "green", "Renda mensal real", Format.money(t.before), "nos primeiros meses", true) +
      statHTML("moedas", "blue", "Capital investido", Format.money(t.invest), "de " + Format.compactMoney(S.capital) + " disponíveis") +
      statHTML("relogio", "violet", "Horas por dia", t.hours + "h", "de " + S.hours + "h disponíveis") +
      statHTML("camadas", "pink", "Fontes ativas", String(t.count), t.count === 1 ? "fonte única" : "combinadas");

    document.getElementById("res-list").innerHTML = list.map(rowHTML).join("");
    document.getElementById("res-insight").innerHTML = insightHTML(list, t);
    document.getElementById("sec-result").hidden = false;
  }

  function hide() {
    document.getElementById("sec-result").hidden = true;
  }

  global.ResultView = {
    show: show,
    hide: hide
  };
})(window);
