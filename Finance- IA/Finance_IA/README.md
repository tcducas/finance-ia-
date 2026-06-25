# Aura - Gestão de Ativos e Inteligência de Investimentos IA

Aura é uma plataforma avançada e acessível para recomendação de alocação de ativos patrimoniais inteligentes, simulações de estresse de mercado e relatórios estratégicos alimentados por Inteligência Artificial (Gemini 3.5). 

O sistema foi inteiramente projetado com altos conceitos de engenharia de software e segurança cibernética aplicada a modelos de linguagem de grande porte (LLMs).

---

## 🛡️ Security by Design: Arquitetura de Segurança de IA

Para evitar vazamento de dados sensíveis de investidores, falhas operacionais ou ataques maliciosos estruturados, no arquivo de governança do projeto foram estabelecidos **4 pilares de segurança e governança de dados**:

### 1. Autenticação Segura com Gateway Proxy (BFF Pattern)
- **Como funciona**: O frontend nunca estabelece conexões diretas ou solicitações brutas para APIs de terceiros. Todas as comunicações passam primeiro pelo nosso gateway Proxy Backend-For-Frontend (BFF) expresso em `server.ts`. 
- **Benefício**: Guarda segredos sensíveis como a chave do Gemini (`GEMINI_API_KEY`) blindando-os contra vazamentos no console do navegador do cliente. Fornece o alicerce para validação encriptada de tokens JWT de prestadores confiáveis (Supabase/Clerk).

### 2. Anonimização e Mascaramento de Dados (LGPD & GDPR Compliance)
- **Como funciona**: Antes de enviar dados de perfil do usuário para os resolvedores generativos da IA comercial, em nosso gateway de backend, ativamos o pipeline de anonimização:
  - O nome do usuário é mascarado para `{{USER_FIRST_NAME}}`.
  - O montante líquido do patrimônio simulado é mascarado para `{{TOTAL_BALANCE}}`.
- **Benefício**: O modelo de IA realiza as deduções matemáticas e tece as interpretações macroeconômicas de alocação recomendada sem nunca saber o nome completo, identificação tributária ou volumes financeiros absolutos do investidor real. Ao retornar o texto ao servidor isolado, o backend hidrata as tags com as variáveis preservadas em memória local antes de renderizar a interface do usuário.

### 3. Proteção contra Prompt Injection (Guardrails de Segurança)
- **Como funciona**: Contamos com duas camadas sólidas de contenção contra ataques estruturados (prompt injections) focados em forçar desvios operacionais ou conselhos financeiros maliciosos:
  1. **Filtros de Entrada**: Monitoramento contínuo das entradas textuais do chat comparadas a gatilhos e padrões de injeção (ex: "ignore as instruções anteriores", "developer mode"). Bloqueia requisições em tempo de execução e retorna uma aviso amigável.
  2. **System Instructions Rígidas (Cérebro Aura)**: Instruções regulatórias severas no modelo delimitando as fronteiras de escopo analítico como assessoria regulada pela CVM e blindagem de persona.

### 4. Sandbox Operacional e Isolamento de Chamadas (Sandbox Execution)
- **Como funciona**: Os gráficos de projeção estendidos (neutro, otimista e testes de estresse) utilizam algoritmos matemáticos e estatísticos calculados em sandbox local no back-end, sem dar à LLM autonomia lógica para execução direta de queries no banco de dados ou códigos não-saneados.
- **Benefício**: Evita vulnerabilidades de Execução de Código Remoto (RCE) e garante precisão aritmética inabalável independente de alucinações de LLM.

---

## ⚙️ Tecnologias Utilizadas

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Recharts (visualização dinâmica de dados) e Motion (transições fluidas).
- **Backend**: Express, Tsx CLI, Dotenv, Esbuild (empacotamento robusto de produção).
- **Inteligência Artificial**: SDK oficial do `@google/genai` utilizando o novo modelo `gemini-3.5-flash` para retornos de alta fidelidade e velocidade.

