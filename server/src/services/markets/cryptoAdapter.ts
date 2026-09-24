import { AppError } from '../../errors/AppError.js';
import * as binance from '../../lib/binanceClient.js';
import { catalogCache, marketCache } from '../../lib/marketCache.js';
import type { AssetRef, MarketAdapter, Quote } from './types.js';

/**
 * Cripto via Binance — somente leitura, endpoints públicos, sem API key.
 * Cotação em tempo real (`delayed: false`). Ver server/src/lib/binanceClient.ts
 * para o que foi e não foi aproveitado do projeto `API -TRADE`.
 */

const TICKER_RE = /^[A-Z0-9]{5,20}$/;
const CRYPTO_SHAPE_RE = /^[A-Z0-9]{2,15}(USDT|USDC|BRL|BTC|ETH|BUSD)$/;
const QUOTE_ASSETS = ['USDT', 'USDC', 'BUSD', 'BRL', 'BTC', 'ETH'];

function sanitizeSymbols(tickers: string[]): string[] {
  const clean = [...new Set(tickers.map((t) => t.trim().toUpperCase()))]
    .filter((t) => TICKER_RE.test(t))
    .slice(0, 20);
  if (clean.length === 0) {
    throw new AppError('Informe ao menos um ticker cripto válido.', 'VALIDATION_ERROR', 400);
  }
  return clean;
}

/** Sanitiza um único símbolo, sem o `string | undefined` do destructure de array. */
function sanitizeOne(ticker: string): string {
  const [clean] = sanitizeSymbols([ticker]);
  return clean ?? ticker.trim().toUpperCase();
}

function splitSymbol(symbol: string): string {
  const quote = QUOTE_ASSETS.find((q) => symbol.endsWith(q));
  if (!quote) return symbol;
  return `${symbol.slice(0, -quote.length)}/${quote}`;
}

async function loadCatalog(): Promise<Map<string, AssetRef>> {
  return catalogCache.getOrFetch('catalog:CRYPTO', async () => {
    const symbols = await binance.exchangeInfo();
    const map = new Map<string, AssetRef>();
    for (const meta of symbols.values()) {
      map.set(meta.symbol, {
        ticker: meta.symbol,
        market: 'CRYPTO',
        name: `${meta.baseAsset}/${meta.quoteAsset}`,
        type: 'crypto',
        currency: meta.quoteAsset,
      });
    }
    return map;
  });
}

function toQuote(t: binance.Ticker24h, name?: string): Quote {
  return {
    ticker: t.symbol,
    market: 'CRYPTO',
    name: name ?? splitSymbol(t.symbol),
    price: t.lastPrice,
    change: t.priceChange,
    changePercent: t.priceChangePercent,
    volume: t.volume,
    high52w: null,
    low52w: null,
    marketCap: null,
    priceEarnings: null,
    earningsPerShare: null,
    logoUrl: null,
    updatedAt: null,
    delayed: false,
  };
}

const DEFAULT_KLINES = { interval: '1d', limit: 90 };
const RANGE_TO_KLINES: Record<string, { interval: string; limit: number }> = {
  '1mo': { interval: '1d', limit: 30 },
  '3mo': DEFAULT_KLINES,
  '6mo': { interval: '1d', limit: 180 },
  '1y': { interval: '1d', limit: 365 },
};

export const cryptoAdapter: MarketAdapter = {
  id: 'CRYPTO',

  available() {
    return true;
  },

  matches(ticker) {
    return CRYPTO_SHAPE_RE.test(ticker.toUpperCase());
  },

  catalog: loadCatalog,

  async search(query, limit) {
    const catalog = await loadCatalog();
    const q = query.trim().toUpperCase();
    if (!q) return [];
    const exact: AssetRef[] = [];
    const starts: AssetRef[] = [];
    const includes: AssetRef[] = [];
    for (const ref of catalog.values()) {
      if (ref.ticker === q) exact.push(ref);
      else if (ref.ticker.startsWith(q)) starts.push(ref);
      else if (ref.ticker.includes(q)) includes.push(ref);
    }
    return [...exact, ...starts, ...includes].slice(0, limit);
  },

  async validate(ticker) {
    const catalog = await loadCatalog();
    return catalog.get(ticker.toUpperCase()) ?? null;
  },

  async quotes(tickers) {
    const clean = sanitizeSymbols(tickers);
    const key = `quotes:CRYPTO:${clean.join(',')}`;
    return marketCache.getOrFetch(key, async () => {
      const raw = await binance.tickers24h(clean);
      return raw.map((t) => toQuote(t));
    });
  },

  async detail(ticker, range) {
    const clean = sanitizeOne(ticker);
    const key = `asset:CRYPTO:${clean}:${range}`;
    return marketCache.getOrFetch(key, async () => {
      const [rawTicker] = await binance.tickers24h([clean]);
      if (!rawTicker) {
        throw new AppError('Ativo não encontrado.', 'ASSET_NOT_FOUND', 404);
      }
      const { interval, limit } = RANGE_TO_KLINES[range] ?? DEFAULT_KLINES;
      const candles = await binance.klines(clean, interval, limit);
      return {
        ...toQuote(rawTicker),
        history: candles.map((c) => ({
          date: new Date(c.openTime).toISOString().slice(0, 10),
          close: c.close,
        })),
      };
    });
  },
};
