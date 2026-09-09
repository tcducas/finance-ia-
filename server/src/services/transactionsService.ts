import { AppError } from '../errors/AppError.js';
import { fromPostgrest } from '../errors/postgrest.js';
import type { Tables } from '../lib/database.types.js';
import type { DateRange } from '../lib/period.js';
import type { UserClient } from '../lib/supabase.js';
import type { TransactionCreateInput, TransactionUpdateInput } from '../schemas/transaction.js';

export type Transaction = Tables<'transactions'>;

export async function listTransactions(db: UserClient, range: DateRange): Promise<Transaction[]> {
  const { data, error } = await db
    .from('transactions')
    .select('*')
    .gte('occurred_on', range.from)
    .lte('occurred_on', range.to)
    .order('occurred_on', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw fromPostgrest(error);
  return data;
}

export async function createTransaction(
  db: UserClient,
  userId: string,
  input: TransactionCreateInput,
): Promise<Transaction> {
  const { data, error } = await db
    .from('transactions')
    .insert({ ...input, amount: round2(input.amount), user_id: userId })
    .select()
    .single();
  if (error) throw fromPostgrest(error);
  return data;
}

export async function updateTransaction(
  db: UserClient,
  id: string,
  input: TransactionUpdateInput,
): Promise<Transaction> {
  const patch = { ...input, ...(input.amount !== undefined && { amount: round2(input.amount) }) };
  const { data, error } = await db
    .from('transactions')
    .update(patch)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) throw fromPostgrest(error);
  if (!data) throw new AppError('Movimentação não encontrada.', 'NOT_FOUND', 404);
  return data;
}

export async function deleteTransaction(db: UserClient, id: string): Promise<void> {
  const { data, error } = await db
    .from('transactions')
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle();
  if (error) throw fromPostgrest(error);
  if (!data) throw new AppError('Movimentação não encontrada.', 'NOT_FOUND', 404);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
