# Portal Financial Experts

Os sistemas dos cursos da Financial Experts num lugar só, com **um login só**. O aluno entra uma vez, escolhe o curso e abre os sistemas dele — sem entrar de novo em cada um. Todos usam o mesmo banco (Supabase) e as mesmas contas de sempre: quem já entrava no Fluxo de Caixa ou nas calculadoras entra aqui com o mesmo e-mail e senha.

| Curso | Sistemas |
|---|---|
| **Evolution** (Financial Evolution) | Fluxo de Caixa · Laura (simulador de renda) · Vanessa e Karine (escolhas + Seu dinheiro no tempo) |
| **Elas** (Finanças para Elas) | Calculadora de Juros · Calculadora Financeira · Carteira de Investimentos |
| **Master** (Financial Master) | Calculadora de Juros · Calculadora Financeira · Carteira de Investimentos |

## O que tem

- **Acesso:** entrar, criar conta (nome completo, e-mail e senha), "Esqueci minha senha" e a senha nova pelo link do e-mail. As contas são as do Supabase de todos os sistemas.
- **Início:** um portal por curso, com a arte animada feita da logo dele — o neon do Evolution, a aurora verde-água do Elas e o "M" do Master, cujas peças se encaixam sob o mouse. O portal sob o mouse sobe, se inclina na direção do ponteiro e mostra os sistemas do curso. Embaixo, "Continuar de onde parou" leva ao último sistema aberto.
- **Página do curso:** o banner com a logo e um cartão por sistema, com o resumo do aluno naquele sistema quando há (ex.: "Planilha pronta até set. de 2027", "Seu perfil: Moderado").
- **Sistema aberto:** o sistema roda numa moldura, ocupando a tela. No cabeçalho: voltar, o curso, as abas das atividades (quando o sistema tem mais de uma), recarregar, o tema claro/escuro dos sistemas e a conta.
- **Barra lateral:** os cursos, e os sistemas do curso aberto logo abaixo dele, para pular de um para outro.
- **Endereços de verdade:** `?curso=evolution`, `?curso=evolution&sistema=fluxo-de-caixa`… Voltar, recarregar e abrir em outra aba funcionam como num site comum. O endereço antigo de um sistema (`apps/fluxo-de-caixa/`) leva para ele dentro do portal.

O visual segue o padrão da Gestão de Reuniões (`Padrão design/`): claro, no estilo Apple, com a fonte do sistema e o azul de ação. As cores de cada curso são as da logo dele.

## Como rodar

Precisa do Node.js 18 ou mais novo (ou da extensão Live Server do VS Code).

```
npm start
```

Abra <http://localhost:5500>. Abrir o `index.html` direto do disco não funciona: os módulos JavaScript precisam ser servidos por HTTP.

Não há dependências nem passo de build. Para publicar, suba a raiz como site estático (Vercel, Netlify, GitHub Pages…). As pastas `Sistemas/` e `Padrão design/` não são usadas pelo portal.

> **GitHub Pages:** neste repositório, `Sistemas/` e `Padrão design/` são referências a outros repositórios (gitlinks, sem `.gitmodules`), e o build do GitHub Pages costuma falhar com isso. Se acontecer, tire essas referências do repositório (`git rm --cached`) ou publique só os arquivos do portal.

## Antes de publicar: o endereço no Supabase

Os links que o Supabase manda por e-mail (trocar a senha, confirmar a conta) voltam para o portal — mas **o Supabase só respeita o endereço se ele estiver na lista de permitidos**; senão, manda para a *Site URL* do projeto. Em **Supabase → Authentication → URL Configuration**:

- **Redirect URLs:** o endereço publicado do portal com `/**` no fim (ex.: `https://financialexperts.github.io/Sistema-Geral/**`) e, para desenvolvimento, `http://localhost:5500/**` e `http://127.0.0.1:5500/**`.
- **Site URL:** vale trocar para o endereço do portal, que agora é a porta de entrada.

Mudar a configuração não conserta e-mails já enviados: é preciso pedir um link novo.

## Como adicionar um sistema

