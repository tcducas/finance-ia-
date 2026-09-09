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
