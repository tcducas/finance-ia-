import { env } from '../../env.js';
import { AppError } from '../../errors/AppError.js';
import { catalogCache, marketCache } from '../../lib/marketCache.js';
import { logger } from '../../lib/logger.js';
import type { AssetDetail, AssetRef, MarketAdapter, OhlcCandle, Quote } from './types.js';

/**
 * Mercado internacional (ações e ETFs dos EUA) via finnhub.io — plano gratuito.
 * A chave nunca sai do backend. Somente leitura: não existe rota de ordem.
 *
 * Limitação conhecida do plano gratuito: `/stock/candle` é endpoint pago em boa
 * parte das contas e responde 403. Tratamos isso como "sem histórico" em vez de
 * derrubar a rota — o board segue mostrando cotação e estatísticas do dia.
 */

const FINNHUB_BASE = 'https://finnhub.io/api/v1';

/** Tickers dos EUA: letras, podendo ter ponto (BRK.B). */
const TICKER_RE = /^[A-Z][A-Z0-9.]{0,9}$/;
const US_SHAPE_RE = /^[A-Z]{1,5}$/;

function requireKey(): string {
  if (!env.FINNHUB_API_KEY) {
    throw new AppError(
      'Mercado internacional não configurado no servidor (FINNHUB_API_KEY ausente).',
      'INTL_NOT_CONFIGURED',
      503,
    );
  }
  return env.FINNHUB_API_KEY;
}

export function available(): boolean {
  return Boolean(env.FINNHUB_API_KEY);
}

/** `allow403` cobre o endpoint de candles, pago em contas gratuitas. */
async function finnhubGet(path: string, allow403 = false): Promise<unknown> {
  const token = requireKey();
  const sep = path.includes('?') ? '&' : '?';
  const url = `${FINNHUB_BASE}${path}${sep}token=${encodeURIComponent(token)}`;

  let res: Response;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  } catch {
    throw new AppError('Mercado internacional indisponível no momento.', 'INTL_UNAVAILABLE', 502);
  }
  if (allow403 && (res.status === 403 || res.status === 401)) {
    logger.warn({ path }, '[intl] endpoint exige plano pago no finnhub');
    return null;
  }
  if (res.status === 429) {
    throw new AppError(
      'Limite de consultas do mercado internacional atingido. Tente em instantes.',
      'INTL_RATE_LIMITED',
      429,
    );
  }
  if (!res.ok) {
    throw new AppError('Mercado internacional indisponível no momento.', 'INTL_UNAVAILABLE', 502);
  }
  return res.json();
}

function sanitize(ticker: string): string {
  const clean = ticker.trim().toUpperCase();
  if (!TICKER_RE.test(clean)) {
    throw new AppError('Ticker internacional inválido.', 'VALIDATION_ERROR', 400);
  }
  return clean;
}

interface RawQuote {
  c?: number;
  d?: number;
  dp?: number;
  h?: number;
  l?: number;
  o?: number;
  pc?: number;
  t?: number;
}

interface RawProfile {
  name?: string;
  currency?: string;
  logo?: string;
  marketCapitalization?: number;
}

interface RawSymbol {
  symbol?: string;
  description?: string;
  displaySymbol?: string;
  type?: string;
  currency?: string;
}

async function loadCatalog(): Promise<Map<string, AssetRef>> {
  return catalogCache.getOrFetch('catalog:US', async () => {
    const body = (await finnhubGet('/stock/symbol?exchange=US')) as RawSymbol[] | null;
    const map = new Map<string, AssetRef>();
    for (const s of body ?? []) {
      const ticker = s.symbol?.toUpperCase();
      if (!ticker || !TICKER_RE.test(ticker)) continue;
      map.set(ticker, {
        ticker,
        market: 'US',
        name: s.description ?? ticker,
        type: (s.type ?? 'stock').toLowerCase().includes('etf') ? 'etf' : 'stock',
        currency: s.currency ?? 'USD',
      });
    }
    return map;
  });
}

/** Perfil (nome, moeda, logo) é cacheado por bem mais tempo que a cotação. */
async function loadProfile(ticker: string): Promise<RawProfile> {
  return catalogCache.getOrFetch(`profile:US:${ticker}`, async () => {
    const body = (await finnhubGet(
      `/stock/profile2?symbol=${encodeURIComponent(ticker)}`,
    )) as RawProfile | null;
    return body ?? {};
  });
}

function toQuote(ticker: string, raw: RawQuote, profile: RawProfile): Quote {
  return {
    ticker,
    market: 'US',
    name: profile.name ?? ticker,
    currency: profile.currency ?? 'USD',
    price: raw.c ?? 0,
    change: raw.d ?? 0,
    changePercent: raw.dp ?? 0,
    volume: null,
    dayHigh: raw.h ?? null,
    dayLow: raw.l ?? null,
    high52w: null,
    low52w: null,
    // Finnhub devolve em milhões de dólares.
    marketCap:
      typeof profile.marketCapitalization === 'number'
        ? profile.marketCapitalization * 1_000_000
        : null,
    priceEarnings: null,
    earningsPerShare: null,
    logoUrl: profile.logo ?? null,
    updatedAt: raw.t ? new Date(raw.t * 1000).toISOString() : null,
    // Plano gratuito entrega cotação com atraso; assumimos o pior caso.
    delayed: true,
  };
}

