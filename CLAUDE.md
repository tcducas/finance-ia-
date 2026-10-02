# CLAUDE.md — Aura Finance
 
Contexto do projeto para o Claude Code. Leia antes de gerar ou alterar código.
Alinhado ao Documento de Evolução v0.4.
 
## O que é
 
Aura Finance é um **copiloto financeiro inteligente**: acompanha a vida financeira do usuário (movimentações, orçamento, patrimônio, metas), mostra o mercado ao vivo e usa IA para **direcionar** onde investir. Evolução de um consultor de investimentos (Beta 0.1.0) para a visão de copiloto (v0.4).
 
Princípio central: o app **direciona, não executa**. Ele analisa, explica e sugere; quem aplica é o usuário, na corretora dele. O Aura nunca envia ordem de compra nem opera a conta.
 
Projeto de portfólio. Prioridade: código limpo, tipado e coerente com as convenções abaixo.
 
## Stack
 
- **Frontend:** React 19 + Vite, TypeScript, TailwindCSS, Recharts, Lucide.
- **Backend:** Express + tsx, TypeScript. Monorepo (npm workspaces) servindo client e server na porta 3000.
- **Banco:** Supabase (PostgreSQL) com RLS. Auth via Supabase + JWT.
- **IA:** híbrida — Google Gemini + Claude (API Anthropic), roteadas por um `AiRouter`.
## Navegação
 
Consolidada em **4 destinos principais** + copiloto e botão global (menos itens = mais fácil de navegar):
 
1. **Minha Carteira** — a HOME após login. Lista de movimentações (entradas/saídas, com adicionar/remover) à esquerda; gráfico de gastos por categoria à direita. Ao adicionar/remover, totais e gráfico recalculam na hora.
2. **Gastos** — orçamento por categoria, com análise e alertas.
3. **Planejamento** — metas, projeções, score.
4. **Investimentos** — carteira, mercado (monitor + detalhe do ativo), montar/importar.
Os boards de mercado ficam num grupo **"Mercados"** no menu, abaixo dos destinos principais:
Investimentos (panorama), Ações B3, Cripto e Internacional — cada um com rota própria. No mobile a
barra inferior mostra os 3 destinos + um atalho "Mercados".

Persistentes em qualquer tela: **Copiloto** (drawer pela direita) e **botão "+" global** (lançar movimentação). Perfil e Admin ficam no rodapé. No mobile, o menu lateral vira barra inferior.
 
Nomenclatura: **"Minha Carteira"** é a carteira financeira do mês (entradas/saídas). A carteira de investimentos chama-se **"Investimentos"** — nunca "carteira" sozinho, para não confundir.

### Mapa de telas

Rotas centralizadas em `client/src/App.tsx`. Cada arquivo em `client/src/pages/` tem um header no topo
(`Tela / Menu / o que faz`) — abra o arquivo para confirmar; esta tabela é o atalho.

| Tela | Arquivo | Rota | Menu |
|---|---|---|---|
| Landing | `pages/LandingPage.tsx` | `/` | — (pública) |
| Login/Cadastro | `pages/LoginPage.tsx` | `/login` | — (pública) |
| Onboarding | `pages/OnboardingPage.tsx` | `/onboarding` | — (pública) |
| Minha Carteira (HOME) | `pages/CarteiraPage.tsx` | `/app` | 1º item |
| Gastos | `pages/OrcamentoPage.tsx` | `/app/gastos` | 2º item |
| Planejamento | `pages/PlanejamentoPage.tsx` | `/app/planejamento` | 3º item |
| Investimentos (panorama) | `pages/MercadoPage.tsx` | `/app/investimentos` | grupo Mercados |
| Detalhe do ativo | `pages/AtivoDetalhePage.tsx` | `/app/investimentos/:ticker` | sub-rota de Investimentos |
| Ações B3 (board) | `pages/AcoesB3Page.tsx` | `/app/acoes` | grupo Mercados |
| Cripto (board) | `pages/CriptoPage.tsx` | `/app/cripto` | grupo Mercados |
| Internacional (board) | `pages/InternacionalPage.tsx` | `/app/internacional` | grupo Mercados |
| Perfil | `pages/PerfilPage.tsx` | `/app/perfil` | rodapé |
| Planos | `pages/PlanoPage.tsx` | `/app/plano` | rodapé |
| Admin | `pages/AdminPage.tsx` | `/app/admin` | rodapé (só is_admin) |

