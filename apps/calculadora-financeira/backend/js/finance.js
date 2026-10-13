/* Matemática financeira pura — as 5 funções da planilha (PGTO, VF, VP, TAXA, NPER).
   Convenção de sinais: aqui tudo entra positivo. Valor inicial e parcela são o
   dinheiro que você coloca; valor final é o que você tem no fim. A relação que
   liga as cinco funções é sempre a mesma, série postecipada (depósito no fim
   de cada período):

       VF = VP·(1+i)^n + PMT · [((1+i)^n − 1) / i]

   Cada função isola uma das cinco variáveis dessa igualdade. */
(function (global) {
  "use strict";

  function growth(i, n) { return Math.pow(1 + i, n); }

  // Fator de acumulação de uma série postecipada: ((1+i)^n − 1)/i
  function annuity(i, n) { return i === 0 ? n : (growth(i, n) - 1) / i; }

  // VF = VP·(1+i)^n + PMT·s
  function futureValue(i, n, pv, pmt) {
    return pv * growth(i, n) + pmt * annuity(i, n);
  }

  // PMT = (VF − VP·(1+i)^n) / s
  // Negativo significa que o valor inicial sozinho já ultrapassa a meta: em vez
  // de depositar, dá para retirar esse valor por período e ainda assim chegar lá.
  function payment(i, n, pv, fv) {
    return (fv - pv * growth(i, n)) / annuity(i, n);
  }

  // VP = (VF − PMT·s) / (1+i)^n
  function presentValue(i, n, pmt, fv) {
    return (fv - pmt * annuity(i, n)) / growth(i, n);
  }

  // Isolando n:  (1+i)^n = (VF·i + PMT) / (VP·i + PMT)  →  n = ln(...)/ln(1+i)
  // Retorna null quando não existe prazo possível (nunca chega ao valor final).
  function periods(i, pv, pmt, fv) {
    if (fv <= pv) return 0;                       // já tem o valor final
    if (i === 0) return pmt > 0 ? (fv - pv) / pmt : null;
    var num = fv * i + pmt, den = pv * i + pmt;
    if (den <= 0 || num <= 0) return null;
    var g = num / den;
    if (g <= 1) return null;
    return Math.log(g) / Math.log(1 + i);
  }

  // TAXA por bisseção. f(i) = VP·(1+i)^n + PMT·s(i,n) − VF é crescente em i
  // (com VP e PMT ≥ 0), então a bisseção converge sempre e sem chute inicial.
  // Retorna null quando a raiz está fora do intervalo procurado.
  function rate(n, pv, pmt, fv) {
    if (pv <= 0 && pmt <= 0) return null;
    function f(i) { return futureValue(i, n, pv, pmt) - fv; }
    var lo = -0.9999, hi = 1;                     // até 100% por período
    if (f(lo) > 0 || f(hi) < 0) return null;
    for (var k = 0; k < 200; k++) {
      var mid = (lo + hi) / 2;
      if (f(mid) < 0) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  }

  // Quanto do valor final é dinheiro seu e quanto os juros produziram.
  function split(pv, pmt, n, fv) {
    var proprio = pv + pmt * n;
    return { proprio: proprio, juros: fv - proprio };
  }

  global.Finance = {
    growth: growth,
    annuity: annuity,
    futureValue: futureValue,
    payment: payment,
    presentValue: presentValue,
    periods: periods,
    rate: rate,
    split: split
  };
})(window);
