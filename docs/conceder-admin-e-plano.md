# Conceder admin e plano

Duas coisas distintas, de propósito:

- **`is_admin`** é permissão administrativa — abre a tela Admin e as rotas `/api/admin/*`.
- **`plan`** é o plano comercial (`free` | `pro`) — controla mercados, períodos de candle,
  livro de ofertas, janela de evolução e cotas de IA.

Admin **não** recebe Pro automaticamente. Misturar os dois faria o acesso comercial depender de
um cargo técnico, e um admin em Pro implícito nunca veria o app como um usuário free vê.

Nenhum e-mail de admin é cravado no código. O primeiro admin nasce de um `UPDATE` manual; a
partir daí, planos são concedidos pela tela Admin.

`is_admin`, `plan` e `plan_updated_at` **não são graváveis pelo cliente**: a migration
`20261002090000_lock_profile_privileged_columns` deixa o usuário atualizar só `full_name` e
`onboarded_at`. Sem isso, qualquer conta logada se promovia a admin com a anon key.

## 0. Via script (recomendado)

Cadastre-se no app (`/login`) e confirme o e-mail. Depois, com `SUPABASE_SERVICE_ROLE` no `.env`:

```
npm run grant-admin -w server -- <SEU_EMAIL> --pro
```

Sem `--pro` só vira admin. O script imprime `is_admin` e `plan` da linha alterada; e-mail sem
perfil sai com erro. Saia e entre de novo no app para o `/api/me` refletir.

## 1. Primeiro admin (uma vez, no SQL Editor do Supabase)

Troque `<SEU_EMAIL>` pelo e-mail **exatamente como está em `auth.users`** — se errar, o update
não encontra ninguém e passa em silêncio. Por isso o `returning`: ele prova que a linha mudou.

```sql
update public.profiles
   set is_admin = true
 where id = (select id from auth.users where lower(email) = lower('<SEU_EMAIL>'))
returning id, email, is_admin, plan;
```

`0 rows` significa que o e-mail não existe em `auth.users`. Confirme com:

```sql
select id, email, created_at, email_confirmed_at
  from auth.users
 order by created_at desc
 limit 10;
```

## 2. Plano Pro

Depois do passo 1, entre no app em **Admin → Planos por usuário** e troque o plano no select.
A rota é `PATCH /api/admin/users/:id/plan`, protegida por `requireAdmin`.

Se preferir pelo banco (ou para se conceder Pro antes do primeiro login):

```sql
update public.profiles
   set plan = 'pro', plan_updated_at = now()
 where id = (select id from auth.users where lower(email) = lower('<SEU_EMAIL>'))
returning id, email, plan, plan_updated_at;
```

## Rebaixar o próprio plano

O painel recusa: sem Pro o admin perderia as telas que precisa testar, e rebaixar a si mesmo é
quase sempre engano. Para fazer de propósito, rode o `update` acima com `plan = 'free'`.

## Cotas de IA

O consumo do plano free fica em `public.ai_usage`, que o usuário só **lê** (RLS select-own). O
incremento passa pela service role — se o cliente pudesse escrever, zeraria a própria cota.
Para zerar manualmente durante um teste:

```sql
delete from public.ai_usage
 where user_id = (select id from auth.users where lower(email) = lower('<SEU_EMAIL>'));
```
