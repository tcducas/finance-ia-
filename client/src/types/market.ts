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
}

/** Resultado com origem: 'api' (proxy real) ou 'placeholder' (exemplo marcado). */
export interface MarketResult<T> {
  source: 'api' | 'placeholder';
  data: T;
}
