-- Posições da carteira de INVESTIMENTOS (v0.5). Distinta de `assets`, que é a
-- foto de patrimônio (saldo por classe): aqui cada linha é uma posição com
-- quantidade, preço médio e data de aporte — o que o motor de análise precisa
-- para calcular TIR, payback e concentração.

create table public.holdings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  ticker text not null check (char_length(trim(ticker)) > 0),
  market text not null default 'BR' check (market in ('BR', 'CRYPTO', 'US')),
  asset_class text not null default 'acao'
    check (asset_class in ('acao', 'fii', 'etf', 'cripto', 'renda_fixa', 'internacional', 'caixa', 'outro')),
  -- 8 casas para cripto; ações usam inteiros, mas o tipo não precisa saber disso.
  quantity numeric(20,8) not null check (quantity > 0),
  avg_price numeric(20,8) not null check (avg_price >= 0),
  -- Data do aporte: sem ela não há TIR (a taxa depende de quando o dinheiro entrou).
  acquired_on date,
  -- Proventos recebidos acumulados; alimentam o payback por dividendos.
  dividends_received numeric(15,2) not null default 0 check (dividends_received >= 0),
  created_at timestamptz not null default now(),
  unique (user_id, ticker, market)
);

create index holdings_user_class_idx on public.holdings (user_id, asset_class);

alter table public.holdings enable row level security;

create policy holdings_select_own on public.holdings
  for select using (auth.uid() = user_id);

create policy holdings_insert_own on public.holdings
  for insert with check (auth.uid() = user_id);

create policy holdings_update_own on public.holdings
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy holdings_delete_own on public.holdings
  for delete using (auth.uid() = user_id);
