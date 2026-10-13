(function (global) {
  "use strict";

  var shortMoney = Format.shortMoney;
  var esc = Format.esc;

  var CW = 720, CH = 300, PAD = { t: 20, r: 14, b: 30, l: 54 };

  // Eixo X sempre em anos inteiros ("hoje", "N anos") — nunca mistura com meses.
  function niceYearStep(totalYears) {
    var steps = [1, 2, 5, 10, 20, 25, 50, 100];
    for (var i = 0; i < steps.length; i++) {
      if (Math.ceil(totalYears / steps[i]) <= 6) return steps[i];
    }
    return steps[steps.length - 1];
  }
  function yearsAxisLabel(yy) {
    if (yy <= 0) return "Hoje";
    var r = Math.round(yy);
    return r + (r === 1 ? " ano" : " anos");
  }

  /**
   * cfg = {
   *   totalYears: number,
   *   series: [{ values:[numbers], color:'accent'|'warm', fill:boolean, dashed:boolean }],
   *   band: { top:[numbers], bottom:[numbers] }  // opcional (área entre duas curvas)
   *   tooltip: function(index) -> html
   * }
   */
  function draw(host, cfg) {
    if (!cfg) { host.innerHTML = '<div style="height:180px;display:grid;place-items:center;color:var(--muted);font-size:13.5px">O gráfico aparece assim que você preencher os campos.</div>'; return; }

    var all = [];
    if (cfg.band) all = all.concat(cfg.band.top);
    (cfg.series || []).forEach(function (s) { all = all.concat(s.values); });
    var max = Math.max.apply(null, all);
    if (!isFinite(max) || max <= 0) max = 1;
    max = max * 1.12;

    var n = cfg.band ? cfg.band.top.length - 1 : cfg.series[0].values.length - 1;
    var iw = CW - PAD.l - PAD.r, ih = CH - PAD.t - PAD.b;
    var X = function (k) { return PAD.l + (n === 0 ? 0 : (k / n) * iw); };
    var Y = function (v) { return PAD.t + ih - (v / max) * ih; };

    var uid = (host.id || "chart") + "-" + Math.random().toString(36).slice(2, 7);
    var gradAccent = "g-accent-" + uid, gradWarm = "g-warm-" + uid;

    var svg = '<svg viewBox="0 0 ' + CW + ' ' + CH + '" role="img" aria-label="Gráfico da evolução do patrimônio" preserveAspectRatio="xMidYMid meet">';
    svg += '<defs>' +
      '<linearGradient id="' + gradAccent + '" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0%" stop-color="var(--accent)" stop-opacity=".24"/>' +
        '<stop offset="100%" stop-color="var(--accent)" stop-opacity="0"/>' +
      '</linearGradient>' +
      '<linearGradient id="' + gradWarm + '" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0%" stop-color="var(--warm)" stop-opacity=".28"/>' +
        '<stop offset="100%" stop-color="var(--warm)" stop-opacity="0"/>' +
      '</linearGradient>' +
    '</defs>';

    // grades horizontais (hairline, recessivas)
    for (var g = 0; g <= 3; g++) {
      var val = (max / 3) * g, y = Y(val);
      svg += '<line x1="' + PAD.l + '" y1="' + y.toFixed(1) + '" x2="' + (CW - PAD.r) + '" y2="' + y.toFixed(1) + '" stroke="' + (g === 0 ? "var(--line-strong)" : "var(--line)") + '" stroke-width="1"/>';
      svg += '<text x="' + (PAD.l - 8) + '" y="' + (y + 4).toFixed(1) + '" text-anchor="end" font-weight="500" fill="var(--muted)">' + esc(g === 0 ? "0" : shortMoney(val)) + '</text>';
    }

    // rótulos do eixo x — sempre em anos inteiros, nunca mistura "anos" com "meses"
    var step = niceYearStep(cfg.totalYears);
    var xTicks = [];
    for (var yy = 0; yy < cfg.totalYears - step * 0.4; yy += step) xTicks.push(yy);
    xTicks.push(cfg.totalYears);
    xTicks.forEach(function (yy) {
      var k = Math.max(0, Math.min(n, Math.round((yy / cfg.totalYears) * n)));
      var anchor = yy <= 0 ? "start" : (yy >= cfg.totalYears ? "end" : "middle");
      svg += '<text x="' + X(k).toFixed(1) + '" y="' + (CH - 10) + '" text-anchor="' + anchor + '" fill="var(--muted)">' + esc(yearsAxisLabel(yy)) + '</text>';
    });

    function path(values, close) {
      var d = "";
      for (var k = 0; k < values.length; k++) d += (k ? "L" : "M") + X(k).toFixed(2) + " " + Y(values[k]).toFixed(2) + " ";
      if (close) d += "L" + X(values.length - 1).toFixed(2) + " " + Y(0).toFixed(2) + " L" + X(0).toFixed(2) + " " + Y(0).toFixed(2) + " Z";
      return d.trim();
    }

    // faixa entre duas curvas (ex.: só a parte dos juros, sem repetir a área dos depósitos)
    function strip(top, bottom) {
      var d = "";
      for (var k = 0; k < top.length; k++) d += (k ? "L" : "M") + X(k).toFixed(2) + " " + Y(top[k]).toFixed(2) + " ";
      for (var j = bottom.length - 1; j >= 0; j--) d += "L" + X(j).toFixed(2) + " " + Y(bottom[j]).toFixed(2) + " ";
      return (d + "Z").trim();
    }

    if (cfg.band) {
      // duas áreas em wash (gradiente leve), sem sobreposição: depósitos embaixo, juros só na faixa acima
      svg += '<path d="' + path(cfg.band.bottom, true) + '" fill="url(#' + gradAccent + ')"/>';
      svg += '<path d="' + strip(cfg.band.top, cfg.band.bottom) + '" fill="url(#' + gradWarm + ')"/>';
      svg += '<path d="' + path(cfg.band.bottom, false) + '" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
      svg += '<path d="' + path(cfg.band.top, false) + '" fill="none" stroke="var(--warm)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
    }
    (cfg.series || []).forEach(function (s) {
      var color = s.color === "warm" ? "var(--warm)" : "var(--accent)";
      var grad = s.color === "warm" ? gradWarm : gradAccent;
      if (s.fill) svg += '<path d="' + path(s.values, true) + '" fill="url(#' + grad + ')"/>';
      svg += '<path d="' + path(s.values, false) + '" fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round"' + (s.dashed ? ' stroke-dasharray="6 6"' : '') + ' stroke-linejoin="round"/>';
    });

    // marcador no valor final de cada curva (a cor mora no marcador, não no texto)
    var endMarkers = cfg.band ? [
      { v: cfg.band.top[n], color: "var(--warm)" },
      { v: cfg.band.bottom[n], color: "var(--accent)" }
    ] : (cfg.series || []).map(function (s) { return { v: s.values[n], color: s.color === "warm" ? "var(--warm)" : "var(--accent)" }; });
    endMarkers.forEach(function (m) {
      svg += '<circle cx="' + X(n).toFixed(2) + '" cy="' + Y(m.v).toFixed(2) + '" r="4.5" fill="' + m.color + '" stroke="var(--surface)" stroke-width="2"/>';
    });

    // valor final escrito no próprio gráfico — texto sempre em tinta neutra; a cor fica só no marcador ao lado
    var labels = endMarkers.map(function (m) { return { v: m.v, color: m.color, y: Y(m.v) - 11 }; }).sort(function (a, b) { return a.y - b.y; });
    for (var li = 1; li < labels.length; li++) {
      if (labels[li].y - labels[li - 1].y < 16) labels[li].y = labels[li - 1].y + 16;
    }
    labels.forEach(function (m) {
      var ly = Math.max(PAD.t + 8, Math.min(CH - PAD.b - 3, m.y));
      svg += '<circle cx="' + (X(n) - 17).toFixed(1) + '" cy="' + (ly - 3.5).toFixed(1) + '" r="3" fill="' + m.color + '"/>';
      svg += '<text x="' + (X(n) - 24).toFixed(1) + '" y="' + (ly + 4).toFixed(1) + '" text-anchor="end" ' +
        'style="fill:var(--ink);font-weight:700;font-size:12.5px" paint-order="stroke" stroke="var(--surface)" stroke-width="4" stroke-linejoin="round">' +
        esc(shortMoney(m.v)) + '</text>';
    });

    // linha guia do tooltip
    svg += '<line class="js-guide" x1="0" y1="' + PAD.t + '" x2="0" y2="' + (PAD.t + ih) + '" stroke="var(--line-strong)" stroke-width="1.5" opacity="0"/>';
    svg += '<circle class="js-dot" r="5" fill="var(--ink)" stroke="var(--surface)" stroke-width="2" opacity="0"/>';
    svg += '<rect class="js-hit" x="' + PAD.l + '" y="' + PAD.t + '" width="' + iw + '" height="' + ih + '" fill="transparent"/>';
    svg += "</svg>";

    host.innerHTML = svg + '<div class="tip"></div>';

    if (typeof cfg.tooltip !== "function") return;

    var svgEl = host.querySelector("svg");
    var guide = host.querySelector(".js-guide");
    var dot = host.querySelector(".js-dot");
    var tip = host.querySelector(".tip");

    function move(ev) {
      var r = svgEl.getBoundingClientRect();
      if (!r.width) return;
      var px = (ev.clientX - r.left) * (CW / r.width);
      var k = Math.round(((px - PAD.l) / iw) * n);
      if (k < 0) k = 0; if (k > n) k = n;
      guide.setAttribute("x1", X(k).toFixed(2));
      guide.setAttribute("x2", X(k).toFixed(2));
      guide.setAttribute("opacity", "1");
      var yv = Y(cfg.band ? cfg.band.top[k] : cfg.series[0].values[k]);
      dot.setAttribute("cx", X(k).toFixed(2));
      dot.setAttribute("cy", yv.toFixed(2));
      dot.setAttribute("opacity", "1");
      tip.innerHTML = cfg.tooltip(k);
      tip.classList.add("is-on");
      var hr = host.getBoundingClientRect();
      var dx = r.left - hr.left, dy = r.top - hr.top;
      var left = (X(k) / CW) * r.width + dx;
      var top = (yv / CH) * r.height + dy - 12;
      tip.style.left = Math.max(80, Math.min(hr.width - 80, left)) + "px";
      tip.style.top = Math.max(72, top) + "px";
    }
    function leave() { guide.setAttribute("opacity", "0"); dot.setAttribute("opacity", "0"); tip.classList.remove("is-on"); }

    svgEl.addEventListener("mousemove", move);
    svgEl.addEventListener("mouseleave", leave);
    svgEl.addEventListener("touchstart", function (e) { if (e.touches[0]) move(e.touches[0]); }, { passive: true });
    svgEl.addEventListener("touchmove", function (e) { if (e.touches[0]) move(e.touches[0]); }, { passive: true });
    svgEl.addEventListener("touchend", leave);
  }

  global.Chart = { draw: draw };
})(window);
