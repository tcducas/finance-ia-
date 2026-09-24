import { beforeAll, describe, expect, it, vi } from 'vitest';
import { getQuotesMulti, parsePrefixed, resolveMarket } from '../services/markets/registry.js';

// exchangeInfo/available são carregados uma vez (catalogCache, TTL 12h) e
// reusados por todos os testes deste arquivo — por isso o fetch stub cobre
// os dois catálogos + as duas rotas de cotação desde o início.
beforeAll(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string | URL) => {
      const url = input.toString();

      if (url.includes('brapi.dev/api/available')) {
        return new Response(
          JSON.stringify({ stocks: ['PETR4', 'VALE3', 'GOLD'], indexes: ['^BVSP'] }),
          { status: 200 },
        );
      }
      if (url.includes('brapi.dev/api/quote/')) {
        const tickers = decodeURIComponent(url.split('/quote/')[1]?.split('?')[0] ?? '').split(',');
        return new Response(
          JSON.stringify({
            results: tickers.map((t) => ({ symbol: t, shortName: t, regularMarketPrice: 10 })),
          }),
          { status: 200 },
        );
      }
      if (url.includes('binance.com/api/v3/exchangeInfo')) {
        return new Response(
          JSON.stringify({
            symbols: [
              { symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT', status: 'TRADING', filters: [] },
              { symbol: 'ETHUSDT', baseAsset: 'ETH', quoteAsset: 'USDT', status: 'TRADING', filters: [] },
              { symbol: 'GOLD', baseAsset: 'GOLD', quoteAsset: 'USDT', status: 'TRADING', filters: [] },
            ],
          }),
          { status: 200 },
        );
      }
      if (url.includes('binance.com/api/v3/ticker/24hr')) {
        const symbols = JSON.parse(decodeURIComponent(url.split('symbols=')[1] ?? '[]')) as string[];
        return new Response(
          JSON.stringify(
            symbols.map((s) => ({
              symbol: s,
              lastPrice: '100',
              priceChange: '1',
              priceChangePercent: '1',
              volume: '10',
              highPrice: '110',
              lowPrice: '90',
            })),
          ),
          { status: 200 },
        );
      }
      return new Response(null, { status: 404 });
    }),
  );
});

describe('parsePrefixed', () => {
  it('separa mercado explícito do ticker', () => {
    expect(parsePrefixed('CRYPTO:BTCUSDT')).toEqual({ market: 'CRYPTO', ticker: 'BTCUSDT' });
    expect(parsePrefixed('BR:PETR4')).toEqual({ market: 'BR', ticker: 'PETR4' });
  });

  it('sem prefixo reconhecido, devolve market null', () => {
    expect(parsePrefixed('PETR4')).toEqual({ market: null, ticker: 'PETR4' });
  });
});

describe('resolveMarket', () => {
  it('resolve BR pela heurística de formato, sem precisar do catálogo', async () => {
    const result = await resolveMarket('PETR4');
    expect(result).toEqual({ market: 'BR', ticker: 'PETR4', ambiguous: false });
  });

  it('resolve CRYPTO pela heurística de sufixo (USDT/...)', async () => {
    const result = await resolveMarket('BTCUSDT');
    expect(result).toEqual({ market: 'CRYPTO', ticker: 'BTCUSDT', ambiguous: false });
  });

  it('prefixo explícito vence qualquer heurística', async () => {
    const result = await resolveMarket('CRYPTO:PETR4'); // formato BR, mas prefixo manda
    expect(result).toEqual({ market: 'CRYPTO', ticker: 'PETR4', ambiguous: false });
  });

  it('sem heurística, cai para o catálogo — presente nos dois marca ambiguous', async () => {
    const result = await resolveMarket('GOLD');
    expect(result).toEqual({ market: 'BR', ticker: 'GOLD', ambiguous: true });
  });

  it('não encontrado em nenhum catálogo, default BR (não ambíguo)', async () => {
    const result = await resolveMarket('NAOEXISTE');
    expect(result).toEqual({ market: 'BR', ticker: 'NAOEXISTE', ambiguous: false });
  });
});

describe('getQuotesMulti', () => {
  it('agrupa por mercado e concatena os resultados', async () => {
    const { quotes, partial } = await getQuotesMulti(['PETR4', 'CRYPTO:ETHUSDT']);
    expect(partial).toBe(false);
    expect(quotes.map((q) => q.ticker).sort()).toEqual(['ETHUSDT', 'PETR4']);
    expect(quotes.find((q) => q.ticker === 'PETR4')?.market).toBe('BR');
    expect(quotes.find((q) => q.ticker === 'ETHUSDT')?.market).toBe('CRYPTO');
  });
});
