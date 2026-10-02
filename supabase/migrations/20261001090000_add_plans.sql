-- Planos free/pro (v0.5). `plan` é comercial e `is_admin` é permissão
-- administrativa: conceitos separados de propósito. Admin não ganha Pro
-- automaticamente — quem concede plano é o painel Admin, de forma explícita.

alter table public.profiles
  add column plan text not null default 'free' check (plan in ('free', 'pro')),
  add column plan_updated_at timestamptz;

-- Contador de uso da IA, para a cota do plano free. Fica FORA da RLS de escrita:
-- o usuário só LÊ o próprio consumo; incrementar é trabalho do backend com a
-- service role. Sem isso, qualquer cliente poderia zerar a própria cota.
create table public.ai_usage (
  user_id uuid not null references public.profiles(id) on delete cascade,
  -- 'YYYY-MM-DD' para chat (cota diária), 'YYYY-MM' para analyze (cota mensal).
  period text not null,
  kind text not null check (kind in ('chat', 'analyze')),
  count integer not null default 0 check (count >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, period, kind)
);

alter table public.ai_usage enable row level security;

-- Só leitura para o dono. Nenhuma policy de insert/update/delete: o incremento
-- passa pela service role, que ignora a RLS.
create policy ai_usage_select_own on public.ai_usage
  for select using (auth.uid() = user_id);
