# Configurar Supabase (login + banco + admin)

Sem Supabase o app abre mas toda chamada de API responde 401. Faça uma vez.

## 1. Criar o projeto

1. https://supabase.com → **New project**. Nome livre, região São Paulo, defina a senha do banco.
2. Espere provisionar (~2 min).

## 2. Pegar as chaves

**Project Settings → API:**

| Campo no painel | Variável no `.env` |
|---|---|
| Project URL | `SUPABASE_URL` **e** `VITE_SUPABASE_URL` |
| Project API keys → `anon` `public` | `SUPABASE_ANON_KEY` **e** `VITE_SUPABASE_ANON_KEY` |
| Project API keys → `service_role` `secret` | `SUPABASE_SERVICE_ROLE` |

**Project Settings → API → JWT Settings → `JWT Secret`** (o "Legacy JWT Secret", HS256):

| | |
|---|---|
| JWT Secret | `JWT_SECRET` |

Cole tudo no `.env` da raiz (já existe, com os campos prontos). Salve.

## 3. Rodar as migrations


**Opção A — SQL Editor (mais rápido):** Dashboard → **SQL Editor** → **New query** → cole o
conteúdo de `supabase/all_migrations.sql` → **Run**.

**Opção B — CLI:**

```
npx supabase login
npx supabase link --project-ref <ref-do-projeto>
npx supabase db push
```

Confere: **Table Editor** deve listar `profiles`, `investor_profiles`, `transactions`,
`budgets`, `assets`, `watchlist`, `ai_conversations`, `ai_messages`.

## 4. Criar a conta e virar admin

1. `npm run dev` → http://localhost:3000 → **Entrar → Criar conta**.
   Nome: `Thales Ducas` · seu e-mail · senha.
2. Se o projeto tiver confirmação de e-mail ativa (**Authentication → Providers → Email**),
   confirme pelo link. Para pular: desligue "Confirm email" ali.
3. Faça login uma vez (cria a linha em `profiles` via trigger).
4. SQL Editor → rode, com o seu e-mail:

```sql
update public.profiles
set is_admin = true
where email = 'SEU_EMAIL_AQUI';
```

5. Recarregue o app. O item **Admin** aparece no rodapé do menu.

## 5. IA 

- `GEMINI_API_KEY` — https://aistudio.google.com/apikey → chat e explicações do copiloto.
-  `GROQ_API_KEY` —  https://console.groq.com/keys


Sem chave, as rotas de IA respondem 503 e a UI mostra o estado desabilitado; o resto do app funciona.

## Importar sua carteira real

Depois de logar: **Minha Carteira → Importar CSV** (extrato de entradas/saídas) e
**aba Patrimônio → Importar CSV** (posições da corretora/banco). Botão **baixar modelo**
em cada diálogo mostra o formato. Conexão automática com corretora (Open Finance/Pluggy)
não faz parte do escopo — o app é somente leitura e você alimenta os dados.