Toda tela nova: registrar a rota em `App.tsx`, adicionar o header padrão no topo do arquivo da página
e uma linha nesta tabela — nessa ordem, sempre os três juntos.

## Estrutura
 
```
client/   # React 19 + Vite  (pages, components, layouts, hooks, services, lib, types)
server/   # Express + tsx     (routes, controllers, services, middlewares, schemas, ai, lib, errors)
supabase/migrations/          # YYYYMMDDHHMMSS_*.sql
```
 
Camadas do backend: `routes -> controllers -> services -> lib`. O controller nunca contém regra de negócio; o service nunca conhece `req`/`res`. O layout do app (menu + topbar + drawer) é o `MainLayout` no client.
 
## Interface e design

- **Cor é intocável sem pedido explícito.** `client/src/styles/tokens.css` é a fonte da verdade:
  acento dourado único, creme/escuro, paleta `--chart-*` validada para CVD. Não introduzir hue novo.
- **Duas fontes, papéis separados:** `--font-sans` (Inter) em toda a UI e `--font-display`
  (Archivo) só em título — landing, login e o `<h2>` de cada tela. Não trocar a de corpo.
- **Nunca inventar prova social.** Sem depoimento, contagem de usuários, logo de parceiro ou nota
  de loja. O projeto não tem usuários reais; a credibilidade vem de afirmação verificável no
  código (RLS, contrato de anonimização, chave só no servidor, não executa ordem).
- **Landing**: herói com recorte REAL do produto em SVG/CSS (nunca Recharts — a landing não carrega
  biblioteca de gráfico) + recursos em **bento grid** (células de tamanhos diferentes, uma ideia por
  bloco, acento em um bloco só). Segue as referências do banco do usuário em
  `referencias-design/Bento-Grid.md`.
- **Animação parte do estado visível.** `.reveal` usa `animation-timeline: view()` dentro de
  `@supports`; sem suporte o elemento já está visível. Nada de `opacity: 0` esperando observer.
- **Carregamento** usa `components/ui/Skeleton.tsx`, nunca `animate-pulse` solto.
- **Largura das telas**: `max-w-6xl` para tela de dados, `max-w-7xl` para os boards (gráfico + livro
  lado a lado), `max-w-3xl` para formulário longo (Perfil) — campo largo não se lê.
- **Rotas de `/app/*` entram por `React.lazy`** (`client/src/App.tsx`); as públicas são estáticas.
  Vendors em `manualChunks` no `client/vite.config.ts`. Sem isso a landing baixava o app inteiro.

## Convenções de código (obrigatórias)
 
- **TypeScript estrito.** Sem `any` implícito.
- **Validação com Zod** em todo boundary de entrada; tipos derivados com `z.infer`.
- **Tipos do banco** gerados do Supabase (`supabase gen types typescript`) e importados; não declarar interfaces paralelas ao schema.
- **Erros** passam por um `errorHandler` central; resposta padrão: sucesso `{ data }`, erro `{ error: { message, code } }`.
- **Segredos** só via `process.env` (validado no boot). Nunca literal, nunca versionado.
- **Nada de PII em log.**
## Banco e RLS
 
- Toda tabela nova nasce com `ENABLE ROW LEVEL SECURITY` + policy por operação. Regra base: `auth.uid() = user_id`.
- Uma mudança lógica por migration, nome versionado.
- Tabelas novas: `transactions`, `budgets`, `assets`, `goals`, `ai_conversations`, `ai_messages`, `watchlist`.
- Metas (`goals`): `annual_rate` é **decimal** (0.105 = 10,5% a.a.), nunca percentual — o schema rejeita > 1.
- `profiles.plan` (`free`|`pro`) + `plan_updated_at`; `ai_usage` guarda a cota consumida de IA
  (sem policy de escrita — só a service role incrementa).
