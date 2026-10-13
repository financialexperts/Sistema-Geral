(function (global) {
  "use strict";

  // As 7 fontes de renda que a Laura pode combinar, na ordem da tela.
  //
  // hours: quanto do dia a opção toma, já contando a locomoção (é o que soma
  //   no medidor de horas). hoursLabel é só o texto do cartão.
  // invest: quanto capital a opção exige. Um número é valor fixo (0 = não
  //   exige nada); "ajustavel" quer dizer que a aluna escolhe quanto aplicar,
  //   num controle deslizante que vai até o capital que ainda sobra.
  // estimate: a renda mensal prometida no cartão — [valor] ou [mínimo, máximo].
  //   Nas ajustáveis ela é calculada: "rate" ao mês sobre o valor aplicado.
  // risk: 0 a 3, quantas barrinhas do medidor de risco ficam acesas (0 = sem
  //   medidor).
  // kind: que tipo de fonte é; decide as frases da análise do resultado
  //   (result.js) e a cor do quadrinho do ícone (icons.js).
  // icon: o desenho do quadrinho da opção, no cartão, no resultado e na
  //   pandemia (os nomes estão em frontend/js/icons.js).
  //
  // before / after: a renda real do mês nos primeiros meses e depois da
  //   pandemia. Recebem o valor aplicado (só faz diferença nas ajustáveis).
  //   after pode ser negativo: é quando a opção deu prejuízo.
  // impact: como a opção passou pela pandemia — "manteve", "atencao" ou
  //   "grave". Decide o ícone e a cor da nota que explica o que aconteceu.
  var TAXA_BAIXO_RISCO = 0.004;
  var TAXA_MEDIO_RISCO = 0.015;
  var PERDA_MEDIO_RISCO = 0.05;

  var LIST = [
    {
      id: 1,
      label: "Opção 1",
      title: "Trabalhar 8h/dia na Empresa 1 com salário fixo",
      kind: "salario",
      icon: "predio",
      hours: 10,
      hoursLabel: "8h de trabalho + 2h de locomoção",
      invest: 0,
      estimate: [10000],
      risk: 0,
      before: function () { return 10000; },
      after: function () { return 10000; },
      impact: "manteve",
      note: "Manteve o salário (trabalho remoto ou essencial)."
    },
    {
      id: 2,
      label: "Opção 2",
      title: "Investimento de baixo risco, rendendo 0,4% ao mês",
      kind: "investimento",
      icon: "escudo",
      hours: 0,
      hoursLabel: "Não ocupa horas do dia",
      invest: "ajustavel",
      rate: TAXA_BAIXO_RISCO,
      risk: 1,
      riskLabel: "Risco baixo",
      before: function (v) { return v * TAXA_BAIXO_RISCO; },
      after: function (v) { return v * TAXA_BAIXO_RISCO; },
      impact: "manteve",
      note: "Rendimento mantido (renda fixa)."
    },
    {
      id: 3,
      label: "Opção 3",
      title: "Investimento de médio risco, rendendo 1,5% ao mês (média dos últimos 12 meses)",
      kind: "investimento",
      icon: "grafico",
      hours: 0,
      hoursLabel: "Não ocupa horas do dia",
      invest: "ajustavel",
      rate: TAXA_MEDIO_RISCO,
      risk: 2,
      riskLabel: "Risco médio",
      before: function (v) { return v * TAXA_MEDIO_RISCO; },
      after: function (v) { return -(v * PERDA_MEDIO_RISCO); },
      impact: "atencao",
      note: "Perdeu 5% do capital aplicado."
    },
    {
      id: 4,
      label: "Opção 4",
      title: "Abrir loja própria de bolos (reforma, equipamentos e funcionários)",
      kind: "empreendimento",
      icon: "loja",
      hours: 10,
      hoursLabel: "10h por dia",
      invest: 30000,
      estimate: [10000, 20000],
      risk: 3,
      riskLabel: "Risco alto",
      before: function () { return 25000; },
      after: function () { return 5000; },
      impact: "grave",
      note: "Loja fechada por decreto: queda drástica de receita."
    },
    {
      id: 5,
      label: "Opção 5",
      title: "Trabalhar na Empresa 2 por 4h/dia com salário fixo",
      kind: "salario",
      icon: "maleta",
      hours: 5,
      hoursLabel: "4h de trabalho + 1h de locomoção",
      invest: 0,
      estimate: [4500],
      risk: 0,
      before: function () { return 4500; },
      after: function () { return 4500; },
      impact: "manteve",
      note: "Manteve o salário."
    },
    {
      id: 6,
      label: "Opção 6",
      title: "Trabalhar na Empresa 3 por 4h/dia: fixo de R$ 1.000 + comissão de R$ 2.000 a R$ 6.000",
      kind: "comissao",
      icon: "comissao",
      hours: 5,
      hoursLabel: "4h de trabalho + 1h de locomoção",
      invest: 0,
      estimate: [3000, 7000],
      risk: 2,
      riskLabel: "Risco variável",
      before: function () { return 6500; },
      after: function () { return 3000; },
      impact: "grave",
      note: "A queda nas vendas reduziu as comissões."
    },
    {
      id: 7,
      label: "Opção 7",
      title: "Fazer bolos em casa como renda extra (5h/dia): R$ 10.000 em maquinário + venda pelo Instagram",
      kind: "empreendimento",
      icon: "bolo",
      hours: 5,
      hoursLabel: "5h por dia",
      invest: 10000,
      estimate: [4000, 6000],
      risk: 2,
      riskLabel: "Risco médio",
      before: function () { return 6000; },
      after: function () { return 3000; },
      impact: "atencao",
      note: "A entrega foi afetada, mas o delivery sustentou parte da renda."
    }
  ];

  function byId(id) {
    return LIST.filter(function (o) { return o.id === id; })[0] || null;
  }

  global.IncomeOptions = {
    list: LIST,
    byId: byId
  };
})(window);
