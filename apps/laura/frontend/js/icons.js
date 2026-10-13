(function (global) {
  "use strict";

  // Os ícones da tela, todos de traço numa grade de 24×24. A cor vem do texto
  // em volta (currentColor). As peças com classe (ico-hands, ico-line…) são as
  // que se mexem na animação de cada ícone (styles.css, "Ícones animados").
  // pathLength="1" deixa o traço "se desenhar" sem precisar medir o caminho.
  var PATHS = {
    // as opções (o "icon" de backend/js/incomeOptions.js)
    predio: '<path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/><path d="M16 9h2a2 2 0 0 1 2 2v10"/><path d="M2 21h20"/><path d="M8 7h4M8 11h4M8 15h4"/>',
    escudo: '<path d="M12 3l7 3v5.5c0 4.2-2.9 7.9-7 9.5-4.1-1.6-7-5.3-7-9.5V6l7-3z"/><path class="ico-line" pathLength="1" d="M9 12l2 2 4-4"/>',
    grafico: '<path d="M3 3v18h18"/><path class="ico-line" pathLength="1" d="M7 15l4-4 3 3 6-6"/><path d="M16 8h4v4"/>',
    loja: '<path d="M4 10v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V10"/><path d="M3 10l1.6-5.6A2 2 0 0 1 6.5 3h11a2 2 0 0 1 1.9 1.4L21 10z"/><path d="M10 21v-5h4v5"/>',
    maleta: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M3 13h18"/>',
    comissao: '<path d="M19 5L5 19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
    bolo: '<path d="M3 21h18"/><path d="M5 21v-6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v6"/><path d="M5 17c1.2.8 2.3.8 3.5 0s2.3-.8 3.5 0 2.3.8 3.5 0 2.3-.8 3.5 0"/><path d="M12 13v-3"/><path class="ico-flame" d="M12 7.5c1-.8 1.1-1.8 0-3.5-1.1 1.7-1 2.7 0 3.5z"/>',

    // o ponto de partida, os medidores e as etiquetas do cartão
    moedas: '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6"/><path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/>',
    relogio: '<circle cx="12" cy="12" r="9"/><path class="ico-hands" d="M12 7v5l3 2"/>',
    alvo: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/><g class="ico-arrow"><path d="M12 12l7.5-7.5"/><path d="M16.5 3.5v4h4"/></g>',
    faisca: '<path d="M11 3l1.9 5.1L18 10l-5.1 1.9L11 17l-1.9-5.1L4 10l5.1-1.9L11 3z"/><path class="ico-twinkle" d="M19 14.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2z"/>',
    ajustes: '<path d="M4 6h16M4 12h16M4 18h16" opacity=".4"/><circle class="ico-k1" cx="15" cy="6" r="2.2"/><circle class="ico-k2" cx="9" cy="12" r="2.2"/><circle class="ico-k3" cx="16" cy="18" r="2.2"/>',

    // os botões
    foguete: '<g class="ico-rocket"><path d="M12 2.5c3 2.4 4.5 5.8 4.5 9.5l-1.8 3.5H9.3L7.5 12c0-3.7 1.5-7.1 4.5-9.5z"/><circle cx="12" cy="9.5" r="1.8"/><path d="M7.6 12.8L5 15.5v3l4-1.8M16.4 12.8l2.6 2.7v3l-4-1.8"/><path class="ico-flame" d="M10.3 18.5c0 1.6.7 2.4 1.7 3.3 1-.9 1.7-1.7 1.7-3.3"/></g>',
    recomecar: '<path d="M4 12a8 8 0 1 0 2.4-5.7L4 8.5"/><path d="M4 4v4.5h4.5"/>',
    dados: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',

    // o resultado e a pandemia
    barras: '<path d="M3 21h18"/><rect class="ico-b1" x="5" y="12" width="3.5" height="8" rx="1"/><rect class="ico-b2" x="10.25" y="6" width="3.5" height="14" rx="1"/><rect class="ico-b3" x="15.5" y="9" width="3.5" height="11" rx="1"/>',
    cifrao: '<path d="M12 2.5v19"/><path d="M16.5 6.5C15.7 5.2 14 4.5 12 4.5c-2.6 0-4.3 1.3-4.3 3.2 0 4.4 9 2.3 9 7 0 1.9-1.8 3.3-4.7 3.3-2.3 0-4.2-.9-5-2.5"/>',
    camadas: '<path d="M12 3l9 4.5-9 4.5-9-4.5L12 3z"/><path d="M3 12l9 4.5 9-4.5"/><path d="M3 16.5l9 4.5 9-4.5"/>',
    lampada: '<path d="M9.5 18h5M10.5 21h3"/><path d="M12 4a5.5 5.5 0 0 0-3.3 9.9c.5.4.8 1 .8 1.6V16h5v-.5c0-.6.3-1.2.8-1.6A5.5 5.5 0 0 0 12 4z"/><path class="ico-rays" d="M12 .8v.4M4.3 3.8l.4.4M19.7 3.8l-.4.4M1.3 10h.4M22.3 10h.4"/>',
    virus: '<circle cx="12" cy="12" r="5"/><path d="M12 7V4M12 20v-3M7 12H4M20 12h-3M8.5 8.5L6.3 6.3M17.7 17.7l-2.2-2.2M8.5 15.5l-2.2 2.2M17.7 6.3l-2.2 2.2"/><circle cx="12" cy="3" r="1"/><circle cx="12" cy="21" r="1"/><circle cx="3" cy="12" r="1"/><circle cx="21" cy="12" r="1"/><circle cx="5.6" cy="5.6" r="1"/><circle cx="18.4" cy="18.4" r="1"/><circle cx="5.6" cy="18.4" r="1"/><circle cx="18.4" cy="5.6" r="1"/><path d="M10.5 11h.01M13.5 13.5h.01M13 10h.01"/>',
    queda: '<path class="ico-line" pathLength="1" d="M3 7l6 6 4-4 8 8"/><path d="M15 17h6v-6"/>',
    igual: '<path d="M5 9h14M5 15h14"/>'
  };

  // a cor do quadrinho de cada opção vem do tipo dela (o "kind"): emprego em
  // roxo, investimento em azul, negócio próprio em rosa
  var KIND_TONE = {
    salario: "violet",
    comissao: "violet",
    investimento: "blue",
    empreendimento: "pink"
  };

  function svg(name) {
    return '<svg class="ico ico--' + name + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
      (PATHS[name] || "") + "</svg>";
  }

  // o ícone dentro de um quadrinho colorido; extra = classes a mais (tamanho…)
  function tile(name, tone, extra) {
    return '<span class="itile itile--' + (tone || "neutral") + (extra ? " " + extra : "") + '" aria-hidden="true">' +
      svg(name) + "</span>";
  }

  function optionTile(opt, extra) {
    return tile(opt.icon, KIND_TONE[opt.kind], extra);
  }

  // Os ícones fixos do index.html são marcados com data-icon="nome" e
  // desenhados aqui, pra os desenhos ficarem num lugar só.
  function mount(root) {
    Array.prototype.forEach.call((root || document).querySelectorAll("[data-icon]"), function (el) {
      el.innerHTML = svg(el.getAttribute("data-icon"));
      el.setAttribute("aria-hidden", "true");
    });
  }

  global.Icons = {
    svg: svg,
    tile: tile,
    optionTile: optionTile,
    mount: mount
  };
})(window);
