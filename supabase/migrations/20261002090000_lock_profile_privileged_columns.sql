-- Fecha a autopromoção: a policy profiles_update_own deixava o cliente (anon key
-- + JWT do próprio usuário) gravar QUALQUER coluna do próprio perfil, inclusive
-- is_admin e plan. A RLS filtra linhas, não colunas — o corte é por GRANT.
-- is_admin / plan / plan_updated_at só mudam via service role (painel Admin ou
-- server/scripts/grant-admin.ts).

revoke update on public.profiles from anon, authenticated;
grant update (full_name, onboarded_at) on public.profiles to authenticated;
