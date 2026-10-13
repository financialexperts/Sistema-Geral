(function () {
  "use strict";

  var Fi = Finance;
  var money = Format.money;
  var shortMoney = Format.shortMoney;
  var fmtNum = Format.fmtNum;
  var fmtPct = Format.fmtPct;
  var parseNumber = Format.parseNumber;

  /* ============ formatação dos resultados ============ */

  // "1.234,50" sem o ",00" quando o número é redondo
  function plain(v) { return fmtNum.format(v).replace(/,00$/, ""); }
  // Percentual sem zeros à toa: "0,62 %", "6,17 %", "12 %"
  function pct(i) {
    var s = fmtPct.format(i * 100);
    if (s.indexOf(",") > -1) s = s.replace(/0+$/, "").replace(/,$/, "");
    return s + " %";
  }
  function periodosLabel(n) {
    return plain(n) + (n === 1 ? " período" : " períodos");
  }

  /* ============ máscara e validação ============ */

  function formatOnBlur(el) {
    var kind = el.getAttribute("data-mask");
    var v = parseNumber(el.value);
    if (!isFinite(v)) return;
    if (kind === "money") el.value = fmtNum.format(v);
    else if (kind === "rate") el.value = String(Math.round(v * 10000) / 10000).replace(".", ",");
    else el.value = String(Math.round(v * 100) / 100).replace(".", ",");
  }

  function setError(id, msg) {
    var box = document.getElementById(id + "-box");
    var err = document.getElementById(id + "-err");
    if (!box || !err) return;
    if (msg) {
      box.classList.add("is-error");
      err.textContent = msg;
      err.classList.add("is-on");
    } else {
      box.classList.remove("is-error");
      err.textContent = "";
      err.classList.remove("is-on");
    }
  }

  // Lê um campo obrigatório. Devolve null e marca o erro quando inválido.
  // touched = false -> campo ainda vazio não acusa erro
  function readField(id, opts, touched) {
    var raw = document.getElementById(id).value.trim();
    if (!raw) { setError(id, touched ? "Preencha este campo." : ""); return null; }
    var v = parseNumber(raw);
    if (!isFinite(v)) { setError(id, "Use apenas números. Ex.: " + opts.example); return null; }
    if (v < 0) { setError(id, "O valor não pode ser negativo."); return null; }
    if (v === 0 && opts.min !== 0) { setError(id, "O valor precisa ser maior que zero."); return null; }
    if (opts.max && v > opts.max) { setError(id, "Valor muito alto. Use até " + opts.maxLabel + "."); return null; }
    setError(id, "");
    return v;
  }

  // Campo opcional: vazio vale 0 e nunca acusa "preencha este campo".
  function readOptional(id, opts) {
    var raw = document.getElementById(id).value.trim();
    if (!raw) { setError(id, ""); return 0; }
    var v = parseNumber(raw);
    if (!isFinite(v)) { setError(id, "Use apenas números. Ex.: " + opts.example); return null; }
    if (v < 0) { setError(id, "O valor não pode ser negativo."); return null; }
    if (opts.max && v > opts.max) { setError(id, "Valor muito alto. Use até " + opts.maxLabel + "."); return null; }
    setError(id, "");
    return v;
  }

  var MONEY = { example: "10.000,00", max: 1e12, maxLabel: "R$ 1 trilhão" };
  var PERIODS = { example: "240", max: 1200, maxLabel: "1.200 períodos" };
  var RATE = { example: "0,5", min: 0, max: 100, maxLabel: "100 %" };

  /* ============ estado de "campo tocado" ============ */
  var touched = {};

  /* ============ bloco de resultado ============ */

  // Desenha o resultado e a linha de cores. `split` (opcional) é
  // { proprio, juros, total } — a mesma proporção alimenta a barra e a faixa
  // colorida no topo do card, para as duas contarem a mesma história.
  function render(p, out) {
    var card = document.getElementById(p + "-result");
    var meter = document.getElementById(p + "-meter");

    card.classList.toggle("is-empty", !!out.empty);
    card.classList.toggle("is-warn", !!out.warn);
    document.getElementById(p + "-label").textContent = out.label;
    document.getElementById(p + "-value").textContent = out.value;
    document.getElementById(p + "-note").innerHTML = out.note;

    if (!out.split || !isFinite(out.split.total) || out.split.total <= 0) {
      meter.hidden = true;
      card.style.removeProperty("--mix");
      return;
    }

    var share = Math.max(0, Math.min(100, out.split.proprio / out.split.total * 100));
    meter.hidden = false;
    document.getElementById(p + "-seg-a").style.width = share + "%";
    document.getElementById(p + "-seg-b").style.width = (100 - share) + "%";
    document.getElementById(p + "-key-a").textContent =
      shortMoney(out.split.proprio) + " · " + Math.round(share) + "%";
    document.getElementById(p + "-key-b").textContent =
      shortMoney(Math.max(0, out.split.juros)) + " · " + (100 - Math.round(share)) + "%";
    card.style.setProperty("--mix", share + "%");
  }

  function blank(p, label, zero) {
    render(p, { empty: true, label: label, value: zero, note: "Preencha os campos acima para ver o resultado." });
  }

  /* ============ 01 — Parcela ============ */
  function calc1(force) {
    var t = function (id) { return force || touched[id]; };
    var i = readField("c1-taxa", RATE, t("c1-taxa"));
    var n = readField("c1-n", PERIODS, t("c1-n"));
    var pv = readOptional("c1-pv", MONEY);
    var fv = readField("c1-fv", MONEY, t("c1-fv"));

    if (i === null || n === null || pv === null || fv === null) return blank("c1", "Parcela por período", "R$ 0,00");

    i = i / 100;
    var pmt = Fi.payment(i, n, pv, fv);

    if (pmt < 0) {
      return render("c1", {
        warn: true,
        label: "Não é preciso depositar nada",
        value: money(-pmt),
        note: "O valor inicial de <b>" + money(pv) + "</b> sozinho já ultrapassa a meta. Em <b>" + periodosLabel(n) +
              "</b> dá até para <b>retirar</b> esse valor por período e ainda terminar com <b>" + money(fv) + "</b>."
      });
    }

    var s = Fi.split(pv, pmt, n, fv);
    render("c1", {
      label: "Parcela por período",
      value: money(pmt),
      note: "Depositando <b>" + money(pmt) + "</b> por período durante <b>" + periodosLabel(n) +
            "</b>" + (pv > 0 ? ", partindo de <b>" + money(pv) + "</b>," : "") + " você chega a <b>" + money(fv) + "</b>.",
      split: { proprio: s.proprio, juros: s.juros, total: fv }
    });
  }

  /* ============ 02 — Valor final ============ */
  function calc2(force) {
    var t = function (id) { return force || touched[id]; };
    var i = readField("c2-taxa", RATE, t("c2-taxa"));
    var n = readField("c2-n", PERIODS, t("c2-n"));
    var pv = readOptional("c2-pv", MONEY);
    var pmt = readField("c2-pmt", MONEY, t("c2-pmt"));

    if (i === null || n === null || pv === null || pmt === null) return blank("c2", "Valor final", "R$ 0,00");

    i = i / 100;
    var fv = Fi.futureValue(i, n, pv, pmt);
    var s = Fi.split(pv, pmt, n, fv);

    render("c2", {
      label: "Valor final",
      value: money(fv),
      note: (pv > 0 ? "Partindo de <b>" + money(pv) + "</b> e depositando " : "Depositando ") +
            "<b>" + money(pmt) + "</b> por período durante <b>" + periodosLabel(n) +
            "</b>, você termina com <b>" + money(fv) + "</b>.",
      split: { proprio: s.proprio, juros: s.juros, total: fv }
    });
  }

  /* ============ 03 — Valor inicial ============ */
  function calc3(force) {
    var t = function (id) { return force || touched[id]; };
    var i = readField("c3-taxa", RATE, t("c3-taxa"));
    var n = readField("c3-n", PERIODS, t("c3-n"));
    var pmt = readOptional("c3-pmt", MONEY);
    var fv = readField("c3-fv", MONEY, t("c3-fv"));

    if (i === null || n === null || pmt === null || fv === null) return blank("c3", "Valor inicial necessário", "R$ 0,00");

    i = i / 100;
    var pv = Fi.presentValue(i, n, pmt, fv);

    if (pv < 0) {
      return render("c3", {
        warn: true,
        label: "Não é preciso valor inicial",
        value: "R$ 0,00",
        note: "Só com os depósitos de <b>" + money(pmt) + "</b> por período você já passa de <b>" + money(fv) +
              "</b> em <b>" + periodosLabel(n) + "</b>. Não precisa começar com nada."
      });
    }

    var s = Fi.split(pv, pmt, n, fv);
    render("c3", {
      label: "Valor inicial necessário",
      value: money(pv),
      note: "Com <b>" + money(pv) + "</b> hoje" + (pmt > 0 ? " mais <b>" + money(pmt) + "</b> por período" : "") +
            ", você chega a <b>" + money(fv) + "</b> em <b>" + periodosLabel(n) + "</b>.",
      split: { proprio: s.proprio, juros: s.juros, total: fv }
    });
  }

  /* ============ 04 — Taxa de juros ============ */
  function calc4(force) {
    var t = function (id) { return force || touched[id]; };
    var n = readField("c4-n", PERIODS, t("c4-n"));
    var fv = readField("c4-fv", MONEY, t("c4-fv"));
    var pv = readOptional("c4-pv", MONEY);
    var pmt = readOptional("c4-pmt", MONEY);

    if (n === null || fv === null || pv === null || pmt === null) return blank("c4", "Taxa de juros por período", "0 %");

    if (pv <= 0 && pmt <= 0) {
      return render("c4", {
        warn: true, label: "Faltam dados",
        value: "—",
        note: "Preencha o valor inicial, a parcela por período, ou os dois — sem dinheiro entrando não existe taxa a calcular."
      });
    }

    var i = Fi.rate(n, pv, pmt, fv);
    if (i === null) {
      return render("c4", {
        warn: true, label: "Sem taxa possível",
        value: "—",
        note: "Não existe taxa entre −100 % e 100 % por período que leve esses valores a <b>" + money(fv) + "</b> em <b>" + periodosLabel(n) + "</b>."
      });
    }

    var s = Fi.split(pv, pmt, n, fv);

    render("c4", {
      warn: i < 0,
      label: i < 0 ? "Taxa por período (prejuízo)" : "Taxa de juros por período",
      value: pct(i),
      note: "É a taxa que transforma " +
            (pv > 0 ? "<b>" + money(pv) + "</b> hoje" : "") +
            (pv > 0 && pmt > 0 ? " mais " : "") +
            (pmt > 0 ? "<b>" + money(pmt) + "</b> por período" : "") +
            " em <b>" + money(fv) + "</b> ao longo de <b>" + periodosLabel(n) + "</b>.",
      split: i < 0 ? null : { proprio: s.proprio, juros: s.juros, total: fv }
    });
  }

  /* ============ 05 — Número de períodos ============ */
  function calc5(force) {
    var t = function (id) { return force || touched[id]; };
    var i = readField("c5-taxa", RATE, t("c5-taxa"));
    var fv = readField("c5-fv", MONEY, t("c5-fv"));
    var pv = readOptional("c5-pv", MONEY);
    var pmt = readField("c5-pmt", MONEY, t("c5-pmt"));

    if (i === null || fv === null || pv === null || pmt === null) return blank("c5", "Número de períodos", "0 períodos");

    i = i / 100;
    var n = Fi.periods(i, pv, pmt, fv);

    if (n === null) {
      return render("c5", {
        warn: true, label: "Prazo impossível",
        value: "—",
        note: "Com <b>" + money(pmt) + "</b> por período a <b>" + pct(i) + " por período</b>, o valor de <b>" + money(fv) + "</b> nunca é alcançado."
      });
    }
    if (n === 0) {
      return render("c5", {
        warn: true, label: "Você já chegou lá",
        value: "0 períodos",
        note: "O valor inicial de <b>" + money(pv) + "</b> já é igual ou maior que <b>" + money(fv) + "</b>."
      });
    }

    var s = Fi.split(pv, pmt, n, fv);
    render("c5", {
      label: "Número de períodos",
      value: periodosLabel(n),
      note: "Depositando <b>" + money(pmt) + "</b> por período" +
            (pv > 0 ? ", partindo de <b>" + money(pv) + "</b>," : "") + " até chegar a <b>" + money(fv) + "</b>.",
      split: { proprio: s.proprio, juros: s.juros, total: fv }
    });
  }

  var calcs = { form1: calc1, form2: calc2, form3: calc3, form4: calc4, form5: calc5 };
  function runAll(force) { calc1(force); calc2(force); calc3(force); calc4(force); calc5(force); }

  /* ============ eventos ============ */
  document.querySelectorAll("input[data-mask]").forEach(function (el) {
    el.addEventListener("input", function () { touched[el.id] = true; runAll(false); });
    el.addEventListener("blur", function () { touched[el.id] = true; formatOnBlur(el); runAll(false); });
    el.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); el.blur(); runAll(true); }
    });
  });

  document.querySelectorAll("#view-calc form").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var fn = calcs[form.id];
      if (fn) fn(true);
    });
  });

  document.querySelectorAll("[data-clear]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var form = document.getElementById(btn.getAttribute("data-clear"));
      if (!form) return;
      form.querySelectorAll("input").forEach(function (el) {
        el.value = "";
        touched[el.id] = false;
        setError(el.id, "");
      });
      runAll(false);
      var first = form.querySelector("input");
      if (first) first.focus();
    });
  });

  /* ============ seletor de calculadora ============ */
  // Só as abas da calculadora — as de Entrar/Criar conta são do auth.js.
  var tabs = Array.prototype.slice.call(document.querySelectorAll('#calc-tabs [role="tab"]'));
  function selectTab(tab) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
    });
  }
  tabs.forEach(function (tab, idx) {
    tab.addEventListener("click", function () { selectTab(tab); });
    tab.addEventListener("keydown", function (e) {
      var d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      var next = tabs[(idx + d + tabs.length) % tabs.length];
      selectTab(next); next.focus();
    });
  });

  /* ============ tema ============ */
  var root = document.documentElement;
  var stored = null;
  try { stored = localStorage.getItem("tema"); } catch (err) { stored = null; }
  if (stored === "dark" || stored === "light") {
    root.setAttribute("data-theme", stored);
  } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    root.setAttribute("data-theme", "dark");
  }
  document.getElementById("tema").addEventListener("click", function () {
    var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("tema", next); } catch (err) {}
  });

  /* ============ liquid glass: brilho que segue o ponteiro ============ */
  document.querySelectorAll(".glass").forEach(function (el) {
    el.addEventListener("pointermove", function (e) {
      var r = el.getBoundingClientRect();
      el.style.setProperty("--gx", ((e.clientX - r.left) / r.width * 100) + "%");
      el.style.setProperty("--gy", ((e.clientY - r.top) / r.height * 100) + "%");
    });
  });

  /* ============ início ============ */
  runAll(false);
})();
