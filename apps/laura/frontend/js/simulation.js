(function (global) {
  "use strict";

  var S = global.Scenario;
  var Catalog = global.IncomeOptions;
  var Format = global.Format;

  // O estado da simulação. Não toca no DOM: as telas leem daqui e pedem as
  // mudanças por aqui, e é aqui que ficam as regras do que pode ser combinado.
  //
  // selected: os ids escolhidos, na ordem em que foram escolhidos (é a ordem
  //   em que aparecem no resultado).
  // invest: quanto vai em cada investimento ajustável — escolhido ou não, pra
  //   o valor não se perder quando a aluna tira e põe a opção de volta.
  var selected = [];
  var invest = {};

  function round2(n) { return Math.round(n * 100) / 100; }

  function isAdjustable(opt) { return opt.invest === "ajustavel"; }
  function investOf(opt) { return isAdjustable(opt) ? invest[opt.id] : opt.invest; }
  function needsCapital(opt) { return isAdjustable(opt) || opt.invest > 0; }
  function usesAllCapital(opt) { return opt.invest === S.capital; }
  function isFullTime(opt) { return opt.hours >= S.hours; }

  function isSelected(id) { return selected.indexOf(id) > -1; }
  function chosen() { return selected.map(Catalog.byId); }

  function used() {
    var money = 0;
    var hours = 0;
    chosen().forEach(function (o) {
      money += investOf(o);
      hours += o.hours;
    });
    return { money: round2(money), hours: hours };
  }

  // Quanto capital cabe nesta opção: o total menos o que as outras escolhidas
  // já usam. Ela mesma não entra na conta, senão não daria pra ajustar o
  // próprio valor pra cima.
  function roomFor(id) {
    var usado = 0;
    chosen().forEach(function (o) {
      if (o.id !== id) usado += investOf(o);
    });
    return Math.max(round2(S.capital - usado), 0);
  }

  // Nenhum investimento ajustável passa do que cabe pra ele. Quando a aluna
  // aumenta um, o outro (se estiver acima do que sobrou) é cortado junto.
  function clampOthers(exceptId) {
    Catalog.list.forEach(function (o) {
      if (!isAdjustable(o) || o.id === exceptId) return;
      var room = roomFor(o.id);
      if (invest[o.id] > room) invest[o.id] = room;
    });
  }

  // Muda o valor de um investimento ajustável, cortando no que cabe.
  // Devolve { value, room, capped } — capped diz se o que veio foi cortado.
  function setInvest(id, value) {
    var room = roomFor(id);
    var pedido = Math.max(value || 0, 0);
    var v = round2(Math.min(pedido, room));
    invest[id] = v;
    clampOthers(id);
    return { value: v, room: room, capped: round2(pedido) > room };
  }

  /* ============ as regras de combinação ============ */
  // Tira a opção se ela já estava escolhida (isso sempre pode). Se não
  // estava, confere as regras e só inclui se passar em todas. Devolve "" quando
  // deu certo, ou a frase que explica por que não deu.
  function toggle(id) {
    if (isSelected(id)) {
      selected.splice(selected.indexOf(id), 1);
      return "";
    }

    var opt = Catalog.byId(id);
    var u = used();
    var lista = chosen();
    var integral = lista.filter(isFullTime)[0];
    var tudo = lista.filter(usesAllCapital)[0];

    // uma opção que ocupa o dia inteiro não divide as horas com nenhuma outra
    // (os investimentos, que não tomam tempo, continuam valendo com ela)
    if (isFullTime(opt) && u.hours > 0) {
      return "A " + opt.label + " ocupa as " + S.hours + "h do dia e não pode ser combinada com outras atividades.";
    }
    if (integral && opt.hours > 0) {
      return "Você já tem uma atividade que ocupa todas as " + S.hours + " horas do dia (" + integral.label + ").";
    }
    // uma opção que usa o capital inteiro não divide dinheiro com nenhuma
    // outra que precise de investimento — nem com um investimento em R$ 0
    if (usesAllCapital(opt) && lista.some(needsCapital)) {
      return "A " + opt.label + " exige " + Format.compactMoney(S.capital) +
        " e não pode ser combinada com outras que exigem investimento.";
    }
    if (tudo && needsCapital(opt)) {
      return "A " + tudo.label + " já utiliza todo o capital disponível (" + Format.compactMoney(S.capital) + ").";
    }
    if (round2(u.money + investOf(opt)) > S.capital) {
      return "Capital insuficiente: ainda cabem " + Format.money(S.capital - u.money) +
        ". Ajuste o valor do investimento.";
    }
    if (u.hours + opt.hours > S.hours) {
      return "Tempo insuficiente: ainda cabem " + (S.hours - u.hours) + "h no dia, e esta opção exige " + opt.hours + "h.";
    }

    selected.push(id);
    return "";
  }

  /* ============ o que a combinação rende ============ */
  function beforeOf(opt) { return round2(opt.before(investOf(opt))); }
  function afterOf(opt) { return round2(opt.after(investOf(opt))); }

  function totals() {
    var t = { before: 0, after: 0, invest: 0, hours: 0, count: selected.length };
    chosen().forEach(function (o) {
      t.before += beforeOf(o);
      t.after += afterOf(o);
      t.invest += investOf(o);
      t.hours += o.hours;
    });
    t.before = round2(t.before);
    t.after = round2(t.after);
    t.invest = round2(t.invest);
    return t;
  }

  // volta tudo ao começo: nada escolhido e os investimentos no valor inicial
  function reset() {
    selected = [];
    Catalog.list.forEach(function (o) {
      if (isAdjustable(o)) invest[o.id] = S.defaultInvest;
    });
  }

  reset();

  global.Simulation = {
    isAdjustable: isAdjustable,
    investOf: investOf,
    isSelected: isSelected,
    chosen: chosen,
    used: used,
    roomFor: roomFor,
    setInvest: setInvest,
    toggle: toggle,
    beforeOf: beforeOf,
    afterOf: afterOf,
    totals: totals,
    reset: reset
  };
})(window);
