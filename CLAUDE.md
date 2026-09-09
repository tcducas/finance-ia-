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
Persistentes em qualquer tela: **Copiloto** (drawer pela direita) e **botão "+" global** (lançar movimentação). Perfil e Admin ficam no rodapé. No mobile, o menu lateral vira barra inferior.
 
Nomenclatura: **"Minha Carteira"** é a carteira financeira do mês (entradas/saídas). A carteira de investimentos chama-se **"Investimentos"** — nunca "carteira" sozinho, para não confundir.
 
## Estrutura
 
```
client/   # React 19 + Vite  (pages, components, layouts, hooks, services, lib, types)
server/   # Express + tsx     (routes, controllers, services, middlewares, schemas, ai, lib, errors)
supabase/migrations/          # YYYYMMDDHHMMSS_*.sql
```
 
Camadas do backend: `routes -> controllers -> services -> lib`. O controller nunca contém regra de negócio; o service nunca conhece `req`/`res`. O layout do app (menu + topbar + drawer) é o `MainLayout` no client.
 
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
- Admin é a coluna `is_admin` em `profiles` — nunca cravar e-mail de admin no código; o guard `requireAdmin` lê a flag.
## IA — Gemini + Claude
 
- **Claude** (tool use, JSON estruturado): análise de carteira com contexto de mercado, rebalanceamento, direcionamento de aporte, análise de carteira importada.
- **Gemini**: chat conversacional, explicações de ativos/conceitos, insights rápidos.
- Um `AiRouter` no backend decide o provedor por tarefa. **Ambos recebem dados já anonimizados.**
- **Consultor / direcionamento:** o usuário informa o aporte do mês; a IA sugere onde alocar conforme perfil + mercado do dia, com a justificativa. Também responde "vale a pena comprar X?". Sempre educativo.
- **Contrato de anonimização:** pode ir ao prompt — tickers, classes/percentuais, faixas de patrimônio, perfil, categorias de gasto. **Nunca vai** — nome, CPF, e-mail, valor absoluto do patrimônio, identificador direto.
- Toda saída de análise/consultoria mostra o disclaimer **"não é recomendação de investimento"** (enquadramento CVM: análise educativa, não consultoria; o app não executa ordens).
- Chat tem memória via `ai_conversations`/`ai_messages`: o backend reenvia o histórico + contexto anonimizado a cada mensagem; limitar janela e resumir conversas longas.
## Investimentos e mercado
 
- **Conta conectada é somente leitura** (Open Finance/Pluggy ou import CSV/link). O app enxerga a carteira para raciocinar; nunca opera nem custodia.
- **O frontend nunca chama a API de mercado direto.** Sempre via proxy no backend (`/api/market`) que guarda a chave e faz **cache curto** das cotações.
- Cotação com atraso (~15 min) via API gratuita (brapi.dev para BR). Mostrar o rótulo de atraso na UI.
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
## Fase atual
 
Fase 1 concluída: monorepo, banco (profiles, investor_profiles, transactions, budgets, assets, watchlist, ai_* + RLS), API CRUD + resumo, home Minha Carteira, Gastos, mercado (proxy brapi), copiloto (Gemini+Claude), e — v0.5 tarefa 1.12 — autenticação Supabase, onboarding (quiz de perfil), landing pública, `requireAdmin` + painel Admin. App autenticado sob `/app/*`.

Próximo: Fase 2 (v0.5) — tabela `goals`, motor de projeção (juros compostos, função pura), aba **Análise & Objetivos** (BI: KPIs, gráfico, cenários, tabela + export .xlsx) e telas de Planejamento. Isso adiciona o 5º destino de navegação. Ver o roadmap por tarefas na Especificação v0.5.