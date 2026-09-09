import { fromPostgrest } from '../errors/postgrest.js';
import type { UserClient } from '../lib/supabase.js';
import type { AssetCreateInput } from '../schemas/asset.js';
import type { TransactionCreateInput } from '../schemas/transaction.js';

export interface ImportResult {
  inserted: number;
}

// Lotes menores que o limite de payload do PostgREST.
const CHUNK = 500;

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export async function importTransactions(
  db: UserClient,
  userId: string,
  rows: TransactionCreateInput[],
): Promise<ImportResult> {
  const payload = rows.map((row) => ({ ...row, amount: round2(row.amount), user_id: userId }));
  let inserted = 0;
  for (let i = 0; i < payload.length; i += CHUNK) {
    const slice = payload.slice(i, i + CHUNK);
    const { error } = await db.from('transactions').insert(slice);
    if (error) throw fromPostgrest(error);
    inserted += slice.length;
  }
  return { inserted };
}

export async function importAssets(
  db: UserClient,
  userId: string,
  rows: AssetCreateInput[],
): Promise<ImportResult> {
  const payload = rows.map((row) => ({ ...row, value: round2(row.value), user_id: userId }));
  let inserted = 0;
  for (let i = 0; i < payload.length; i += CHUNK) {
    const slice = payload.slice(i, i + CHUNK);
    const { error } = await db.from('assets').insert(slice);
    if (error) throw fromPostgrest(error);
    inserted += slice.length;
  }
  return { inserted };
}
