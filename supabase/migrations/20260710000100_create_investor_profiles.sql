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
