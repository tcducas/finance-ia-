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
