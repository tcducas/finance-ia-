import type { AssetDetail, MarketResult, Movers, Quote, WatchlistItem } from '../types/market';
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
): AssetDetail {
  const price = Math.round(base * 100) / 100;
  return {
    ticker,
    name: `${name} (exemplo)`,
    price,
    change: Math.round(price * (changePercent / 100) * 100) / 100,
    changePercent,
    volume: 1_000_000 * seed,
    high52w: Math.round(price * 1.28 * 100) / 100,
    low52w: Math.round(price * 0.74 * 100) / 100,
    marketCap: null,
    priceEarnings: Math.round((6 + seed * 1.3) * 10) / 10,
    earningsPerShare: Math.round((price / (6 + seed * 1.3)) * 100) / 100,
    logoUrl: null,
    updatedAt: null,
    delayed: true,
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
];

function sampleByTicker(ticker: string): AssetDetail {
  return (
    SAMPLE_ASSETS.find((a) => a.ticker === ticker.toUpperCase()) ??
    sampleQuote(ticker.toUpperCase(), ticker.toUpperCase(), 25 + (ticker.length % 5) * 8, 0.5, 8)
  );
}

// --- API pública deste módulo ----------------------------------------------

export async function fetchQuotes(tickers: string[]): Promise<MarketResult<Quote[]>> {
  if (tickers.length === 0) return { source: 'api', data: [] };
  try {
    const data = await api<Quote[]>(`/api/market/quotes?tickers=${tickers.join(',')}`);
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
      .filter((a) => !a.ticker.startsWith('^'))
      .sort((a, b) => b.changePercent - a.changePercent);
    return {
      source: 'placeholder',
      data: { gainers: sorted.slice(0, 3), losers: sorted.slice(-3).reverse() },
    };
  }
}

export async function fetchAsset(ticker: string, range = '3mo'): Promise<MarketResult<AssetDetail>> {
  try {
    const data = await api<AssetDetail>(`/api/market/asset/${ticker}?range=${range}`);
    return { source: 'api', data };
  } catch {
    return { source: 'placeholder', data: sampleByTicker(ticker) };
  }
}

// --- Watchlist ---------------------------------------------------------------

const DEMO_KEY = 'aura-demo-watchlist';

export async function listWatchlist(): Promise<WatchlistItem[]> {
  if (isDemoMode()) {
    try {
      return JSON.parse(localStorage.getItem(DEMO_KEY) ?? '[]') as WatchlistItem[];
    } catch {
      return [];
    }
  }
  const res = await fetch('/api/watchlist', {
    headers: { Authorization: `Bearer ${getSessionToken()}` },
  });
  const body = (await res.json()) as { data: WatchlistItem[] };
  return body.data;
}

export async function addWatchlist(ticker: string): Promise<void> {
  const clean = ticker.trim().toUpperCase();
  if (!/^[A-Z0-9^.]{1,12}$/.test(clean)) throw new Error('Ticker inválido.');
  if (isDemoMode()) {
    const items = await listWatchlist();
    if (items.some((i) => i.ticker === clean)) return;
    items.push({ id: crypto.randomUUID(), ticker: clean });
    localStorage.setItem(DEMO_KEY, JSON.stringify(items));
    return;
  }
  await fetch('/api/watchlist', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getSessionToken()}`,
    },
    body: JSON.stringify({ ticker: clean }),
  });
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
