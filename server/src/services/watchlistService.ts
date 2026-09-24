import { AppError } from '../errors/AppError.js';
import { fromPostgrest } from '../errors/postgrest.js';
import type { Tables } from '../lib/database.types.js';
import type { UserClient } from '../lib/supabase.js';
import * as assetLookupService from './assetLookupService.js';
import type { MarketId } from './assetLookupService.js';

export type WatchlistItem = Tables<'watchlist'>;

export async function listWatchlist(db: UserClient): Promise<WatchlistItem[]> {
  const { data, error } = await db.from('watchlist').select('*').order('ticker');
  if (error) throw fromPostgrest(error);
  return data;
}

export async function addToWatchlist(
  db: UserClient,
  userId: string,
  ticker: string,
  market?: MarketId,
): Promise<WatchlistItem> {
  // Valida contra o catálogo real antes de gravar — sem isso, qualquer string
  // que case com o regex entrava na watchlist mesmo sem existir.
  const result = await assetLookupService.validateTicker(ticker, market);
  if (!result) {
    throw new AppError('Ativo não encontrado.', 'ASSET_NOT_FOUND', 404);
  }

  const { data, error } = await db
    .from('watchlist')
    .insert({ user_id: userId, ticker: result.asset.ticker, market: result.asset.market })
    .select()
    .single();
  if (error) throw fromPostgrest(error);
  return data;
}

export async function removeFromWatchlist(db: UserClient, id: string): Promise<void> {
  const { data, error } = await db.from('watchlist').delete().eq('id', id).select('id').maybeSingle();
  if (error) throw fromPostgrest(error);
  if (!data) throw new AppError('Item não encontrado na watchlist.', 'NOT_FOUND', 404);
}