const RANGE_TO_DAYS: Record<string, number> = {
  '1mo': 30,
  '3mo': 90,
  '6mo': 180,
  '1y': 365,
};

interface RawCandles {
  s?: string;
  t?: number[];
  o?: number[];
  h?: number[];
  l?: number[];
  c?: number[];
  v?: number[];
}

/** Histórico diário; devolve [] quando o endpoint é pago ou não tem dado. */
async function loadHistory(ticker: string, range: string): Promise<AssetDetail['history']> {
  const days = RANGE_TO_DAYS[range] ?? 90;
  const to = Math.floor(Date.now() / 1000);
  const from = to - days * 86_400;
  const body = (await finnhubGet(
    `/stock/candle?symbol=${encodeURIComponent(ticker)}&resolution=D&from=${from}&to=${to}`,
    true,
  )) as RawCandles | null;

  if (!body || body.s !== 'ok' || !body.t || !body.c) return [];
  return body.t.map((seconds, i) => ({
    date: new Date(seconds * 1000).toISOString().slice(0, 10),
    close: body.c?.[i] ?? 0,
  }));
}

/** Resoluções do Finnhub por período do board. */
const BOARD_RESOLUTION: Record<string, { resolution: string; days: number }> = {
  '60': { resolution: '60', days: 30 },
  D: { resolution: 'D', days: 180 },
  W: { resolution: 'W', days: 730 },
};

export const finnhubAdapter: MarketAdapter = {
  id: 'US',

  available,

  // Sem livro nem tape no plano gratuito. Candles podem vir vazios (endpoint pago).
  board: { intervals: ['60', 'D', 'W'], book: false, trades: false },

  async ohlc(ticker, interval): Promise<OhlcCandle[]> {
    const clean = sanitize(ticker);
    const cfg = BOARD_RESOLUTION[interval] ?? BOARD_RESOLUTION.D;
    const to = Math.floor(Date.now() / 1000);
    const from = to - (cfg?.days ?? 180) * 86_400;
    return marketCache.getOrFetch(`ohlc:US:${clean}:${interval}`, async () => {
      const body = (await finnhubGet(
        `/stock/candle?symbol=${encodeURIComponent(clean)}&resolution=${cfg?.resolution ?? 'D'}&from=${from}&to=${to}`,
        true,
      )) as RawCandles | null;
      if (!body || body.s !== 'ok' || !body.t) return [];
      return body.t.map((seconds, i) => ({
        time: new Date(seconds * 1000).toISOString(),
        open: body.o?.[i] ?? 0,
        high: body.h?.[i] ?? 0,
        low: body.l?.[i] ?? 0,
        close: body.c?.[i] ?? 0,
        volume: body.v?.[i] ?? null,
      }));
    });
  },

  matches(ticker) {
    // Só reivindica o formato quando a chave existe — sem ela, "AAPL" cairia
    // aqui e viraria 503 em vez de seguir para o mercado BR.
    return available() && US_SHAPE_RE.test(ticker.toUpperCase());
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
      else if (ref.ticker.includes(q) || ref.name.toUpperCase().includes(q)) includes.push(ref);
    }
    return [...exact, ...starts, ...includes].slice(0, limit);
  },

  async validate(ticker) {
    const catalog = await loadCatalog();
    return catalog.get(ticker.toUpperCase()) ?? null;
  },

  async quotes(tickers) {
    const clean = [...new Set(tickers.map(sanitize))].slice(0, 20);
    if (clean.length === 0) {
      throw new AppError('Informe ao menos um ticker válido.', 'VALIDATION_ERROR', 400);
    }
    // Finnhub cota UM símbolo por chamada — daí o cache por ticker, para 20
    // tickers na tela não virarem 20 chamadas a cada refresh.
    return Promise.all(
      clean.map((ticker) =>
        marketCache.getOrFetch(`quotes:US:${ticker}`, async () => {
          const [raw, profile] = await Promise.all([
            finnhubGet(`/quote?symbol=${encodeURIComponent(ticker)}`) as Promise<RawQuote>,
            loadProfile(ticker),
          ]);
          return toQuote(ticker, raw ?? {}, profile);
        }),
      ),
    );
  },

  async detail(ticker, range) {
    const clean = sanitize(ticker);
    return marketCache.getOrFetch(`asset:US:${clean}:${range}`, async () => {
      const [raw, profile, history] = await Promise.all([
        finnhubGet(`/quote?symbol=${encodeURIComponent(clean)}`) as Promise<RawQuote>,
        loadProfile(clean),
        loadHistory(clean, range),
      ]);
      if (!raw || raw.c === undefined || raw.c === 0) {
        throw new AppError('Ativo não encontrado.', 'ASSET_NOT_FOUND', 404);
      }
      return { ...toQuote(clean, raw, profile), history };
    });
  },
};

/** Dados de 24h para o board, derivados da cotação (o free não tem /ticker). */
export async function dailyStats(ticker: string) {
  const clean = sanitize(ticker);
  return marketCache.getOrFetch(`stats:US:${clean}`, async () => {
    const raw = (await finnhubGet(`/quote?symbol=${encodeURIComponent(clean)}`)) as RawQuote;
    return {
      price: raw.c ?? 0,
      change: raw.d ?? 0,
      changePercent: raw.dp ?? 0,
      high: raw.h ?? 0,
      low: raw.l ?? 0,
      open: raw.o ?? 0,
      previousClose: raw.pc ?? 0,
    };
  });
}

export { loadHistory as usHistory };