- `holdings`: posições da carteira de INVESTIMENTOS (ticker, quantidade, preço médio, data de
  aporte, proventos). Distinta de `assets`, que é foto de patrimônio por classe. Sem `acquired_on`
  não há TIR nem payback — a UI avisa em vez de inventar.
- `patrimonio_snapshots`: foto mensal do patrimônio (`asset_class = 'total'` + uma linha por classe).
  O gráfico de evolução combina snapshot (medido) com fluxo de caixa acumulado (derivado) e marca
  a origem de cada ponto — nunca apresentar derivado como medido.
- Admin é a coluna `is_admin` em `profiles` — nunca cravar e-mail de admin no código; o guard `requireAdmin` lê a flag.
## IA — Gemini + Claude
 
- **Análise estruturada** (tool use, JSON validado com Zod) via `ANALYZE_PROVIDER`: **Groq/Llama** (grátis, default) ou **Claude**. Cobre análise de carteira com contexto de mercado, rebalanceamento, direcionamento de aporte, análise de carteira importada.
- **Gemini**: chat conversacional, explicações de ativos/conceitos, insights rápidos.
- Um `AiRouter` no backend decide o provedor por tarefa (chat → Gemini; análise → `ANALYZE_PROVIDER`). **Ambos recebem dados já anonimizados.**
- **Consultor / direcionamento:** o usuário informa o aporte do mês; a IA sugere onde alocar conforme perfil + mercado do dia, com a justificativa. Também responde "vale a pena comprar X?". Sempre educativo.
- **Contrato de anonimização:** pode ir ao prompt — tickers, classes/percentuais, faixas de patrimônio, perfil, categorias de gasto. **Nunca vai** — nome, CPF, e-mail, valor absoluto do patrimônio, identificador direto.
- Toda saída de análise/consultoria mostra o disclaimer **"não é recomendação de investimento"** (enquadramento CVM: análise educativa, não consultoria; o app não executa ordens).
- Chat tem memória via `ai_conversations`/`ai_messages`: o backend reenvia o histórico + contexto anonimizado a cada mensagem; limitar janela e resumir conversas longas.
## Planos e permissões

Dois conceitos **separados**, nunca unificados:

- **`profiles.is_admin`** — permissão administrativa. Abre a tela Admin e `/api/admin/*`.
- **`profiles.plan`** (`free` | `pro`) — plano comercial. Admin **não** ganha Pro implicitamente.

- A fonte única da verdade do gating é `server/src/lib/entitlements.ts` (função pura, testada).
  `/api/me` devolve `plan` + `entitlements`; **a UI espelha, nunca recalcula a regra**.
- O gating acontece no **servidor**: fora do Pro, livro de ofertas e tape saem da resposta, não só
  da UI. E o período de candle é recortado **antes** de buscar, para não pagar chamada que não será
  mostrada.
- Recusa por plano = **402 `PLAN_REQUIRED`** (status próprio para o client abrir a tela de planos,
  em vez de confundir com 403 de permissão).
- Pro libera: mercado internacional (`US`), todos os períodos de candle, livro de ofertas/tape,
  evolução de 24 meses e copiloto sem cota. **O free precisa continuar útil** — ele mantém B3,
  cripto, metas e projeções sem limite.
- Cota de IA em `public.ai_usage`: usuário só **lê** (RLS select-own); incremento pela service role.
  Se o cliente pudesse escrever, zeraria a própria cota. Cobra-se **depois** da resposta da IA.
- Concessão de plano é pelo painel Admin (`PATCH /api/admin/users/:id/plan`). O primeiro admin nasce
  de um `UPDATE` manual — ver `docs/conceder-admin-e-plano.md`. **Nunca cravar e-mail no código.**
- `attachPlan` autentica de forma **opcional**: as rotas de mercado seguem públicas e sem token
  valem os limites do free.

## Análise de investimentos

- Motor em `server/src/lib/portfolioAnalysis.ts` — **puro e testado**: VPL, TIR (bisseção),
  payback, HHI de concentração, volatilidade anualizada, liquidez por giro e alinhamento ao perfil.
