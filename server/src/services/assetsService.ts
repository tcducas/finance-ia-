import { AppError } from '../errors/AppError.js';
import { fromPostgrest } from '../errors/postgrest.js';
import type { Tables } from '../lib/database.types.js';
import type { UserClient } from '../lib/supabase.js';
import type { AssetCreateInput, AssetUpdateInput } from '../schemas/asset.js';

export type Asset = Tables<'assets'>;

export async function listAssets(db: UserClient): Promise<Asset[]> {
  const { data, error } = await db
    .from('assets')
    .select('*')
    .order('is_liability')
    .order('value', { ascending: false });
  if (error) throw fromPostgrest(error);
  return data;
}

export async function createAsset(
  db: UserClient,
  userId: string,
  input: AssetCreateInput,
): Promise<Asset> {
  const { data, error } = await db
    .from('assets')
    .insert({ ...input, value: round2(input.value), user_id: userId })
    .select()
    .single();
  if (error) throw fromPostgrest(error);
  return data;
}

export async function updateAsset(
  db: UserClient,
  id: string,
  input: AssetUpdateInput,
): Promise<Asset> {
  const patch = {
    ...input,
    ...(input.value !== undefined && { value: round2(input.value) }),
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await db.from('assets').update(patch).eq('id', id).select().maybeSingle();
  if (error) throw fromPostgrest(error);
  if (!data) throw new AppError('Item de patrimônio não encontrado.', 'NOT_FOUND', 404);
  return data;
}

export async function deleteAsset(db: UserClient, id: string): Promise<void> {
  const { data, error } = await db.from('assets').delete().eq('id', id).select('id').maybeSingle();
  if (error) throw fromPostgrest(error);
  if (!data) throw new AppError('Item de patrimônio não encontrado.', 'NOT_FOUND', 404);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