1. **Copie a pasta** do sistema para `apps/<id>/` (o `id` em minúsculas e com hífens, ex.: `apps/orcamento-familiar/`).
2. **Ligue o sistema ao portal.** No `<head>` de cada página dele, antes de qualquer outro script:
   ```html
   <script src="../compartilhado/portal.js" data-sistema="orcamento-familiar"></script>
   ```
   (com `data-pagina="…"` também, se ele tiver mais de uma página).
3. **Se ele usa o banco**, troque o `config.js` e o `supabaseClient.js` próprios pelos do portal, no fim do `<body>`:
   ```html
   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.112.4/dist/umd/supabase.min.js" integrity="sha384-yiVMs0R/Jyz7OhoXa/DsEMUSBLjEhr/QJta2ONO+zB6I8/GmNg/7AUFrZmAJV7KV" crossorigin="anonymous"></script>
   <script src="../../backend/config/supabase.js"></script>
   <script src="../compartilhado/supabaseClient.js"></script>
   ```
   e o `window.DB.client` funciona como antes, já com a sessão do aluno.
4. **Tire o login dele:** apague a tela de entrar/criar conta, o botão de sair e a barra do topo (o portal mostra o nome, a conta e o tema). Onde ele decidia pela sessão, use:
   ```js
   window.FEPortal.comSessao(window.DB.client, function (sessao) {
     // começa o sistema com sessao.user (id, email, user_metadata.full_name)
   });
   ```
   Sem sessão (saiu, expirou), o portal mostra o login sozinho. O tema claro/escuro chega pela chave `tema` do navegador (o `portal.js` aplica o `data-theme` no `<html>`).
5. **Cadastre no catálogo**, em [`backend/config/catalogo.js`](backend/config/catalogo.js): um item em `SISTEMAS` (nome, descrição, ícone, endereço) e o `id` na lista `sistemas` de cada curso onde ele deve aparecer, na ordem desejada. Opcional: `resumo(perfil)` para mostrar uma linha sobre o aluno no cartão, `paginas` para várias atividades e `temaEscuro: true` para o botão de tema.
6. **Ícone:** escolha um dos de [`frontend/features/sistemas/icones.js`](frontend/features/sistemas/icones.js) ou desenhe um novo lá (SVG 24 × 24, só traço). Sem ícone, entra um genérico.

Se algo no catálogo não bater (um curso que lista um sistema que não existe, uma cor faltando), o console do navegador avisa ao abrir o portal.

## Como adicionar um curso

Um item em `CURSOS`, no mesmo [`catalogo.js`](backend/config/catalogo.js): nome, nome completo, descrição, a logo (em `frontend/img/cursos/`, PNG sem fundo e recortado), as cores da logo, o tom do fundo (`escuro` ou `claro`), a arte (`neon`, `aurora` ou `geometria` — as cores são as do curso) e a lista de sistemas. Ele aparece sozinho no início, na barra lateral e nas rotas. Uma arte nova se desenha em [`frontend/styles/arte.css`](frontend/styles/arte.css) e [`frontend/features/cursos/aparencia.js`](frontend/features/cursos/aparencia.js).

## Estrutura

