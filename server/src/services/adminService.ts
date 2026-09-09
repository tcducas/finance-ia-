import { fromPostgrest } from '../errors/postgrest.js';
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
