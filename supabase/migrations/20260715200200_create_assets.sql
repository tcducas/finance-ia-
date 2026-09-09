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
