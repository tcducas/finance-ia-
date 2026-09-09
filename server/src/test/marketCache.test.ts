import { describe, expect, it, vi } from 'vitest';
import { MarketCache } from '../lib/marketCache.js';

describe('MarketCache', () => {
  it('duas leituras dentro do TTL geram UMA consulta externa', async () => {
    const cache = new MarketCache(60_000);
    const fetcher = vi.fn().mockResolvedValue(['PETR4']);

    const a = await cache.getOrFetch('quotes:PETR4', fetcher);
    const b = await cache.getOrFetch('quotes:PETR4', fetcher);

    expect(a).toEqual(['PETR4']);
    expect(b).toEqual(['PETR4']);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('deduplica chamadas concorrentes (em voo)', async () => {
    const cache = new MarketCache(60_000);
    let resolve!: (v: string) => void;
    const fetcher = vi.fn().mockImplementation(
      () =>
        new Promise<string>((r) => {
          resolve = r;
        }),
    );

    const p1 = cache.getOrFetch('movers', fetcher);
    const p2 = cache.getOrFetch('movers', fetcher);
    resolve('ok');

    expect(await p1).toBe('ok');
    expect(await p2).toBe('ok');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('expira após o TTL e busca de novo', async () => {
    vi.useFakeTimers();
    const cache = new MarketCache(1_000);
    const fetcher = vi.fn().mockResolvedValue(1);

    await cache.getOrFetch('k', fetcher);
    vi.advanceTimersByTime(1_500);
    await cache.getOrFetch('k', fetcher);

    expect(fetcher).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it('erro não fica em cache — próxima chamada tenta de novo', async () => {
    const cache = new MarketCache(60_000);
    const fetcher = vi
      .fn()
      .mockRejectedValueOnce(new Error('falhou'))
      .mockResolvedValueOnce('ok');

    await expect(cache.getOrFetch('k', fetcher)).rejects.toThrow('falhou');
    await expect(cache.getOrFetch('k', fetcher)).resolves.toBe('ok');
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
