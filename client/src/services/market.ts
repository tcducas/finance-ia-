import type {
  AssetDetail,
  MarketId,
  MarketResult,
  Movers,
  Quote,
  SearchResponse,
  WatchlistItem,
} from '../types/market';
import { getSessionToken, isDemoMode } from './data';

/**
 * O frontend NUNCA chama a API de mercado externa — sempre o proxy /api/market.
 * Se o proxy estiver indisponível (sem rede/token), cai para DADOS DE EXEMPLO
 * claramente marcados (source: 'placeholder') — nunca números reais inventados.
 */

async function api<T>(path: string): Promise<T> {
  const res = await fetch(path);
  const body = (await res.json().catch(() => null)) as { data: T } | { error: unknown } | null;
  if (!res.ok || body === null || 'error' in body) throw new Error('market api indisponível');
  return body.data;
}

/** Aceita ticker cru ou prefixado (BR:PETR4, CRYPTO:BTCBRL), como o backend. */
export const TICKER_RE = /^(?:(?:BR|CRYPTO):)?[A-Z0-9^.]{1,20}$/;

// --- Dados de exemplo (PLACEHOLDER — valores fictícios para demonstração) ----

function sampleHistory(base: number, seed: number): Array<{ date: string; close: number }> {
  const out: Array<{ date: string; close: number }> = [];
  const today = new Date();
  for (let i = 59; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const wave = Math.sin((i + seed) / 6) * 0.06 + Math.sin((i + seed) / 17) * 0.09;
    out.push({
      date: d.toISOString().slice(0, 10),
      close: Math.round(base * (1 + wave) * 100) / 100,
    });
  }
  return out;
}

function sampleQuote(
  ticker: string,
  name: string,
  base: number,
  changePercent: number,
  seed: number,
  market: MarketId = 'BR',
  currency = 'BRL',
): AssetDetail {
  const price = Math.round(base * 100) / 100;
  return {
    ticker,
    market,
    name: `${name} (exemplo)`,
    currency,
    price,
    change: Math.round(price * (changePercent / 100) * 100) / 100,
    changePercent,
    volume: 1_000_000 * seed,
    dayHigh: Math.round(price * 1.02 * 100) / 100,
    dayLow: Math.round(price * 0.98 * 100) / 100,
    high52w: Math.round(price * 1.28 * 100) / 100,
    low52w: Math.round(price * 0.74 * 100) / 100,
    marketCap: null,
    priceEarnings: market === 'CRYPTO' ? null : Math.round((6 + seed * 1.3) * 10) / 10,
    earningsPerShare:
      market === 'CRYPTO' ? null : Math.round((price / (6 + seed * 1.3)) * 100) / 100,
    logoUrl: null,
    updatedAt: null,
    delayed: market === 'BR',
    history: sampleHistory(base, seed * 7),
  };
}

const SAMPLE_ASSETS: AssetDetail[] = [
  sampleQuote('PETR4', 'Petrobras PN', 38.42, 1.2, 1),
  sampleQuote('VALE3', 'Vale ON', 61.75, -0.8, 2),
  sampleQuote('ITUB4', 'Itaú Unibanco PN', 33.9, 0.4, 3),
  sampleQuote('BBAS3', 'Banco do Brasil ON', 27.15, 2.1, 4),
  sampleQuote('WEGE3', 'WEG ON', 41.3, -1.5, 5),
  sampleQuote('MGLU3', 'Magazine Luiza ON', 9.87, 3.4, 6),
  sampleQuote('^BVSP', 'Ibovespa', 128_450, 0.6, 7),
  sampleQuote('BTCBRL', 'Bitcoin/BRL', 612_400, 2.8, 8, 'CRYPTO'),
  sampleQuote('ETHBRL', 'Ethereum/BRL', 21_350, 1.9, 9, 'CRYPTO'),
  sampleQuote('SOLBRL', 'Solana/BRL', 1_180, -1.4, 10, 'CRYPTO'),
  sampleQuote('XRPBRL', 'XRP/BRL', 14.6, 0.7, 11, 'CRYPTO'),
];

/** Heurística só para o modo de exemplo — a real vive no registry do backend. */
function guessMarket(ticker: string): MarketId {
  return /^[A-Z0-9]{2,15}(USDT|USDC|BRL|BTC|ETH|BUSD)$/.test(ticker) ? 'CRYPTO' : 'BR';
}

function sampleByTicker(raw: string): AssetDetail {
  const ticker = raw.includes(':') ? (raw.split(':')[1] ?? raw) : raw;
  const upper = ticker.toUpperCase();
  const found = SAMPLE_ASSETS.find((a) => a.ticker === upper);
  if (found) return found;
  const market = guessMarket(upper);
  return sampleQuote(upper, upper, 25 + (upper.length % 5) * 8, 0.5, 8, market);
}

