import { AppError } from '../errors/AppError.js';
import { fromPostgrest } from '../errors/postgrest.js';
import type { Plan } from '../lib/entitlements.js';
import { createServiceClient } from '../lib/supabase.js';

export interface AdminStats {
  users: number;
  transactions: number;
  aiMessages: number;
  watchlistItems: number;
}

/** Contagens globais para o painel admin. Usa a service role (ignora RLS). */
export async function getStats(): Promise<AdminStats> {
  const db = createServiceClient();
  const [users, transactions, aiMessages, watchlist] = await Promise.all([
    db.from('profiles').select('*', { count: 'exact', head: true }),
    db.from('transactions').select('*', { count: 'exact', head: true }),
    db.from('ai_messages').select('*', { count: 'exact', head: true }),
    db.from('watchlist').select('*', { count: 'exact', head: true }),
  ]);
  for (const result of [users, transactions, aiMessages, watchlist]) {
    if (result.error) throw fromPostgrest(result.error);
  }
  return {
    users: users.count ?? 0,
    transactions: transactions.count ?? 0,
    aiMessages: aiMessages.count ?? 0,
    watchlistItems: watchlist.count ?? 0,
  };
}

export interface AdminUser {
  id: string;
  email: string | null;
  full_name: string | null;
  plan: Plan;
  plan_updated_at: string | null;
  is_admin: boolean;
  created_at: string;
}

const PAGE_SIZE = 50;

/**
 * Lista usuários para o painel Admin. Service role (ignora RLS) — só alcançável
 * atrás de requireAdmin. O e-mail aparece na UI do admin, mas NUNCA em log.
 */
export async function listUsers(query?: string): Promise<AdminUser[]> {
  const db = createServiceClient();
  let request = db
    .from('profiles')
    .select('id, email, full_name, plan, plan_updated_at, is_admin, created_at')
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE);

  if (query) {
    // Busca por e-mail ou nome; escapa % e _ para o termo não virar curinga.
    const safe = query.trim().replace(/[%_]/g, (c) => `\${c}`);
    request = request.or(`email.ilike.%${safe}%,full_name.ilike.%${safe}%`);
  }

  const { data, error } = await request;
  if (error) throw fromPostgrest(error);
  return data as AdminUser[];
}

/** Concede ou revoga o plano de um usuário. Registra quando mudou. */
export async function setUserPlan(userId: string, plan: Plan): Promise<AdminUser> {
  const db = createServiceClient();
  const { data, error } = await db
    .from('profiles')
    .update({ plan, plan_updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select('id, email, full_name, plan, plan_updated_at, is_admin, created_at')
    .maybeSingle();
  if (error) throw fromPostgrest(error);
  if (!data) throw new AppError('Usuário não encontrado.', 'NOT_FOUND', 404);
  return data as AdminUser;
}
