import { AppError } from '../errors/AppError.js';
import { fromPostgrest } from '../errors/postgrest.js';
import type { Tables } from '../lib/database.types.js';
import { round2 } from '../lib/projection.js';
import type { UserClient } from '../lib/supabase.js';
import type { GoalCreateInput, GoalUpdateInput } from '../schemas/goal.js';

export type Goal = Tables<'goals'>;

/** Prioridade 1 primeiro; empate resolvido pela ordem de criação. */
export async function listGoals(db: UserClient): Promise<Goal[]> {
  const { data, error } = await db
    .from('goals')
    .select('*')
    .order('priority')
    .order('created_at');
  if (error) throw fromPostgrest(error);
  return data;
}

const MONEY_FIELDS = ['target_amount', 'current_amount', 'monthly_contribution'] as const;

/** Arredonda só os campos monetários — annual_rate tem 4 casas no banco. */
function roundMoney<T extends Record<string, unknown>>(input: T): T {
  const out = { ...input };
  for (const field of MONEY_FIELDS) {
    const value = out[field];
    if (typeof value === 'number') {
      (out as Record<string, unknown>)[field] = round2(value);
    }
  }
  return out;
}

export async function createGoal(
  db: UserClient,
  userId: string,
  input: GoalCreateInput,
): Promise<Goal> {
  const { data, error } = await db
    .from('goals')
    .insert({ ...roundMoney(input), user_id: userId })
    .select()
    .single();
  if (error) throw fromPostgrest(error);
  return data;
}

export async function updateGoal(
  db: UserClient,
  id: string,
  input: GoalUpdateInput,
): Promise<Goal> {
  const { data, error } = await db
    .from('goals')
    .update(roundMoney(input))
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) throw fromPostgrest(error);
  if (!data) throw new AppError('Meta não encontrada.', 'NOT_FOUND', 404);
  return data;
}

export async function deleteGoal(db: UserClient, id: string): Promise<void> {
  const { data, error } = await db.from('goals').delete().eq('id', id).select('id').maybeSingle();
  if (error) throw fromPostgrest(error);
  if (!data) throw new AppError('Meta não encontrada.', 'NOT_FOUND', 404);
}
