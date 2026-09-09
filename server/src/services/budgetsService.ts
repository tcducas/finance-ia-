import { AppError } from '../errors/AppError.js';
import { fromPostgrest } from '../errors/postgrest.js';
import type { Tables } from '../lib/database.types.js';
import type { UserClient } from '../lib/supabase.js';
import type { BudgetCreateInput, BudgetUpdateInput } from '../schemas/budget.js';

export type Budget = Tables<'budgets'>;

export async function listBudgets(db: UserClient): Promise<Budget[]> {
  const { data, error } = await db.from('budgets').select('*').order('category');
  if (error) throw fromPostgrest(error);
  return data;
}

/** Cria ou atualiza o limite da categoria (unique user_id+category). */
export async function upsertBudget(
  db: UserClient,
  userId: string,
  input: BudgetCreateInput,
): Promise<Budget> {
  const { data, error } = await db
    .from('budgets')
    .upsert(
      { ...input, monthly_limit: round2(input.monthly_limit), user_id: userId },
      { onConflict: 'user_id,category' },
    )
    .select()
    .single();
  if (error) throw fromPostgrest(error);
  return data;
}

export async function updateBudget(
  db: UserClient,
  id: string,
  input: BudgetUpdateInput,
): Promise<Budget> {
  const patch = {
    ...input,
    ...(input.monthly_limit !== undefined && { monthly_limit: round2(input.monthly_limit) }),
  };
  const { data, error } = await db.from('budgets').update(patch).eq('id', id).select().maybeSingle();
  if (error) throw fromPostgrest(error);
  if (!data) throw new AppError('Orçamento não encontrado.', 'NOT_FOUND', 404);
  return data;
}

export async function deleteBudget(db: UserClient, id: string): Promise<void> {
  const { data, error } = await db.from('budgets').delete().eq('id', id).select('id').maybeSingle();
  if (error) throw fromPostgrest(error);
  if (!data) throw new AppError('Orçamento não encontrado.', 'NOT_FOUND', 404);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
