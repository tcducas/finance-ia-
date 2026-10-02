-- Fotos mensais do patrimônio (Fase 2 / v0.5) — alimentam o gráfico de evolução
-- da Minha Carteira. Sem isto, a série só poderia ser derivada do fluxo de caixa,
-- que ignora valorização de ativo. Uma linha por (usuário, mês, classe).

create table public.patrimonio_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  month text not null check (month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  -- Classe do ativo (espelha assets.kind); 'total' guarda o patrimônio líquido.
  asset_class text not null default 'total',
  value numeric(15,2) not null,
  created_at timestamptz not null default now(),
  unique (user_id, month, asset_class)
);

create index patrimonio_snapshots_user_month_idx
  on public.patrimonio_snapshots (user_id, month);

alter table public.patrimonio_snapshots enable row level security;

create policy patrimonio_snapshots_select_own on public.patrimonio_snapshots
  for select using (auth.uid() = user_id);

create policy patrimonio_snapshots_insert_own on public.patrimonio_snapshots
  for insert with check (auth.uid() = user_id);

create policy patrimonio_snapshots_update_own on public.patrimonio_snapshots
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy patrimonio_snapshots_delete_own on public.patrimonio_snapshots
  for delete using (auth.uid() = user_id);
