-- Metas financeiras (Fase 2 / v0.5). Alimentam o motor de projeção e a tela
-- de Planejamento. `annual_rate` é decimal (0.105 = 10,5% a.a.), não percentual.

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  kind text not null default 'geral' check (kind in ('reserva', 'compra', 'aposentadoria', 'geral')),
  target_amount numeric(15,2) not null check (target_amount > 0),
  current_amount numeric(15,2) not null default 0 check (current_amount >= 0),
  monthly_contribution numeric(15,2) not null default 0 check (monthly_contribution >= 0),
  -- Rentabilidade esperada ao ano; 0 = deixar parado (poupança sem juros).
  annual_rate numeric(6,4) not null default 0 check (annual_rate >= 0 and annual_rate <= 1),
  -- Prazo desejado (opcional). Com prazo, o motor calcula o aporte necessário.
  target_date date,
  priority smallint not null default 2 check (priority between 1 and 3),
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create index goals_user_priority_idx on public.goals (user_id, priority, created_at);

alter table public.goals enable row level security;

create policy goals_select_own on public.goals
  for select using (auth.uid() = user_id);

create policy goals_insert_own on public.goals
  for insert with check (auth.uid() = user_id);

create policy goals_update_own on public.goals
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy goals_delete_own on public.goals
  for delete using (auth.uid() = user_id);
