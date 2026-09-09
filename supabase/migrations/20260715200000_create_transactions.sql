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