// --- API pública deste módulo ----------------------------------------------

export async function fetchQuotes(tickers: string[]): Promise<MarketResult<Quote[]>> {
  if (tickers.length === 0) return { source: 'api', data: [] };
  try {
    const data = await api<Quote[]>(
      `/api/market/quotes?tickers=${encodeURIComponent(tickers.join(','))}`,
    );
    return { source: 'api', data };
  } catch {
    return { source: 'placeholder', data: tickers.map((t) => sampleByTicker(t)) };
  }
}

export async function fetchMovers(): Promise<MarketResult<Movers>> {
  try {
    const data = await api<Movers>('/api/market/movers');
    return { source: 'api', data };
  } catch {
    const sorted = [...SAMPLE_ASSETS]
      .filter((a) => a.market === 'BR' && !a.ticker.startsWith('^'))
      .sort((a, b) => b.changePercent - a.changePercent);
    return {
      source: 'placeholder',
      data: { gainers: sorted.slice(0, 3), losers: sorted.slice(-3).reverse() },
    };
  }
}

export async function fetchAsset(ticker: string, range = '3mo'): Promise<MarketResult<AssetDetail>> {
  try {
    const data = await api<AssetDetail>(
      `/api/market/asset/${encodeURIComponent(ticker)}?range=${range}`,
    );
    return { source: 'api', data };
  } catch {
    return { source: 'placeholder', data: sampleByTicker(ticker) };
  }
}

/** Busca no catálogo dos dois mercados (ou só no pedido). */
export async function searchAssets(
  query: string,
  market?: MarketId,
): Promise<MarketResult<SearchResponse>> {
  const params = new URLSearchParams({ q: query });
  if (market) params.set('market', market);
  try {
    const data = await api<SearchResponse>(`/api/market/search?${params.toString()}`);
    return { source: 'api', data };
  } catch {
    const upper = query.trim().toUpperCase();
    const results = SAMPLE_ASSETS.filter(
      (a) => a.ticker.includes(upper) && (!market || a.market === market),
    ).map((a) => ({
      ticker: a.ticker,
      market: a.market,
      name: a.name,
      type: a.market === 'CRYPTO' ? 'crypto' : 'stock',
      currency: a.currency,
      price: a.price,
      changePercent: a.changePercent,
    }));
    return { source: 'placeholder', data: { results, sources: { BR: 'ok', CRYPTO: 'ok' } } };
  }
}

// --- Watchlist ---------------------------------------------------------------

const DEMO_KEY = 'aura-demo-watchlist';

/** Itens salvos antes do suporte a cripto não têm `market` — inferimos. */
function withMarket(items: WatchlistItem[]): WatchlistItem[] {
  return items.map((i) => ({ ...i, market: i.market ?? guessMarket(i.ticker) }));
}

export async function listWatchlist(): Promise<WatchlistItem[]> {
  if (isDemoMode()) {
    try {
      return withMarket(JSON.parse(localStorage.getItem(DEMO_KEY) ?? '[]') as WatchlistItem[]);
    } catch {
      return [];
    }
  }
  const res = await fetch('/api/watchlist', {
    headers: { Authorization: `Bearer ${getSessionToken()}` },
  });
  const body = (await res.json()) as { data: WatchlistItem[] };
  return withMarket(body.data);
}

export async function addWatchlist(ticker: string, market?: MarketId): Promise<void> {
  const clean = ticker.trim().toUpperCase();
  if (!TICKER_RE.test(clean)) throw new Error('Ticker inválido.');
  if (isDemoMode()) {
    const items = await listWatchlist();
    if (items.some((i) => i.ticker === clean)) return;
    items.push({ id: crypto.randomUUID(), ticker: clean, market: market ?? guessMarket(clean) });
    localStorage.setItem(DEMO_KEY, JSON.stringify(items));
    return;
  }
  const res = await fetch('/api/watchlist', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getSessionToken()}`,
    },
    body: JSON.stringify(market ? { ticker: clean, market } : { ticker: clean }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: { message: string } } | null;
    throw new Error(body?.error?.message ?? 'Não foi possível adicionar o ativo.');
  }
}

export async function removeWatchlist(id: string): Promise<void> {
  if (isDemoMode()) {
    const items = (await listWatchlist()).filter((i) => i.id !== id);
    localStorage.setItem(DEMO_KEY, JSON.stringify(items));
    return;
  }
  await fetch(`/api/watchlist/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${getSessionToken()}` },
  });
}
