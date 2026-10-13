(function (global) {
  "use strict";

  // O aviso de quando uma escolha não cabe (capital, horas ou combinação).
  // Fica preso no pé da tela, e não no alto da lista, porque quem toca na
  // Opção 7 lá embaixo precisa ver o aviso sem subir a página. Some sozinho
  // depois de alguns segundos, ou no "fechar".
  var TEMPO = 6000;
  var timer = null;

  function el(id) { return document.getElementById(id); }

  function hide() {
    clearTimeout(timer);
    el("toast").hidden = true;
  }

  function show(msg) {
    var toast = el("toast");
    // esconde e mostra de novo pra a animação de entrada repetir quando um
    // aviso chega com outro ainda na tela
    toast.hidden = true;
    void toast.offsetWidth;
    el("toast-text").textContent = msg;
    toast.hidden = false;
    clearTimeout(timer);
    timer = setTimeout(hide, TEMPO);
  }

  function mount() {
    el("toast-close").addEventListener("click", hide);
  }

  global.Toast = {
    mount: mount,
    show: show,
    hide: hide
  };
})(window);
