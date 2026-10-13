(function (global) {
  "use strict";

  var S = global.Scenario;
  var Catalog = global.IncomeOptions;
  var Sim = global.Simulation;
  var Format = global.Format;
  var Toast = global.Toast;
  var Icons = global.Icons;

  var root = null;       // o container dos cartões
  var onChange = null;   // avisa o app que a combinação mudou (o resultado na tela deixa de valer)

  // o tipo da opção (o "kind"), no alto do cartão ao lado do número
  var KIND_LABEL = {
    salario: "Salário fixo",
    comissao: "Fixo + comissão",
    investimento: "Investimento",
    empreendimento: "Negócio próprio"
  };

  /* ============ textos de cada cartão ============ */
  function estimateText(opt) {
    if (Sim.isAdjustable(opt)) return Format.money(Sim.beforeOf(opt));
    var e = opt.estimate;
    return e.length > 1
      ? Format.compactMoney(e[0]) + " a " + Format.compactMoney(e[1])
      : Format.money(e[0]);
  }

  function investTagText(opt) {
    if (Sim.isAdjustable(opt)) return "Investe até " + Format.compactMoney(S.capital);
    return opt.invest > 0 ? "Investe " + Format.compactMoney(opt.invest) : "Sem investimento";
  }

  function riskHTML(opt) {
    if (!opt.risk) return "";
    return '<span class="tag risk risk--' + opt.risk + '">' +
      '<span class="risk__bars" aria-hidden="true"><span class="risk__bar"></span><span class="risk__bar"></span><span class="risk__bar"></span></span>' +
      '<span class="risk__label">' + Format.esc(opt.riskLabel) + "</span>" +
      "</span>";
  }

  /* ============ montagem da tela ============ */
  // Os investimentos ajustáveis ganham um quadro abaixo do cartão: o campo em
  // reais e o controle deslizante mexem no mesmo valor, e o deslizante vai só
  // até o capital que ainda sobra.
  function investHTML(opt) {
    if (!Sim.isAdjustable(opt)) return "";
    var id = opt.id;
    return '<div class="investbox">' +
      '<div class="investbox__top">' +
        '<label class="investbox__label" for="invest-' + id + '">Quanto investir?</label>' +
        '<div class="input investbox__input"><span class="input__affix">R$</span>' +
          '<input id="invest-' + id + '" type="text" inputmode="decimal" placeholder="0,00" data-invest="' + id + '"></div>' +
      "</div>" +
      '<input class="range" id="range-' + id + '" type="range" min="0" step="' + S.investStep + '" data-range="' + id + '" ' +
        'aria-label="Valor investido na ' + Format.esc(opt.label) + ', em reais">' +
      '<div class="investbox__limits"><span>' + Format.compactMoney(0) + '</span><span data-max="' + id + '"></span></div>' +
      '<p class="investbox__calc" data-calc="' + id + '"></p>' +
      "</div>";
  }

  // O cartão todo (menos o quadro do investimento) é um botão: tocar nele
  // inclui ou tira a opção. aria-pressed diz ao leitor de tela se ela está
  // na combinação; o "Incluir / Incluída" é o mesmo aviso pra quem vê (por
  // isso fica escondido do leitor de tela, que já ouve o aria-pressed).
  function cardHTML(opt) {
    var kind = KIND_LABEL[opt.kind];
    return '<div class="optcard fx" data-id="' + opt.id + '">' +
      '<button class="optcard__toggle" type="button" aria-pressed="false" data-toggle="' + opt.id + '">' +
        Icons.optionTile(opt, "optcard__icon") +
        '<span class="optcard__main">' +
          '<span class="optcard__badge">' + Format.esc(opt.label) +
            (kind ? '<span class="optcard__kind"> · ' + Format.esc(kind) + "</span>" : "") + "</span>" +
          '<span class="optcard__title">' + Format.esc(opt.title) + "</span>" +
          '<span class="optcard__tags">' +
            '<span class="tag">' + Icons.svg("relogio") + Format.esc(opt.hoursLabel) + "</span>" +
            '<span class="tag">' + Icons.svg("moedas") + Format.esc(investTagText(opt)) + "</span>" +
            riskHTML(opt) +
          "</span>" +
        "</span>" +
        '<span class="optcard__income">' +
          '<span class="optcard__price">' +
            '<span class="optcard__incomelabel">Renda estimada</span>' +
            '<span class="optcard__incomevalue" data-income="' + opt.id + '"></span>' +
            '<span class="optcard__incomeunit">por mês</span>' +
          "</span>" +
          '<span class="optcard__pick" aria-hidden="true">' +
            '<span class="optcard__pick-off">Incluir</span><span class="optcard__pick-on">Incluída</span>' +
          "</span>" +
        "</span>" +
      "</button>" +
      investHTML(opt) +
      "</div>";
  }

  function cardEl(id) { return root.querySelector('.optcard[data-id="' + id + '"]'); }

  /* ============ a tela acompanha o estado ============ */
  // Os cartões são montados uma vez só e depois só atualizados: redesenhar
  // tudo a cada toque tiraria o foco de quem navega pelo teclado.
  function syncInvest(opt, withText) {
    var id = opt.id;
    var v = Sim.investOf(opt);
    var room = Sim.roomFor(id);
    var range = document.getElementById("range-" + id);

    range.max = room;
    range.value = v;
    range.style.setProperty("--p", (room > 0 ? Math.min(v / room, 1) * 100 : 0) + "%");
    // o campo que a aluna está digitando não é reescrito no meio da digitação
    if (withText) document.getElementById("invest-" + id).value = Format.number(v);

    root.querySelector('[data-max="' + id + '"]').textContent = Format.compactMoney(room);
    root.querySelector('[data-calc="' + id + '"]').innerHTML =
      Format.pct(opt.rate * 100) + " ao mês × " + Format.money(v) +
      " = <strong>" + Format.money(Sim.beforeOf(opt)) + "</strong> por mês";
  }

  function syncCard(opt, withText) {
    var card = cardEl(opt.id);
    var on = Sim.isSelected(opt.id);
    card.classList.toggle("is-on", on);
    card.querySelector("[data-toggle]").setAttribute("aria-pressed", on ? "true" : "false");
    card.querySelector("[data-income]").textContent = estimateText(opt);
    if (Sim.isAdjustable(opt)) syncInvest(opt, withText);
  }

  // medidores de capital e de horas: laranja quando chegam no limite
  function syncMeter(key, value, max, html) {
    var pct = max > 0 ? Math.min(value / max * 100, 100) : 0;
    document.getElementById("meter-" + key + "-used").innerHTML = html;
    document.getElementById("meter-" + key + "-fill").style.width = pct + "%";
    document.getElementById("meter-" + key).classList.toggle("is-full", value >= max);
  }

  function syncMeters() {
    var u = Sim.used();
    // o "R$" do usado também some, mas só no celular bem estreito (styles.css).
    // O format.js separa o "R$" com espaço inquebrável: o \s pega os dois.
    syncMeter("money", u.money, S.capital,
      '<span class="meter__cur meter__cur--used">R$ </span>' + Format.compactMoney(u.money).replace(/^R\$\s/, ""));
    syncMeter("hours", u.hours, S.hours, u.hours + "h");
  }

  // skipTextId: o campo em reais que está sendo digitado agora (não reescreve)
  function sync(skipTextId) {
    Catalog.list.forEach(function (opt) { syncCard(opt, opt.id !== skipTextId); });
    syncMeters();
  }

  /* ============ medidores grudados no alto ============ */
  // Os medidores grudam logo abaixo da barra do topo enquanto a lista de
  // opções passa, e, grudados, viram uma cápsula de vidro (igual aos atalhos
  // da Carteira de Investimentos).
  var quadroPedido = false;

  function syncStuck() {
    var meters = document.getElementById("meters");
    meters.classList.toggle("is-stuck",
      meters.getBoundingClientRect().top <= parseFloat(getComputedStyle(meters).top) + 0.5);
  }

  function aoRolar() {
    if (quadroPedido) return;
    quadroPedido = true;
    requestAnimationFrame(function () {
      quadroPedido = false;
      syncStuck();
    });
  }

  /* ============ eventos ============ */
  function handleClick(e) {
    var btn = e.target.closest("[data-toggle]");
    if (!btn) return;

    var msg = Sim.toggle(Number(btn.getAttribute("data-toggle")));
    if (msg) {
      Toast.show(msg);
      return;
    }
    Toast.hide();
    sync();
    if (onChange) onChange();
  }

  function capMessage(room) {
    return room > 0
      ? "Cabem só " + Format.money(room) + " neste investimento: a soma não passa do capital de " + Format.compactMoney(S.capital) + "."
      : "Não sobrou capital para este investimento. Tire ou diminua outra opção para liberar espaço.";
  }

  function handleInput(e) {
    var t = e.target;
    var rangeId = t.getAttribute("data-range");
    var textId = t.getAttribute("data-invest");
    if (!rangeId && !textId) return;

    var id = Number(rangeId || textId);
    var n = rangeId ? Number(t.value) : (t.value.trim() ? Format.parseNumber(t.value) : 0);
    // enquanto o que foi digitado não é um número, espera o resto
    if (!isFinite(n)) return;

    var res = Sim.setInvest(id, n);
    if (res.capped) {
      Toast.show(capMessage(res.room));
      t.value = Format.number(res.value);
    }
    sync(textId && !res.capped ? id : null);
    // só uma opção escolhida muda o resultado; mexer num investimento de fora
    // da combinação nunca corta uma que está dentro
    if (onChange && Sim.isSelected(id)) onChange();
  }

  // ao sair do campo, "1500" e "1.500,5" viram "1.500,00" e "1.500,50"
  function handleBlur(e) {
    var textId = e.target.getAttribute("data-invest");
    if (!textId) return;
    e.target.value = Format.number(Sim.investOf(Catalog.byId(Number(textId))));
  }

  /* ============ API ============ */
  function mount(container, changeCallback) {
    root = container;
    onChange = changeCallback || null;
    root.innerHTML = Catalog.list.map(cardHTML).join("");
    root.addEventListener("click", handleClick);
    root.addEventListener("input", handleInput);
    root.addEventListener("focusout", handleBlur);

    // o "R$" do limite some no celular (styles.css), onde "R$ 15.000 / R$ 30.000"
    // não cabe em meia tela
    document.getElementById("meter-money-max").innerHTML =
      '<span class="meter__cur">R$ </span>' + Format.compactMoney(S.capital).replace("R$ ", "");
    document.getElementById("meter-hours-max").textContent = S.hours + "h";

    window.addEventListener("scroll", aoRolar, { passive: true });
    window.addEventListener("resize", aoRolar);

    sync();
    syncStuck();
  }

  global.OptionsView = {
    mount: mount,
    sync: sync
  };
})(window);
