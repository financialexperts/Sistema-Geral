(function (global) {
  "use strict";

  var fmtBRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var fmtNum = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var fmtPct = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 4 });

  function money(v) { return fmtBRL.format(v); }

  function trim(n) {
    var s = n.toFixed(n < 10 ? 1 : 0);
    return s.replace(".", ",").replace(",0", "");
  }

  function shortMoney(v) {
    var a = Math.abs(v);
    if (a >= 1e9) return "R$ " + trim(v / 1e9) + " bi";
    if (a >= 1e6) return "R$ " + trim(v / 1e6) + " mi";
    if (a >= 1e3) return "R$ " + trim(v / 1e3) + " mil";
    return "R$ " + Math.round(v);
  }

  // Aceita "1.000,50", "1000,5", "1000.50", "1.000" e "R$ 1.000,00"
  function parseNumber(raw) {
    if (raw == null) return NaN;
    var s = String(raw).replace(/[R$\s ]/g, "").trim();
    if (!s) return NaN;
    if (!/^-?[0-9.,]+$/.test(s)) return NaN;
    if (s.indexOf(",") > -1) {
      s = s.replace(/\./g, "").replace(",", ".");
    } else {
      var parts = s.split(".");
      if (parts.length > 1) {
        var last = parts[parts.length - 1];
        // ".000" no fim = separador de milhar; caso contrário é decimal
        if (last.length === 3 && parts[0].length > 0) s = parts.join("");
      }
    }
    var n = parseFloat(s);
    return isFinite(n) ? n : NaN;
  }

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;"); }

  // Para o tooltip do gráfico, por extenso ("daqui a 38 anos e 10 meses").
  function yearLabelLong(k) {
    var anos = Math.floor(k / 12), meses = k % 12;
    if (k === 0) return "Hoje";
    if (anos === 0) return "Daqui a " + meses + (meses === 1 ? " mês" : " meses");
    if (meses === 0) return "Daqui a " + anos + (anos === 1 ? " ano" : " anos");
    return "Daqui a " + anos + (anos === 1 ? " ano" : " anos") + " e " + meses + (meses === 1 ? " mês" : " meses");
  }

  global.Format = {
    fmtBRL: fmtBRL,
    fmtNum: fmtNum,
    fmtPct: fmtPct,
    money: money,
    shortMoney: shortMoney,
    trim: trim,
    parseNumber: parseNumber,
    esc: esc,
    yearLabelLong: yearLabelLong
  };
})(window);
