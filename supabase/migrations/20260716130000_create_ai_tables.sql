-- Memória do copiloto: sessões de chat e mensagens (doc v0.4 §5.3).
-- Uma mudança lógica: as duas tabelas formam a unidade "memória do chat".

create table public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  context text,
  created_at timestamptz not null default now()
);

create table public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index ai_messages_conversation_idx
  on public.ai_messages (conversation_id, created_at);

alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;

create policy ai_conversations_select_own on public.ai_conversations
  for select using (auth.uid() = user_id);

create policy ai_conversations_insert_own on public.ai_conversations
  for insert with check (auth.uid() = user_id);

create policy ai_conversations_delete_own on public.ai_conversations
  for delete using (auth.uid() = user_id);

-- Mensagens: acesso via posse da conversa.
create policy ai_messages_select_own on public.ai_messages
  for select using (
    exists (
      select 1 from public.ai_conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );

create policy ai_messages_insert_own on public.ai_messages
  for insert with check (
    exists (
      select 1 from public.ai_conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );
