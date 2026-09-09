import { env } from '../env.js';
import { AppError } from '../errors/AppError.js';
import { marketCache } from '../lib/marketCache.js';

/**
 * Proxy do brapi.dev — a chave NUNCA sai do backend e o frontend NUNCA
 * chama a API externa direto. Cotações com atraso (~15 min, plano gratuito).
 */

const BRAPI_BASE = 'https://brapi.dev/api';

export interface Quote {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number | null;
  high52w: number | null;
  low52w: number | null;
  marketCap: number | null;
  priceEarnings: number | null;
  earningsPerShare: number | null;
  logoUrl: string | null;
  updatedAt: string | null;
  /** Sempre true no plano gratuito — a UI mostra o rótulo de atraso. */
  delayed: true;
}

export interface AssetDetail extends Quote {
  history: Array<{ date: string; close: number }>;
}

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

function sanitizeTickers(tickers: string[]): string[] {
  const clean = [...new Set(tickers.map((t) => t.trim().toUpperCase()))]
    .filter((t) => TICKER_RE.test(t))
    .slice(0, 20);
  if (clean.length === 0) {
    throw new AppError('Informe ao menos um ticker válido.', 'VALIDATION_ERROR', 400);
  }
  return clean;
}

export async function getQuotes(tickers: string[]): Promise<Quote[]> {
  const clean = sanitizeTickers(tickers);
  const key = `quotes:${clean.join(',')}`;
  return marketCache.getOrFetch(key, async () => {
    const body = (await brapiGet(`/quote/${clean.join(',')}`)) as { results?: BrapiQuoteResult[] };
    return (body.results ?? []).map(toQuote);
  });
}

export interface Movers {
  gainers: Quote[];
  losers: Quote[];
}

export async function getMovers(): Promise<Movers> {
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

export async function getAssetDetail(ticker: string, range: string): Promise<AssetDetail> {
  const [clean] = sanitizeTickers([ticker]);
  const allowedRanges = new Set(['1mo', '3mo', '6mo', '1y']);
  const safeRange = allowedRanges.has(range) ? range : '3mo';

  return marketCache.getOrFetch(`asset:${clean}:${safeRange}`, async () => {
    const body = (await brapiGet(
      `/quote/${clean}?range=${safeRange}&interval=1d&fundamental=true`,
    )) as { results?: BrapiQuoteResult[] };
    const result = body.results?.[0];
    if (!result) {
      throw new AppError('Ativo não encontrado.', 'NOT_FOUND', 404);
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
}
