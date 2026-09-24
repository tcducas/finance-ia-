import { env } from '../../env.js';
import { AppError } from '../../errors/AppError.js';
import { catalogCache, marketCache } from '../../lib/marketCache.js';
import type { AssetRef, MarketAdapter, Quote } from './types.js';

/**
 * Ações e FIIs brasileiros via brapi.dev (plano gratuito). A chave nunca sai
 * do backend; cotação com atraso (~15min) — `delayed: true` sempre.
 */

const BRAPI_BASE = 'https://brapi.dev/api';

interface BrapiQuoteResult {
  symbol: string;
  shortName?: string;
  longName?: string;
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  regularMarketVolume?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  marketCap?: number;
  priceEarnings?: number;
  earningsPerShare?: number;
  logourl?: string;
  regularMarketTime?: string;
  historicalDataPrice?: Array<{ date: number; close: number | null }>;
}

async function brapiGet(path: string): Promise<unknown> {
  const url = new URL(`${BRAPI_BASE}${path}`);
  if (env.BRAPI_TOKEN) url.searchParams.set('token', env.BRAPI_TOKEN);

  let res: Response;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  } catch {
    throw new AppError('API de mercado indisponível no momento.', 'MARKET_UNAVAILABLE', 502);
  }
  if (!res.ok) {
    throw new AppError('API de mercado indisponível no momento.', 'MARKET_UNAVAILABLE', 502);
  }
  return res.json();
}

function toQuote(r: BrapiQuoteResult): Quote {
  return {
    ticker: r.symbol,
    market: 'BR',
    name: r.longName ?? r.shortName ?? r.symbol,
    price: r.regularMarketPrice ?? 0,
    change: r.regularMarketChange ?? 0,
    changePercent: r.regularMarketChangePercent ?? 0,
    volume: r.regularMarketVolume ?? null,
    high52w: r.fiftyTwoWeekHigh ?? null,
    low52w: r.fiftyTwoWeekLow ?? null,
    marketCap: r.marketCap ?? null,
    priceEarnings: r.priceEarnings ?? null,
    earningsPerShare: r.earningsPerShare ?? null,
    logoUrl: r.logourl ?? null,
    updatedAt: r.regularMarketTime ?? null,
    delayed: true,
  };
}

const TICKER_RE = /^[A-Z0-9^.]{1,12}$/;
const BR_SHAPE_RE = /^([A-Z]{4}\d{1,2}|\^[A-Z]+)$/;

export function sanitizeTickers(tickers: string[]): string[] {
  const clean = [...new Set(tickers.map((t) => t.trim().toUpperCase()))]
    .filter((t) => TICKER_RE.test(t))
    .slice(0, 20);
  if (clean.length === 0) {
    throw new AppError('Informe ao menos um ticker válido.', 'VALIDATION_ERROR', 400);
  }
  return clean;
}

interface BrapiAvailable {
  indexes?: string[];
  stocks?: string[];
}

async function loadCatalog(): Promise<Map<string, AssetRef>> {
  return catalogCache.getOrFetch('catalog:BR', async () => {
    const body = (await brapiGet('/available')) as BrapiAvailable;
    const map = new Map<string, AssetRef>();
    for (const ticker of body.indexes ?? []) {
      map.set(ticker, { ticker, market: 'BR', name: ticker, type: 'index', currency: 'BRL' });
    }
    for (const ticker of body.stocks ?? []) {
      map.set(ticker, { ticker, market: 'BR', name: ticker, type: 'stock', currency: 'BRL' });
    }
    return map;
  });
}

export const brapiAdapter: MarketAdapter = {
  id: 'BR',

  available() {
    return true;
  },

  matches(ticker) {
    return BR_SHAPE_RE.test(ticker.toUpperCase());
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
    const clean = sanitizeTickers(tickers);
    const key = `quotes:BR:${clean.join(',')}`;
    return marketCache.getOrFetch(key, async () => {
      const body = (await brapiGet(`/quote/${clean.join(',')}`)) as { results?: BrapiQuoteResult[] };
      return (body.results ?? []).map(toQuote);
    });
  },

  async detail(ticker, range) {
    const [clean] = sanitizeTickers([ticker]);
    const allowedRanges = new Set(['1mo', '3mo', '6mo', '1y']);
    const safeRange = allowedRanges.has(range) ? range : '3mo';

    return marketCache.getOrFetch(`asset:BR:${clean}:${safeRange}`, async () => {
      const body = (await brapiGet(
        `/quote/${clean}?range=${safeRange}&interval=1d&fundamental=true`,
      )) as { results?: BrapiQuoteResult[] };
      const result = body.results?.[0];
      if (!result) {
        throw new AppError('Ativo não encontrado.', 'ASSET_NOT_FOUND', 404);
      }
      return {
        ...toQuote(result),
        history: (result.historicalDataPrice ?? [])
          .filter((p) => p.close !== null)
          .map((p) => ({
            date: new Date(p.date * 1000).toISOString().slice(0, 10),
            close: p.close as number,
          })),
      };
    });
  },
};

/** Só o brapiAdapter tem "maiores altas/quedas" no MVP — sem análogo cripto. */
export async function getMovers() {
  return marketCache.getOrFetch('movers', async () => {
    const [up, down] = await Promise.all([
      brapiGet('/quote/list?sortBy=change&sortOrder=desc&limit=5&type=stock') as Promise<{
        stocks?: Array<{ stock: string; name: string; close: number; change: number; volume: number; logo?: string }>;
      }>,
      brapiGet('/quote/list?sortBy=change&sortOrder=asc&limit=5&type=stock') as Promise<{
        stocks?: Array<{ stock: string; name: string; close: number; change: number; volume: number; logo?: string }>;
      }>,
    ]);
    const toLite = (s: {
      stock: string;
      name: string;
      close: number;
      change: number;
      volume: number;
      logo?: string;
    }): Quote => ({
      ticker: s.stock,
      market: 'BR',
      name: s.name,
      price: s.close,
      change: 0,
      changePercent: s.change,
      volume: s.volume ?? null,
      high52w: null,
      low52w: null,
      marketCap: null,
      priceEarnings: null,
      earningsPerShare: null,
      logoUrl: s.logo ?? null,
      updatedAt: null,
      delayed: true,
    });
    return {
      gainers: (up.stocks ?? []).map(toLite),
      losers: (down.stocks ?? []).map(toLite),
    };
  });
}
