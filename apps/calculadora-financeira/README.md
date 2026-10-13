# Calculadora Financeira — 5 funções

As cinco funções da planilha `Calculadora Financeira.xlsx`, cada uma com seu próprio painel no seletor do topo. Sem build: é `index.html` + a sessão do portal.

Segue o mesmo padrão visual do *Simulador de Aposentadoria*, mas enxuto: um seletor, só os campos da calculadora, e embaixo o resultado em escala grande com a linha de cores.

> **No portal Financial Experts.** Este sistema roda dentro do portal (a raiz deste repositório), numa moldura, e não tem login próprio: o aluno entra uma vez no portal e chega aqui já com a sessão (`apps/compartilhado/portal.js`). Entrar, criar conta, esqueci a senha, o nome e o botão de sair, a barra do topo e o botão de tema claro/escuro são do portal. O banco é o mesmo de todos os sistemas, configurado em `backend/config/supabase.js`. No portal: **Elas ou Master** → **Calculadora Financeira**. A versão original, com login próprio, continua em `Sistemas/`.

## Login

É o do portal: a calculadora só espera a sessão chegar (`frontend/js/session.js`) para aparecer, e não grava nada no banco. Aberta pelo endereço direto, ela leva para o portal, que pede o login se precisar.

## As cinco calculadoras

Todas saem da mesma igualdade — juros compostos com depósito no fim de cada período (série postecipada):

```
VF = VP·(1+i)^n + PMT · [((1+i)^n − 1) / i]
```

Cada calculadora isola uma das cinco variáveis:

| # | Resolve | Entradas | Função equivalente no Excel |
|---|---------|----------|-----------------------------|
| 01 | Parcela (`PMT`) | taxa, períodos, valor inicial (opc.), valor final | `PGTO` / `PMT` |
| 02 | Valor final (`VF`) | taxa, períodos, valor inicial (opc.), parcela | `VF` / `FV` |
| 03 | Valor inicial (`VP`) | taxa, períodos, parcela (opc.), valor final | `VP` / `PV` |
| 04 | Taxa de juros (`i`) | períodos, valor final, valor inicial (opc.), parcela (opc.) | `TAXA` / `RATE` |
| 05 | Número de períodos (`n`) | taxa, valor final, valor inicial (opc.), parcela | `NPER` |

- `i` = taxa por período
- `n` = número de períodos
- A taxa 04 é resolvida por bisseção, porque não tem fórmula fechada. `f(i) = VF(i) − VF_alvo` é crescente em `i` quando o valor inicial e a parcela são positivos, então a bisseção converge sempre, sem chute inicial.

## Convenção de sinais

A planilha usa a convenção do Excel, em que dinheiro que sai é negativo — por isso as células têm `-250000`, `-359`, `-4000`. **Aqui todos os valores entram positivos.** Valor inicial e parcela são o dinheiro que você põe; valor final é o que você tem no fim. É a leitura direta, sem sinal para o usuário decorar.

Quando o resultado "dá negativo" na matemática, a calculadora explica em vez de mostrar um número negativo:

- **01** — se o valor inicial sozinho já ultrapassa a meta, o painel muda para *"Não é preciso depositar nada"* e mostra quanto dá para **retirar** por período.
- **03** — se os depósitos sozinhos já passam do valor final, mostra *"Não é preciso valor inicial"*.
- **05** — se o valor final nunca é alcançado, mostra *"Prazo impossível"*.

## Conferência com a planilha

Rodando os mesmos números das células:

| Calculadora | Entradas | Resultado | Planilha |
|-------------|----------|-----------|----------|
| 01 Parcela | 0,62 % · 240 · R$ 250.000 · R$ 1.000.000 | R$ 185,54 (a retirar) | 185,5371 |
| 02 Valor final | 0,5 % · 60 · R$ 100.000 · R$ 200 | R$ 148.839,02 | 148.839,0214 |
| 03 Valor inicial | 0,8 % · 12 · R$ 359 · R$ 1.000.000 | R$ 904.718,98 | 904.718,9804 |
| 05 N.º de períodos | 0,5 % · R$ 0 · R$ 4.000 · R$ 1.000.000 | 162,59 períodos | 162,5911713 |

**A calculadora 04 é a única que difere da planilha**, e de propósito. A célula `RATE(C13,C16,C15,C14,,1%)` mistura sinais (`VP = −10.000`, `PMT = +500`, `VF = +20.000`), ou seja, trata a parcela como dinheiro *saindo* enquanto o valor inicial entra — daí os 9,7477 % por período. Com a convenção única daqui (os R$ 10.000 e as 12 parcelas de R$ 500 são tudo dinheiro que você põe, somando R$ 16.000 para virar R$ 20.000), a taxa é **2,322 % por período**. Conferido pela volta: `VF(2,322 %, 12, 10.000, 500) = 20.000,00` exato.

## A linha de cores

O bloco de resultado tem uma faixa colorida no topo e uma barra embaixo do número — as duas mostram a mesma divisão, com as mesmas duas cores nas cinco calculadoras:

- 🟩 **verde** — o dinheiro que saiu do seu bolso (`valor inicial + parcela × períodos`)
- 🟧 **laranja** — o que os juros produziram (`valor final − o que é seu`)

Quando o resultado é um dos casos explicativos acima, a barra some e o card inteiro vira laranja.

## Estrutura de arquivos

```
index.html                 carregando e a marcação das 5 calculadoras e do seletor
frontend/
  css/styles.css           todo o estilo visual
  js/format.js             formatação de número/moeda e parsing de input
  js/app.js                validação, eventos, abas, tema — liga as calculadoras à página
  js/session.js            espera a sessão do portal e mostra a calculadora
  img/                     favicon
../compartilhado/          portal.js (sessão, tema, ida ao portal) e supabaseClient.js
backend/
  js/finance.js            as 5 funções puras (sem DOM)
```

Os scripts carregam em ordem (`portal.js` no `<head>`; depois `finance.js` → `backend/config/supabase.js` do portal → `supabaseClient.js` → `format.js` → `app.js` → `session.js`) como globais simples (`FEPortal`, `Finance`, `Format`, `DB`), sem bundler. `finance.js` não depende de nada — dá para reaproveitar em Node ou em outro front-end.

## Detalhes técnicos

- HTML + CSS + JavaScript puro, sem build nem framework (o `supabase-js` vem do CDN).
- Entrada aceita formato brasileiro (`1.500,50`) e também `1500.50`.
- Calcula enquanto você digita; `Calcular` força a validação de todos os campos.
- Validação de campos, mensagens de erro com `role="alert"`, navegação por teclado no seletor (setas ← →).
- Tema claro/escuro (o botão fica no cabeçalho do portal; a escolha vale para todos os sistemas).
- Responsivo de 320px até desktop; respeita `prefers-reduced-motion`.

## Aviso

É um modelo de estudo, não é recomendação de investimento.
