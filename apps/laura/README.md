
| As falas do balão da Laura | `FALAS`, no `frontend/js/app.js` |
| O ícone de uma opção | `icon`, no `backend/js/incomeOptions.js` (os desenhos ficam no `frontend/js/icons.js`) |
| A cor do ícone de cada tipo de opção | `KIND_TONE`, no `frontend/js/icons.js` |# Simulador de Renda – Laura

Simulação em que o aluno escolhe como a Laura vai gerar renda, com R$ 30.000 de capital e 10 horas por dia. Ele combina fontes de renda (salário, investimentos, negócio próprio) e vê quanto cada combinação rendeu. Depois, um elemento surpresa mostra o que aconteceu com essa renda na pandemia.

Não tem build, instalação nem banco de dados: é `index.html` + alguns arquivos `.js` e `.css` estáticos, na identidade visual da Financial Experts. Para rodar, basta abrir o `index.html` no navegador (ou publicar a pasta no GitHub Pages).

---

## O caminho do aluno

1. **O ponto de partida.** A Laura abre a tela num cartão com um balão de fala: tocando nela, ela dá um pulinho e diz outra frase. O mesmo cartão mostra o que ela tem: capital, horas por dia e objetivo.

2. **Montar a combinação.** São 7 opções, e cada uma é um cartão que o aluno toca para incluir ou tirar da combinação. Cada cartão tem o ícone da opção, colorido pelo tipo (emprego em roxo, investimento em azul, negócio próprio em rosa), e um "Incluir / Incluída" que diz se ela está na combinação. Os dois investimentos (Opções 2 e 3) têm valor ajustável: um campo em reais e um controle deslizante que vai só até o capital que ainda sobra.

   Enquanto ele escolhe, dois medidores (capital usado e horas usadas) ficam grudados no alto da tela. Quando um deles chega no limite, fica laranja.

3. **Revelar o resultado.** Mostra a renda real dos primeiros meses: o total, o capital e as horas usados, uma linha por fonte de renda e uma análise curta da escolha (diversificada ou concentrada, previsível, passiva, arriscada).

4. **O elemento surpresa.** No pé do resultado há um botão discreto, "Carregar dados complementares". Ele é discreto de propósito, para a pandemia pegar a turma de surpresa. Depois de uma pausa curta, aparece a renda depois da pandemia: o total, quanto caiu e, para cada opção, o antes, o depois e o que aconteceu. A chegada é um susto de propósito: a tela pisca em vermelho, o painel treme e abre como um plantão urgente, com letreiro de notícias correndo.

**Reiniciar simulação** volta tudo ao começo. **Mudar a combinação** depois de revelar esconde o resultado e a pandemia, porque os números da tela deixariam de valer. É só revelar de novo.

---

## As regras de combinação

Tirar uma opção sempre pode. Para incluir, ela precisa passar por todas estas regras, nesta ordem. Quando não passa, aparece um aviso no pé da tela explicando o motivo:

| Regra | Aviso |
| --- | --- |
| Uma opção de dia inteiro (10h) não divide as horas com nenhuma outra atividade | "A Opção 1 ocupa as 10h do dia…" |
| Com uma opção de dia inteiro já escolhida, nada mais que tome horas entra | "Você já tem uma atividade que ocupa todas as 10 horas do dia…" |
| Uma opção que usa o capital inteiro (Opção 4) não combina com nada que exija investimento, nem com um investimento de R$ 0 | "A Opção 4 exige R$ 30.000…" / "A Opção 4 já utiliza todo o capital disponível…" |
| A soma dos investimentos não passa do capital | "Capital insuficiente: ainda cabem R$ …" |
| A soma das horas não passa do dia | "Tempo insuficiente: ainda cabem …h no dia…" |

Os investimentos, que não tomam horas, **combinam com uma opção de dia inteiro** (por exemplo, Opção 1 + Opção 2), seja qual for a ordem em que o aluno toca nelas.

Os valores ajustáveis também têm limite: o campo e o deslizante cortam no capital que sobra. Se o aluno aumenta um investimento, o outro é reduzido se estiver acima do que sobrou.

---

## As opções

Ficam em [`backend/js/incomeOptions.js`](backend/js/incomeOptions.js):

