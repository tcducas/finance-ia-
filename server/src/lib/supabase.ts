import { createClient } from '@supabase/supabase-js';
import { env } from '../env.js';
import { AppError } from '../errors/AppError.js';
import type { Database } from './database.types.js';

/**
 * Cliente Supabase por requisição, autenticado com o token do usuário.
 * Assim TODA consulta passa pela RLS (auth.uid() = user_id) — o backend
 * nunca acessa dados de outro usuário, mesmo com bug de filtro.
 */
export function createUserClient(accessToken: string) {
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    throw new AppError('Supabase não configurado no servidor.', 'SUPABASE_NOT_CONFIGURED', 503);
  }
  return createClient<Database>(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export type UserClient = ReturnType<typeof createUserClient>;