- **A IA nunca calcula**; ela recebe o panorama pronto e interpreta (`/api/ai/portfolio`, contrato
  em `ai/portfolioReviewSchema.ts`). Número reproduzível, explicação variável.
- VPL/TIR/payback são métodos de projeto. Aplicados a carteira, o fluxo é: aportes como saída,
  proventos como entrada, valor de mercado de hoje como valor terminal. **Documente isso ao mexer** —
  é o que torna o número interpretável.
- Métrica sem dado devolve `null`, nunca 0: TIR sem data de aporte, volatilidade com menos de 3
  fechamentos, liquidez sem volume. A UI mostra "—" e diz o que falta preencher.
- Cada card do panorama carrega o método por trás do número (`MetricCard` com "por quê?").
  Número sem explicação não ensina nada, e o app é educativo.
- `TARGET_ALLOCATION` por perfil é referência **educativa** para medir distância, não recomendação.
- Volatilidade da carteira é média ponderada e **ignora correlação** — superestima o risco de
  carteira diversificada. Dizer isso é melhor que fingir uma matriz de covariância que não temos.
- Contagem de meses é de **calendário** (`monthsSince`/`monthsUntil`), nunca dias ÷ 30,4375: o
  divisor médio errava o aniversário exato (365 dias davam 11 meses).

## Investimentos e mercado
 
- **Conta conectada é somente leitura** (Open Finance/Pluggy ou import CSV/link). O app enxerga a carteira para raciocinar; nunca opera nem custodia.
- **O frontend nunca chama a API de mercado direto.** Sempre via proxy no backend (`/api/market`) que guarda a chave e faz **cache curto** das cotações.
- Cotação com atraso (~15 min) via API gratuita (brapi.dev para BR). Mostrar o rótulo de atraso na UI.
- **Cripto (Binance, só leitura, sem chave): tempo real** (`delayed: false`). O rótulo de atraso é por ativo, não global.
- **Internacional (finnhub.io, plano gratuito): `FINNHUB_API_KEY`.** Sem a chave o mercado `US` responde 503 —
  nunca inventar número. `/stock/candle` é pago em boa parte das contas: o board degrada para
  `candlesUnavailable: true` e segue mostrando cotação.
- **Board de trade** (`/api/market/board/:ticker`) é genérico: cada adapter declara `BoardSupport`
  (`intervals`, `book`, `trades`) e a UI lê a capacidade. Só cripto tem livro de ofertas e tape.
- **Somente leitura, sempre.** Nenhum adapter, rota ou componente de board pode ganhar caminho de ordem.
- Todo `Quote` carrega `currency`: ação é BRL, cripto é o quote asset do par (BTCUSDT → USDT).
  No client, use `formatMoney(valor, currency)` — `formatCurrency` só serve para BRL.
- Ticker pode vir prefixado (`BR:PETR4`, `CRYPTO:BTCBRL`); a UI sempre prefixa ao navegar, para o backend não adivinhar.
- MVP: polling / refresh manual. Sem WebSocket por ora.
## Skills que constroem o app
 
| Skill | Faz |
|---|---|
| skill-frontend | Telas e componentes React |
| skill-backend | Rotas, controllers, services, middlewares, AiRouter |
| skill-database | Schema, migrations, RLS, tipos |
| skill-security | Política de acesso, JWT, contrato de anonimização |
| skill-ai-claude | Análise/direcionamento de carteira via Claude |
| skill-ai-gemini | Chat e explicações via Gemini |
 
Handoff: **security decide → database escreve RLS → backend escreve middleware/router → skills de IA consomem dado anonimizado.** `inspiracao-front` é a camada de design consultada pelo `skill-frontend`.
 
## Comandos
 
```
npm run dev              # sobe client + server (porta 3000)
npm run build            # build de produção
supabase migration new <nome>
supabase gen types typescript --project-id <id> > server/src/lib/database.types.ts
```
 
## Regras rápidas (Do / Don't)
 