| Opção | Horas/dia | Capital | Renda prometida | Renda real | Depois da pandemia |
| --- | ---: | ---: | --- | ---: | ---: |
| 1. Empresa 1, salário fixo | 10h | — | R$ 10.000 | R$ 10.000 | R$ 10.000 |
| 2. Investimento de baixo risco | 0h | ajustável | 0,4% ao mês | 0,4% do valor | 0,4% do valor |
| 3. Investimento de médio risco | 0h | ajustável | 1,5% ao mês | 1,5% do valor | perde 5% do valor |
| 4. Loja própria de bolos | 10h | R$ 30.000 | R$ 10.000 a R$ 20.000 | R$ 25.000 | R$ 5.000 |
| 5. Empresa 2, salário fixo | 5h | — | R$ 4.500 | R$ 4.500 | R$ 4.500 |
| 6. Empresa 3, fixo + comissão | 5h | — | R$ 3.000 a R$ 7.000 | R$ 6.500 | R$ 3.000 |
| 7. Bolos em casa + Instagram | 5h | R$ 10.000 | R$ 4.000 a R$ 6.000 | R$ 6.000 | R$ 3.000 |

As horas já contam a locomoção (8h de trabalho + 2h de locomoção = 10h, por exemplo). Os investimentos ajustáveis começam em R$ 5.000.

A Opção 3 depois da pandemia fica **negativa**, porque o que era rendimento vira prejuízo. A tela mostra o sinal: −R$ 250,00.

---

## Estrutura de arquivos

```
index.html                      a tela: cenário, opções, resultado e pandemia
frontend/
  css/styles.css                todo o visual (identidade Financial Experts)
  img/                          logos, favicon e a Laura (laura.webp, já sem
                                fundo; Laura.jpg é a original)
  js/format.js                  formatação de dinheiro e leitura do que foi digitado
  js/icons.js                   os desenhos dos ícones e o quadrinho colorido de cada opção
  js/simulation.js              o estado da simulação e as regras de combinação
  js/toast.js                   o aviso de quando uma escolha não cabe
  js/options.js                 os cartões das opções, os valores ajustáveis e os medidores
  js/result.js                  o resultado dos primeiros meses e a análise da escolha
  js/pandemic.js                o elemento surpresa: a renda depois da pandemia
  js/app.js                     tema claro/escuro, a Laura, as animações dos ícones,
                                botões principais, liga tudo
backend/
  js/scenario.js                o ponto de partida da Laura: capital, horas e objetivo
  js/incomeOptions.js           as 7 opções, com a renda antes e depois da pandemia
```

Os ícones de todas as partes da tela se mexem quando o mouse passa, quando o aluno toca neles ou quando recebem o foco do teclado. No celular, só um toque de verdade anima: passar o dedo para rolar a página não mexe em nada. Quem pede menos movimento no sistema operacional não vê animação nenhuma.

Os dois arquivos em `backend/js/` não tocam no DOM: são só dados. O `simulation.js` também não. É ele que guarda o que foi escolhido e aplica as regras, e as telas só leem dele.

---

## Onde mexer para mudar cada coisa

| Para mudar… | Edite |
| --- | --- |
| O capital, as horas por dia, o objetivo ou o valor inicial dos investimentos | `backend/js/scenario.js` |
| Texto, horas, capital, renda ou o que acontece na pandemia de uma opção | `backend/js/incomeOptions.js` |
| As frases da análise do resultado | `INSIGHTS`, no `frontend/js/result.js` |
| As regras de combinação e os avisos | `toggle()`, no `frontend/js/simulation.js` |
| Os textos fixos da tela (títulos, rodapé) | `index.html` |
| Cores, tamanhos e o visual | `frontend/css/styles.css` |

Os avisos e os medidores leem o capital e as horas de `scenario.js`: mudando lá, os textos acompanham.

Cada opção tem um `kind` (`salario`, `investimento`, `empreendimento` ou `comissao`) que decide as frases da análise e a cor do ícone, e um `impact` (`manteve`, `atencao` ou `grave`) que decide o ícone e a cor da nota na pandemia.

---

## O que fica guardado no navegador

Só a escolha de tema claro ou escuro, no `localStorage`. A simulação não é salva: recarregar a página começa do zero.
