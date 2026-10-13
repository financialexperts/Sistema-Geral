(function (global) {
  "use strict";

  // FV = PV*(1+i)^n + PMT * [((1+i)^n - 1) / i]
  function futureValue(pmt, i, n, pv) {
    pv = pv || 0;
    var growth = Math.pow(1 + i, n);
    var fromPmt = i === 0 ? pmt * n : pmt * ((growth - 1) / i);
    return pv * growth + fromPmt;
  }
  // PMT = (FV - PV*(1+i)^n) * i / ((1+i)^n - 1)
  function payment(fv, i, n, pv) {
    pv = pv || 0;
    var growth = Math.pow(1 + i, n);
    var remaining = fv - pv * growth;
    if (remaining <= 0) return 0;
    return i === 0 ? remaining / n : remaining * i / (growth - 1);
  }
  // Saque A = P * i
  function incomePerpetual(p, i) { return p * i; }
  // Saque B = P * [i(1+i)^n / ((1+i)^n - 1)]
  function incomeDepleting(p, i, n) {
    if (i === 0) return p / n;
    var f = Math.pow(1 + i, n);
    return p * (i * f) / (f - 1);
  }
  // Série de saldos da acumulação: saldo[m] após m meses
  function accumulationSeries(pmt, i, n, pv) {
    pv = pv || 0;
    var out = new Array(n + 1), bal = pv;
    out[0] = { total: pv, base: pv };
    for (var m = 1; m <= n; m++) {
      bal = bal * (1 + i) + pmt;
      out[m] = { total: bal, base: pv + pmt * m };
    }
    return out;
  }
  // Série de saldos da fase de saque
  function depletionSeries(p, i, n, withdraw) {
    var out = new Array(n + 1), bal = p;
    out[0] = bal;
    for (var m = 1; m <= n; m++) {
      bal = bal * (1 + i) - withdraw;
      if (bal < 0) bal = 0;
      out[m] = bal;
    }
    return out;
  }

  function months(years) { return Math.max(1, Math.round(years * 12)); }

  global.Finance = {
    futureValue: futureValue,
    payment: payment,
    incomePerpetual: incomePerpetual,
    incomeDepleting: incomeDepleting,
    accumulationSeries: accumulationSeries,
    depletionSeries: depletionSeries,
    months: months
  };
})(window);
