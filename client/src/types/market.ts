/** Mercados suportados pelo proxy /api/market. */
export type MarketId = 'BR' | 'CRYPTO' | 'US';

export interface Quote {
  ticker: string;
  market: MarketId;
  name: string;
  /** Moeda da cotação: BRL para ações; para cripto, o quote asset do par. */
  currency: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number | null;
  /** Máx/mín do dia (24h em cripto); null quando a fonte não informa. */
  dayHigh: number | null;
  dayLow: number | null;
  high52w: number | null;
  low52w: number | null;
  marketCap: number | null;
  priceEarnings: number | null;
  earningsPerShare: number | null;
  logoUrl: string | null;
  updatedAt: string | null;
  delayed: boolean;
}

export interface AssetDetail extends Quote {
  history: Array<{ date: string; close: number }>;
}

export interface Movers {
  gainers: Quote[];
  losers: Quote[];
}

export interface WatchlistItem {
  id: string;
  ticker: string;
  market: MarketId;
}

/** Resultado com origem: 'api' (proxy real) ou 'placeholder' (exemplo marcado). */
export interface MarketResult<T> {
  source: 'api' | 'placeholder';
  data: T;
}

/** Item de /api/market/search — catálogo + cotação quando disponível. */
export interface SearchHit {
  ticker: string;
  market: MarketId;
  name: string;
  type: string;
  currency: string;
  price: number | null;
  changePercent: number | null;
}

export interface SearchResponse {
  results: SearchHit[];
  sources: Partial<Record<MarketId, 'ok' | 'unavailable'>>;
}