```
index.html                    telas (abertura, acesso e portal) e os ícones
servidor.mjs                  servidor local de desenvolvimento (npm start)
backend/
  config/supabase.js          URL e chave do Supabase: o banco de TODOS os sistemas (portal e apps/)
  config/catalogo.js          os cursos e os sistemas de cada um ← é aqui que entra sistema novo
  domain/catalogo.js          consultas ao catálogo e a conferência dele
  api/                        supabaseClient.js e perfilRepo.js (a linha do aluno em profiles)
frontend/
  main.js                     liga as telas, decide entre o acesso e o portal e mostra a tela do endereço
  features/auth/              entrar, criar conta, "Esqueci minha senha", senha nova
  features/app/               estrutura (shell.js), barra lateral (navegacao.js) e endereços (rotas.js)
  features/inicio/            o início: cumprimento, portais dos cursos e "Continuar"
  features/curso/             a página do curso: banner e cartões dos sistemas
  features/sistema/           o sistema aberto: moldura, abas das atividades, tema
  features/cursos/            aparência de cada curso (cores e arte animada)
  features/sistemas/          ícones dos sistemas e o último sistema aberto
  features/avisos/            aviso de cookies (LGPD)
  shared/, state/             utilitários (abas, estados vazios) e estado da aba aberta
  styles/                     tokens.css → base → auth / app / arte / inicio / curso / sistema
  img/                        logo Financial Experts, favicon e logos dos cursos
apps/
  compartilhado/portal.js     liga cada sistema ao portal (sessão, tema, ida ao portal)
  compartilhado/supabaseClient.js   o cliente do Supabase dos sistemas
  fluxo-de-caixa/  laura/  vanessa-e-karine/
  calculadora-de-juros/  calculadora-financeira/  carteira-de-investimentos/
```

## Como os sistemas entraram no portal

Cada sistema em `apps/` é uma cópia do original em `Sistemas/` (que **não foi alterado** e continua com o próprio repositório). Nas cópias:

- saíram a tela de login/criar conta, o "Esqueci minha senha", o nome com o botão Sair e a barra do topo; quem decide pela sessão agora é `FEPortal.comSessao` (a sessão do portal);
- o botão de tema claro/escuro foi para o cabeçalho do portal (a escolha continua na chave `tema` e vale para todos); dentro do portal, os sistemas abrem claros até a pessoa escolher o escuro;
- as abas "Vanessa e Karine | Seu dinheiro no tempo" foram para o cabeçalho do portal (as `paginas` do sistema no catálogo);
- o aviso de cookies da Carteira foi para o portal (mesmo cookie, `aviso_cookies`);
- o banco vem de `backend/config/supabase.js` e a biblioteca do Supabase ficou numa versão fixa, com hash de integridade;
- os elementos que grudavam embaixo da barra do topo (medidores da Laura e de Vanessa e Karine, atalhos da Carteira) agora grudam no alto da moldura.

O resto — cálculos, telas, regras, tabelas e o que cada um grava — é o mesmo. A Laura não usava login nem banco; no portal, ela só passa a exigir que quem abre seja um aluno logado.

## Dados usados

| Onde | O quê | Para quê |
|---|---|---|
| `profiles` (Supabase) | a linha do aluno: `full_name`, `onboarding_completed`, `plan_end_month`, `investor_profile` | o nome do cumprimento e da conta e os resumos dos cartões (só leitura; o "Criar conta" grava o `full_name`, como os sistemas sempre fizeram) |
| `localStorage` | `fe-portal:ultimo:<id do aluno>` | o último sistema aberto ("Continuar de onde parou") |
| `localStorage` | `fe-portal:barra-lateral-oculta` | a barra lateral escondida |
| `localStorage` | `tema` | o tema claro/escuro dos sistemas (a mesma chave de antes) |
| `sessionStorage` | `fe-portal:recuperacao-pendente` | segura a tela de senha nova se a página recarregar no meio |
| cookie | `aviso_cookies` | o aviso de cookies já foi visto |

Os dados de cada sistema (planilha, carteira, ranking do jogo…) continuam nas mesmas tabelas, e cada aluno só vê os próprios: quem protege é o RLS do banco.

## Bom saber

- **Fluidez:** as animações do portal mexem só em `transform` e `opacity` (a placa de vídeo anima sem redesenhar a tela). Sombras e brilhos mais fortes são camadas prontas que só acendem, e as capas dos cartões ficam paradas até o mouse passar. Quem pede menos movimento no sistema operacional vê tudo parado.
- **Aparência:** o portal é sempre claro, mesmo com o Windows/macOS no modo escuro (como a Gestão de Reuniões). Só os sistemas, dentro da moldura, têm o tema escuro, pelo botão do cabeçalho.
- **Sair:** a moldura do sistema é descartada junto, então num computador compartilhado nada do aluno anterior fica na tela. Sair em outra aba (ou a sessão expirar) também leva todas as abas para o login.
