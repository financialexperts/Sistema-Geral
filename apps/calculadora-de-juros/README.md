# Simulador de Aposentadoria

Três calculadoras simples para planejar a aposentadoria com juros compostos.

> **No portal Financial Experts.** Este sistema roda dentro do portal (a raiz deste repositório), numa moldura, e não tem login próprio: o aluno entra uma vez no portal e chega aqui já com a sessão (`apps/compartilhado/portal.js`). Entrar, criar conta, esqueci a senha, o nome e o botão de sair, a barra do topo e o botão de tema claro/escuro são do portal. O banco é o mesmo de todos os sistemas, configurado em `backend/config/supabase.js`. No portal: **Elas ou Master** → **Calculadora de Juros**. A versão original, com login próprio, continua em `Sistemas/`.

## As calculadoras

1. **Quanto vou ter?** Mostra quanto você acumula poupando um valor por mês.
2. **Quanto preciso poupar?** Mostra quanto guardar por mês para chegar a uma meta.
3. **Quanto posso gastar?** Mostra quanto dá para gastar por mês depois de aposentado, vivendo só dos juros ou usando todo o patrimônio ao longo dos anos.

A taxa padrão é de 0,5% ao mês acima da inflação (cerca de 6,17% ao ano). Você pode mudar a taxa no topo da página.

## Como usar

Entre no portal, abra o curso Elas ou o Master e escolha **Calculadora de Juros**. Não precisa de instalação, mas precisa de internet para a sessão do portal.

## Login

É o do portal. A calculadora só espera a sessão chegar (`frontend/js/session.js`) para aparecer — os cálculos não são salvos no banco. Aberta pelo endereço direto, ela leva para o portal, que pede o login se precisar.

## Estrutura

```
index.html                  página principal: carregando e as calculadoras
frontend/
  css/styles.css            visual
  js/session.js             espera a sessão do portal e mostra a calculadora
  js/app.js                 as três calculadoras, abas e tema (o escolhido no portal)
../compartilhado/           portal.js (sessão, tema, ida ao portal) e supabaseClient.js
backend/                    cálculos financeiros
```

## Aviso

Os valores estão no poder de compra de hoje, porque a taxa já desconta a inflação. É uma ferramenta de estudo, não uma recomendação de investimento.
