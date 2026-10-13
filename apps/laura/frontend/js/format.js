(function (global) {
  "use strict";

  var fmtBRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var fmtNum = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var fmtInt = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });

  // "R$ 10.000,00" — e "−R$ 250,00" quando é prejuízo (o sinal vem antes do
  // R$, com o traço de menos de verdade)
  function money(v) {
    v = v || 0;
    return (v < 0 ? "−" : "") + fmtBRL.format(Math.abs(v));
  }

  // "R$ 30.000" quando não tem centavos, "R$ 5.000,50" quando tem. Serve nos
  // lugares apertados (medidores, etiquetas) sem esconder centavo nenhum.
  function compactMoney(v) {
    v = v || 0;
    if (Math.round(v * 100) % 100 !== 0) return money(v);
    return (v < 0 ? "−" : "") + "R$ " + fmtInt.format(Math.abs(v));
  }

  // "5.000,00": o número sem o R$, do jeito que fica dentro do campo
  function number(v) { return fmtNum.format(v || 0); }

  // "0,4%", "72,3%" e "20%": casa decimal só quando ela existe de verdade
  function pct(n) {
    return (Math.round(n * 10) / 10).toFixed(1).replace(".", ",").replace(/,0$/, "") + "%";
  }

  // Aceita "1.000,50", "1000,5", "1000.50", "1.000" e "R$ 1.000,00"
  function parseNumber(raw) {
    if (raw == null) return NaN;
    var s = String(raw).replace(/[R$\s ]/g, "").trim();
    if (!s) return NaN;
    if (!/^-?[0-9.,]+$/.test(s)) return NaN;
    if (s.indexOf(",") > -1) {
      s = s.replace(/\./g, "").replace(",", ".");
    } else {
      var parts = s.split(".");
      if (parts.length > 1) {
        var last = parts[parts.length - 1];
        if (last.length === 3 && parts[0].length > 0) s = parts.join("");
      }
    }
    var n = parseFloat(s);
    return isFinite(n) ? n : NaN;
  }

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;"); }

  global.Format = {
    money: money,
    compactMoney: compactMoney,
    number: number,
    pct: pct,
    parseNumber: parseNumber,
    esc: esc
  };
})(window);
