(function () {
  "use strict";

  var S = window.Scenario;
  var Format = window.Format;
  var Sim = window.Simulation;
  var Toast = window.Toast;

  /* ============ tema ============ */
  var root = document.documentElement;
  var metaTheme = document.getElementById("meta-theme-color");
  function syncThemeColor() {
    if (!metaTheme) return;
    metaTheme.setAttribute("content", root.getAttribute("data-theme") === "dark" ? "#171435" : "#F7F7FA");
  }
  var stored = null;
  try { stored = localStorage.getItem("tema"); } catch (err) { stored = null; }
  if (stored === "dark" || stored === "light") {
    root.setAttribute("data-theme", stored);
  } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    root.setAttribute("data-theme", "dark");
  }
  syncThemeColor();
  document.getElementById("tema").addEventListener("click", function () {
    var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    syncThemeColor();
    try { localStorage.setItem("tema", next); } catch (err) {}
  });

  /* ============ liquid glass: brilho que segue o ponteiro ============ */
  document.addEventListener("pointermove", function (e) {
    var el = e.target.closest && e.target.closest(".glass");
    if (!el) return;
    var r = el.getBoundingClientRect();
    el.style.setProperty("--gx", ((e.clientX - r.left) / r.width * 100) + "%");
    el.style.setProperty("--gy", ((e.clientY - r.top) / r.height * 100) + "%");
  });

  /* ============ ícones animados ============ */
  // Tudo o que tem a classe .fx anima o próprio ícone quando o mouse entra,
  // quando é tocado (no celular não existe "passar o mouse") ou quando recebe
  // o foco do teclado. A animação de cada ícone está no styles.css; aqui só
  // se liga e desliga o .is-poked que dispara ela.
  //
  // No toque, a animação sai quando o dedo levanta (pointerup), e não quando
  // encosta: se o dedo encostou pra rolar a página, o navegador cancela o
  // toque (pointercancel), o pointerup não vem e nada chacoalha no caminho.
  var semAnimacao = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  window.Icons.mount(document);

  function cutucar(el) {
    if (!el || el.classList.contains("is-poked")) return;
    el.classList.add("is-poked");
    setTimeout(function () { el.classList.remove("is-poked"); }, 900);
  }
  function fxDe(e) { return e.target.closest && e.target.closest(".fx"); }

  document.addEventListener("pointerover", function (e) {
    if (e.pointerType !== "mouse") return;
    var el = fxDe(e);
    // só quando o mouse entra de fora, não a cada filho por onde ele passa
    if (el && !(e.relatedTarget && el.contains(e.relatedTarget))) cutucar(el);
  });
  document.addEventListener("pointerdown", function (e) {
    if (e.pointerType === "mouse") cutucar(fxDe(e));
  });
  document.addEventListener("pointerup", function (e) {
    if (e.pointerType !== "mouse") cutucar(fxDe(e));
  });
  document.addEventListener("focusin", function (e) { cutucar(fxDe(e)); });

  /* ============ a Laura ============ */
  // Tocar na Laura faz ela dar um pulinho e dizer a próxima frase do balão.
  var FALAS = [
    "Oi! Eu sou a " + S.person + ". Me ajude a escolher?",
    "Tenho " + Format.compactMoney(S.capital) + " e " + S.hours + " horas por dia.",
    "Dá pra juntar mais de uma opção!",
    "Mas o dinheiro e as horas têm limite, hein?"
  ];
  var fala = 0;
  var laura = document.getElementById("laura");
  var balao = document.getElementById("laura-bubble");
  var balaoTexto = document.getElementById("laura-fala");

  balaoTexto.textContent = FALAS[0];
  laura.addEventListener("click", function () {
    fala = (fala + 1) % FALAS.length;
    balaoTexto.textContent = FALAS[fala];
    // o "toque em mim" já cumpriu o papel depois do primeiro toque
    balao.classList.add("is-known");
    // tira e põe a classe pra a animação repetir a cada toque
    [laura, balao].forEach(function (el) {
      el.classList.remove("is-talking");
      void el.offsetWidth;
      el.classList.add("is-talking");
    });
  });

  /* ============ o ponto de partida ============ */
  document.getElementById("sc-capital").textContent = Format.compactMoney(S.capital);
  document.getElementById("sc-hours").textContent = S.hours + " horas";
  document.getElementById("sc-goal").textContent = S.goal;

  /* ============ navegação ============ */

  // leva a tela até a parte que acabou de aparecer (o scroll-margin-top do
  // CSS desconta a barra do topo) e põe o foco nela, pra o leitor de tela
  // anunciar e o próximo Tab já continuar lá dentro
  function irPara(secao) {
    secao.scrollIntoView({ behavior: semAnimacao ? "auto" : "smooth", block: "start" });
    secao.focus({ preventScroll: true });
  }

  // a combinação mudou: o resultado que estava na tela não vale mais
  function combinacaoMudou() {
    window.ResultView.hide();
    window.PandemicView.reset();
  }

  Toast.mount();
  window.OptionsView.mount(document.getElementById("options"), combinacaoMudou);
  window.PandemicView.mount(irPara);

  document.getElementById("btn-reveal").addEventListener("click", function () {
    if (!Sim.chosen().length) {
      Toast.show("Selecione ao menos uma opção para continuar.");
      return;
    }
    Toast.hide();
    window.PandemicView.reset();
    window.ResultView.show();
    irPara(document.getElementById("sec-result"));
  });

  document.getElementById("btn-reset").addEventListener("click", function () {
    Sim.reset();
    window.OptionsView.sync();
    combinacaoMudou();
    Toast.hide();
    window.scrollTo({ top: 0, behavior: semAnimacao ? "auto" : "smooth" });
  });
})();