- OK: validar entrada com Zod, habilitar RLS, anonimizar antes da IA, usar env para segredos.
- OK: um card/tela lida com o próprio estado vazio (skeleton / "sem dados ainda").
- OK: ao adicionar/remover movimentação, recalcular totais e gráficos na hora.
- NÃO: chamar API de mercado ou IA a partir do frontend.
- NÃO: enviar ordem de compra, executar operação ou custodiar dinheiro — o app só direciona; conexão de conta é somente leitura.
- NÃO: mandar PII para a IA nem para logs.
- NÃO: recriar as tabelas base existentes — estender.
- NÃO: apresentar a IA como consultoria; é análise educativa (disclaimer sempre visível).
- NÃO: cravar e-mail de admin no código — usar a flag is_admin.
- NÃO: gatear feature só no frontend — o servidor recusa com 402 PLAN_REQUIRED e tira o dado da resposta.
- NÃO: tratar is_admin como plano Pro — são conceitos separados.
- NÃO: deixar o plano free inútil; ele é a vitrine do portfólio.
## Fase atual

Fase 1 concluída: monorepo, banco (profiles, investor_profiles, transactions, budgets, assets,
watchlist, ai_* + RLS), API CRUD + resumo, home Minha Carteira, Gastos, mercado (proxy brapi),
copiloto (Gemini+Claude), e — v0.5 tarefa 1.12 — autenticação Supabase, onboarding (quiz de
perfil), landing pública, `requireAdmin` + painel Admin. App autenticado sob `/app/*`.

Autenticação: o `requireAuth` valida **ES256/RS256 pelo JWKS** do Supabase (projeto migrado para
JWT signing keys) e mantém HS256 com `JWT_SECRET` como fallback — é o caminho dos testes.

Fase 2 (v0.5) em andamento:

- **Feito:** tabela `goals` + RLS; motor de projeção puro (`server/src/lib/projection.ts`) e score
  de saúde financeira puro (`server/src/lib/financeScore.ts`), ambos testados; `/api/goals` (CRUD) e
  `/api/planning`; tela **Planejamento** com metas, projeção, cenários ±2 p.p. e score por pilares.
- **Feito:** board de trade genérico (`/api/market/board/:ticker` + `boardService`) com três
  mercados — **Cripto** (Binance: candles, livro de ofertas, tape), **Ações B3** (brapi: candles
  diário/semanal/mensal) e **Internacional** (finnhub: ações e ETFs dos EUA). Livro e tape aparecem
  por `BoardSupport`, não por `if` de mercado.
- **Feito:** gráfico de evolução do patrimônio na Minha Carteira, com `patrimonio_snapshots` +
  fluxo de caixa acumulado e botão "salvar foto do mês".
- **Feito:** guias de tela do copiloto (`SCREEN_GUIDES` em `ai/prompts.ts`) — o modelo recebe o
  vocabulário da tela, então "o que é esse livro?" vira explicação do book, não resposta genérica.
- **Feito:** planos free/pro — `entitlements.ts` puro, `attachPlan`/`requirePlan`, gating de
  mercado/board/evolução/IA no servidor, tela de Planos e concessão pelo painel Admin.
- **Feito:** carteira de investimentos importável (`holdings` + CSV tolerante) com panorama
  analítico interativo e avaliação da IA por critério (rentabilidade, risco, liquidez, prazo,
  alinhamento) + prioridades de melhoria ligadas ao objetivo declarado pelo usuário.
- **Falta:** aba **Análise & Objetivos** (BI: KPIs, tabela e export `.xlsx`). Cobrança de verdade
  (gateway de pagamento) também está fora — o plano é concedido manualmente.
- **Limites conhecidos:** Planejamento e evolução exigem login (a matemática vive só no backend e
  não é duplicada no client). `FINNHUB_API_KEY` precisa ser criada para o mercado internacional sair
  do modo exemplo.

Fase 3 (interface) feita: landing reescrita com herói de produto + bento grid, login em duas
colunas, fonte de display (Archivo) nos títulos, `Skeleton` compartilhado, larguras padronizadas e
code splitting por rota — o chunk de entrada caiu de 1.047 kB para 92 kB e o Recharts saiu do
caminho crítico.
