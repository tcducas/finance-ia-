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
