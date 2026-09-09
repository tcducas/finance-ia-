# Aura Finance

Copiloto financeiro inteligente: acompanha movimentações, orçamento, patrimônio e metas, mostra o mercado ao vivo e usa IA para **direcionar** onde investir. O app **direciona, não executa** — quem aplica é você, na sua corretora.

> Toda análise gerada por IA é educativa — **não é recomendação de investimento**.

## Stack

- **Frontend:** React 19 + Vite, TypeScript, TailwindCSS 4, Recharts, Lucide
- **Backend:** Express 5 + tsx, TypeScript (monorepo npm workspaces, porta única 3000)
- **Banco:** Supabase (PostgreSQL) com RLS · Auth Supabase + JWT
- **IA:** Google Gemini + Claude (Anthropic), roteadas por um `AiRouter`

## Como rodar

```bash
# 1. Instalar dependências (raiz do monorepo)
npm install

# 2. Configurar ambiente
cp .env.example .env   # e preencha as chaves

# 3. Subir client + server na porta 3000
npm run dev
```

Outros comandos:

```bash
npm run build       # build de produção (client) + typecheck do server
npm run start       # serve o build em modo produção
npm run typecheck   # TypeScript estrito em client e server
```

## Estrutura

```
client/   # React 19 + Vite (pages, components, layouts, hooks, services, lib, types)
server/   # Express + tsx  (routes, controllers, services, middlewares, schemas, ai, lib, errors)
supabase/migrations/   # YYYYMMDDHHMMSS_*.sql
```

## Progresso da Fase 1

- [x] **1.0 — Fundação do monorepo**: workspaces `client`/`server` servidos na porta 3000 (Vite em modo middleware no dev), design tokens claro/escuro (dourado, `prefers-color-scheme`, `prefers-reduced-motion`), `MainLayout` com os 4 destinos (sidebar no desktop, barra inferior no mobile), Copiloto como drawer e botão "+" global, validação de env com Zod no boot, `errorHandler` central (`{ data }` / `{ error: { message, code } }`), rota `/api/health`. Legado Python/React 18 removido.
- [x] **1.1 — Migrations** `transactions`, `budgets`, `assets` (+ `watchlist`) com RLS por operação; `database.types.ts` no formato do `supabase gen types` (regenerar quando o projeto estiver linkado). *Aplicação real pendente das credenciais do Supabase.*
- [x] **1.2 — API**: CRUD com Zod + `requireAuth` (JWT Supabase verificado localmente) + cliente por requisição (RLS sempre ativa); `/api/summary` e `/api/summary/spending`; Vitest + Supertest.
- [x] **1.3 — Minha Carteira**: `TransactionList` (add/remove com recálculo na hora), `SpendingDonut` (paleta validada p/ daltonismo e contraste nos 2 temas), `TransactionForm` global no “+”, faixa do copiloto.
- [x] **1.4 — Patrimônio** (aba da carteira): patrimônio líquido = ativos − passivos, edição persiste.
- [x] **1.5 — Controle de Gastos**: `BudgetRow` (abaixo/perto/acima com ícone + texto), `BudgetForm`, `SpendingAnalysis` (mês a mês), alertas do copiloto (80% / estouro).
- [x] **1.6 — Mercado (backend)**: migration `watchlist` + RLS; proxy `/api/market` (brapi.dev) com cache curto em memória que deduplica chamadas concorrentes — 2 usuários no mesmo ativo = 1 consulta externa (testado); chave só no backend.
- [x] **1.7 — Mercado (telas)**: monitor (índices, watchlist com add/remove, maiores altas/quedas, refresh manual) e detalhe do ativo (gráfico de preço por período, mín/máx 52 sem, P/L, LPA, volume, “explicar este ativo”). Sem `BRAPI_TOKEN`/rede, cai para dados de exemplo claramente rotulados; cotações sempre com rótulo de atraso (~15 min).
- [x] **1.8 — Memória do copiloto**: migrations `ai_conversations`/`ai_messages` com RLS (mensagens acessíveis só pelo dono da conversa).
- [x] **1.9 — IA**: `AiRouter` por tarefa (chat/explicações → Gemini; análise/aporte → Claude `claude-sonnet-5` com tool use forçado + `strict`); `anonymize.ts` com o contrato LGPD **testado** (percentuais/faixas/tickers entram; nome, CPF, e-mail, telefone, valores absolutos e ids nunca); `/api/ai/chat` (janela de 20 mensagens + contexto anonimizado da tela) e `/api/ai/analyze` (JSON "atual → sugerido" com cenário de mercado); sem chaves → `503 AI_NOT_CONFIGURED`.
- [x] **1.10 — Copiloto drawer**: acessível de qualquer tela, entra sabendo o contexto (carteira/gastos/investimentos/ativo), insight proativo ao abrir, chat com histórico, consultor de aporte com bloco estruturado, "explicar este ativo" com kickoff automático, disclaimer permanente. Sem chaves de IA, opera em modo demonstração claramente marcado.
- [x] **1.11 — Dashboard enriquecido**: cards da home ligados às fontes reais — receitas/despesas/saldo, fixos×variáveis, orçamento usado (%), patrimônio líquido e aporte do mês (clique abre o consultor do copiloto). Loading/erro/vazio tratados; zero mock nos números.
- [x] **1.12 — Autenticação + onboarding + landing + admin**: migrations greenfield `profiles` (flag `is_admin`, `onboarded_at`, trigger `handle_new_user`) e `investor_profiles` (RLS own). Backend: `/api/me`, `/api/onboarding` (perfil de risco por regra pura em `riskScore.ts`), `requireAdmin` + `/api/admin/stats`. Client: landing pública em `/`, `/login` (Supabase Auth), quiz de perfil em `/onboarding`, app sob `/app/*` atrás de `RequireAuth`; `AuthContext` sincroniza o access_token com o provider HTTP — **login tira o app do modo demo automaticamente**. Perfil e Admin deixam de ser stub; ativação guiada na home.

## Ativando os serviços reais (quando quiser)

Sem `VITE_SUPABASE_*` o app roda em **modo demonstração** (dados no localStorage, selo "demo" na topbar). Para ligar cada serviço, preencha o `.env` (copie de `.env.example`):

1. **IA** — `GEMINI_API_KEY` (chat) e `ANTHROPIC_API_KEY` (análise). Basta preencher e reiniciar: o copiloto sai do modo demo sozinho.
2. **Mercado** — `BRAPI_TOKEN` (brapi.dev, plano gratuito) para cotações reais; sem ele, os movers do dia já funcionam e o resto usa dados de exemplo rotulados.
3. **Supabase** — no backend `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE`, `JWT_SECRET` (o *Legacy JWT Secret* do projeto, HS256); no client `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`. Aplique as migrations e regenere os tipos:
   ```bash
   npx supabase link --project-ref <ref>
   npx supabase db push
   npx supabase gen types typescript --project-id <ref> > server/src/lib/database.types.ts
   ```
   Com o Supabase configurado, `/` mostra a landing, `/login` cuida do cadastro/login,
   `/onboarding` roda o quiz de perfil (1x) e o app fica sob `/app/*`. O login troca o
   provider local pelo HTTP sozinho. Para testar o cadastro sem caixa de e-mail, desligue
   *Confirm email* em Authentication → Providers no painel do Supabase. Para acessar o
   `/app/admin`, marque `is_admin = true` na linha do seu usuário em `profiles`.

## Testes

```bash
npm test   # 46 testes (Vitest + Supertest): API, cache de mercado, anonimização, IA, perfil/onboarding/admin
```
