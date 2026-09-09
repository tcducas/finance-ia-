-- Aura Finance — todas as migrations em ordem.
-- Cole no SQL Editor do Supabase (Dashboard > SQL Editor > New query) e rode uma vez.

-- ================================================================
-- 20260710000000_create_profiles.sql
-- ================================================================
-- Perfil do usuário (base do app). As demais tabelas fazem FK para cá,
-- então esta migration precisa rodar antes das de 20260715.
-- 1 linha por usuário de auth.users, criada por trigger no cadastro.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  is_admin boolean not null default false,
  onboarded_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- O usuário lê e edita só o próprio perfil. Não há policy de insert:
-- a criação é feita pelo trigger abaixo (security definer).
create policy profiles_select_own on public.profiles
  for select using (auth.uid() = id);

create policy profiles_update_own on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Cria o profile automaticamente quando um usuário se cadastra no Supabase Auth.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ================================================================
-- 20260710000100_create_investor_profiles.sql
-- ================================================================
-- Resultado do quiz de perfil do investidor (onboarding, 1x).
-- 1 linha por usuário; refazer o quiz sobrescreve (upsert).

create table public.investor_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  risk_profile text not null check (risk_profile in ('conservador', 'moderado', 'arrojado')),
  answers jsonb not null default '{}'::jsonb,
  computed_at timestamptz not null default now()
);

alter table public.investor_profiles enable row level security;

create policy investor_profiles_select_own on public.investor_profiles
  for select using (auth.uid() = user_id);

create policy investor_profiles_insert_own on public.investor_profiles
  for insert with check (auth.uid() = user_id);

create policy investor_profiles_update_own on public.investor_profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- ================================================================
-- 20260715200000_create_transactions.sql
-- ================================================================
-- Livro-caixa: receitas e despesas (doc v0.4 §5.3).
-- Estende a base do Beta 0.1.0 — public.profiles já existe.

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('receita', 'despesa')),
  category text not null,
  amount numeric(15,2) not null check (amount > 0),
  occurred_on date not null,
  description text,
  is_recurring boolean not null default false,
  created_at timestamptz not null default now()
);

-- Consultas do app são sempre por usuário + período.
create index transactions_user_period_idx
  on public.transactions (user_id, occurred_on desc);

alter table public.transactions enable row level security;

create policy transactions_select_own on public.transactions
  for select using (auth.uid() = user_id);

create policy transactions_insert_own on public.transactions
  for insert with check (auth.uid() = user_id);

create policy transactions_update_own on public.transactions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy transactions_delete_own on public.transactions
  for delete using (auth.uid() = user_id);


-- ================================================================
-- 20260715200100_create_budgets.sql
-- ================================================================
-- Orçamento por categoria: limite mensal (doc v0.4 §5.3).

create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  category text not null,
  monthly_limit numeric(15,2) not null check (monthly_limit > 0),
  created_at timestamptz not null default now(),
  unique (user_id, category)
);

alter table public.budgets enable row level security;

create policy budgets_select_own on public.budgets
  for select using (auth.uid() = user_id);

create policy budgets_insert_own on public.budgets
  for insert with check (auth.uid() = user_id);

create policy budgets_update_own on public.budgets
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy budgets_delete_own on public.budgets
  for delete using (auth.uid() = user_id);


-- ================================================================
-- 20260715200200_create_assets.sql
-- ================================================================
-- Controle patrimonial: ativos e passivos (doc v0.4 §5.3).
-- Patrimônio líquido = soma(ativos) - soma(passivos, is_liability = true).

create table public.assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null,
  name text not null,
  value numeric(15,2) not null check (value >= 0),
  is_liability boolean not null default false,
  updated_at timestamptz not null default now()
);

create index assets_user_idx on public.assets (user_id);

alter table public.assets enable row level security;

create policy assets_select_own on public.assets
  for select using (auth.uid() = user_id);

create policy assets_insert_own on public.assets
  for insert with check (auth.uid() = user_id);

create policy assets_update_own on public.assets
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy assets_delete_own on public.assets
  for delete using (auth.uid() = user_id);


-- ================================================================
-- 20260716120000_create_watchlist.sql
-- ================================================================
-- Ativos acompanhados no monitor de mercado (doc v0.4 §5.3).

create table public.watchlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  ticker text not null,
  market text not null default 'BR',
  unique (user_id, ticker)
);

alter table public.watchlist enable row level security;

create policy watchlist_select_own on public.watchlist
  for select using (auth.uid() = user_id);

create policy watchlist_insert_own on public.watchlist
  for insert with check (auth.uid() = user_id);

create policy watchlist_delete_own on public.watchlist
  for delete using (auth.uid() = user_id);


-- ================================================================
-- 20260716130000_create_ai_tables.sql
-- ================================================================
-- Memória do copiloto: sessões de chat e mensagens (doc v0.4 §5.3).
-- Uma mudança lógica: as duas tabelas formam a unidade "memória do chat".

create table public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  context text,
  created_at timestamptz not null default now()
);

create table public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index ai_messages_conversation_idx
  on public.ai_messages (conversation_id, created_at);

alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;

create policy ai_conversations_select_own on public.ai_conversations
  for select using (auth.uid() = user_id);

create policy ai_conversations_insert_own on public.ai_conversations
  for insert with check (auth.uid() = user_id);

create policy ai_conversations_delete_own on public.ai_conversations
  for delete using (auth.uid() = user_id);

-- Mensagens: acesso via posse da conversa.
create policy ai_messages_select_own on public.ai_messages
  for select using (
    exists (
      select 1 from public.ai_conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );

create policy ai_messages_insert_own on public.ai_messages
  for insert with check (
    exists (
      select 1 from public.ai_conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );


