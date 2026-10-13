(function (global) {
  "use strict";

  // O ponto de partida da Laura: quanto ela tem para investir e quantas horas
  // do dia pode dedicar a gerar renda. Tudo o que for escolhido na simulação
  // tem que caber nesses dois limites — e os textos da tela (o cartão do
  // cenário, os medidores e os avisos) saem daqui, então basta mudar aqui.
  global.Scenario = {
    person: "Laura",
    capital: 30000,
    hours: 10,
    goal: "Maximizar renda",

    // valor com que os investimentos ajustáveis começam (e voltam ao reiniciar)
    defaultInvest: 5000,
    // de quanto em quanto o controle deslizante anda
    investStep: 500
  };
})(window);
