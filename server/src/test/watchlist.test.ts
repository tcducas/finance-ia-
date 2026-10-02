import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UserClient } from '../lib/supabase.js';
import { addToWatchlist } from '../services/watchlistService.js';

vi.mock('../services/assetLookupService.js', () => ({
  validateTicker: vi.fn(),
}));

const assetLookupService = vi.mocked(await import('../services/assetLookupService.js'));

/** Stub encadeável: db.from('watchlist').insert(payload).select().single(). */
function stubInsert(row: unknown, onInsert?: (payload: unknown) => void) {
  return {
    from: () => ({
      insert: (payload: unknown) => {
        onInsert?.(payload);
        return {
          select: () => ({
            single: async () => ({ data: row, error: null }),
          }),
        };
      },
    }),
  } as unknown as UserClient;
}

beforeEach(() => vi.clearAllMocks());

describe('addToWatchlist', () => {
  it('rejeita ticker que não existe em nenhum catálogo, sem tocar o banco', async () => {
    assetLookupService.validateTicker.mockResolvedValue(null);
    let touchedDb = false;
    const db = stubInsert(null, () => {
      touchedDb = true;
    });

    await expect(addToWatchlist(db, 'user-1', 'ZZZZ9')).rejects.toMatchObject({
      code: 'ASSET_NOT_FOUND',
      status: 404,
    });
    expect(touchedDb).toBe(false);
  });

  it('persiste o ticker/market canônicos do catálogo, não o que o usuário digitou', async () => {
    assetLookupService.validateTicker.mockResolvedValue({
      asset: { ticker: 'PETR4', market: 'BR', name: 'Petrobras', type: 'stock', currency: 'BRL' },
      quote: {
        ticker: 'PETR4',
        market: 'BR',
        name: 'Petrobras',
        currency: 'BRL',
        price: 38.5,
        change: 0,
        changePercent: 0,
        volume: null,
        dayHigh: null,
        dayLow: null,
        high52w: null,
        low52w: null,
        marketCap: null,
        priceEarnings: null,
        earningsPerShare: null,
        logoUrl: null,
        updatedAt: null,
        delayed: true,
      },
      ambiguous: false,
    });
    const row = { id: 'w1', user_id: 'user-1', ticker: 'PETR4', market: 'BR' };
    let insertedPayload: unknown;
    const db = stubInsert(row, (payload) => {
      insertedPayload = payload;
    });

    const result = await addToWatchlist(db, 'user-1', ' petr4 ');

    expect(result).toEqual(row);
    expect(insertedPayload).toEqual({ user_id: 'user-1', ticker: 'PETR4', market: 'BR' });
  });
});