---

## 🔒 Guia Técnico: Row Level Security (RLS) no Supabase

Para estender a postura de **Security by Design** da Aura na camada de persistência com o **Supabase (PostgreSQL)**, é crítico ativar e configurar o **Row Level Security (RLS)**. Isso garante de forma matemática e indestrutível que nenhum usuário consiga visualizar, atualizar ou apagar os dados financeiros de outros investidores, mesmo se houver vazamentos de chaves públicas no lado do cliente ou requisições forjadas manualmente direto ao gateway de REST do PostgREST.

### 1. Criando a Tabela de Dados Financeiros (`user_profiles`)
Cada investidor armazena seu perfil estratégico de risco, saldo de simulação e metas. A chave estrangeira primaria deve referenciar a tabela interna de usuários do Supabase Auth (`auth.users`).

```sql
-- Criar tabela de perfis de investimentos que conecta com a autenticação nativa do Supabase
create table public.user_profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  goals text,
  risk_psychology text,
  knowledge_level text,
  calculated_profile text not null,
  balance numeric(15, 2) not null default 0.00,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

### 2. Ativando o Row Level Security (RLS)
Por padrão, tabelas Postgres recém-criadas no Supabase não possuem restrições ativadas. É obrigatório executar a instrução de ativação para habilitar a interceptação de segurança:

```sql
-- Forçar que todas as requisições SELECT, INSERT, UPDATE, DELETE passem pelo crivo das políticas RLS
alter table public.user_profiles enable row level security;
```

### 3. Escrevendo as Políticas de Segurança de Nível de Linha (RLS Policies)
Com o RLS ativo, o Postgres bloqueia por padrão todas as ações se não houver políticas explícitas de liberação. Vamos criar regras que validam se o `auth.uid()` (o ID decodificado de forma segura do JWT do usuário autenticado) é idêntico ao `id` do registro na tabela.

#### A. Política de Leitura (SELECT)
Permite que o usuário autenticado consulte apenas o seu próprio perfil.
```sql
create policy "Usuários podem visualizar apenas seu próprio perfil financeiro."
on public.user_profiles
for select
using (
  auth.uid() = id
);
```

#### B. Política de Escrita / Criação (INSERT)
Garante que um usuário autenticado só possa se registrar vinculando seu próprio UID seguro fornecido pelo token JWT.
```sql
create policy "Usuários podem inserir apenas seu próprio perfil financeiro."
on public.user_profiles
for insert
with check (
  auth.uid() = id
);
```

#### C. Política de Atualização (UPDATE)
Limita as alterações cadastrais e de saldo exclusivamente ao proprietário do registro.
```sql
create policy "Usuários podem atualizar apenas seu próprio perfil financeiro."
on public.user_profiles
for update
using (
  auth.uid() = id
)
with check (
  auth.uid() = id
);
```

#### D. Política de Deleção (DELETE)
Controle completo de encerramento de conta.
```sql
create policy "Usuários podem deletar apenas seu próprio perfil financeiro."
on public.user_profiles
for delete
using (
  auth.uid() = id
);
```

### 4. Automatizando a Sincronização com Triggers
Para manter o princípio de automação limpa, podemos criar uma Trigger no PostgreSQL do Supabase que cria automaticamente o registro na tabela `public.user_profiles` sempre que um novo registro de autenticação for concluído no Supabase Auth:

```sql
-- Função auxiliar executada de forma segura pelo contexto de nível SUPERUSER do Postgres
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id, name, calculated_profile, balance)
  values (
    new.id, 
    coalesce(new.raw_user_meta_data->>'name', 'Investidor Anonimizado'), 
    'Conservador', 
    0.00
  );
  return new;
end;
$$ language plpgsql security definer;

-- Associar a função de gatilho à tabela nativa de autenticação
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

---
