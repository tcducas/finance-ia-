import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '../errors/AppError.js';
import {
  depth,
  exchangeInfo,
  klines,
  recentTrades,
  roundStep,
  tickers24h,
} from '../lib/binanceClient.js';

afterEach(() => vi.unstubAllGlobals());

describe('roundStep', () => {
  it('arredonda para o step permitido, com a precisão do step', () => {
    expect(roundStep(123.456789, 0.01)).toBe(123.46);
    expect(roundStep(123.456789, 0.00000001)).toBeCloseTo(123.45678900, 8);
  });

  it('devolve o valor original quando o step é 0 ou inválido', () => {
    expect(roundStep(10.5, 0)).toBe(10.5);
    expect(roundStep(10.5, Number.NaN)).toBe(10.5);
  });
});

describe('exchangeInfo', () => {
  it('projeta só TRADING e extrai stepSize/tickSize/minNotional', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            symbols: [
              {
                symbol: 'BTCUSDT',
                baseAsset: 'BTC',
                quoteAsset: 'USDT',
                status: 'TRADING',
                filters: [
                  { filterType: 'LOT_SIZE', stepSize: '0.00001000' },
                  { filterType: 'PRICE_FILTER', tickSize: '0.01000000' },
                  { filterType: 'NOTIONAL', minNotional: '5.00000000' },
                ],
              },
              { symbol: 'DEADUSDT', baseAsset: 'DEAD', quoteAsset: 'USDT', status: 'BREAK', filters: [] },
            ],
          }),
          { status: 200 },
        ),
      ),
    );

    const map = await exchangeInfo();
    expect(map.has('DEADUSDT')).toBe(false);
    expect(map.get('BTCUSDT')).toEqual({
      symbol: 'BTCUSDT',
      baseAsset: 'BTC',
      quoteAsset: 'USDT',
      status: 'TRADING',
      stepSize: 0.00001,
      tickSize: 0.01,
      minNotional: 5,
    });
  });
});

describe('tickers24h / klines', () => {
  it('converte os campos string da Binance para number', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify([
            {
              symbol: 'ETHUSDT',
              lastPrice: '3000.50',
              priceChange: '10.5',
              priceChangePercent: '0.35',
              volume: '1234.5',
              highPrice: '3100',
              lowPrice: '2900',
            },
          ]),
          { status: 200 },
        ),
      ),
    );
    const [t] = await tickers24h(['ETHUSDT']);
    expect(t).toMatchObject({ symbol: 'ETHUSDT', lastPrice: 3000.5, priceChangePercent: 0.35 });
  });

  it('extrai o OHLCV completo de cada candle', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(JSON.stringify([[1000, '1', '2', '0.5', '1.5', '99']]), { status: 200 }),
      ),
    );
    const candles = await klines('BTCUSDT', '1d', 1);
    expect(candles).toEqual([
      { openTime: 1000, open: 1, high: 2, low: 0.5, close: 1.5, volume: 99 },
    ]);
  });
});

describe('depth', () => {
  it('converte bids/asks de string para number', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            lastUpdateId: 42,
            bids: [['100.5', '2']],
            asks: [['101.5', '3']],
          }),
          { status: 200 },
        ),
      ),
    );
    const book = await depth('BTCBRL', 20);
    expect(book).toEqual({
      lastUpdateId: 42,
      bids: [{ price: 100.5, qty: 2 }],
      asks: [{ price: 101.5, qty: 3 }],
    });
  });

  it('aceita resposta sem bids/asks sem estourar', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({}), { status: 200 })));
    const book = await depth('BTCBRL', 20);
    expect(book).toEqual({ lastUpdateId: 0, bids: [], asks: [] });
  });
});

describe('recentTrades', () => {
  it('converte preço/quantidade e preserva isBuyerMaker', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify([{ id: 7, price: '99.5', qty: '0.25', time: 1000, isBuyerMaker: true }]),
          { status: 200 },
        ),
      ),
    );
    const trades = await recentTrades('BTCBRL', 25);
    expect(trades).toEqual([
      { id: 7, price: 99.5, qty: 0.25, time: 1000, isBuyerMaker: true },
    ]);
  });
});

describe('erros de rede', () => {
  it('451 (bloqueio regional) vira CRYPTO_UNAVAILABLE, não derruba com um 500 genérico', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 451 })));
    await expect(exchangeInfo()).rejects.toMatchObject(
      expect.objectContaining({ code: 'CRYPTO_UNAVAILABLE' }) as Partial<AppError>,
    );
  });

  it('falha de rede vira CRYPTO_UNAVAILABLE (502)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down');
      }),
    );
    await expect(exchangeInfo()).rejects.toMatchObject({ code: 'CRYPTO_UNAVAILABLE', status: 502 });
  });
});
